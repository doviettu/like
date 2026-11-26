# vork — ghi chú nghiên cứu

Nguồn: [voyager-so/vork](https://github.com/voyager-so/vork) (giấy phép riêng "vork Preview License", phiên bản 0.6.2, đọc tại commit `0f53714`, 25/11/2026). Trang sản phẩm: <https://voyager.so/vork>.

Ghi chú này rút từ việc **đọc mã và tài liệu trong repo**. Chưa cài vork và chưa render gì trong phiên này; mọi con số về tốc độ là của tác giả.

## Nó là gì

Bộ máy dựng hình 3D và kỹ xảo (VFX) **thiết kế cho agent AI dùng**, không có trình biên tập đồ họa. Agent viết cả cảnh dưới dạng mã (JSON, hoặc TypeScript/Python sinh ra JSON), kể cả shader, vật liệu, camera và mô phỏng vật lý; vork render trên GPU; agent mở ảnh ra xem rồi sửa mã.

Khác với hai repo trước, cái này **liên quan trực tiếp đến Claude Code**: nó kèm sẵn một skill cho agent và một lệnh để cài skill đó vào dự án.

```json
{"version":2,"nodes":[
  {"type":"mesh","geometry":{"std":"rounded_box","size":[2,2,2],"radius":0.3},
   "materials":[{"inputs":{"base_color":[0.12,0.35,0.65],"specular_roughness":0.3}}]},
  {"type":"light","shape":"rectangle","translation":[-3,5,4],"target":[0,0,0],"energy":700,"size":4},
  {"type":"camera","translation":[3,2,5],"target":[0,0,0]}
],"render":{"resolution":[640,480]}}
```

```sh
vork render scene.json --profile std/previs --out preview.png
```

## Công nghệ

| Phần | Dùng gì |
|---|---|
| Lõi | Rust (workspace 21 crate trong `crates/`), shader viết bằng Slang (~25.000 dòng) |
| GPU | Vulkan (Linux, Windows) và Metal (Mac), qua bản wgpu đã vá nằm trong `vendor/` |
| Dựng hình | Mặc định: raster kết hợp chiếu sáng ray-tracing phần cứng; có thêm path tracer |
| Khử nhiễu | OIDN đi kèm |
| SDK viết cảnh | `packages/ts` (npm `@voyager-so/vork`), `packages/python` (PyPI `vork`) |
| Thư viện mô phỏng | `libraries/`: chất lỏng, khói, vải, và lớp tương thích Blender |
| Cầu nối Blender | `integrations/blender` (thành phần riêng, GPL-3.0-or-later) |

## Cách làm việc

Bốn mức chất lượng tách khỏi nội dung cảnh, đổi bằng `--profile`:

| Profile | Dùng khi |
|---|---|
| `std/previs` | Dựng khung, thử góc máy; nhanh nhất, ánh sáng và bóng đổ khác bản cuối |
| `std/draft` | Đánh giá ánh sáng; 4 mẫu + khử nhiễu |
| `std/final` | Bản giao mặc định; 8 mẫu + khử nhiễu |
| `std/path` | Cần chính xác về đường đi ánh sáng; chậm hơn nhiều |

Các lệnh chính: `vork init` (tạo dự án mẫu), `vork check` (kiểm tra cảnh bằng CPU, không cần GPU), `vork ask` (đọc giá trị trong cảnh mà không render), `vork render`, `vork export` (xuất `.glb`), `vork setup` (kiểm tra GPU và biên dịch sẵn shader).

Khi cảnh cần thứ khác thường, agent viết chương trình Slang cắm vào các điểm móc công khai: tia camera, phản ứng vật liệu, đường truyền ánh sáng, phản ứng phim. Ví dụ hố đen trong `examples/black-hole/` bẻ cong tia sáng hoàn toàn bằng mã của cảnh, không sửa bộ dựng hình.

## Bài học đáng mang về

Đây là ví dụ rõ nhất trong ba repo về cách **thiết kế công cụ cho agent**.

1. **Tài liệu nằm trong lệnh, chia theo ngân sách token.** `vork help` là trang đầu (tác giả nói API lõi vừa khoảng 2.500 token); `vork help CHỦ_ĐỀ --all` cho chi tiết từng chủ đề; `vork help field ĐƯỜNG_DẪN` cho đúng một trường. Agent chỉ nạp phần nó cần, đúng lúc cần.
2. **Trường lạ là lỗi.** Bộ đọc cảnh từ chối mọi trường không có trong lược đồ, nên agent bịa tên trường sẽ bị báo ngay thay vì bị âm thầm bỏ qua.
3. **Skill ngắn, chỉ nói điều công cụ không tự nói được.** `skills/vork/SKILL.md` dài 27 dòng: trỏ về `vork help` cho mọi tra cứu, còn lại là quy trình (render thử rẻ, xem ảnh, sửa lỗi lớn nhất trước) và kỷ luật báo cáo. Hai file tham khảo chỉ được đọc khi đúng tình huống.
4. **Skill đóng gói trong binary.** `vork skills add` ghi skill vào `.agents/skills/vork` và `.claude/skills/vork` của dự án; nội dung được nhúng lúc biên dịch nên luôn khớp phiên bản công cụ.
5. **Buộc agent trung thực về kết quả.** Skill yêu cầu: mã thoát bằng 0, đọc cảnh báo, báo mọi chỗ bỏ sót hay thay thế, không lặng lẽ bỏ hiệu ứng được yêu cầu, nói rõ đã kiểm tra gì và có xem video chạy hay chỉ xem khung mẫu.
6. **Vòng lặp rẻ trước, đắt sau.** Kiểm tra bằng CPU, rồi ảnh tĩnh previs, rồi bảng khung hình cho chuyển động, cuối cùng mới render đầy đủ. Ngân sách tính từ thời gian đo được.
7. **Công bố số liệu kèm giới hạn.** README ghi cả trường hợp vork *chậm hơn* (path tracing chậm hơn Cycles 2–5,8 lần), cảnh hết bộ nhớ GPU, và nói rõ con số nào là đo, con số nào là ngoại suy. Đây là mẫu tốt cho cách viết báo cáo hiệu năng.
8. **Vá thư viện ngoài có ghi nguồn gốc.** Mỗi bản vá trong `vendor/` có file `PROVENANCE.md` giải thích sửa gì và vì sao.

## Áp dụng cho tài khoản

| Muốn gì | Cách | Lưu ý |
|---|---|---|
| Thử trong phiên cloud của Claude Code | Không render được ở đây | Container cloud không có GPU. Viết cảnh, `vork check` và `vork help` thì chạy được không cần GPU. Có chế độ CPU (`VORK_GPU=cpu`) nhưng tác giả mô tả là chậm và cần driver Vulkan hỗ trợ ray query |
| Dùng trên máy riêng | Cài theo README, rồi `vork init my-shot && cd my-shot && vork skills add` | Cần Mac Apple Silicon (macOS 15+), hoặc GPU NVIDIA/AMD có ray-tracing phần cứng. Một số GPU máy chủ (A100, H100…) không dùng được |
| Cho Claude Code biết cách dùng | `vork skills add` trong thư mục dự án | Skill gắn với từng dự án, không phải cài một lần cho cả tài khoản |
| Không có GPU phù hợp | Dịch vụ [vork cloud](https://voyager.so/vork/cloud) của Voyager | Chưa xem điều khoản hay giá; cảnh và tài nguyên sẽ được gửi lên máy chủ của họ |
| Lời nhắc khởi đầu cho agent | "Run `vork init my-shot`, read `vork help`, render a preview and inspect the image. Refine the camera and lighting before rendering at final quality." | Trích từ README |

Trình cài đặt tải binary từ GitHub Releases, kiểm tra SHA256, cài vào `~/.local/lib/vork` và **sửa file khởi động shell để thêm PATH**; đặt `VORK_NO_MODIFY_PATH=1` nếu không muốn. `vork setup` lần đầu mất vài phút để biên dịch shader (tác giả đo khoảng 250 giây trên NVIDIA L4).

## Giấy phép

**Không phải mã nguồn mở.** "vork Preview License" của Nullframe, Inc.:

- Được: dùng miễn phí cho mọi mục đích kể cả thương mại, cho agent AI vận hành thay mình, sửa đổi để tự dùng, chia sẻ bản *chưa sửa* kèm nguyên giấy phép.
- Không được nếu chưa xin phép: bán, cấp phép lại, phát hành bản đã sửa, hoặc cung cấp vork như dịch vụ render cho người khác gửi cảnh lên.
- Sản phẩm bạn làm ra (cảnh, mã, hình, video) là của bạn. Render cho tổ chức mình rồi giao thành phẩm cho khách hàng thì được.
- Giấy phép chỉ áp dụng cho phiên bản này; phiên bản sau có thể đổi điều khoản, kể cả thu phí.

Vì điều khoản chia sẻ chỉ cho phép bản chưa sửa, repo này **không sao chép** skill hay mã của vork; hãy lấy skill bằng `vork skills add`.

Tài nguyên trong các ví dụ (mô hình, cảnh quay, HDRI) có giấy phép riêng, phần lớn CC BY 4.0 hoặc CC0, và cần ghi công theo file `CREDITS` đi kèm.
