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

## 3. "Bồ đề tâm" — phát tâm theo gói, ghi danh bảng công đức

Mọi cấu hình nằm ở khối **"1b. CẤU HÌNH BỒ ĐỀ TÂM"** đầu phần script trong `index.html`. Để trống tài khoản, `apiBase` và `kofi` thì toàn bộ phần phát tâm và bảng công đức **tự ẩn**.

### Người nhận là ai? (bắt buộc chọn đúng)
| `recipientType` | Khi nào dùng | Lời mời trong game |
|---|---|---|
| `'nguoilamgame'` (mặc định) | Tài khoản cá nhân của người làm game | "Phát tâm duy trì hương khói **chùa ảo** An Lạc…", kèm tên người nhận "(người làm game)" |
| `'chua'` + `templeName` | **Chỉ khi** tài khoản đúng là của một ngôi chùa thật **và chùa đã đồng ý** | "Phát tâm **cúng dường Tam Bảo, duy trì hương khói** <tên chùa>" |

Chùa An Lạc trong game là chùa hư cấu. Ghi "cúng dường Tam Bảo" mà tiền vào tài khoản cá nhân sẽ khiến người chuyển tưởng tiền tới chùa thật. Vì vậy game chỉ dùng lời ấy khi bạn khai báo một ngôi chùa thật.

### Các gói & cách ghi danh
| Gói | Số tiền | Ghi danh trên bảng công đức |
|---|---|---|
| 🔔 Chuông đồng | 500.000đ | Chữ vàng, hàng đầu bảng |
| 🌿 Cành bồ đề | 200.000đ | Chữ xanh bồ đề, hàng trên |
| 🪷 Đoá sen | 100.000đ | Chữ hồng sen |
| 🕯️ Ngọn đèn | 50.000đ | Kèm ngọn đèn sáng |
| 🙏 Nén hương | 20.000đ | Hàng Nén hương |
| 🤍 Tuỳ tâm | từ 10.000đ | Theo mức tương ứng với số tiền |

- Người phát tâm nhập **tên ghi danh** (ví dụ "Gia đình ông bà Nguyễn Văn A") hoặc chọn **ẩn danh**. Tên được lọc từ thô tục.
- Nội dung chuyển khoản: `BO DE TAM <TÊN KHÔNG DẤU>` (tối đa 25 ký tự). Với payOS, nội dung là `BDTAM` + 4 số.
- **Bảng công đức** có ở hai nơi: tấm bảng 3D trong sân (bên trái, trước chính điện; lại gần sẽ hiện nút "Xem bảng công đức") và bảng chi tiết mở từ bảng phát tâm.
- Ghi danh chỉ để tri ân. Không đổi được gì trong game, mọi hoạt động lễ vẫn miễn phí.
- Muốn đổi số tiền, tên hoặc biểu tượng của gói: sửa mảng `TIERS` trong `index.html` và `TIER_MIN` trong `worker/donate-worker.js` (hai chỗ phải khớp nhau).

### Ghi danh đến từ đâu
1. **Thủ công** (`honorRoll` trong cấu hình): bạn đối chiếu sao kê rồi tự thêm `{ name: '...', tier: 3 }`. Mọi người chơi đều thấy. Dùng khi chỉ có VietQR tĩnh.
2. **Tự động qua Worker + payOS**: khi tiền về, tên vào bảng chung theo **số tiền thực nhận** (không theo số trình duyệt gửi lên). Mọi người chơi đều thấy.
3. **Trên máy người chơi**: với VietQR tĩnh, người chơi bấm "Con đã chuyển khoản — ghi danh". Tên hiện **chỉ trên máy họ**, có dấu `*` "chờ người nhận xác nhận".

### Mức 1 — VietQR tĩnh (5 phút, không cần đăng ký gì)
Điền `bankBin`, `accountNo`, `accountName`. Game tự sinh mã VietQR **ngay trên máy người chơi**, có sẵn số tiền của gói và nội dung `BO DE TAM <TEN>`. Mọi app ngân hàng đều quét được.
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

