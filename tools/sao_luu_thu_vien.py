# =====================================================================
#  SAO LƯU THƯ VIỆN KINH SÁCH VÀO GOOGLE DRIVE CỦA BẠN (chạy trên Google Colab)
#  - Google tự sao chép giữa các máy chủ: không tải về máy, không tốn mạng của bạn.
#  - Chạy lại bao nhiêu lần cũng được: tệp đã có thì bỏ qua (tiếp tục chỗ đang dở).
#  - Bản sao để LƯU TRỮ RIÊNG: đừng bật chia sẻ công khai thư mục đích.
#  Cách dùng: https://colab.research.google.com → Tệp → Sổ tay mới → dán toàn bộ → bấm ▶
# =====================================================================
SRC_ID = '1VbpbVymXXPDv0A5239L9hEnsHXiDrZG2'      # thư mục nguồn (thư viện công khai)
DEST_NAME = 'Thu vien kinh sach - sao luu'          # thư mục sẽ tạo trong "Drive của tôi"
ONLY_EXT = None   # vd ('.pdf',) nếu chỉ muốn lấy PDF; None = lấy tất cả (pdf, epub, ảnh bìa, mô tả)

import time
from google.colab import auth
auth.authenticate_user()
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

drv = build('drive', 'v3', cache_discovery=False)
FOLDER = 'application/vnd.google-apps.folder'
stat = {'copied': 0, 'skipped': 0, 'bytes': 0, 'errors': 0, 'folders': 0}

def call(req, tries=6):
    for k in range(tries):
        try:
            return req.execute()
        except HttpError as e:
            code = int(e.resp.status)
            if code in (403, 429, 500, 502, 503) and k < tries - 1:
                time.sleep(2 ** k); continue
            raise

def ls(pid):
    tok = None
    while True:
        r = call(drv.files().list(q=f"'{pid}' in parents and trashed=false", pageSize=1000, pageToken=tok,
                                  fields='nextPageToken, files(id,name,mimeType,size)',
                                  supportsAllDrives=True, includeItemsFromAllDrives=True))
        yield from r.get('files', [])
        tok = r.get('nextPageToken')
        if not tok: return

def mkdir(name, parent):
    body = {'name': name, 'mimeType': FOLDER}
    if parent: body['parents'] = [parent]
    return call(drv.files().create(body=body, fields='id'))['id']

def dest_root():
    r = call(drv.files().list(q=f"name='{DEST_NAME}' and mimeType='{FOLDER}' and 'root' in parents and trashed=false", fields='files(id)'))
    return r['files'][0]['id'] if r.get('files') else mkdir(DEST_NAME, None)

def mirror(src, dst, path=''):
    have = {(f['name'], f['mimeType'] == FOLDER): f['id'] for f in ls(dst)}
    for f in ls(src):
        name, isdir = f['name'], f['mimeType'] == FOLDER
        if isdir:
            sub = have.get((name, True)) or mkdir(name, dst)
            stat['folders'] += 1
            if stat['folders'] % 25 == 0: print(f"… {stat['folders']} thư mục · {stat['copied']} tệp mới · {stat['bytes'] / 1e9:.2f} GB")
            mirror(f['id'], sub, path + name + '/')
            continue
        if ONLY_EXT and not name.lower().endswith(ONLY_EXT): continue
        if (name, False) in have: stat['skipped'] += 1; continue
        try:
            call(drv.files().copy(fileId=f['id'], body={'name': name, 'parents': [dst]}, fields='id', supportsAllDrives=True))
            stat['copied'] += 1; stat['bytes'] += int(f.get('size') or 0)
        except HttpError as e:
            stat['errors'] += 1; print('Lỗi:', path + name, '→', e.resp.status)

root = dest_root()
print('Bắt đầu sao lưu vào "Drive của tôi/' + DEST_NAME + '"…')
mirror(SRC_ID, root)
print(f"XONG: {stat['folders']} thư mục, {stat['copied']} tệp mới ({stat['bytes'] / 1e9:.2f} GB), "
      f"{stat['skipped']} tệp đã có, {stat['errors']} lỗi. Có lỗi thì chạy lại ô này để thử tiếp.")
