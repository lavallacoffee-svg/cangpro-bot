"""
OpenAI 圖片生成器（用 gpt-image-1）
從 prompts/*.json 讀取每個鏡頭的 prompt，批次產出 1024x1536 直式圖（接近 9:16）。

用法：
  export OPENAI_API_KEY=sk-...
  python3 scripts/generate_openai_images.py prompts/C1.json

輸出：output/images/<slug>/scene_NN.png
"""
import base64
import json
import os
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

API_URL = "https://api.openai.com/v1/images/generations"
MODEL = "gpt-image-1"
SIZE = "1024x1536"  # portrait, closest to 9:16


def call_openai(prompt, api_key, size=SIZE, quality="medium"):
    """Call OpenAI image generation API. Returns PNG bytes."""
    payload = json.dumps({
        "model": MODEL,
        "prompt": prompt,
        "size": size,
        "quality": quality,
        "n": 1,
    }).encode("utf-8")

    req = Request(
        API_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(req, timeout=180) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"OpenAI API HTTP {e.code}: {err_body}")

    b64 = data["data"][0]["b64_json"]
    return base64.b64decode(b64)


def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY env var not set", file=sys.stderr)
        sys.exit(1)

    if len(sys.argv) < 2:
        print("Usage: generate_openai_images.py prompts/C1.json", file=sys.stderr)
        sys.exit(1)

    config_path = sys.argv[1]
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    slug = config.get("slug", Path(config_path).stem)
    out_dir = Path(f"output/images/{slug}")
    out_dir.mkdir(parents=True, exist_ok=True)

    scenes = config["scenes"]
    style = config.get("style_prefix", "")
    print(f"[{slug}] {len(scenes)} scenes to generate, ~USD${len(scenes) * 0.04:.2f}-${len(scenes) * 0.17:.2f}")

    for i, scene in enumerate(scenes):
        out_path = out_dir / f"scene_{i:02d}.png"
        if out_path.exists() and not scene.get("force"):
            print(f"  scene_{i:02d}.png  [skip, exists]")
            continue

        full_prompt = f"{style}\n\n{scene['prompt']}"
        print(f"  scene_{i:02d}.png  [{scene.get('label', '')[:30]}] generating…")

        retries = 3
        while retries > 0:
            try:
                png_bytes = call_openai(
                    full_prompt,
                    api_key,
                    quality=scene.get("quality", "medium"),
                )
                with open(out_path, "wb") as f:
                    f.write(png_bytes)
                size_kb = len(png_bytes) // 1024
                print(f"    → {out_path}  ({size_kb} KB)")
                break
            except Exception as e:
                retries -= 1
                if retries == 0:
                    print(f"    ✗ failed: {e}", file=sys.stderr)
                else:
                    print(f"    retry ({retries} left): {e}", file=sys.stderr)
                    time.sleep(3)

    print(f"[{slug}] done. images in {out_dir}/")


if __name__ == "__main__":
    main()
