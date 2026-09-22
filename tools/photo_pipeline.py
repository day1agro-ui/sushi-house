import io, json, re, unicodedata
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageDraw

BASE = 'https://sushihouse-nsk.ru/'
ROOT = Path(__file__).resolve().parents[1]
MENU = ROOT / 'menu.json'
ORIG = ROOT / 'assets/menu/original'
OUT = ROOT / 'assets/menu/processed'
REPORT = ROOT / 'photo-pipeline-report.json'
UA = 'Mozilla/5.0 (compatible; SUSHI-HOUSE-photo-pipeline/2.0)'


def norm(s):
    s = unicodedata.normalize('NFKC', s or '').lower().replace('ё', 'е')
    s = re.sub(r'[^\w\s/+-]', ' ', s, flags=re.UNICODE)
    return re.sub(r'\s+', ' ', s).strip()


def slug(s):
    x = norm(s).replace('/', '-').replace(' ', '-')
    return re.sub(r'[^\w-]', '', x, flags=re.UNICODE)[:90]


def fetch():
    r = requests.get(BASE, headers={'User-Agent': UA}, timeout=40)
    r.raise_for_status()
    return r.text


def scrape(html):
    soup = BeautifulSoup(html, 'html.parser')
    found = {}
    for img in soup.find_all('img'):
        alt = img.get('alt', '')
        m = re.search(r"Фото товара ['\"](.+?)['\"]", alt, re.I)
        if not m:
            continue
        name = m.group(1).strip()
        src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
        if not src:
            continue
        found[norm(name)] = {'name': name, 'url': urljoin(BASE, src)}
    return found


def isolate(img):
    """Remove the old background when rembg is available; otherwise keep source intact."""
    try:
        from rembg import remove
        rgba = remove(img.convert('RGBA'))
        return rgba
    except Exception:
        return img.convert('RGBA')


def cinematic(img):
    img = ImageOps.exif_transpose(img).convert('RGBA')
    subject = isolate(img)
    bbox = subject.getbbox()
    if bbox:
        # Add a small breathing room around the extracted subject.
        pad = int(max(subject.size) * 0.035)
        bbox = (max(0,bbox[0]-pad), max(0,bbox[1]-pad), min(subject.width,bbox[2]+pad), min(subject.height,bbox[3]+pad))
        subject = subject.crop(bbox)

    # Premium square canvas with a subtle charcoal radial gradient.
    W = H = 900
    bg = Image.new('RGB', (W, H))
    px = bg.load()
    cx, cy = W * 0.48, H * 0.42
    for y in range(H):
        for x in range(W):
            d = ((x-cx)**2 + (y-cy)**2) ** 0.5 / 700
            v = int(max(8, min(22, 24 - 14*d)))
            px[x,y] = (v, v, v)

    subject.thumbnail((790, 790), Image.Resampling.LANCZOS)
    x = (W - subject.width) // 2
    y = (H - subject.height) // 2 - 5

    # Soft contact shadow beneath the product.
    shadow = Image.new('RGBA', (subject.width + 80, 80), (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((10, 20, shadow.width-10, 62), fill=(0,0,0,150))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    bg_rgba = bg.convert('RGBA')
    bg_rgba.alpha_composite(shadow, (x-40, min(H-90, y+subject.height-18)))

    # Very light toning; do not redraw or alter the food itself.
    rgb = subject.convert('RGB')
    rgb = ImageEnhance.Contrast(rgb).enhance(1.04)
    rgb = ImageEnhance.Color(rgb).enhance(1.06)
    rgb = ImageEnhance.Sharpness(rgb).enhance(1.10)
    subject = rgb.convert('RGBA')
    bg_rgba.alpha_composite(subject, (x, y))
    return bg_rgba.convert('RGB')


def main():
    data = json.loads(MENU.read_text(encoding='utf-8'))
    html = fetch()
    scraped = scrape(html)
    ORIG.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update({'User-Agent': UA})

    report = {'source': BASE, 'matched': [], 'manual_locked': [], 'missing': [], 'errors': []}

    for p in data['products']:
        # Approved manual assets stay untouched during bulk sync.
        if str(p.get('image_original') or '').startswith('manual-test/') and p.get('image'):
            report['manual_locked'].append(p['name'])
            continue

        item = scraped.get(norm(p['name']))
        if not item:
            report['missing'].append(p['name'])
            continue

        base = slug(p['name'])
        op = ORIG / f'{base}.jpg'
        pp = OUT / f'{base}.webp'
        try:
            rr = session.get(item['url'], timeout=40)
            rr.raise_for_status()
            op.write_bytes(rr.content)
            with Image.open(io.BytesIO(rr.content)) as source:
                cinematic(source).save(pp, 'WEBP', quality=88, method=6)
            p['image'] = f'assets/menu/processed/{pp.name}'
            p['image_original'] = item['url']
            report['matched'].append({'name': p['name'], 'source_url': item['url'], 'file': p['image']})
        except Exception as e:
            report['errors'].append({'name': p['name'], 'error': str(e), 'source_url': item['url']})

    MENU.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    summary = {'products': len(data['products']), 'scraped': len(scraped), 'matched': len(report['matched']), 'manual_locked': len(report['manual_locked']), 'missing': len(report['missing']), 'errors': len(report['errors'])}
    print(json.dumps(summary, ensure_ascii=False))
    if report['missing']:
        print('MISSING:', ', '.join(report['missing']))


if __name__ == '__main__':
    main()
