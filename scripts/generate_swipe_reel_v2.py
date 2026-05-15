"""
F2 圖文翻牌型 Reels 產生器 v2 — 電商質感版
"""
import json
import sys
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
FONT_BOLD = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
FONT_REG  = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"

GOLD     = (255, 210, 80)
WHITE    = (255, 255, 255)
OFF_WHITE= (235, 236, 245)
GRAY     = (150, 155, 175)
DARK_GRAY= (90,  95, 115)
CORAL    = (255, 90,  80)

GRAD_DARK   = ((10, 11, 24),   (22, 24, 52))   # deep navy
GRAD_BRAND  = ((28, 18,  2),   (14,  9,  1))   # dark gold
GRAD_WHITE  = ((248,248,252),  (232,233,242))   # soft white


def font(size, bold=True):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def draw_gradient(img, color_top, color_bot):
    draw = ImageDraw.Draw(img)
    r1, g1, b1 = color_top
    r2, g2, b2 = color_bot
    for y in range(H):
        t = y / (H - 1)
        r = int(r1 + (r2 - r1) * t)
        g = int(g1 + (g2 - g1) * t)
        b = int(b1 + (b2 - b1) * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))


def draw_centered(draw, text, fnt, y, fill, max_w=W - 120):
    if not text:
        return y
    # simple wrap
    chars_per_line = max(1, max_w // (fnt.size // 2 + 2))
    lines = []
    for para in text.split("\n"):
        if len(para) <= chars_per_line:
            lines.append(para)
        else:
            cur = ""
            for ch in para:
                if len(cur) >= chars_per_line:
                    lines.append(cur); cur = ch
                else:
                    cur += ch
            if cur:
                lines.append(cur)
    lh = fnt.size + 18
    for i, line in enumerate(lines):
        bb = draw.textbbox((0, 0), line, font=fnt)
        x = (W - (bb[2] - bb[0])) // 2
        draw.text((x, y + i * lh), line, font=fnt, fill=fill)
    return y + len(lines) * lh


def draw_pill_label(draw, text, fnt, y, text_color, border_color):
    """Pill with border outline — no fill."""
    bb = draw.textbbox((0, 0), text, font=fnt)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    px, py = 36, 16
    x = (W - tw) // 2
    bx0, by0 = x - px, y - py
    bx1, by1 = x + tw + px, y + th + py
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=40,
                            fill=None, outline=border_color, width=3)
    draw.text((x, y), text, font=fnt, fill=text_color)
    return by1


def draw_emphasis_bar(draw, text, fnt, y, text_color, bar_color):
    """Left gold bar + text, centered as a block."""
    bb = draw.textbbox((0, 0), text, font=fnt)
    tw = bb[2] - bb[0]
    bar_w = 8
    gap = 24
    block_w = bar_w + gap + tw
    bx = (W - block_w) // 2
    bar_x = bx
    tx = bx + bar_w + gap
    bar_h = fnt.size + 10
    draw.rectangle([bar_x, y, bar_x + bar_w, y + bar_h], fill=bar_color)
    draw.text((tx, y), text, font=fnt, fill=text_color)
    return y + bar_h


def draw_gold_line(draw, y, alpha=160):
    """Thin horizontal gold divider."""
    for x in range(80, W - 80):
        draw.point((x, y), fill=GOLD)


def render_card(card, out_path):
    style = card.get("style", "dark")

    if style == "dark":
        grad = GRAD_DARK
        title_col  = WHITE
        sub_col    = GRAY
        label_col  = GOLD
        emph_col   = OFF_WHITE
        bar_col    = GOLD
    elif style == "brand":
        grad = GRAD_BRAND
        title_col  = GOLD
        sub_col    = (180, 150, 60)
        label_col  = GOLD
        emph_col   = WHITE
        bar_col    = GOLD
    else:  # white
        grad = GRAD_WHITE
        title_col  = (20, 20, 40)
        sub_col    = DARK_GRAY
        label_col  = (20, 20, 40)
        emph_col   = (20, 20, 40)
        bar_col    = GOLD

    img = Image.new("RGB", (W, H))
    draw_gradient(img, grad[0], grad[1])
    draw = ImageDraw.Draw(img)

    # ── Top accent stripe ──────────────────────────────
    draw.rectangle([0, 0, W, 6], fill=GOLD)

    # ── Label pill ────────────────────────────────────
    label_text = card.get("label", "")
    if label_text:
        f_label = font(46)
        label_bottom = draw_pill_label(draw, label_text, f_label, 240,
                                       label_col, label_col)
        draw_gold_line(draw, label_bottom + 30)

    # ── Main title ────────────────────────────────────
    if card.get("title"):
        f_title = font(card.get("title_size", 110))
        draw_centered(draw, card["title"], f_title,
                      card.get("title_y", 600), title_col)

    # ── Subtitle ──────────────────────────────────────
    if card.get("subtitle"):
        f_sub = font(card.get("subtitle_size", 64), bold=False)
        draw_centered(draw, card["subtitle"], f_sub,
                      card.get("subtitle_y", 900), sub_col)

    # ── Emphasis (left-bar style) ──────────────────────
    if card.get("emphasis"):
        f_emp = font(card.get("emphasis_size", 68))
        draw_emphasis_bar(draw, card["emphasis"], f_emp,
                          card.get("emphasis_y", 1180),
                          emph_col, bar_col)

    # ── Note ──────────────────────────────────────────
    if card.get("note"):
        f_note = font(card.get("note_size", 42), bold=False)
        draw_centered(draw, card["note"], f_note,
                      card.get("note_y", 1560), DARK_GRAY)

    # ── Footer divider + brand ─────────────────────────
    draw_gold_line(draw, H - 130)
    f_brand = font(34, bold=False)
    brand = card.get("brand", "@cangpro")
    bb = draw.textbbox((0, 0), brand, font=f_brand)
    draw.text(((W - (bb[2]-bb[0])) // 2, H - 110),
              brand, font=f_brand, fill=DARK_GRAY)

    img.save(out_path, "PNG", optimize=True)
    return out_path


def build_video(config, frame_dir, output_path):
    cards = config["cards"]
    concat_path = Path(frame_dir) / "concat.txt"
    with open(concat_path, "w") as f:
        for i, card in enumerate(cards):
            duration = card.get("duration", 3.5)
            f.write(f"file '{Path(frame_dir).absolute() / f'card_{i:02d}.png'}'\n")
            f.write(f"duration {duration}\n")
        f.write(f"file '{Path(frame_dir).absolute() / f'card_{len(cards)-1:02d}.png'}'\n")

    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(concat_path),
        "-vf", "fps=30,scale=1080:1920,format=yuv420p",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-r", "30", "-pix_fmt", "yuv420p", output_path,
    ]
    subprocess.run(cmd, check=True)
    return output_path


def main():
    config_path = sys.argv[1] if len(sys.argv) > 1 else "reels/F2-1.json"
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    slug = config.get("slug", Path(config_path).stem) + "-v2"
    frame_dir = Path(f"output/frames/{slug}")
    frame_dir.mkdir(parents=True, exist_ok=True)
    output_path = f"output/reels/{slug}.mp4"

    print(f"[{slug}] rendering {len(config['cards'])} cards…")
    for i, card in enumerate(config["cards"]):
        frame_path = frame_dir / f"card_{i:02d}.png"
        render_card(card, str(frame_path))
        print(f"  card_{i:02d}.png")

    build_video(config, str(frame_dir), output_path)
    print(f"[{slug}] done → {output_path}")


if __name__ == "__main__":
    main()
