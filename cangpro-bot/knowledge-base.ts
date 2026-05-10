/**
 * AI 客服知識庫
 * 用於 LINE Bot 自動回覆常見問題
 */

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  keywords: string[];
}

export const faqKnowledgeBase = [
  {
    id: 'faq_001',
    question: '1kg要多少錢？運費怎麼計算？',
    answer: '空快 21 RMB/kg（1-2天到台）、海快 14 RMB/kg（3-5天到台），以台銀即時匯率換算台幣\n\n例如 1kg 空快約 21 RMB，加台灣派送費。\n\n派送費：i郵箱 NT$40起 / 順豐宅配 NT$95起',
    keywords: ['運費', '多少錢', '幾錢', '費用', '1kg', '一公斤', '報價', '價格'],
    intent: '運費查詢',
    confidence: 'high'
  },
  {
    id: 'faq_002',
    question: '空快跟海快差多少？哪個比較好？',
    answer: '空快 21 RMB/kg，1-2天到台，適合急件或輕量商品\n海快 14 RMB/kg，3-5天到台，適合不急、重量較重的包裹\n\n重量越重，選海快省越多！不確定可以告訴我重量，我幫您試算比較',
    keywords: ['空快', '海快', '差別', '差在', '比較', '哪個好', '幾天', '區別', '不同'],
    intent: '運輸方式比較',
    confidence: 'high'
  },
  {
    id: 'faq_003',
    question: '有沒有比較便宜的寄法？',
    answer: '海快是最便宜的運輸方式（14 RMB/kg）\n\n另外建議合併多件一起出，只付一次台灣派送費，可以省不少\n\n小包裹建議等湊多一點再出，攤薄派送費更划算！',
    keywords: ['便宜', '省錢', '優惠', '最便宜', '省'],
    intent: '省錢方式',
    confidence: 'high'
  },
  {
    id: 'faq_004',
    question: '運費怎麼算？怎麼計費？',
    answer: '運費計算方式：\n實重（kg）× 運費率（RMB）× 即時匯率 = 集運費\n\n我們嚴格實重計費，不收材積重\n\n台灣派送費另計：\ni郵箱 NT$40起（自取）\n順豐宅配 NT$95起（送到家）',
    keywords: ['怎麼算', '計費', '計算', '實重', '材積', '收費方式'],
    intent: '計費說明',
    confidence: 'high'
  },
  {
    id: 'faq_005',
    question: '匯率是多少？怎麼換算？',
    answer: '我們即時抓取台灣銀行公告匯率，每天更動\n\n可到 https://rate.bot.com.tw/xrt 查詢最新人民幣匯率\n\n備用匯率為 4.684，若當日無法取得即時匯率會以此計算',
    keywords: ['匯率', '換算', '台幣', 'RMB', '人民幣'],
    intent: '匯率查詢',
    confidence: 'high'
  },
  {
    id: 'faq_overweight_001',
    question: '超過20公斤可以寄嗎？25公斤可以寄嗎？單件太重怎麼辦？',
    answer: '我們主要服務電商小包，單件上限為 20kg\n\n如果是多件合計超過 20kg，拆開分批寄就可以，每件在 20kg 以內完全沒問題\n\n如果是單件真的超過 20kg（像家電、家具這類大型商品），建議走大件渠道，歡迎聯繫客服為您報價',
    keywords: ['超重', '25公斤', '太重', '超過20', '上限', '不能寄', '大件', '限制', '單件', '20公斤'],
    intent: '超重詢問',
    confidence: 'high'
  },
  {
    id: 'faq_007',
    question: '尺寸有限制嗎？太大件可以寄嗎？',
    answer: '尺寸限制：\n單邊不超過 100cm\n三邊總和不超過 150cm\n單件不超過 20kg\n\n如選 i郵箱派送，需另符合郵局規定（最長邊不超過45cm）\n\n超過限制的大型商品建議走大件渠道，請聯繫客服報價',
    keywords: ['尺寸', '大小', '太大', '限制', '大件', '長寬高'],
    intent: '尺寸限制',
    confidence: 'high'
  },
  {
    id: 'faq_008',
    question: '怎麼開始使用？第一次用集運不知道從哪開始？',
    answer: '很簡單，三步驟搞定\n\n第一步：點連結建檔，取得專屬入倉編號（約1分鐘）\nhttps://liff.line.me/2009972505-gtmQGDv0\n\n第二步：在淘寶/1688/拼多多等平台下單\n收件人填入倉編號、地址填深圳倉\n\n第三步：等商品到倉，我們 LINE 通知您確認出貨',
    keywords: ['怎麼開始', '第一次', '新手', '如何使用', '開始', '怎麼用'],
    intent: '新手引導',
    confidence: 'high'
  },
  {
    id: 'faq_009',
    question: '收件地址是哪裡？深圳倉地址是什麼？',
    answer: '深圳倉地址：\n深圳市寶安區福海街道大洋路90號\n中糧機器人科技園15棟2樓208\n電話：18165786929\n\n收件人姓名請填您的入倉編號（例如 TN1234）\n\n建議存成常用地址，下次直接選取更方便',
    keywords: ['地址', '深圳', '倉庫', '收件地址', '寄到哪', '深圳倉'],
    intent: '倉庫地址',
    confidence: 'high'
  },
  {
    id: 'faq_010',
    question: '收件人要填什麼？怎麼填深圳地址？',
    answer: '在購物平台填寫收件資訊：\n\n收件人姓名：您的入倉編號（如 TN1234）\n地址：深圳市寶安區福海街道大洋路90號中糧機器人科技園15棟2樓208\n電話：18165786929\n\n收件人一定要填入倉編號，這是識別您包裹的唯一依據，請務必填正確',
    keywords: ['收件人', '填什麼', '怎麼填', '地址怎麼填', '名字填什麼'],
    intent: '填寫地址教學',
    confidence: 'high'
  },
  {
    id: 'faq_011',
    question: '幾天可以到？運送時間多久？',
    answer: '運送時間參考：\n\n空快：深圳到台灣 1-2 個工作天\n海快：深圳到台灣 3-5 個工作天\n\n加上台灣派送約再 1-2 天\n\n旺季或特殊假期可能稍有延誤',
    keywords: ['幾天', '多久', '時間', '幾天到', '快嗎', '到台灣'],
    intent: '運送時間',
    confidence: 'high'
  },
  {
    id: 'faq_012',
    question: '商品到倉了我怎麼知道？會通知嗎？',
    answer: '商品入倉後，我們會自動透過 LINE 推播通知您\n\n通知內容包含重量、包裹照片等資訊，不需要自己追蹤，等通知就好\n\n如果超過預期時間還沒收到通知，請提供訂單資訊給客服協助查詢',
    keywords: ['到倉', '通知', '怎麼知道', '有沒有到', '到了嗎', '入倉'],
    intent: '入倉通知',
    confidence: 'high'
  },
  {
    id: 'faq_013',
    question: '可以幫我驗貨嗎？',
    answer: '可以！商品到倉後我們會：\n\n拍照確認外觀\n核對商品是否正確\n確認數量是否齊全\n檢查有無重大外觀瑕疵\n\n如發現少件、缺件或嚴重瑕疵，我們會主動通知您並協助安排退回賣家',
    keywords: ['驗貨', '檢查', '確認', '查貨', '核對'],
    intent: '驗貨服務',
    confidence: 'high'
  },
  {
    id: 'faq_014',
    question: '可以合併多件一起寄嗎？',
    answer: '當然可以！合併出貨是我們最推薦的方式\n\n多件包裹合成一箱出貨，只付一次台灣派送費，省錢又方便\n\n建議等這批購物的包裹都到倉後再一起出，效益最大！',
    keywords: ['合併', '合包', '一起寄', '多件', '集合'],
    intent: '合併出貨',
    confidence: 'high'
  },
  {
    id: 'faq_015',
    question: '可以暫存在倉庫嗎？有倉儲費嗎？',
    answer: '可以暫存\n\n15天內免費暫存，讓您等包裹到齊再一起出貨\n\n超過15天請聯繫客服確認後續安排',
    keywords: ['暫存', '倉儲', '放多久', '倉儲費', '存放', '15天'],
    intent: '倉儲服務',
    confidence: 'high'
  },
  {
    id: 'faq_016',
    question: '怎麼付款？可以刷卡嗎？運費什麼時候付？',
    answer: '運費在出貨前結算，我們會透過 LINE 通知付款金額與方式\n\n目前支援銀行轉帳付款\n\n如有其他付款需求請聯繫客服確認',
    keywords: ['付款', '怎麼付', '刷卡', '轉帳', '什麼時候付', '繳費'],
    intent: '付款方式',
    confidence: 'high'
  },
  {
    id: 'faq_017',
    question: '台灣怎麼送到我手上？有哪些派送方式？',
    answer: '台灣派送提供兩種方式：\n\ni郵箱（NT$40起）\n自取，全台4000多個據點，到貨3天內取件\n\n順豐宅配（NT$95起）\n送到家，依重量計費\n\n建議輕量包裹選 i郵箱最省，較重包裹選順豐較划算',
    keywords: ['派送', '送貨', '怎麼送', '配送', '宅配', '到家', '台灣'],
    intent: '台灣派送',
    confidence: 'high'
  },
  {
    id: 'faq_018',
    question: 'i郵箱是什麼？怎麼用？',
    answer: 'i郵箱是中華郵政推出的智慧型快遞置物箱\n\n全台超過 4000 個據點\n到貨後 3 天內自取\n費用 NT$40起，非常划算\n\n收到取件通知後，前往最近的 i郵箱，輸入手機末3碼加6位取件碼即可取件\n\n查詢最近 i郵箱：https://ezpost.post.gov.tw/ibox/e_map/index',
    keywords: ['i郵箱', '郵箱', '自取', '郵局', '取件', '置物箱'],
    intent: 'i郵箱說明',
    confidence: 'high'
  },
  {
    id: 'faq_019',
    question: '順豐多少錢？宅配費用是多少？',
    answer: '順豐宅配費用（送到家）：\n\n1kg以下：NT$95\n5kg以下：NT$115\n10kg以下：NT$165\n15kg以下：NT$205\n20kg以下：NT$245\n\n直接送到您指定地址，方便省事',
    keywords: ['順豐', '宅配', '送到家', '到府', '快遞費'],
    intent: '順豐費用',
    confidence: 'high'
  },
  {
    id: 'faq_020',
    question: '包裹破損怎麼辦？商品有問題怎麼處理？',
    answer: '商品寄到深圳倉後，我們會開箱檢查：\n\n內容物是否完好\n數量是否齊全\n商品是否正確\n\n如果內容物完好，我們會幫您做一層加固保護再出貨，請放心\n\n如果發現少件、缺件或嚴重瑕疵，我們會主動通知您，並協助安排退回賣家處理',
    keywords: ['破損', '損壞', '有問題', '缺件', '少件', '瑕疵', '退貨'],
    intent: '包裹問題處理',
    confidence: 'high'
  },
  {
    id: 'faq_021',
    question: '東西寄丟了怎麼辦？包裹找不到？',
    answer: '請透過 LINE 聯繫客服，提供以下資訊：\n\n入倉編號\n購物平台訂單編號\n賣家快遞單號\n\n我們會協助追蹤查詢，盡快為您處理',
    keywords: ['寄丟', '找不到', '丟失', '追蹤', '查詢包裹', '沒收到'],
    intent: '包裹遺失',
    confidence: 'high'
  },
  {
    id: 'faq_022',
    question: '可以退貨回中國嗎？',
    answer: '可以協助安排退件\n\n退貨需另收退貨運費，且須確認賣家接受退貨\n\n請透過 LINE 聯繫客服說明情況，我們協助評估最佳處理方式',
    keywords: ['退貨', '退回', '退件', '不要了', '退款'],
    intent: '退貨處理',
    confidence: 'high'
  },
  {
    id: 'faq_023',
    question: '海關會不會被扣？要繳稅嗎？',
    answer: '我們走正規集運渠道，全程包稅\n\n一般電商小包正常情況不會被海關扣押\n\n如有特殊商品疑慮（仿冒品、管制物品等），建議事先諮詢客服，避免損失',
    keywords: ['海關', '被扣', '關稅', '稅', '清關', '包稅'],
    intent: '海關稅務',
    confidence: 'high'
  },
  {
    id: 'faq_024',
    question: '什麼東西不能寄？有哪些限制？',
    answer: '以下商品不可寄送：\n\n危險品（超規格鋰電池）\n仿冒品\n食品類\n藥品\n液體（有限制）\n粉末類\n管制物品\n\n不確定的商品請事先詢問客服，避免包裹被扣押',
    keywords: ['不能寄', '禁止', '限制', '哪些不行', '管制'],
    intent: '禁寄物品',
    confidence: 'high'
  },
  {
    id: 'faq_025',
    question: '入倉編號是什麼？有什麼用？',
    answer: '入倉編號是您在倉老闆的專屬識別碼\n\n格式：TN加上四位數字（例如 TN1234）\n\n作用：在中國購物平台下單時，收件人姓名填入倉編號，讓我們知道包裹是您的，才能自動對應到您的帳號\n\n沒有入倉編號的包裹會成為孤兒包裹，無法識別，請務必先建檔！',
    keywords: ['入倉編號', '編號', 'CL', '是什麼', '幹嘛用'],
    intent: '入倉編號說明',
    confidence: 'high'
  },
  {
    id: 'faq_026',
    question: '怎麼建檔？怎麼取得入倉編號？',
    answer: '點選以下連結完成建檔，約 1 分鐘即可取得入倉編號\n\nhttps://liff.line.me/2009972505-gtmQGDv0\n\n填寫基本資料後，入倉編號會立即透過 LINE 傳送給您，就可以開始購物囉！',
    keywords: ['建檔', '怎麼建檔', '取得編號', '註冊', '加入', '申請'],
    intent: '建檔說明',
    confidence: 'high'
  },
  {
    id: 'faq_027',
    question: '沒有入倉編號可以嗎？忘記入倉編號怎麼辦？',
    answer: '沒有入倉編號的包裹會成為孤兒包裹，無法自動對應到您的帳號\n\n請先完成建檔再下單：\nhttps://liff.line.me/2009972505-gtmQGDv0\n\n如果忘記入倉編號，請聯繫客服查詢',
    keywords: ['沒有編號', '忘記', '忘了', '沒建檔', '孤兒'],
    intent: '入倉編號問題',
    confidence: 'high'
  },
  {
    id: 'faq_028',
    question: '跟淘寶官方集運比哪個好？',
    answer: '淘寶官方集運方便，但只限淘寶訂單且費率較高\n\n倉老闆的優勢：\n支援所有平台（淘寶/1688/拼多多/抖音/小紅書）\n空快 21/海快 14 RMB，費率更透明\n到倉驗貨拍照，多一層保障\n嚴格實重計費，不收材積重',
    keywords: ['淘寶集運', '官方', '比較', '哪個好', '差別'],
    intent: '競品比較',
    confidence: 'high'
  },
  {
    id: 'faq_029',
    question: '跟蝦皮比有什麼差別？',
    answer: '蝦皮上的中國商品是賣家先進口再轉售，價格已含平台抽成和運費\n\n倉老闆是集運服務，您直接在淘寶、1688、拼多多等平台自己下單購買，商品直接從中國寄到我們深圳倉再轉運到台灣，省去中間商環節，價格更接近源頭',
    keywords: ['蝦皮', '差別', '比較'],
    intent: '競品比較',
    confidence: 'high'
  },
  {
    id: 'faq_030',
    question: '你們跟其他集運公司差在哪？為什麼選你們？',
    answer: '三個核心差異：\n\n第一：到倉驗貨，少件缺件主動告知，協助退回賣家\n第二：嚴格實重，不收材積重\n第三：費率透明，空快 21/海快 14 RMB，比市場行情更優惠\n\n歡迎比較看看，我們對費率很有信心',
    keywords: ['差別', '為什麼選', '優勢', '特色', '其他家'],
    intent: '服務比較',
    confidence: 'high'
  },
  {
    id: 'faq_031',
    question: '衣服鞋子大概多重？商品重量怎麼估？',
    answer: '常見商品重量參考：\n\n一般衣服：0.3-0.5kg\n厚外套：0.8-1.2kg\n鞋子（含鞋盒）：1-1.5kg\n運動鞋：1.5-2kg\n\n實際以到倉秤重為準，出貨前我們會告知正確重量',
    keywords: ['多重', '幾公斤', '衣服重量', '鞋子重量', '估算', '大概'],
    intent: '商品重量估算',
    confidence: 'high'
  },
  {
    id: 'faq_032',
    question: '我想出貨了，怎麼操作？',
    answer: '告訴我們以下資訊就可以安排出貨：\n\n要出哪些包裹\n選空快還是海快\n台灣派送選 i郵箱還是順豐\n收件地址或 i郵箱地點\n\n確認後我們安排集貨出倉，運費出貨前結算',
    keywords: ['出貨', '要寄了', '怎麼出', '安排出貨', '寄出'],
    intent: '出貨申請',
    confidence: 'high'
  },
  {
    id: 'faq_033',
    question: '有沒有最低消費？最少要寄幾公斤？',
    answer: '沒有最低消費限制\n\n但建議包裹重量 2kg 以上再出貨，這樣台灣派送費攤下來比較划算\n\n輕量小包裹可以等累積多一點再合併出，省更多',
    keywords: ['最低', '最少', '限制', '幾公斤以上', '門檻'],
    intent: '最低消費',
    confidence: 'high'
  },
  {
    id: 'faq_034',
    question: '有沒有手續費？收費透明嗎？',
    answer: '沒有額外手續費\n\n只收兩項費用：\n集運費（實重乘以運費率乘以匯率）\n台灣派送費（i郵箱或順豐）\n\n收費透明，不收任何隱藏費用，出貨前會明細告知',
    keywords: ['手續費', '隱藏費用', '其他費用', '額外收費', '透明'],
    intent: '費用說明',
    confidence: 'high'
  },
  {
    id: 'faq_035',
    question: '你們是合法的嗎？可以信任嗎？',
    answer: '是的，倉老闆是合法登記的集運服務業者，深圳實體倉庫運營\n\n歡迎參考官網了解更多：www.cangpro.com\n\n有任何疑問都歡迎直接詢問，我們對服務很有信心',
    keywords: ['合法', '信任', '可靠', '騙人', '詐騙', '正規'],
    intent: '信任問題',
    confidence: 'high'
  },
  {
    id: 'faq_036',
    question: '我的個資安全嗎？',
    answer: '您的個人資料僅用於集運服務，不會提供給任何第三方，請放心\n\n如有隱私相關疑問，歡迎參考我們的隱私政策：www.cangpro.com/privacy',
    keywords: ['個資', '隱私', '安全', '資料', '個人資料'],
    intent: '隱私安全',
    confidence: 'high'
  },
  {
    id: 'faq_037',
    question: '商品會不會被掉包？',
    answer: '到倉後我們會拍照存檔，出貨前再次確認，全程有記錄可查\n\n如有任何異常我們會主動告知，請放心',
    keywords: ['掉包', '被換', '安全', '信任', '記錄'],
    intent: '商品安全',
    confidence: 'high'
  },
  {
    id: 'faq_038',
    question: '化妝品可以寄嗎？保健品可以寄嗎？',
    answer: '化妝品：固體粉狀類可以寄，液態類（精華、乳液等）有航空限制，建議事先告知客服確認\n\n保健品維他命：固體錠劑一般可以寄，但台灣海關對進口食品藥品有數量限制，建議少量寄送並事先諮詢',
    keywords: ['化妝品', '保健品', '維他命', '美妝', '護膚品', '藥'],
    intent: '特殊商品詢問',
    confidence: 'high'
  },
  {
    id: 'faq_039',
    question: '手機可以寄嗎？含電池的商品可以寄嗎？',
    answer: '手機可以寄！屬於一般電子產品，正常寄送沒問題\n\n含鋰電池商品（手機、耳機、行動電源等）需符合航空鋰電池規定：\n一般品牌手機、耳機：沒問題\n行動電源：容量有上限，請事先告知客服確認\n\n不確定請先詢問，避免退件',
    keywords: ['手機', '電池', '鋰電池', '行動電源', '耳機', '電子產品'],
    intent: '電子產品詢問',
    confidence: 'high'
  },
  {
    id: 'faq_040',
    question: '食品可以寄嗎？液體可以寄嗎？',
    answer: '食品類：不建議寄送，台灣海關對進口食品管制嚴格，容易被查扣\n\n液體類（飲料、護膚水、香水等）：航空運輸有嚴格限制，建議改選海快並事先告知客服確認包裝是否符合規定',
    keywords: ['食品', '食物', '液體', '飲料', '香水', '護膚水'],
    intent: '禁限寄商品',
    confidence: 'high'
  },
  {
    id: 'faq_041',
    question: '淘寶怎麼填地址？1688拼多多抖音小紅書可以用嗎？',
    answer: '所有中國購物平台都可以用\n\n填寫收件地址方式：\n收件人：您的入倉編號（如 TN1234）\n地址：深圳市寶安區福海街道大洋路90號中糧機器人科技園15棟2樓208\n電話：18165786929\n\n建議存成常用地址，下次直接選取',
    keywords: ['淘寶', '1688', '拼多多', '抖音', '小紅書', '平台', '怎麼填'],
    intent: '平台操作',
    confidence: 'high'
  },
  {
    id: 'faq_042',
    question: '我要找真人客服',
    answer: '好的，幫您轉接真人客服\n\n請稍候，客服同仁看到會盡快回覆您\n\n如有緊急需求，也可以直接在 LINE 留言說明情況，我們會優先處理',
    keywords: ['真人', '客服', '人工', '真人客服', '找人', '真人回覆'],
    intent: '轉接客服',
    confidence: 'high'
  },
  {
    id: 'faq_043',
    question: '客服幾點上班？什麼時候有人？',
    answer: '客服服務時間：週一至週六 09:00-18:00\n\nLINE 訊息 24 小時都可以留言，客服看到會盡快回覆\n\n非上班時間的急件請留言說明，我們會盡快處理',
    keywords: ['客服時間', '上班', '幾點', '有人嗎', '營業時間'],
    intent: '客服時間',
    confidence: 'high'
  },
  {
    id: 'faq_044',
    question: '我的包裹到了嗎？可以幫我查嗎？',
    answer: '商品到倉後我們會自動 LINE 通知您\n\n如果還沒收到通知，可能包裹還在運送中\n\n需要查詢請提供：\n入倉編號\n賣家快遞單號（或平台訂單編號）\n\n我們幫您確認狀態',
    keywords: ['到了嗎', '查包裹', '到貨了嗎', '有沒有到', '查詢'],
    intent: '包裹查詢',
    confidence: 'high'
  },
  {
    id: 'faq_045',
    question: '賣家說已出貨，什麼時候會到倉？',
    answer: '從中國境內快遞一般 2-5 個工作天可到我們深圳倉\n\n到倉後我們會立即 LINE 通知您\n\n旺季（雙11、618等）或偏遠地區可能稍長，可提供快遞單號我們協助追蹤',
    keywords: ['出貨了', '快遞', '幾天到倉', '賣家出貨', '快遞單號'],
    intent: '到倉時間',
    confidence: 'high'
  },
];

export function searchFAQWithScore(query: string, intents: string[] = []): { item: FAQItem; score: number }[] {
  const q = query.toLowerCase();
  return faqKnowledgeBase
    .map(item => {
      let score = 0;
      item.keywords.forEach(k => { if (q.includes(k.toLowerCase())) score += 10; });
      if (intents.length && intents.includes(item.intent)) score += 5;
      if (q.includes(item.question.toLowerCase().slice(0, 6))) score += 3;
      return { item, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function searchFAQ(query: string, intents: string[] = []): FAQItem[] {
  return searchFAQWithScore(query, intents).map(r => r.item);
}

export function generateFollowUpQuestion(item: FAQItem): string {
  return `請問您還有其他問題嗎？`;
}

export function generateMediumConfidenceReply(item: FAQItem): string {
  return item.answer;
}
