# Xuất bản game & nhận ủng hộ — "Lên Chùa Cầu An"

Tài liệu cập nhật 11/2026. Phí và điều kiện của các dịch vụ thay đổi thường xuyên, hãy xem lại trang chính thức trước khi làm.

---

## 1. Xuất bản ngay, miễn phí: GitHub Pages

Repo `doviettu/like` đang công khai nên dùng được GitHub Pages miễn phí, có sẵn HTTPS.

1. Mở https://github.com/doviettu/like/settings/pages
2. **Build and deployment → Source:** `Deploy from a branch`
3. **Branch:** chọn `ccr-c1e2e7ed-k0ue6s`, thư mục `/ (root)` → **Save**.
   (Hoặc merge PR #2 trước rồi chọn nhánh mặc định. Cách này gọn hơn về lâu dài.)
4. Đợi 1–2 phút. Game chạy ở: **https://doviettu.github.io/like/**

File `.nojekyll` đã có sẵn để GitHub phục vụ nguyên file, không qua Jekyll.

---

## 2. Tên miền miễn phí

| Lựa chọn | Phí | Bao lâu có | Điều kiện | Lưu ý |
|---|---|---|---|---|
| `doviettu.github.io/like` | 0đ | Ngay | Không | Đủ dùng, không cần đăng ký thêm |
| `ten-ban.dpdns.org` (DigitalPlat FreeDomain) | 0đ | Vài phút – vài ngày | Tạo tài khoản | `.us.kg` đã tạm dừng đăng ký mới, `.qzz.io` chuyển sang thu phí |
| `ten-ban.eu.org` | 0đ | Có thể mất **nhiều tháng** duyệt tay | Tạo tài khoản | Chạy từ 1996, ổn định nhưng chậm |
| `ten-ban.id.vn` | 0đ nếu là công dân **18–23 tuổi** (dùng CCCD) | Vài giờ | Mỗi người 1 tên miền, qua nhà đăng ký (iNET, Tenten, BKNS…) | Chính sách miễn phí 3 năm áp dụng từ 01/01/2027. Đăng ký sai đối tượng sẽ bị thu hồi |
| `.com` / `.vn` trả phí | ~250k–750k/năm | Ngay | Không | **Nên dùng nếu nhận tiền**: tên miền riêng tạo lòng tin, không lo bị thu hồi |

Các tên miền miễn phí thực chất là tên miền con: nhà cung cấp có thể thu hồi bất cứ lúc nào, và một số nơi khuyên không dùng cho email.

### Gắn tên miền vào GitHub Pages
1. Ở nơi quản lý DNS của tên miền, tạo bản ghi **CNAME**: `lenchua` (hoặc `@`/`www`) → `doviettu.github.io`
2. Settings → Pages → **Custom domain**: nhập tên miền → Save → bật **Enforce HTTPS** khi nút sáng lên.
3. Đổi `GAME_URL` và `ALLOW_ORIGIN` trong `worker/wrangler.toml` sang tên miền mới (nếu có dùng Worker).

---

## 3. Nhận ủng hộ — 3 mức, từ đơn giản tới tự động

Mọi cấu hình nằm ở khối **"1b. CẤU HÌNH ỦNG HỘ"** đầu phần script trong `index.html`. Để trống tất cả thì nút ủng hộ **tự ẩn**.

### Mức 1 — VietQR tĩnh (5 phút, không cần đăng ký gì)
Điền `bankBin`, `accountNo`, `accountName`. Game tự sinh mã VietQR **ngay trên máy người chơi**, có sẵn số tiền và nội dung `UNG HO <TEN>`. Mọi app ngân hàng đều quét được.
- Ưu: miễn phí, tiền về thẳng tài khoản.
- Nhược: **không tự xác nhận**, người chơi không thấy lời cảm ơn tự động.

### Mức 2 — payOS + Cloudflare Worker (tự xác nhận) ✅ khuyên dùng
payOS miễn phí khởi tạo, duy trì và giao dịch (từ 23/01/2026). Cá nhân đăng ký được bằng CCCD, tiền về thẳng tài khoản ngân hàng. Worker chạy trên gói miễn phí của Cloudflare.

1. Đăng ký tại https://payos.vn → tạo **kênh thanh toán**, liên kết tài khoản ngân hàng → lấy **Client ID, API Key, Checksum Key**.
2. Cài Node.js, rồi trong thư mục `worker/`:
   ```bash
   npx wrangler login
   npx wrangler kv namespace create DB      # dán id vào wrangler.toml
   npx wrangler secret put PAYOS_CLIENT_ID
   npx wrangler secret put PAYOS_API_KEY
   npx wrangler secret put PAYOS_CHECKSUM_KEY
   npx wrangler deploy                       # in ra URL dạng https://lenchua-ungho.<ban>.workers.dev
   ```
3. Trong payOS, đặt **Webhook URL** = `<URL Worker>/payos-webhook`.
4. Điền `apiBase: '<URL Worker>'` trong `index.html`.

Luồng hoạt động: người chơi chọn số tiền → Worker tạo mã QR payOS → người chơi quét bằng app ngân hàng → payOS gọi webhook (Worker kiểm chữ ký HMAC-SHA256) → game hiện "Cảm ơn bạn 🙏". Nếu webhook trục trặc, Worker vẫn tự hỏi payOS trạng thái đơn.

Có Worker thì dòng "Hôm nay có … người lên chùa" chuyển thành **số đếm thật** (mỗi máy tính 1 lần/ngày) thay cho số mô phỏng, và có **bảng cảm ơn** gồm 20 tên gần nhất (đã lọc từ thô tục).

Giới hạn gói miễn phí của Cloudflare: 100.000 request/ngày, KV 1.000 lượt ghi/ngày. Mỗi lượt ủng hộ hoặc mỗi người chơi mới trong ngày tốn 1–2 lượt ghi, đủ cho game nhỏ.

### Mức 3 — Người ở nước ngoài
Điền `kofi` (https://ko-fi.com). Ko-fi không thu phí trên tiền donate, chỉ chịu phí PayPal/Stripe. Stripe chưa hỗ trợ Việt Nam nên thường phải đi qua PayPal. Hãy thử rút một khoản nhỏ về ngân hàng Việt Nam trước khi quảng bá.

### Các lựa chọn khác
- **SePay**: nhận webhook khi tài khoản ngân hàng có tiền vào. Bảng giá (bản cũ) có gói FREE 50 giao dịch/tháng. Hợp nếu bạn muốn tự xác nhận mà không qua payOS.
- **MoMo / VNPay / ZaloPay**: API thanh toán thường yêu cầu doanh nghiệp hoặc hộ kinh doanh. Cá nhân dùng QR nhận tiền tĩnh của ví thì được nhưng không tự xác nhận.

---

## 4. Cách tăng ủng hộ (mà vẫn giữ được lòng tin)

**Nên làm**
- **Mời đúng lúc, không chen ngang**: lời mời nhỏ chỉ hiện sau khi xong mõ (điểm Tâm an) và sau khi xin quẻ, lúc người chơi đang thấy an lòng. Không hiện giữa lúc làm lễ, không có popup. (Đã làm.)
- **Mức gợi ý rõ ràng**: 20k / 50k / 100k / 200k, mặc định 50k, có ô "tuỳ tâm". (Đã làm.)
- **Minh bạch**: nói rõ tiền dùng vào việc gì, ví dụ tên miền hoặc làm lễ hội mới. Có thể đăng tổng nhận và chi mỗi quý lên một trang công khai.
- **Cảm ơn công khai, có chọn lựa**: bảng tên người ủng hộ. (Đã có qua Worker.)
- **Theo mùa lễ**: Tết và Rằm tháng Giêng là mùa "lên chùa cầu an" đông nhất, sau đó tới Phật Đản và Vu Lan. Mỗi mùa thêm một sự kiện trong game, kèm lời kêu gọi nhẹ nhàng.
- **Lan toả**: ảnh chia sẻ 1080×1350 đưa người chơi mới vào game. Khi có tên miền riêng, nên in địa chỉ game lên ảnh.

**Không nên làm**
- Gắn tiền với công đức, phước, "quẻ tốt hơn", hay mở khoá lễ bái. Việc này vừa phản cảm vừa dễ bị xem là trục lợi tín ngưỡng.
- Đặt số đếm người mô phỏng ngay cạnh nút ủng hộ (đây là bằng chứng xã hội giả). Khi nhận tiền nên dùng số đếm thật của Worker.
- Đếm ngược, thúc giục, hay chặn tính năng của người không ủng hộ.

---

## 5. Lưu ý pháp lý & thuế (tham khảo, không phải tư vấn pháp luật)

- **Đừng gọi là "cúng dường chùa An Lạc".** Chùa trong game là hư cấu, còn "An Lạc" là tên phổ biến và có thể trùng chùa thật. Nhận tiền nhân danh chùa vào tài khoản cá nhân dễ gây hiểu lầm, có thể bị xem là lừa đảo. Game đã dùng câu chữ "Ủng hộ người làm game".
- **Muốn cúng dường thật cho một ngôi chùa**: cần thoả thuận chính thức (có văn bản) với chùa đó. Hiển thị **đúng tài khoản của chùa**, tiền không đi qua tài khoản cá nhân của bạn.
- **Nếu chuyển sang quyên góp từ thiện**: cần tài khoản riêng, công khai sao kê và báo cáo theo quy định về vận động đóng góp tự nguyện (Nghị định 93/2021/NĐ-CP — kiểm tra văn bản còn hiệu lực).
- **Thuế**: các nguồn chưa thống nhất về cách tính thuế trên tiền donate cá nhân. Có nơi coi là quà tặng (mỗi lần trên 10 triệu chịu 10% TNCN), có nơi coi là thu nhập kinh doanh (doanh thu từ 100 triệu/năm thì kê khai khoảng 7%). Luật thuế TNCN đang được sửa. Hãy hỏi cơ quan thuế nơi cư trú khi số tiền đáng kể.
- **Dữ liệu**: game không thu thập dữ liệu cá nhân. Worker chỉ lưu tên hiển thị (nếu người chơi có tên) cùng số tiền, tự xoá sau 3 ngày. Bảng cảm ơn giữ 20 tên gần nhất.
