/**
 * SAO LƯU THƯ VIỆN KINH SÁCH VÀO GOOGLE DRIVE CỦA BẠN — Google Apps Script
 *
 * Chạy bằng tài khoản Google đang đăng nhập. Google tự sao chép giữa
 * các máy chủ của Google: không tải qua điện thoại hay máy tính, không cần máy nào bật.
 *
 * Cách dùng: script.google.com → Dự án mới → xoá hết, dán toàn bộ tệp này → Lưu →
 * chọn hàm "batDau" → Chạy → cấp quyền. Từ đó script tự chạy lại mỗi 10 phút cho tới khi xong.
 * Tài khoản Gmail thường được chạy khoảng 90 phút mỗi ngày, nên có thể mất 1–3 ngày.
 * Tiến độ ghi trong tệp TIEN-DO.txt ở thư mục "Thu vien kinh sach - sao luu" trong Drive.
 * Muốn dừng: chọn hàm "dungLai" → Chạy.
 *
 * Bản sao để LƯU TRỮ RIÊNG — đừng chia sẻ công khai thư mục sao lưu.
 */
const SRC_ID = '1VbpbVymXXPDv0A5239L9hEnsHXiDrZG2';   // thư mục thư viện gốc (đang chia sẻ công khai)
const DEST_NAME = 'Thu vien kinh sach - sao luu';      // thư mục sẽ tạo trong "Drive của tôi"
const LIMIT_MS = 4.5 * 60 * 1000;                      // mỗi lượt chạy tối đa 6 phút; dừng sớm cho an toàn

function batDau() {
  dungLai_();
  PropertiesService.getScriptProperties().deleteAllProperties();
  ScriptApp.newTrigger('saoLuu').timeBased().everyMinutes(10).create();
  saoLuu();
}

function dungLai() { dungLai_(); ghi_('Đã dừng theo yêu cầu. Chạy lại hàm "tiepTuc" để làm tiếp.'); }

function tiepTuc() { dungLai_(); ScriptApp.newTrigger('saoLuu').timeBased().everyMinutes(10).create(); saoLuu(); }

function dungLai_() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'saoLuu') ScriptApp.deleteTrigger(t); });
}

function saoLuu() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;            // lượt trước còn đang chạy
  try {
    const t0 = Date.now(), P = PropertiesService.getScriptProperties();
    if (P.getProperty('xong')) { dungLai_(); return; }
    const dest = thuMucDich_();
    let nFolder = +(P.getProperty('nFolder') || 0), nFile = +(P.getProperty('nFile') || 0), nLoi = +(P.getProperty('nLoi') || 0);
    const tok = P.getProperty('tok');
    if (!tok && !P.getProperty('goc')) {        // tệp nằm ngay trong thư mục gốc (nếu có)
      const r = saoTep_(DriveApp.getFolderById(SRC_ID), dest, t0);
      nFile += r.n; nLoi += r.loi;
      if (r.xong) P.setProperty('goc', '1');
    }
    const it = tok ? DriveApp.continueFolderIterator(tok) : DriveApp.getFolderById(SRC_ID).getFolders();
    let hetGio = false;
    while (it.hasNext()) {
      const truoc = it.getContinuationToken();  // giữ vị trí TRƯỚC thư mục này, để lần sau làm lại nếu dở dang
      if (Date.now() - t0 > LIMIT_MS) { P.setProperty('tok', truoc); hetGio = true; break; }
      const src = it.next();
      const r = saoTep_(src, conTheoTen_(dest, src.getName()), t0);
      nFile += r.n; nLoi += r.loi;
      if (!r.xong) { P.setProperty('tok', truoc); hetGio = true; break; }   // tệp đã chép sẽ được bỏ qua lần sau
      nFolder++;
      P.setProperty('tok', it.getContinuationToken());
      P.setProperties({ nFolder: String(nFolder), nFile: String(nFile), nLoi: String(nLoi) });
    }
    P.setProperties({ nFolder: String(nFolder), nFile: String(nFile), nLoi: String(nLoi) });
    if (!hetGio) {
      P.setProperty('xong', '1'); dungLai_();
      ghi_(`ĐÃ XONG ✅\nThư mục sách: ${nFolder}\nTệp đã chép: ${nFile}\nLỗi: ${nLoi}`);
    } else {
      ghi_(`Đang sao lưu… (tự chạy tiếp mỗi 10 phút)\nThư mục sách đã xong: ${nFolder} / khoảng 1.095\nTệp đã chép: ${nFile}\nLỗi: ${nLoi}`);
    }
  } finally { lock.releaseLock(); }
}

// Chép các tệp của một thư mục; tệp trùng tên đã có ở đích thì bỏ qua.
function saoTep_(src, dst, t0) {
  const co = {}; const di = dst.getFiles(); while (di.hasNext()) co[di.next().getName()] = 1;
  const it = src.getFiles(); let n = 0, loi = 0, loiLienTiep = 0;
  while (it.hasNext()) {
    if (Date.now() - t0 > LIMIT_MS) return { n, loi, xong: false };
    const f = it.next(), ten = f.getName();
    if (co[ten]) continue;
    try { f.makeCopy(ten, dst); n++; loiLienTiep = 0; }
    catch (e) {
      loi++; loiLienTiep++; console.warn(`Lỗi chép "${src.getName()}/${ten}": ${e}`);
      if (loiLienTiep >= 5) return { n, loi, xong: false };   // có thể chạm giới hạn của Google — để lượt sau làm tiếp
    }
  }
  return { n, loi, xong: true };
}

function thuMucDich_() {
  const it = DriveApp.getRootFolder().getFoldersByName(DEST_NAME);
  return it.hasNext() ? it.next() : DriveApp.getRootFolder().createFolder(DEST_NAME);
}

function conTheoTen_(cha, ten) {
  const it = cha.getFoldersByName(ten);
  return it.hasNext() ? it.next() : cha.createFolder(ten);
}

function ghi_(noiDung) {
  const dest = thuMucDich_(), ten = 'TIEN-DO.txt';
  const txt = `Cập nhật: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}\n${noiDung}\n`;
  const it = dest.getFilesByName(ten);
  if (it.hasNext()) it.next().setContent(txt); else dest.createFile(ten, txt, MimeType.PLAIN_TEXT);
}
