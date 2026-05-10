import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import {
  searchFAQWithScore,
  searchFAQ,
  generateFollowUpQuestion,
  generateMediumConfidenceReply,
  faqKnowledgeBase,
} from "./knowledge-base.js";
import {
  getSession,
  addUserMessage,
  addAssistantMessage,
  setPendingOptions,
  clearPendingOptions,
  matchNumberOption,
  getConversationHistory,
  parseOptionsFromTemplate,
  getSessionStats,
} from "./conversation-session.js";
import {
  extractWeight,
  extractWeightFromQuery,
  isShippingCalcTrigger,
  generateWeightPrompt,
  hasRecentShippingContext,
  exceedsPackageLimit,
  generatePackageLimitWarning,
  extractDimensions,
  FALLBACK_RATE,
  AIR_EXPRESS_RATE,
  SEA_EXPRESS_RATE,
  SF_DELIVERY_RATES,
} from "./shipping-calculator.js";
import {
  isProductEstimateTrigger,
  estimateProductList,
  formatEstimationMessage,
} from "./product-estimator.js";

const app = express();
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

// — 匯率取得（台銀API，失敗用備援）—
// — 查詢入倉編號（Google Sheets direct）—
import { GoogleAuth } from 'google-auth-library';
const _gauth = new GoogleAuth({
  keyFile: '/root/cangpro-bot/service-account.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
async function lookupWarehouseCode(userId: string): Promise<string | null> {
  try {
    const client = await _gauth.getClient();
    const token = await client.getAccessToken();
    const sheetId = '1sJDTDCmHVl2ieWgBdAzbdH1gFha4DJR3dPY2dCiufVk';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:Z`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token.token}` }
    });
    const data = await res.json() as any;
    const rows: string[][] = data.values || [];
    if (rows.length < 2) return null;
    const headers = rows[0].map((h: string) => h.trim());
    const userIdCol = headers.findIndex((h: string) => h.includes('userId'));
    const codeCol = headers.findIndex((h: string) => h === '入倉編號');
    if (userIdCol === -1 || codeCol === -1) return null;
    for (let i = rows.length - 1; i >= 1; i--) {
      const rowUserId = (rows[i][userIdCol] || '').trim();
      if (rowUserId === userId) {
        const code = (rows[i][codeCol] || '').trim();
        if (code) return code;
      }
    }
    return null;
  } catch(e) {
    console.error('lookupWarehouseCode error', e);
    return null;
  }
}
async function getCNYRate(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.exchangerate-api.com/v4/latest/CNY"
    );
    const data = await res.json() as any;
    return data?.rates?.TWD || FALLBACK_RATE;
  } catch {
    return FALLBACK_RATE;
  }
}

// — 計算運費 —
async function calculateShipping(weight: number) {
  const rate = await getCNYRate();
  const airRMB = Math.ceil(weight * AIR_EXPRESS_RATE * 10) / 10;
  const seaRMB = Math.ceil(weight * SEA_EXPRESS_RATE * 10) / 10;
  const airTWD = Math.round(airRMB * rate);
  const seaTWD = Math.round(seaRMB * rate);

  let sfFee = SF_DELIVERY_RATES[SF_DELIVERY_RATES.length - 1].fee;
  for (const tier of SF_DELIVERY_RATES) {
    if (weight <= tier.maxKg) { sfFee = tier.fee; break; }
  }

  const rivalAirKg = Math.ceil(weight * 2) / 2;
  const rivalAirRMB = rivalAirKg <= 1 ? 29 : 29 + Math.ceil((rivalAirKg - 1) / 0.5) * 15.5;
  const rivalSeaKg = Math.max(weight, 10);
  const rivalSeaNTD = rivalSeaKg * 70;

  return { weight, rate, airRMB, airTWD, seaRMB, seaTWD, sfFee, rivalAirRMB, rivalSeaNTD };
}

