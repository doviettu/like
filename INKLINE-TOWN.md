# Inkline Town — ghi chú nghiên cứu

Nguồn: [sandromaglione/inkline-town](https://github.com/sandromaglione/inkline-town) (Apache-2.0, đọc tại commit `2a0fe9a`, 21/11/2026). Chơi thử: <https://inkline.typeonce.games>.

Ghi chú này rút từ việc **đọc mã và tài liệu**. Chưa cài đặt, chưa chạy test hay game trong phiên này, nên các con số về hành vi (tốc độ headless, tỉ lệ thắng của bot…) là theo lời tác giả.

## Nó là gì

Game xây thị trấn chạy trên trình duyệt, kiểu Anno thu nhỏ: làm thị trưởng theo nhiệm kỳ 45/60/90 phút, xây chuỗi sản xuất, nâng hạng từ xóm lên thành phố. Toàn bộ hình ảnh là nét mực 3D vẽ bằng mã, không có sprite hay file ảnh nào.

Đây **không phải plugin hay công cụ cho Claude Code**, nên không có gì để "cài cho tài khoản" như context-mode. Giá trị của nó là một ví dụ mẫu về cách tổ chức một dự án lớn (~42.600 dòng TypeScript trong `src/`, 440 file) sao cho agent AI làm việc được an toàn.

## Công nghệ

| Phần | Dùng gì |
|---|---|
| Mô phỏng | [Ritmo](https://github.com/typeonce-dev/ritmo) ECS 0.23, bước cố định 60 bước/giây |
| Vẽ 3D | PixiJS 8 + `@pixi/3d` (WebGPU, lùi về WebGL) |
| Lưu game, schema, test sinh dữ liệu | Effect 4 (`Schema`, `Arbitrary`) |
| Build / kiểm tra | Vite 8, TypeScript 7, oxlint, `node --test` chạy thẳng file `.ts` |
| Kiểm tra trình duyệt | Playwright |
| Triển khai | Alchemy → Cloudflare Worker + R2 (chỉ cho tính năng chia sẻ thị trấn) |

## Kiến trúc

Mã chia thành các tầng, mỗi tầng chỉ được import tầng dưới nó:

```
app/        khởi động, module duy nhất biết mọi tầng
ui/dom/     giao diện trang          render/pixi3d/   bộ vẽ 3D
         \                          /
          view/   thế giới dưới dạng dữ liệu thuần, cho mọi UI và mọi bộ vẽ
            |
          game/   mô phỏng: không cần trình duyệt, phát lại chính xác
platform/   lưu trữ, chia sẻ        i18n/   7 ngôn ngữ        labs/   trang chỉ dùng khi phát triển
```

Các tầng nói chuyện qua vài hợp đồng có kiểu:

- **Edit** (`src/game/edits.ts`): mọi thứ người chơi yêu cầu là một union có tag. UI, bot và test đều gửi cùng loại dữ liệu này; chỉ mô phỏng áp dụng, ở đầu bước kế tiếp. Replay chính là danh sách edit.
- **TownView / SceneView** (`src/view/contracts.ts`): mỗi khung hình, thế giới được chiếu thành dữ liệu thuần. UI đọc cái thứ nhất, bộ vẽ đọc cái thứ hai. Thêm UI hay bộ vẽ mới là thêm thư mục, không sửa phần khác.
- **Game nói bằng dữ liệu** (`src/game/said.ts`): sự kiện là `{ _tag: "fire", place }`, không phải câu chữ. Tầng i18n mới biến thành lời. Nhờ đó file lưu, replay và test không chứa văn bản, và đổi ngôn ngữ thì cả lịch sử thị trấn đổi theo.

Mỗi khung hình chạy ba lịch: `simulate` → `project` → `draw`.

## Bài học đáng mang về

Xếp theo mức hữu ích cho việc làm dự án cùng agent.

1. **Luật kiến trúc nằm trong lint, không nằm trong tài liệu.** `.oxlintrc.json` dùng `no-restricted-imports` cho từng tầng, kèm thông báo lỗi giải thích *vì sao*. Agent vi phạm thì bị chặn ngay và đọc được lý do, không cần nhớ quy ước. Plugin lint riêng (`tools/lint/plugin.mjs`) cấm `as never` và `as unknown as`, hai lối tắt agent hay dùng để dập lỗi kiểu.
2. **Tính tất định được cưỡng chế.** Trong `src/game/` cấm `Date.now()`, `Math.random()`, `Infinity`/`NaN` trong dữ liệu, timer số thực, và các hàm toán cho kết quả khác nhau giữa các engine (`sin`, `exp`… phải qua `Ops`). Trạng thái là số nguyên, ngẫu nhiên có seed. Kết quả: cùng hiến chương và cùng chuỗi edit luôn ra cùng thị trấn.
3. **Mô phỏng chạy headless** (`src/game/headless.ts`), theo tác giả nhanh hơn thời gian thực 60–80 lần. Đây là nền cho mọi thứ bên dưới: test, bot và replay đều chơi game thật mà không mở trình duyệt.
4. **Test dựa trên mô hình** (`test/model.test.ts`): sinh ngẫu nhiên chuỗi hành động của thị trưởng bằng `Schema` + `Arbitrary`, chạy trên mô phỏng thật, sau mỗi lệnh kiểm tra các bất biến (hàng trong kho không vượt sức chứa, dân số khớp số nhà, hạng không bao giờ tụt…). Lỗi được rút gọn về chuỗi ngắn nhất còn tái hiện được. `SEED=…` để phát lại, `RUNS=200` để tìm kỹ hơn.
5. **Replay để báo lỗi cho agent** (`PLAYTEST.md`): bản dev giữ 60 giây chơi gần nhất; bấm `\` hoặc khi một luật bị vỡ thì tự lưu file vào `.replays/`. Người chơi chỉ cần đưa agent ba thứ: file, điều đã thấy, khoảng thời điểm. Agent chạy `pnpm replay <file>` để xem lại từng bước mà không cần trình duyệt.
6. **Cân bằng bằng bot** (`pnpm balance`): nhiều kiểu thị trưởng (hợp lý, tham lam, dàn trải, không dịch vụ…) chơi headless trên nhiều seed, báo cáo áp lực kinh tế theo phút. `--set kinds.sawmill.crew=settlers` cho thử thay đổi số liệu mà không sửa mã; `--versus` so hai bot trên cùng seed.
7. **Trình biên dịch làm danh sách việc cần làm.** Các bảng nội dung khai báo `satisfies Record<KindId, …>`; ngôn ngữ mới khai báo `satisfies Catalog`. Thêm một loại nhà mà quên đặt tên ở một trong 7 ngôn ngữ thì không biên dịch được.
8. **Skill cho agent đi theo thư viện.** `.agents/skills/` chỉ gồm symlink vào `node_modules/@typeonce/ritmo/skills/…` và `node_modules/@pixi/3d/skills/…`. Hướng dẫn cho agent được phát hành cùng gói npm, nên nâng phiên bản thư viện là skill tự cập nhật.
9. **Phòng thí nghiệm cho thứ khó test bằng mã.** Các trang `gallery`, `asset-lab`, `map-lab`, `ui-kit`, `effects-lab` bày mọi mô hình và mọi trạng thái UI cạnh nhau. Script `check:*` dùng Playwright chụp ảnh và kiểm tra bằng điểm ảnh (ví dụ khói có thật sự chuyển động không), kể cả ở kích thước điện thoại.
10. **Triển khai tách riêng.** Gói `deploy/` có `package.json` riêng để phụ thuộc hạ tầng không lẫn vào game. Phát hành chạy tay từ máy, push lên GitHub không tự deploy.

## Áp dụng cho tài khoản

| Muốn gì | Cách |
|---|---|
| Đọc mã nguồn trong một phiên cloud | Repo công khai, chỉ cần nhờ Claude clone về để đọc; không cần gắn quyền |
| Dùng các skill Ritmo / PixiJS 3D | Chúng nằm trong gói npm, không nằm trong repo này. Chỉ có ích ở dự án có cài `@typeonce/ritmo` hoặc `@pixi/3d`; khi đó symlink từ `node_modules/…/skills/` vào `.agents/skills/` (hoặc `.claude/skills/`) như repo gốc làm |
| Áp dụng cách làm vào dự án khác | Bắt đầu từ mục 1, 2 và 4 ở trên: lint chặn import sai tầng, cấm nguồn bất định trong lõi, viết một test bất biến chạy headless. Ba thứ này không phụ thuộc Ritmo |
| Chạy thử game tại chỗ | `pnpm install && pnpm dev`, rồi `pnpm typecheck && pnpm test && pnpm check`. Cần Node đủ mới để chạy thẳng `.ts` và pnpm 10 |

## Giấy phép

Apache-2.0, dùng lại và sửa đổi được. Điều 4(d) kèm file `NOTICE`: mọi bản sao hay sản phẩm phái sinh được phát hành, kể cả game đã build, phải mang theo NOTICE ghi công Sandro Maglione. Học kiến trúc và kỹ thuật thì tự do; còn tên game, hình vẽ và nội dung là của tác giả, nên nếu làm game riêng thì hãy làm thiết kế riêng.
