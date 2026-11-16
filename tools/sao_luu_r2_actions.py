# =====================================================================
#  SAO LƯU THƯ VIỆN → KHO R2 (vùng riêng luu-tru/) — chạy tự động trên GitHub Actions
#  Đọc danh sách thư mục sách từ tools/thu-vien-thu-muc.tsv ("Tên<TAB>id thư mục Drive"),
#  tải từng tệp (thư viện đang chia sẻ công khai) rồi đẩy lên R2. Tệp đã có thì bỏ qua,
#  nên chạy lại bao nhiêu lần cũng được. Tự dừng trước giới hạn 6 giờ của GitHub.
#  Biến môi trường: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (GitHub Secrets), R2_ACCOUNT_ID, R2_BUCKET.
# =====================================================================
import os, sys, time, tempfile, unicodedata
import boto3, gdown

T0, BUDGET = time.time(), float(os.environ.get('TIME_BUDGET_S', 5.3 * 3600))
LIST = os.path.join(os.path.dirname(__file__), 'thu-vien-thu-muc.tsv')
TYPES = {'.pdf': 'application/pdf', '.epub': 'application/epub+zip', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png',
         '.json': 'application/json', '.txt': 'text/plain; charset=utf-8'}
s3 = boto3.client('s3', endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com", region_name='auto',
                  aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'], aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'])
BUCKET = os.environ.get('R2_BUCKET', 'thu-vien-sach')
nfc = lambda s: unicodedata.normalize('NFC', s).replace('/', '-').strip()

def existing():
    keys, kw = set(), {'Bucket': BUCKET, 'Prefix': 'luu-tru/'}
    while True:
        r = s3.list_objects_v2(**kw); keys |= {o['Key'] for o in r.get('Contents', [])}
        if not r.get('IsTruncated'): return keys
        kw['ContinuationToken'] = r['NextContinuationToken']

def dl(fid, out):
    if not gdown.download(id=fid, output=out, quiet=True): raise RuntimeError('tải thất bại')

def retry(fn, tries=4):
    for k in range(tries):
        try: return fn()
        except Exception as e:
            if k == tries - 1: raise
            time.sleep(5 * (k + 1))

if not os.path.exists(LIST): print('Chưa có danh sách thư mục (tools/thu-vien-thu-muc.tsv) — bỏ qua.'); sys.exit(0)
folders = [l.rstrip('\n').split('\t') for l in open(LIST, encoding='utf-8') if '\t' in l]
have = existing()
st = {'up': 0, 'skip': 0, 'err': 0, 'bytes': 0, 'folders': 0}
errors = []
print(f'{len(folders)} thư mục · đã có {len(have)} tệp trên kho', flush=True)
stopped = False
with tempfile.TemporaryDirectory() as tmp:
    for title, fid in folders:
        if time.time() - T0 > BUDGET: stopped = True; break
        title = nfc(title); st['folders'] += 1
        try:
            files = retry(lambda: gdown.download_folder(id=fid, skip_download=True, quiet=True) or [])
        except Exception as e:
            st['err'] += 1; errors.append(f'{title}: không liệt kê được ({e})'); continue
        for f in files:
            name = nfc(os.path.basename(f.path)); key = f'luu-tru/{title}/{name}'
            if key in have: st['skip'] += 1; continue
            out = os.path.join(tmp, 'f')
            try:
                retry(lambda: dl(f.id, out))
                ext = os.path.splitext(name)[1].lower(); size = os.path.getsize(out)
                retry(lambda: s3.upload_file(out, BUCKET, key, ExtraArgs={'ContentType': TYPES.get(ext, 'application/octet-stream')}))
                st['up'] += 1; st['bytes'] += size; have.add(key)
            except Exception as e:
                st['err'] += 1; errors.append(f'{title}/{name}: {e}')
            finally:
                if os.path.exists(out): os.remove(out)
            time.sleep(0.4)
        if st['folders'] % 25 == 0:
            print(f"… {st['folders']}/{len(folders)} thư mục · {st['up']} tệp mới · {st['bytes'] / 1e9:.2f} GB · {st['err']} lỗi", flush=True)

msg = (f"### Sao lưu thư viện → R2 `{BUCKET}/luu-tru/`\n"
       f"- Thư mục đã xét: {st['folders']}/{len(folders)}{' (dừng vì sắp hết 6 giờ — chạy lại để làm tiếp)' if stopped else ''}\n"
       f"- Tệp mới: {st['up']} ({st['bytes'] / 1e9:.2f} GB) · đã có: {st['skip']} · lỗi: {st['err']}\n")
if errors: msg += '\n<details><summary>Lỗi</summary>\n\n' + '\n'.join('- ' + e for e in errors[:300]) + '\n</details>\n'
print(msg)
if os.environ.get('GITHUB_STEP_SUMMARY'): open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8').write(msg)