function formatShippingMsg(q: Awaited<ReturnType<typeof calculateShipping>>): string {
  if (q.weight > 20) {
    return `⚠️ ${q.weight}kg 超過單件上限 20kg

建議您以下兩種方式處理：
📦 分拆出貨：將商品分成多個包裹，每件不超過 20kg
🔧 聯繫客服：特殊大件可安排專屬報價

請聯繫真人客服協助處理 😊
LINE：@clb888`;
  }
  const ipost = 40;
  const airTotal = q.airTWD + ipost;
  const seaTotal = q.seaTWD + ipost;
  const rivalAirTWD = Math.round(q.rivalAirRMB * q.rate);
  const airSave = rivalAirTWD - q.airTWD;
  const seaSave = q.rivalSeaNTD - q.seaTWD;
  return `📦 ${q.weight}kg 運費試算

✈️ 極速空快（1-2天）
  集運費：NT$${q.airTWD}
  +i郵箱自取 NT$${ipost} → 合計 NT$${airTotal}
  +順豐到家 NT$${q.sfFee} → 合計 NT$${q.airTWD + q.sfFee}

🚢 極速海快（3-5天）
  集運費：NT$${q.seaTWD}
  +i郵箱自取 NT$${ipost} → 合計 NT$${seaTotal}
  +順豐到家 NT$${q.sfFee} → 合計 NT$${q.seaTWD + q.sfFee}

💰 比同行便宜
  空快省約 NT$${airSave > 0 ? airSave : 0}
  海快省約 NT$${seaSave > 0 ? seaSave : 0}

💡 全程包稅｜嚴格實重｜不計拋
需要協助安排出貨嗎？😊`;
}

// — AI 生成回覆 —
async function generateAIResponse(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const faqContext = faqKnowledgeBase
    .map((i) => `Q: ${i.question}\nA: ${i.answer}`)
    .join("\n\n");

  const systemPrompt = `你是倉老闆的AI客服助手，幫助台灣用戶解答集運問題。

知識庫：
${faqContext}

費率：
- 極速空快：21 RMB/kg（1-2天）
- 新航線海快：14 RMB/kg（3-5天）
- 台灣派送：i郵箱NT$40起（優惠至7/31）、順豐NT$95-245
- 全程包稅，嚴格實重計價

收件方式流程：
- 客人選i郵箱但沒給地址→引導查詢：打開 https://ezpost.post.gov.tw/ibox/e_map/index 選縣市找最近據點回傳地址
- 客人給宅配地址→找最近i郵箱→問箱到箱(NT$40起)還是箱到宅(NT$45起)
- 客人選順豐→問收件地址→記錄確認
- 包裹超過i郵箱尺寸限制（單邊>45cm或三邊和>105cm或>20kg）→自動建議改順豐宅配，說明原因

規則：
1. 回覆精簡，最多150字，不廢話
- 如果客人重複問同樣問題，先溫柔提醒「剛才有說明過～」，然後再完整重複一遍答案，不要只叫他看上面
2. 一次只問一個問題，不要連問多個
3. 語氣活潑有禮貌又專業，像朋友一樣親切，適當使用emoji（😊🎉📦✅）
4. 不確定直接說：這個問題請聯繫 @clb888
5. 問題超出範圍直接說：這個問題請聯繫 @clb888`;

  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-6).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    system: systemPrompt,
    messages,
  });

  const block = res.content[0];
  return block.type === "text" ? block.text.slice(0, 1000) : "抱歉，請稍後再試或聯繫 @clb888";
}

// — LINE 回覆 —
async function replyMessage(replyToken: string, text: string) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
}

// — LINE Push —
export async function pushMessage(userId: string, text: string) {
  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text }],
    }),
  });
}

