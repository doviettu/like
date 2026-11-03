# =====================================================================
#  ĐƯA SÁCH LÊN KHO RIÊNG (Cloudflare R2 "thu-vien-sach") — chạy trên Google Colab
#
#  Hai chế độ:
#   CHE_DO = 'luu-tru'   → sao lưu TOÀN BỘ thư viện vào vùng "luu-tru/" (riêng tư, game KHÔNG BAO GIỜ đọc vùng này)
#   CHE_DO = 'cong-khai' → chỉ đưa những cuốn bạn đã đánh dấu "duoc_phep" trong docs/danh-muc-sach.csv
#                          vào vùng "cong-khai/" (game sẽ mở bản này thay cho link Drive)
#  Chạy lại bao nhiêu lần cũng được: tệp đã có trên kho thì bỏ qua.
#  Khoá R2 nhập trực tiếp trong Colab (ô nhập ẩn) — KHÔNG dán vào chat, không lưu vào tệp.
#  Cách dùng: https://colab.research.google.com → Tệp → Sổ tay mới → dán toàn bộ → sửa CHE_DO → bấm ▶
# =====================================================================
CHE_DO = 'luu-tru'
ACCOUNT_ID = '7391866ef46f5ed5d2814c310a8a53f1'      # Cloudflare Account ID (không phải bí mật)
BUCKET = 'thu-vien-sach'
SRC_ID = '1VbpbVymXXPDv0A5239L9hEnsHXiDrZG2'        # thư mục thư viện trên Google Drive

import io, csv, getpass, subprocess, sys, time
subprocess.run([sys.executable, '-m', 'pip', '-q', 'install', 'boto3'], check=True)
import boto3
from google.colab import auth, files
auth.authenticate_user()
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload

drv = build('drive', 'v3', cache_discovery=False)
s3 = boto3.client('s3', endpoint_url=f'https://{ACCOUNT_ID}.r2.cloudflarestorage.com', region_name='auto',
                  aws_access_key_id=getpass.getpass('R2 Access Key ID: ').strip(),
                  aws_secret_access_key=getpass.getpass('R2 Secret Access Key: ').strip())
FOLDER = 'application/vnd.google-apps.folder'
TYPES = {'.pdf': 'application/pdf', '.epub': 'application/epub+zip', '.webp': 'image/webp', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8'}
stat = {'up': 0, 'skip': 0, 'err': 0, 'bytes': 0}

def call(req, tries=6):
    for k in range(tries):
        try: return req.execute()
        except HttpError as e:
            if int(e.resp.status) in (403, 429, 500, 502, 503) and k < tries - 1: time.sleep(2 ** k); continue
            raise

def ls(pid):
    tok = None
    while True:
        r = call(drv.files().list(q=f"'{pid}' in parents and trashed=false", pageSize=1000, pageToken=tok,
                                  fields='nextPageToken, files(id,name,mimeType,size)', supportsAllDrives=True, includeItemsFromAllDrives=True))
        yield from r.get('files', [])
        tok = r.get('nextPageToken')
        if not tok: return

def existing(prefix):
    keys, kw = set(), {'Bucket': BUCKET, 'Prefix': prefix}
    while True:
        r = s3.list_objects_v2(**kw); keys |= {o['Key'] for o in r.get('Contents', [])}
        if not r.get('IsTruncated'): return keys
        kw['ContinuationToken'] = r['NextContinuationToken']

def put(fid, key, name):
    buf = io.BytesIO(); dl = MediaIoBaseDownload(buf, drv.files().get_media(fileId=fid, supportsAllDrives=True), chunksize=8 * 1024 * 1024)
    done = False
    while not done: _, done = dl.next_chunk()
    ext = '.' + name.rsplit('.', 1)[-1].lower() if '.' in name else ''
    s3.put_object(Bucket=BUCKET, Key=key, Body=buf.getvalue(), ContentType=TYPES.get(ext, 'application/octet-stream'))
    stat['up'] += 1; stat['bytes'] += buf.tell()

def luu_tru(src, path, have):
    for f in ls(src):
        if f['mimeType'] == FOLDER: luu_tru(f['id'], path + f['name'] + '/', have); continue
        if f['mimeType'].startswith('application/vnd.google-apps'): continue  # bỏ qua Google Docs/Sheets
        key = 'luu-tru/' + path + f['name']
        if key in have: stat['skip'] += 1; continue
        try: put(f['id'], key, f['name'])
        except Exception as e: stat['err'] += 1; print('Lỗi:', key, '→', e)
        if stat['up'] and stat['up'] % 50 == 0: print(f"… {stat['up']} tệp · {stat['bytes'] / 1e9:.2f} GB")

def cong_khai(have):
    print('Chọn tệp danh-muc-sach.csv đã đánh dấu cột "duoc_phep" (tải từ Google Sheets: Tệp → Tải xuống → CSV)')
    up = files.upload(); text = next(iter(up.values())).decode('utf-8-sig')
    rows = [r for r in csv.DictReader(io.StringIO(text)) if (r.get('duoc_phep') or '').strip()]
    print(f'{len(rows)} cuốn được đánh dấu được phép.')
    for r in rows:
        fid = r['id'].strip()
        for f in ls(fid):
            ext = '.' + f['name'].rsplit('.', 1)[-1].lower() if '.' in f['name'] else ''
            if ext not in ('.pdf', '.epub'): continue
            key = f'cong-khai/{fid}{ext}'
            if key in have: stat['skip'] += 1; continue
            try: put(f['id'], key, f['name']); print('✓', r['ten'], ext)
            except Exception as e: stat['err'] += 1; print('Lỗi:', r['ten'], '→', e)

if CHE_DO == 'luu-tru': luu_tru(SRC_ID, '', existing('luu-tru/'))
elif CHE_DO == 'cong-khai': cong_khai(existing('cong-khai/'))
else: raise SystemExit("CHE_DO phải là 'luu-tru' hoặc 'cong-khai'")
print(f"XONG ({CHE_DO}): {stat['up']} tệp mới ({stat['bytes'] / 1e9:.2f} GB), {stat['skip']} đã có, {stat['err']} lỗi.")
