# OPC VN Business Law

Skill [diginno-net/opc-vn-business-law](https://github.com/diginno-net/opc-vn-business-law) (v1.2.0, commit `19c3e29`) của Diginno: cẩm nang pháp lý – thuế – kế toán cho doanh nghiệp một người tại Việt Nam. Nội dung theo **CC BY 4.0**, script theo **MIT**.

> Dựa trên skill `opc-vn-business-law` của Diginno (CC BY 4.0). Nội dung chỉ mang tính tham khảo, không phải tư vấn pháp lý.

## Nó làm gì

- **Trả lời theo quy trình** (A–F trong `SKILL.md`): chọn mô hình (HKD/DNTN/TNHH MTV/2TV/CP), đánh giá "doanh nghiệp một người" theo dự thảo Luật Phát triển DNNVV 2026 (Điều 20 khoản 8), chuyển HKD lên công ty (12 bước), điều lệ/Chủ tịch công ty, kế toán (TT58/TT133/TT99, kế toán trưởng), thuế TNDN/GTGT, thuế HKD và hóa đơn điện tử.
- **Cổng trạng thái văn bản**: phân biệt luật đang hiệu lực / dự thảo / hết hiệu lực; bảng nguồn sự thật ở `references/00-legal-status.md`.
- **Công cụ tính** `scripts/so_sanh_thue.py` (Python thuần, không mạng): kiểm điều kiện trước rồi mới so sánh thuế % doanh thu vs kê khai; chế độ `mo-phong` chỉ là phép tính giả định.
- **Mẫu**: checklist chuyển đổi, điều lệ TNHH MTV tối giản, bộ 30 phút câu hỏi tư vấn (`assets/`).
- Từ chối tư vấn tranh chấp, tố tụng, M&A, đầu tư nước ngoài, phá sản → chuyển luật sư.

## Đã tích hợp thế nào

| Phạm vi | Cách |
|---|---|
| Mọi phiên trên repo này | Bản vendored tại `.claude/skills/opc-vn-business-law/` — Claude Code tự nạp skill dự án, không cần cài |
| Mọi phiên cloud, mọi repo | Dán `scripts/setup-opc-vn-business-law.sh` vào **Setup script** của môi trường cloud → cài vào `~/.claude/skills/` |
| Máy local / desktop | `bash scripts/setup-opc-vn-business-law.sh` (hoặc `git clone` repo upstream vào `~/.claude/skills/opc-vn-business-law`) |

Chỉ vendored **gói runtime** (giống gói `.skill` upstream); bỏ `evals/`, `tests/` và script đóng gói. Phiên bản nguồn ghi trong `.claude/skills/opc-vn-business-law/UPSTREAM`.

## Cách dùng

Hỏi bằng tiếng Việt tự nhiên, ví dụ:

- "Tôi là hộ kinh doanh bán online, doanh thu 6 tỷ/năm. Có nên lên TNHH một thành viên?"
- "Công ty TNHH một thành viên có bắt buộc Chủ tịch công ty không?"
- "Doanh thu đúng 1 tỷ có phải dùng hóa đơn máy tính tiền?"

Hoặc gọi trực tiếp: `/opc-vn-business-law`.

## Cập nhật

```bash
bash scripts/setup-opc-vn-business-law.sh --vendor        # kéo main mới nhất vào bản vendored
bash scripts/setup-opc-vn-business-law.sh --vendor v1.2.0 # hoặc một tag/nhánh cụ thể
git diff .claude/skills/opc-vn-business-law               # rà nội dung trước khi commit
```

Luôn đọc diff trước khi commit: đây là chỉ dẫn mà Claude sẽ làm theo.

## Lưu ý

- **Không phải tư vấn pháp lý.** Dữ liệu thuế/kế toán rà soát một phần đến 28–30/10/2026; phần dự thảo/quản trị giữ mốc 17/10/2026. Kiểm văn bản gốc trước mỗi lần dùng (xem `DISCLAIMER.md`).
- Skill có mục **báo lỗi qua email** tới `work@diginno.net`: chỉ soạn bản nháp, phải được người dùng xem và đồng ý trước khi gửi, không gửi dữ liệu khách hàng. Không có gì tự động gửi đi.
- `PROMO.md` là trang giới thiệu cộng đồng/dịch vụ của tác giả, giữ lại để nguyên vẹn gói upstream; không ảnh hưởng hành vi skill.
- Bộ kiểm thử upstream (`--self-test`, `unittest`, `run_evals.py`) không chạy trong lần tích hợp này; chạy trong repo upstream nếu cần.