// — 主要訊息處理 —
async function handleTextMessage(event: any) {
  const userMessage = event.message?.text || "";
  const replyToken = event.replyToken;
  const lineUserId = event.source.userId;

  try {
    // 安排出貨
    const isNeedShip = /^需要$|^好$|^要$|^幫我安排$/.test(userMessage.trim());
    if (isNeedShip) {
      const history = getConversationHistory(lineUserId);
      const recentBot = history.slice(-4).filter(m => m.role === 'assistant');
      const isAfterShipping = recentBot.some(m => m.content.includes('需要協助安排出貨'));
      if (isAfterShipping) {
        const code = await lookupWarehouseCode(lineUserId);
        if (code) {
          const reply = `好的！以下是您的出貨資訊 📦\n\n入倉編號：${code}\n寄件地址：深圳市寶安區福海街道大洋路90號中糧機器人科技園15棟2樓208\n收件人姓名請填：${code}\n聯絡電話：18165786929\n\n下單時將以上資訊填入收件人欄位即可 ✅`;
          await replyMessage(replyToken, reply);
          return;
        } else {
          const reply = `還沒有入倉編號嗎？先建檔取得專屬編號 👇\nhttps://liff.line.me/2009972505-gtmQGDv0\n建檔後就能開始集運囉！`;
          await replyMessage(replyToken, reply);
          return;
        }
      }
    }

    // 查入倉編號
    const isCodeQuery = /入倉編號|我的編號|查編號|我的代碼|TN/.test(userMessage);
    if (isCodeQuery) {
      const code = await lookupWarehouseCode(lineUserId);
      const reply = code
        ? `您的入倉編號是 ${code} 📦\n寄件時請填在收件人姓名欄位～`
        : `查不到您的編號，請先完成建檔：\nhttps://liff.line.me/2009972505-gtmQGDv0`;
      await replyMessage(replyToken, reply);
      return;
    }
    // 策略0：數字選項
    const isWeightQ = /不能寄|能寄嗎|可以寄|超重|上限|限制|不行/.test(userMessage);
    const matchedOption = isWeightQ ? null : matchNumberOption(lineUserId, userMessage);
    if (matchedOption) {
      const results = searchFAQWithScore(userMessage);
      if (results.length > 0) {
        clearPendingOptions(lineUserId);
        const reply = results[0].item.answer;
        addAssistantMessage(lineUserId, reply);
        await replyMessage(replyToken, reply);
        return;
      }
      clearPendingOptions(lineUserId);
    }

    // 策略0.3：商品估算
    if (isProductEstimateTrigger(userMessage)) {
      const estimation = await estimateProductList(userMessage);
      if (estimation && estimation.items.length > 0) {
        addUserMessage(lineUserId, userMessage);
        clearPendingOptions(lineUserId);
        const reply = formatEstimationMessage(estimation);
        addAssistantMessage(lineUserId, reply);
        await replyMessage(replyToken, reply);
        return;
      }
    }

    // 策略0.5：運費試算
    const trimmed = userMessage.trim();
    const isWeightQuestion = /不能寄|能寄嗎|可以寄|寄得了|超重|上限|限制/.test(trimmed);
    if (!isWeightQuestion && isShippingCalcTrigger(trimmed) && searchFAQWithScore(userMessage)[0]?.score < 30) {
      const weight = extractWeightFromQuery(trimmed);
      if (weight) {
        const dims = extractDimensions(trimmed);
        if (exceedsPackageLimit(weight, dims.maxDimension, dims.totalDimensions)) {
          const warn = generatePackageLimitWarning(weight, dims.maxDimension, dims.totalDimensions);
          addUserMessage(lineUserId, userMessage);
          await replyMessage(replyToken, warn);
          return;
        }
        addUserMessage(lineUserId, userMessage);
        clearPendingOptions(lineUserId);
        const q = await calculateShipping(weight);
        const reply = formatShippingMsg(q);
        addAssistantMessage(lineUserId, reply);
        await replyMessage(replyToken, reply);
        return;
      } else {
        addUserMessage(lineUserId, userMessage);
        const reply = generateWeightPrompt();
        addAssistantMessage(lineUserId, reply);
        await replyMessage(replyToken, reply);
        return;
      }
    }

    // 純數字當kg（有運費上下文時）
    const pureNumber = /^\d+\.?\d*$/.test(trimmed) ? parseFloat(trimmed) : null;
    if (pureNumber && pureNumber > 0 && pureNumber <= 100) {
      const history = getConversationHistory(lineUserId);
      const recentBot = history.slice(-4).filter(m => m.role === 'assistant');
      const isAfterWeightPrompt = recentBot.some(m => m.content.includes('公斤') || m.content.includes('幾kg'));
      if (isAfterWeightPrompt) {
        addUserMessage(lineUserId, userMessage);
        clearPendingOptions(lineUserId);
        const q = await calculateShipping(pureNumber);
        const reply = formatShippingMsg(q);
        addAssistantMessage(lineUserId, reply);
        await replyMessage(replyToken, reply);
        return;
      }
    }

    // 純重量
    const directWeight = extractWeight(trimmed);
    if (directWeight) {
      const history = getConversationHistory(lineUserId);
      const isWeightQuestion = /不能寄|能寄嗎|可以寄|寄得了|超重|上限|限制/.test(trimmed);
    if (!isWeightQuestion && (hasRecentShippingContext(history) || /\d+\.?\d*\s*(kg|公斤|斤)/i.test(trimmed))) {
        addUserMessage(lineUserId, userMessage);
        clearPendingOptions(lineUserId);
        const q = await calculateShipping(directWeight);
        const reply = formatShippingMsg(q);
        addAssistantMessage(lineUserId, reply);
        await replyMessage(replyToken, reply);
        return;
      }
    }

    addUserMessage(lineUserId, userMessage);

    // FAQ搜索
    const results = searchFAQWithScore(userMessage);
  if (results.length > 0 && results[0].score >= 10) {
    clearPendingOptions(lineUserId);
    const faqAnswer = results[0].item.answer;
    const history = getConversationHistory(lineUserId);
    const polishedReply = await generateAIResponse(
      `客人問：${userMessage}\n\n請用以下資訊回答，語氣活潑有禮貌，適當加emoji，不超過150字：\n${faqAnswer}`,
      history
    );
    addAssistantMessage(lineUserId, polishedReply);
    await replyMessage(replyToken, polishedReply);
    return;
  }


    // AI 生成
    const history = getConversationHistory(lineUserId);
    const aiResponse = await generateAIResponse(userMessage, history);
    addAssistantMessage(lineUserId, aiResponse);
    await replyMessage(replyToken, aiResponse);

  } catch (error) {
    console.error("Error:", error);
    const errMsg = "抱歉，我暫時無法處理您的問題，請聯繫人工客服 @clb888";
    await replyMessage(replyToken, errMsg);
  }
}

