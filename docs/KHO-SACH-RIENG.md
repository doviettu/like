# Kho sách riêng của chùa & đền (Cloudflare R2)

Mục tiêu: game không còn phụ thuộc thư mục Google Drive của người khác.

**Thứ tự mở một cuốn sách trong Tàng kinh các / Thư các:**
1. **Kho riêng.** Chỉ những cuốn bạn đã xác nhận được phép phát hành.
2. **Nguồn chính thống.** Ví dụ Thư Viện Hoa Sen, SuttaCentral, Budsas… (cột `nguon_chinh_thong` trong danh mục).
3. **Google Drive cộng đồng.** Dùng như hiện nay, khi chưa có hai nguồn trên.

**Kho R2 `thu-vien-sach` có 2 vùng:**

| Vùng | Chứa gì | Ai đọc được |
|---|---|---|
| `luu-tru/` | Bản sao lưu toàn bộ thư viện, giữ nguyên thư mục | **Chỉ bạn.** Máy chủ game không bao giờ phát vùng này. |
| `cong-khai/` | Chỉ các cuốn đánh dấu `duoc_phep`, tên tệp là `<id>.pdf` hoặc `<id>.epub` | Người chơi, qua `/sach/<id>.pdf` |

## Bước 1: Tạo kho (làm một lần)
1. Vào Cloudflare → **R2 Object Storage**. Nếu được hỏi, bật R2: gói miễn phí 10 GB, Cloudflare có thể yêu cầu thêm thẻ.
2. Bấm **Create bucket**, đặt tên `thu-vien-sach`, chọn vị trí **Asia-Pacific (APAC)**. **Không** bật Public access hay r2.dev.
3. Vào R2 → **Manage R2 API Tokens** → **Create API token**:
   - Quyền **Object Read & Write**, chỉ cho bucket `thu-vien-sach`.
   - Ghi lại **Access Key ID** và **Secret Access Key**. Chỉ dùng ở Colab (bước 2 và 3), **không gửi qua chat**.
4. Bật kho cho máy chủ game. Trong repo `doviettu/bodetam`, mở `wrangler.toml`, bỏ dấu `# ` ở 3 dòng cuối:
   ```toml
   [[r2_buckets]]
   binding = "SACH"
   bucket_name = "thu-vien-sach"
   ```
   Commit lên `main`, Cloudflare sẽ tự dựng lại. Bạn cũng có thể nhắn Claude "đã tạo bucket" để Claude bật giúp.
   Kiểm tra: mở `https://bodetam.doviettudn.workers.dev/sach/danh-sach`. Thấy `"kho":true` là kho đã nối.

## Bước 2: Sao lưu toàn bộ vào vùng riêng `luu-tru/`
1. Mở https://colab.research.google.com → **Tệp → Sổ tay mới**.
2. Dán toàn bộ nội dung `tools/dua_sach_len_kho.py` vào ô mã. Để nguyên `CHE_DO = 'luu-tru'`, bấm ▶.
3. Cho phép Colab đọc Google Drive, rồi dán Access Key và Secret vào hai ô nhập ẩn.
4. Chờ tới dòng `XONG`. Nếu Colab ngắt giữa chừng, bấm ▶ lại: tệp đã có sẽ được bỏ qua.

> Muốn lưu sang Google Drive của mình (không qua R2), xem `docs/SAO-LUU-THU-VIEN.md` → Cách 1.

## Bước 3: Chọn những cuốn được phát trong game (`cong-khai/`)
1. Mở `docs/danh-muc-sach.csv` bằng Google Sheets (**Tệp → Nhập**). Danh mục có 289 cuốn của cả chùa và đền.
2. Với mỗi cuốn bạn **chắc chắn được phép phát hành lại**, ghi `x` vào cột `duoc_phep` và ghi căn cứ vào cột `can_cu_quyen`. Ví dụ:
   - "Sách ấn tống, ghi rõ khuyến khích in lại / phổ biến rộng rãi" (chụp lại trang ghi chú đó)
   - "Tác giả / dịch giả / nhà xuất bản đồng ý qua email ngày …"
   - "Bản dịch của chính tôi"

   Không chắc thì **để trống**. Cuốn đó vẫn mở qua nguồn chính thống hoặc Drive như hiện nay.
3. Trong Google Sheets: **Tệp → Tải xuống → CSV**.
4. Chạy lại script Colab với `CHE_DO = 'cong-khai'`. Khi được hỏi, chọn tệp CSV vừa tải.
5. Trong vòng khoảng 5 phút, các cuốn đó trong game sẽ hiện nguồn "Kho kinh của chùa" / "Kho sách của đền" và mở thẳng từ máy chủ của bạn.

**Gỡ một cuốn:** Cloudflare → R2 → `thu-vien-sach` → `cong-khai/` → xoá tệp `<id>.pdf`. Game tự quay về nguồn chính thống hoặc Drive.
