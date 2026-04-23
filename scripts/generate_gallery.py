from pathlib import Path
from PIL import Image, ImageOps
import json

ROOT = Path(__file__).resolve().parents[1]
GALLERY_DIR = ROOT / 'gallery'
THUMBS_DIR = ROOT / 'assets' / 'gallery' / 'thumbs'
MANIFEST = GALLERY_DIR / 'gallery.json'
VALID_EXT = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
THUMB_SIZE = (640, 480)

THUMBS_DIR.mkdir(parents=True, exist_ok=True)

entries = []
for path in sorted(GALLERY_DIR.iterdir() if GALLERY_DIR.exists() else []):
    if not path.is_file() or path.name.startswith('.') or path.suffix.lower() not in VALID_EXT:
        continue

    thumb_name = f"{path.stem}.webp"
    thumb_path = THUMBS_DIR / thumb_name

    with Image.open(path) as im:
        im = ImageOps.exif_transpose(im)
        width, height = im.size
        thumb = im.convert('RGB')
        thumb.thumbnail(THUMB_SIZE)
        canvas = Image.new('RGB', THUMB_SIZE, 'white')
        x = (THUMB_SIZE[0] - thumb.width) // 2
        y = (THUMB_SIZE[1] - thumb.height) // 2
        canvas.paste(thumb, (x, y))
        canvas.save(thumb_path, format='WEBP', quality=86, method=6)

    entries.append({
        'src': f'gallery/{path.name}',
        'thumb': f'assets/gallery/thumbs/{thumb_name}',
        'alt': "Sant'Antonio Equestrian Center",
        'width': width,
        'height': height,
        'title': "Sant'Antonio Equestrian Center"
    })

MANIFEST.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Generated manifest with {len(entries)} image(s).')
