# Context Mode

Plugin [mksglu/context-mode](https://github.com/mksglu/context-mode) (v1.0.169, giấy phép Elastic-2.0) cho Claude Code.

## Nó làm gì

- **Tiết kiệm context**: các tool sandbox (`ctx_execute`, `ctx_batch_execute`, `ctx_execute_file`, `ctx_fetch_and_index`) chạy lệnh/đọc dữ liệu bên ngoài cửa sổ context, chỉ trả về kết quả đã tóm gọn (tác giả công bố giảm ~98%).
- **Nối tiếp phiên**: ghi lại thao tác file, git, task, lỗi vào SQLite + FTS5; khi hội thoại bị nén (compact) thì tìm lại đúng phần liên quan bằng BM25.
- **Hooks**: PreToolUse (điều hướng Bash/Read/Grep/WebFetch sang sandbox), PostToolUse, UserPromptSubmit, PreCompact, SessionStart, Stop.
- **Lệnh**: `/context-mode:ctx-stats`, `ctx-doctor`, `ctx-index`, `ctx-search`, `ctx-upgrade`, `ctx-purge`, `ctx-insight`.
- Cần Node.js (môi trường cloud đã có Node 22).

## Cách áp dụng

| Phạm vi | Cách |
|---|---|
| Mọi phiên trên repo này | `.claude/settings.json` khai báo marketplace + bật plugin |
| Mọi phiên cloud của tài khoản, mọi repo | Dán `scripts/setup-context-mode.sh` vào **Setup script** của môi trường cloud (menu môi trường trên thanh tiêu đề phiên → Edit) |
| Desktop app / máy local | `/plugin marketplace add mksglu/context-mode` rồi `/plugin install context-mode@context-mode` |

Kiểm tra sau khi cài: `/context-mode:ctx-doctor`.

## Lưu ý

- Hook PreToolUse can thiệp vào Bash/Read/Grep/WebFetch; nếu thấy hành vi lạ, tắt bằng `claude plugin disable context-mode@context-mode`.
- Phiên đã đóng không sửa ngược được; chúng chỉ nhận plugin khi mở lại trong container mới.
