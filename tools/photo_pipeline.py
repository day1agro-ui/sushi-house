import io, json, re, unicodedata
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

BASE = 'https://sushihouse-nsk.ru/'
ROOT = Path(__file__).resolve().parents[1]
MENU = ROOT / 'menu.json'
ORIG = ROOT / 'assets/menu/original'
OUT = ROOT / 'assets/menu/processed'
REPORT = ROOT / 'photo-pipeline-report.json'
UA = 'Mozilla/5.0 (compatible; SUSHI-HOUSE-photo-pipeline/1.0)'


def norm(s):
    s = unicodedata.normalize('NFKC', s or '').lower().replace('ё','е')
    s = re.sub(r'[^\w\s/+-]', ' ', s, flags=re.UNICODE)
    return re.sub(r'\s+', ' ', s).strip()


def slug(s):
    x = norm(s).replace('/', '-').replace(' ', '-')
    return re.sub(r'[^\w-]', '', x, flags=re.UNICODE)[:90]


def fetch():
    r = requests.get(BASE, headers={'User-Agent': UA}, timeout=30)
    r.raise_for_status()
    return r.text


def scrape(html):
    soup = BeautifulSoup(html, 'html.parser')
    found = {}
    for img in soup.find_all('img'):
        alt = img.get('alt','')
        m = re.search(r"Фото товара ['\"](.+?)['\"]", alt, re.I)
        if not m:
            continue
        name = m.group(1).strip()
        src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
        if not src:
            continue
        found[norm(name)] = {'name': name, 'url': urljoin(BASE, src)}
    return found


def cinematic(img):
    img = ImageOps.exif_transpose(img).convert('RGB')
    img.thumbnail((900,900), Image.Resampling.LANCZOS)
    bg = Image.new('RGB',(900,900),(13,13,13))
    # Preserve the original dish exactly; only normalize crop/tonality and add a dark studio frame.
    fitted = ImageOps.contain(img,(820,820),Image.Resampling.LANCZOS)
    x=(900-fitted.width)//2; y=(900-fitted.height)//2
    fitted = ImageEnhance.Contrast(fitted).enhance(1.04)
    fitted = ImageEnhance.Color(fitted).enhance(1.05)
    fitted = ImageEnhance.Sharpness(fitted).enhance(1.12)
    shadow = Image.new('RGBA', fitted.size,(0,0,0,0))
    alpha = Image.new('L',fitted.size,80).filter(ImageFilter.GaussianBlur(18))
    shadow.putalpha(alpha)
    bg.paste((0,0,0),(x+8,y+12,x+8+fitted.width,y+12+fitted.height))
    bg.paste(fitted,(x,y))
    return bg


def main():
    data=json.loads(MENU.read_text(encoding='utf-8'))
    html=fetch(); scraped=scrape(html)
    ORIG.mkdir(parents=True,exist_ok=True); OUT.mkdir(parents=True,exist_ok=True)
    session=requests.Session(); session.headers.update({'User-Agent':UA})
    report={'source':BASE,'matched':[],'missing':[],'errors':[]}
    for p in data['products']:
        key=norm(p['name']); item=scraped.get(key)
        if not item:
            report['missing'].append(p['name']); continue
        ext='.jpg'
        fn=slug(p['name'])+ext
        op=ORIG/fn; pp=OUT/(slug(p['name'])+'.webp')
        try:
            rr=session.get(item['url'],timeout=30); rr.raise_for_status(); op.write_bytes(rr.content)
            img=Image.open(io.BytesIO(rr.content))
            cinematic(img).save(pp,'WEBP',quality=88,method=6)
            p['image']=f'assets/menu/processed/{pp.name}'
            p['image_original']=item['url']
            report['matched'].append({'name':p['name'],'source_url':item['url'],'file':p['image']})
        except Exception as e:
            report['errors'].append({'name':p['name'],'error':str(e),'source_url':item['url']})
    MENU.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'products':len(data['products']),'scraped':len(scraped),'matched':len(report['matched']),'missing':len(report['missing']),'errors':len(report['errors'])},ensure_ascii=False))
    if report['missing']:
        print('MISSING:', ', '.join(report['missing']))

if __name__=='__main__': main()