const registeredUsers = new Set<string>();
app.get("/register-user", (req, res) => {
  const userId = req.query.userId as string;
  if (userId) registeredUsers.add(userId);
  res.json({ ok: true, userId });
});

// — Webhook 路由 —
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  let handled = false;
  // 孤兒訂單偵測：長串數字或圖片 → 轉發 n8n
  try {
    const events = req.body?.events || [];
    for (const event of events) {
      const text = event?.message?.text || "";
      const isCLCode = /^CL\d+$/i.test(text.trim());
        const isRegistered = !!(await lookupWarehouseCode(event?.source?.userId || ""));
        const isOrphan = !isCLCode && !isRegistered && (/\d{8,}/.test(text) || event?.message?.type === "image");
      if (isOrphan) {
        await fetch("http://localhost:5678/webhook/line-orphan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body)
        });
        handled = true;
        break;
      }
    }
  } catch(e) { console.error("orphan forward error", e); }

  if (!handled) {
    const { events } = req.body;
    for (const event of events || []) {
      if (event.type === "message" && event.message?.type === "text") {
        await handleTextMessage(event);
      }
    }
  }
});

app.get("/webhook", (_, res) => res.sendStatus(200));
app.get("/healthz", (_, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
process.on("unhandledRejection", (reason) => { console.error("[UnhandledRejection]", reason); });

app.listen(PORT, () => console.log(`CangPro Bot running on port ${PORT}`));
