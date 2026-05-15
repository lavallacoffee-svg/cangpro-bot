"""
F2 圖文翻牌型 Reels 產生器
輸入：reels/F2-x.json 設定檔（每張卡的標題、副標、強調字）
輸出：1080x1920 MP4，可直接上傳 IG / FB Reels

用法：python3 generate_swipe_reel.py reels/F2-1.json
"""
import json
import os
import sys
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
FONT_BOLD = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
FONT_REG = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"

COLORS = {
    "bg_dark": (15, 15, 18),
    "bg_brand": (255, 215, 0),
    "bg_white": (250, 250, 248),
    "text_white": (255, 255, 255),
    "text_dark": (20, 20, 22),
    "highlight": (255, 215, 0),
    "accent": (255, 95, 95),
}


def font(size, bold=True):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def wrap_lines(text, max_chars):
    """Simple line wrapper for Chinese (1 char = 1 visual unit)."""
    if not text:
        return []
    lines = []
    for paragraph in text.split("\n"):
        if len(paragraph) <= max_chars:
            lines.append(paragraph)
        else:
            current = ""
            for ch in paragraph:
                if len(current) >= max_chars:
                    lines.append(current)
                    current = ch
                else:
                    current += ch
            if current:
                lines.append(current)
    return lines


def draw_centered_text(draw, text, font_obj, y, fill, max_width=W - 120):
    """Draw text centered horizontally at y. Returns bottom y."""
    if not text:
        return y
    lines = wrap_lines(text, max_width // (font_obj.size // 2 + 2))
    line_h = font_obj.size + 16
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font_obj)
        w = bbox[2] - bbox[0]
        x = (W - w) // 2
        draw.text((x, y + i * line_h), line, font=font_obj, fill=fill)
    return y + len(lines) * line_h


def draw_highlight_box(draw, text, font_obj, y, padding=20):
    """Draw text inside a yellow highlight box."""
    bbox = draw.textbbox((0, 0), text, font=font_obj)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (W - w) // 2
    box_x0 = x - padding
    box_y0 = y - padding // 2
    box_x1 = x + w + padding
    box_y1 = y + h + padding
    draw.rounded_rectangle(
        [box_x0, box_y0, box_x1, box_y1],
        radius=18,
        fill=COLORS["highlight"],
    )
    draw.text((x, y), text, font=font_obj, fill=COLORS["text_dark"])
    return box_y1


def render_card(card, out_path):
    """Render a single card to PNG."""
    style = card.get("style", "dark")

    if style == "dark":
        bg = COLORS["bg_dark"]
        title_color = COLORS["text_white"]
        sub_color = (180, 180, 185)
    elif style == "brand":
        bg = COLORS["bg_brand"]
        title_color = COLORS["text_dark"]
        sub_color = (60, 60, 60)
    elif style == "white":
        bg = COLORS["bg_white"]
        title_color = COLORS["text_dark"]
        sub_color = (100, 100, 105)
    else:
        bg = COLORS["bg_dark"]
        title_color = COLORS["text_white"]
        sub_color = (180, 180, 185)

    img = Image.new("RGB", (W, H), bg)
    draw = ImageDraw.Draw(img)

    # Top label
    if card.get("label"):
        f = font(48, bold=True)
        draw_highlight_box(draw, card["label"], f, 280)

    # Main title
    if card.get("title"):
        f = font(card.get("title_size", 110), bold=True)
        title_y = card.get("title_y", 600)
        draw_centered_text(draw, card["title"], f, title_y, title_color)

    # Subtitle
    if card.get("subtitle"):
        f = font(card.get("subtitle_size", 64), bold=True)
        sub_y = card.get("subtitle_y", 900)
        draw_centered_text(draw, card["subtitle"], f, sub_y, sub_color)

    # Emphasis (highlighted text)
    if card.get("emphasis"):
        f = font(card.get("emphasis_size", 70), bold=True)
        emp_y = card.get("emphasis_y", 1180)
        draw_highlight_box(draw, card["emphasis"], f, emp_y)

    # Bottom note
    if card.get("note"):
        f = font(card.get("note_size", 44), bold=True)
        note_y = card.get("note_y", 1560)
        draw_centered_text(draw, card["note"], f, note_y, sub_color)

    # Brand footer
    f = font(36, bold=True)
    brand_text = card.get("brand", "@cangpro")
    bbox = draw.textbbox((0, 0), brand_text, font=f)
    bw = bbox[2] - bbox[0]
    draw.text(((W - bw) // 2, H - 100), brand_text, font=f, fill=sub_color)

    img.save(out_path, "PNG", optimize=True)
    return out_path


def build_video(config, frame_dir, output_path):
    """Build MP4 from frames using FFmpeg with fade transitions."""
    cards = config["cards"]

    # Build concat file with duration per card
    concat_path = Path(frame_dir) / "concat.txt"
    with open(concat_path, "w") as f:
        for i, card in enumerate(cards):
            duration = card.get("duration", 3.5)
            f.write(f"file '{Path(frame_dir).absolute() / f'card_{i:02d}.png'}'\n")
            f.write(f"duration {duration}\n")
        # FFmpeg quirk: repeat last file
        f.write(f"file '{Path(frame_dir).absolute() / f'card_{len(cards)-1:02d}.png'}'\n")

    cmd = [
        "ffmpeg",
        "-y",
        "-loglevel", "error",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_path),
        "-vf", "fps=30,scale=1080:1920,format=yuv420p",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-r", "30",
        "-pix_fmt", "yuv420p",
        output_path,
    ]
    subprocess.run(cmd, check=True)
    return output_path


def main():
    if len(sys.argv) < 2:
        config_path = "reels/F2-1.json"
    else:
        config_path = sys.argv[1]

    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    slug = config.get("slug", Path(config_path).stem)
    frame_dir = Path(f"output/frames/{slug}")
    frame_dir.mkdir(parents=True, exist_ok=True)
    output_path = f"output/reels/{slug}.mp4"

    print(f"[{slug}] rendering {len(config['cards'])} cards…")
    for i, card in enumerate(config["cards"]):
        frame_path = frame_dir / f"card_{i:02d}.png"
        render_card(card, str(frame_path))
        print(f"  card_{i:02d}.png  ({card.get('title', '')[:20]})")

    print(f"[{slug}] composing video → {output_path}")
    build_video(config, str(frame_dir), output_path)

    total_dur = sum(c.get("duration", 3.5) for c in config["cards"])
    print(f"[{slug}] done. duration={total_dur:.1f}s")


if __name__ == "__main__":
    main()
