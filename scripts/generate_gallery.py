from pathlib import Path
from PIL import Image, ImageOps
import json

ROOT = Path(__file__).resolve().parents[1]
GALLERY_DIR = ROOT / "gallery"
THUMBS_DIR = GALLERY_DIR / "thumbs"
MANIFEST = GALLERY_DIR / "gallery.json"
VALID_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
THUMB_SIZE = (640, 480)
KEEP_FILE = THUMBS_DIR / ".gitignore"

THUMBS_DIR.mkdir(parents=True, exist_ok=True)
KEEP_FILE.touch(exist_ok=True)

# Remove stale generated thumbnails but keep the tracked directory marker.
for existing in THUMBS_DIR.iterdir():
    if existing.is_file() and existing.name != KEEP_FILE.name:
        existing.unlink()

entries = []
for path in sorted(GALLERY_DIR.iterdir() if GALLERY_DIR.exists() else []):
    if not path.is_file() or path.name.startswith(".") or path.suffix.lower() not in VALID_EXT:
        continue

    thumb_name = f"{path.stem}.webp"
    thumb_path = THUMBS_DIR / thumb_name

    with Image.open(path) as im:
        im = ImageOps.exif_transpose(im)
        width, height = im.size
        thumb = im.convert("RGB")
        thumb.thumbnail(THUMB_SIZE)
        canvas = Image.new("RGB", THUMB_SIZE, "white")
        x = (THUMB_SIZE[0] - thumb.width) // 2
        y = (THUMB_SIZE[1] - thumb.height) // 2
        canvas.paste(thumb, (x, y))
        canvas.save(thumb_path, format="WEBP", quality=86, method=6)

    entries.append({
        "src": f"gallery/{path.name}",
        "thumb": f"gallery/thumbs/{thumb_name}",
        "width": width,
        "height": height,
    })

MANIFEST.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Generated manifest with {len(entries)} image(s).")
