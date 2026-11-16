# Hướng dẫn: đăng ký Cloudflare & bật "Chùa trực tuyến"

Mất khoảng 10 phút, không cần thẻ thanh toán, không cần cài gì trên máy. Máy chủ đã viết sẵn ở `worker/phong/`; GitHub sẽ tự đưa nó lên Cloudflare sau khi bạn làm xong bước 5.

> 🔒 **Không gửi mật khẩu hay API token qua chat**, kể cả cho Claude. Token chỉ dán vào GitHub Secrets (bước 5).

## Bước 1 — Đăng ký tài khoản Cloudflare
1. Mở https://dash.cloudflare.com/sign-up
2. Nhập email và mật khẩu → **Sign up**.
3. Mở hộp thư, bấm link xác minh của Cloudflare.
4. Nếu được hỏi chọn gói, chọn **Free** (miễn phí). Không cần thêm tên miền hay website nào.

## Bước 2 — Bật Workers & chọn tên miền con `workers.dev`
1. Ở menu bên trái, chọn **Workers & Pages** (giao diện mới có thể nằm trong mục **Compute**).
2. Lần đầu vào, Cloudflare yêu cầu chọn **subdomain** cho `workers.dev`, ví dụ `doviettu` → địa chỉ sẽ có dạng `*.doviettu.workers.dev`. Chọn rồi bấm xác nhận.
   (Nếu không được hỏi: vào **Workers & Pages → Overview**, xem mục *Your subdomain* ở cột phải.)

## Bước 3 — Lấy Account ID
- Trang **Workers & Pages → Overview**, cột bên phải có dòng **Account ID** → bấm biểu tượng sao chép.
- (Hoặc nhìn thanh địa chỉ trình duyệt: `dash.cloudflare.com/`**`<Account ID>`**`/...`)

## Bước 4 — Tạo API token cho việc triển khai
1. Bấm biểu tượng người ở góc phải trên → **My Profile** → **API Tokens** (hoặc mở thẳng https://dash.cloudflare.com/profile/api-tokens).
2. **Create Token** → ở dòng mẫu **Edit Cloudflare Workers** bấm **Use template**.
3. **Account Resources:** *Include* → chọn tài khoản của bạn.
   **Zone Resources:** *Include* → *All zones from an account* → chọn tài khoản của bạn.
4. **Continue to summary** → **Create Token**.
5. **Sao chép token ngay** (Cloudflare chỉ hiện một lần).

## Bước 5 — Dán 2 giá trị vào GitHub Secrets
1. Mở https://github.com/doviettu/like/settings/secrets/actions
2. **New repository secret**:
   - Name: `CLOUDFLARE_API_TOKEN` → Secret: *token ở bước 4* → **Add secret**
3. **New repository secret** lần nữa:
   - Name: `CLOUDFLARE_ACCOUNT_ID` → Secret: *Account ID ở bước 3* → **Add secret**

## Bước 6 — Chạy triển khai
1. Mở https://github.com/doviettu/like/actions
2. Bấm vào **Triển khai máy chủ Cloudflare** ở cột trái → bấm lần chạy gần nhất → **Re-run all jobs**.
3. Chờ khoảng 1 phút cho tới khi có dấu ✓ xanh. Mở lần chạy đó, phần **Summary** ghi địa chỉ, ví dụ `https://lenchua-phong.doviettu.workers.dev`.
4. Mở địa chỉ đó bằng trình duyệt: thấy dòng *"Lên Chùa Cầu An — máy chủ phòng chùa đang chạy 🙏"* là xong.

## Bước 7 — Bật trong game
Gửi cho Claude **địa chỉ ở bước 6** (địa chỉ này công khai, không phải bí mật). Claude sẽ điền vào game và cập nhật bản đang chạy.
Hoặc tự sửa trong `index.html` (khối **1c. CHÙA TRỰC TUYẾN**):
```js
const ONLINE = { url: 'wss://lenchua-phong.doviettu.workers.dev/room/an-lac' };
```
(đổi `https://` thành `wss://` và thêm `/room/an-lac` ở cuối).

## Gói miễn phí đủ dùng tới đâu?
- Durable Objects trên gói Workers Free: **100.000 request mỗi ngày**, đặt lại lúc 7 giờ sáng giờ Việt Nam. Vượt mức thì kết nối mới bị từ chối tới hôm sau; game tự quay về chơi một mình với khách AI.
- Game chỉ gửi vị trí khi nhân vật di chuyển (tối đa khoảng 6 lần/giây), đứng yên thì gần như không gửi. Phòng vắng thì máy chủ "ngủ", không tính tiền.
- Mỗi phòng tối đa 30 người; đầy thì tự sang phòng kế tiếp (`an-lac-1`, `an-lac-2`…).
- Cloudflare tính tin nhắn WebSocket gửi đến máy chủ theo tỉ lệ 20 tin = 1 request (theo tài liệu tham khảo, nên xem lại trang giá của Cloudflare). Ước tính tạm: vài chục người chơi cùng lúc vài giờ mỗi ngày vẫn nằm trong gói miễn phí.

## An toàn & quyền riêng tư
- Không có chat tự do: chỉ cử chỉ (chắp tay, cúi chào, vẫy, thiền), 6 câu chào soạn sẵn và tặng hoa sen.
- Tên người chơi **ẩn** cho tới khi hai người cùng tặng nhau hoa sen ("kết duyên"); tên có lọc từ thô tục ở máy chủ.
- Mỗi người có thể **Ẩn** hoặc **Báo cáo** người khác (bấm dòng "👥 … Phật tử" trên HUD). 3 người khác nhau báo cáo thì người đó bị mời rời phòng.
- Máy chủ **không lưu gì** xuống ổ đĩa: rời phòng là mất. Chỉ chấp nhận kết nối từ trang `doviettu.github.io` (sửa `ALLOW_ORIGINS` trong `worker/phong/wrangler.toml` nếu có tên miền riêng).
- Người chơi tắt được "Chùa trực tuyến" trong Sổ cầu an.

## Sau này: máy chủ nhận ủng hộ (payOS)
Máy chủ ở `worker/` (payOS + bảng công đức) có thể triển khai cùng cách: cần thêm KV và 3 secret của payOS. Nhắn Claude khi bạn đã có tài khoản payOS.
