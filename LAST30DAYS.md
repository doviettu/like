# last30days — ghi chú nghiên cứu

Nguồn: [mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill) (MIT, phiên bản 4.6.0, đọc tại commit `ed7ec67`, 25/11/2026).

Ghi chú này rút từ việc **đọc mã và tài liệu trong repo**. Chưa cài plugin và chưa chạy lần tìm kiếm nào; mô tả hành vi là theo `SECURITY.md` và `SKILL.md` của tác giả, chưa đối chiếu hết với 120.000 dòng mã engine.

## Nó là gì

Một **plugin/skill cho Claude Code** (và hơn 50 agent khác theo chuẩn [Agent Skills](https://agentskills.io)). Gõ `/last30days <chủ đề>`, nó tìm song song trên nhiều nền tảng trong 30 ngày gần nhất, xếp hạng theo mức tương tác thật (upvote, like, tiền đặt cược), rồi để agent tổng hợp thành một bản tóm tắt có trích dẫn.

Ý tưởng cốt lõi: mỗi nền tảng là một khu vườn kín với API và đăng nhập riêng. Không AI nào tự tìm được hết, nhưng người dùng mang khóa và phiên đăng nhập của mình tới thì một agent có thể bắc cầu qua tất cả.

Trong bốn repo đã nghiên cứu, đây là cái duy nhất **cài được cho tài khoản**, cùng loại với context-mode.

## Nguồn dữ liệu

| Nhóm | Nguồn | Cần gì |
|---|---|---|
| Chạy ngay | Reddit, Hacker News, Polymarket, GitHub | Không cần khóa |
| Tự bật khi chủ đề là công ty | Trang tuyển dụng, bằng sáng chế Mỹ (USPTO), Wikidata | Không cần khóa |
| Sau khi chạy trình cài đặt lần đầu | arXiv, Techmeme, Digg, Yahoo Finance, YouTube (bản ghi lời) | Cài thêm CLI ngoài (`yt-dlp`, bộ "Printing Press") |
| Cần khóa API hoặc phiên đăng nhập | X, TikTok, Instagram, LinkedIn, Threads, Pinterest, Bluesky, Perplexity, Meta Ads… | Khóa trả phí (ScrapeCreators, xAI, OpenRouter…) hoặc cookie trình duyệt |
| Phải bật rõ ràng | Xiaohongshu, Telegram, Trustpilot, Amazon, dev.to | Cờ `--search` hoặc `INCLUDE_SOURCES` |

## Cấu tạo

| Phần | Vai trò |
|---|---|
| `skills/last30days/SKILL.md` (261 dòng) | Hợp đồng cho agent: định tuyến theo ý định, luật trình bày kết quả |
| `skills/last30days/references/` (18 file) | Quy trình chi tiết, mỗi file chỉ đọc khi đúng tình huống |
| `skills/last30days/scripts/` (~120.000 dòng Python) | Engine: gọi các nguồn, khử trùng lặp, chấm điểm, gom cụm |
| `mcp/` (Go) | Máy chủ MCP cho host không chạy skill |
| `.claude-plugin/` | Khai báo plugin, marketplace, và một hook `Stop` |
| `tests/` (429 mục) | Bộ test lớn, kèm 11 workflow CI trong đó có quét bảo mật |

Engine **không có phụ thuộc Python nào** ngoài thư viện chuẩn (`dependencies = []`), cần Python 3.12+ và Node.

## Nó chạm vào những gì

Phần này quan trọng nhất khi quyết định cài. Theo `SECURITY.md`:

- **Chủ đề tìm kiếm được gửi đi nhiều nơi:** tới mọi nguồn đang bật và tới công cụ tìm web (mặc định DuckDuckGo rồi Startpage). Nếu chủ đề giống tên công ty hay tên người, nó còn được gửi tới Wikidata.
- **Khóa AI có sẵn sẽ bị dùng để chấm điểm:** nếu máy có khóa Gemini, OpenAI, xAI hoặc OpenRouter (kể cả khóa bạn đặt cho việc khác), engine gửi chủ đề cùng tiêu đề, trích đoạn và bình luận đã lọc tới nhà cung cấp đó ở mỗi lần chạy.
- **Cookie trình duyệt:** tắt mặc định, cần đồng ý trong lúc cài đặt. Khi bật, nó đọc `auth_token` và `ct0` của x.com và `_session_id` của truthsocial.com; giá trị chỉ giữ trong bộ nhớ.
- **Cài phần mềm ngoài:** lần chạy đầu cài `yt-dlp` (qua Homebrew trên Mac) và bốn CLI qua `npx -y @mvanhorn/printing-press-library`, vào `~/.local/bin`. Các gói này nằm ngoài repo.
- **Hook `Stop`:** sau mỗi lượt trả lời của Claude, chạy `capture_brief_hook.py` (giới hạn 5 giây) để lưu bản tóm tắt vừa xong. Tắt bằng `LAST30DAYS_AUTO_CAPTURE=off`.
- **Ghi file:** kết quả thô lưu vào `~/Documents/Last30Days` (đổi bằng `LAST30DAYS_MEMORY_DIR`); cấu hình và khóa ở `~/.config/last30days/.env` với quyền `0600`.
- **Không có** đo lường từ xa, phân tích hay kiểm tra cập nhật.
- **Bỏ qua robots.txt ở một chỗ:** luồng tuyển dụng đọc trang việc làm của Google dù robots.txt không cho phép. Đặt `LAST30DAYS_JOBS_RESPECT_ROBOTS=1` để tuân thủ.

Điều khoản sử dụng của từng nền tảng (Reddit, X, TikTok…) là việc của người dùng; đọc bằng phiên đăng nhập cá nhân có thể trái điều khoản của một số nơi.

## Bài học đáng mang về

1. **SKILL.md là bộ định tuyến, không phải cuốn sổ tay.** File gốc chỉ có bảng "điều kiện → file phải đọc → điểm quay lại". Mười tám file tham khảo nằm ngoài, chỉ nạp khi cần. So với skill 27 dòng của vork, đây là cách mở rộng cho một skill có nhiều chế độ.
2. **Hợp đồng giữa lời văn và mã.** SKILL.md quy định agent truyền cờ nào; engine trả về hình dạng đầu ra cố định mà agent phải giữ nguyên. Hai bên kiểm tra lẫn nhau.
3. **Nội dung lấy về là bằng chứng, không phải mệnh lệnh.** Ngay đầu skill: trang web, bài đăng, bình luận là dữ liệu không đáng tin, không bao giờ là chỉ dẫn mới. Đây là phòng tuyến chống prompt injection cho mọi công cụ đọc web.
4. **Cấm làm giả.** Skill cấm agent tự bịa đường dẫn engine hay thay bằng tìm web thông thường rồi trình bày như skill đã chạy. Thiếu Python đúng phiên bản thì dừng và báo.
5. **Repo không tự cấp quyền cho mình.** File cấu hình trong dự án chỉ được nạp khi người dùng đặt `LAST30DAYS_TRUST_PROJECT_CONFIG` ở cấp toàn cục. Một repo lạ không thể tự bật để đọc khóa.
6. **`SECURITY.md` mô tả hành vi, không chỉ cách báo lỗi.** Mục "What the skill touches" liệt kê từng lần gọi mạng, từng cookie, từng chương trình ngoài. Người cài tự đánh giá được trước khi cài.
7. **Một nguồn, nhiều nền tảng.** Cùng một thư mục skill được đóng gói cho Claude Code, Codex, Grok, Gemini và claude.ai web qua các file khai báo mỏng.
8. **Engine không phụ thuộc gói ngoài.** Chỉ dùng thư viện chuẩn Python nên cài skill là chạy được, không có bước `pip install`.

## Áp dụng cho tài khoản

| Phạm vi | Cách | Lưu ý |
|---|---|---|
| Desktop app / máy local | `/plugin marketplace add mvanhorn/last30days-skill` rồi `/plugin install last30days` | Nơi phù hợp nhất: có trình duyệt, có mạng đầy đủ |
| claude.ai (web) | Tải `last30days.skill` từ trang Releases, tải lên ở Customize > Skills | Cập nhật phải tải lại thủ công |
| Phiên cloud của Claude Code | **Chưa dùng được với cấu hình hiện tại** | Xem bên dưới |
| Agent khác | `npx skills add mvanhorn/last30days-skill -g` | |

**Vì sao chưa bật cho phiên cloud.** Thử từ container của phiên này (26/11/2026): `www.reddit.com`, `hn.algolia.com`, `gamma-api.polymarket.com`, `html.duckduckgo.com` và `www.wikidata.org` đều bị chính sách mạng của môi trường chặn; chỉ `api.github.com` tới được. Tức là ba trong bốn nguồn mặc định không chạy. Python 3.13 và Node 22 thì đã có sẵn.

Vì vậy repo này **không thêm plugin vào `.claude/settings.json`**. Muốn dùng trên cloud cần hai việc, cả hai đều là quyết định của chủ tài khoản:

1. Thêm các host nguồn vào danh sách mạng được phép của môi trường cloud.
2. Khai báo marketplace và bật plugin trong `.claude/settings.json`, giống cách đã làm với context-mode.

Nếu cài ở bất kỳ đâu, nên đặt trước trong `~/.config/last30days/.env`:

```sh
FROM_BROWSER=off                  # không đọc cookie trình duyệt
LAST30DAYS_JOBS_RESPECT_ROBOTS=1  # tuân thủ robots.txt
LAST30DAYS_AUTO_CAPTURE=off       # tắt hook lưu bản tóm tắt (biến môi trường)
```

Kiểm tra sau khi cài: `/last30days doctor`.

## Giấy phép

MIT, bản quyền Matt Van Horn. Mã X client trong `lib/vendor/bird-search/` và các CLI "Printing Press" là thành phần riêng, có giấy phép riêng.
