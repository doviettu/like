# Sao lưu thư viện kinh sách về kho riêng

Thư mục gốc: https://drive.google.com/drive/folders/1VbpbVymXXPDv0A5239L9hEnsHXiDrZG2 (chủ sở hữu: donam@vnn.ng, đang chia sẻ công khai).
Mục đích: **lưu trữ riêng**, phòng khi thư mục gốc bị xoá hoặc tắt chia sẻ. Game vẫn dẫn link như hiện tại.

> Phần lớn sách còn bản quyền của tác giả, dịch giả và nhà xuất bản. Bản sao lưu chỉ để bạn giữ riêng:
> **không bật chia sẻ công khai** thư mục hay kho lưu trữ, và không đổi link trong game sang bản sao này.

## Cách 1 — Sao vào Google Drive của bạn (dễ nhất, khoảng 10–30 phút, không cần cài gì)
Google tự sao chép giữa các máy chủ, không tải qua máy của bạn.
1. Mở https://colab.research.google.com (đăng nhập Google của bạn) → **Tệp → Sổ tay mới**.
2. Mở tệp `tools/sao_luu_thu_vien.py` trong repo, sao chép **toàn bộ** và dán vào ô mã.
3. Bấm ▶. Khi được hỏi, cho phép Colab truy cập Google Drive của bạn.
4. Chờ đến dòng `XONG: …`. Sách nằm trong **Drive của tôi → "Thu vien kinh sach - sao luu"**, giữ nguyên cấu trúc thư mục.
   - Bị ngắt giữa chừng (Colab hết giờ, mạng chập chờn…) thì cứ bấm ▶ lại: tệp đã có được bỏ qua, chạy tiếp chỗ còn thiếu.
   - Drive miễn phí có 15 GB. Nếu không đủ, đặt `ONLY_EXT = ('.pdf',)` ở đầu tệp để chỉ lấy bản PDF.

## Cách 2 — Lưu sang Cloudflare R2 (kho riêng, ngoài Google)
R2 miễn phí tới 10 GB. Cloudflare có thể yêu cầu thêm phương thức thanh toán để bật R2, dù bạn dùng trong mức miễn phí.
1. Cloudflare → **R2 Object Storage** → **Create bucket**, đặt tên `thu-vien-sach`. Để **riêng tư**: không bật Public access hay r2.dev.
2. R2 → **Manage R2 API Tokens** → **Create API token**, quyền *Object Read & Write*, chỉ cho bucket `thu-vien-sach`.
   Ghi lại Access Key ID, Secret Access Key và địa chỉ endpoint `https://<account_id>.r2.cloudflarestorage.com`.
   **Không gửi các giá trị này qua chat.**
3. Trên máy tính của bạn, cài rclone (https://rclone.org/downloads/) rồi chạy `rclone config` để tạo 2 remote:
   - `gdrive`: Storage = **drive**, scope = **drive.readonly**, đăng nhập Google khi được hỏi.
   - `r2`: Storage = **s3**, provider = **Cloudflare**, dán Access Key, Secret và endpoint ở bước 2.
4. Chạy lệnh sau (chạy lại bao nhiêu lần cũng được; tệp đã có sẽ được bỏ qua):
   ```
   rclone copy gdrive: r2:thu-vien-sach --drive-root-folder-id 1VbpbVymXXPDv0A5239L9hEnsHXiDrZG2 --transfers 8 --progress
   ```
   Lệnh này tải từ Drive về máy bạn rồi đẩy lên R2. Nên dùng mạng ổn định, vì dung lượng có thể vài GB.
   Có thể chạy thử trước bằng `--dry-run` để xem số tệp và dung lượng.