Có Worker thì dòng "Hôm nay có … người lên chùa" chuyển thành **số đếm thật** (mỗi máy tính 1 lần/ngày) thay cho số mô phỏng, và **bảng công đức chung** tự cập nhật (giữ 200 lượt gần nhất).

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
- **Gói rõ ràng**: Nén hương 20k → Chuông đồng 500k, mặc định Ngọn đèn 50k, có "tuỳ tâm". (Đã làm.)
- **Minh bạch**: nói rõ tiền dùng vào việc gì, ví dụ tên miền hoặc làm lễ hội mới. Có thể đăng tổng nhận và chi mỗi quý lên một trang công khai.
- **Ghi danh theo gói**: bảng công đức với 5 gói, mỗi gói một kiểu chữ và hàng riêng, có chọn ẩn danh. (Đã làm.)
- **Theo mùa lễ**: Tết và Rằm tháng Giêng là mùa "lên chùa cầu an" đông nhất, sau đó tới Phật Đản và Vu Lan. Mỗi mùa thêm một sự kiện trong game, kèm lời kêu gọi nhẹ nhàng.
- **Lan toả**: ảnh chia sẻ 1080×1350 đưa người chơi mới vào game. Khi có tên miền riêng, nên in địa chỉ game lên ảnh.

**Không nên làm**
- Hứa phước báu, "quẻ tốt hơn", hay khoá lễ bái sau tiền. Ghi danh tri ân như bảng công đức ở chùa thì được; hứa hẹn tâm linh thì dễ bị xem là trục lợi tín ngưỡng.
- Đặt số đếm người mô phỏng ngay cạnh nút ủng hộ (đây là bằng chứng xã hội giả). Khi nhận tiền nên dùng số đếm thật của Worker.
- Đếm ngược, thúc giục, hay chặn tính năng của người không ủng hộ.

---

## 5. Lưu ý pháp lý & thuế (tham khảo, không phải tư vấn pháp luật)

- **Không nhận "cúng dường Tam Bảo" vào tài khoản cá nhân.** Chùa trong game là hư cấu, còn "An Lạc" là tên phổ biến và có thể trùng chùa thật. Nhận tiền nhân danh chùa vào tài khoản cá nhân dễ gây hiểu lầm, có thể bị xem là lừa đảo. Với tài khoản cá nhân, game ghi rõ "chùa ảo" và tên người nhận (`recipientType: 'nguoilamgame'`).
- **Muốn cúng dường thật cho một ngôi chùa**: cần thoả thuận chính thức (có văn bản) với chùa đó. Hiển thị **đúng tài khoản của chùa**, tiền không đi qua tài khoản cá nhân của bạn.
- **Nếu chuyển sang quyên góp từ thiện**: cần tài khoản riêng, công khai sao kê và báo cáo theo quy định về vận động đóng góp tự nguyện (Nghị định 93/2021/NĐ-CP — kiểm tra văn bản còn hiệu lực).
- **Thuế**: các nguồn chưa thống nhất về cách tính thuế trên tiền donate cá nhân. Có nơi coi là quà tặng (mỗi lần trên 10 triệu chịu 10% TNCN), có nơi coi là thu nhập kinh doanh (doanh thu từ 100 triệu/năm thì kê khai khoảng 7%). Luật thuế TNCN đang được sửa. Hãy hỏi cơ quan thuế nơi cư trú khi số tiền đáng kể.
- **Dữ liệu**: game không thu thập dữ liệu cá nhân. Worker lưu đơn (tên ghi danh, số tiền) 3 ngày; bảng công đức chỉ giữ tên ghi danh và gói, 200 lượt gần nhất. Ai chọn ẩn danh thì ghi "Phật tử ẩn danh".
