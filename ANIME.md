# Anime.js — ghi chú nghiên cứu

Nguồn: [juliangarnier/anime](https://github.com/juliangarnier/anime) (MIT, phiên bản 4.5.0, đọc tại commit `01b81be`, 09/08/2026). Tài liệu chính thức: <https://animejs.com/documentation>.

Ghi chú này rút từ việc **đọc mã và tài liệu trong repo**. Chưa cài đặt, chưa chạy test hay ví dụ nào trong phiên này.

## Nó là gì

Thư viện hoạt ảnh JavaScript cho trình duyệt: tạo chuyển động cho thuộc tính CSS, SVG, thuộc tính DOM và đối tượng JS thuần. Không có phụ thuộc lúc chạy; `three` là phụ thuộc ngang hàng tùy chọn cho bộ chuyển đổi Three.js.

Đây là **thư viện để dùng trong dự án web**, không phải plugin Claude Code, nên không có gì để cài cho tài khoản.

```js
import { animate, stagger } from 'animejs';

animate('.square', {
  x: 320,
  rotate: { from: -180 },
  duration: 1250,
  delay: stagger(65, { from: 'center' }),
  ease: 'inOutQuint',
  loop: true,
  alternate: true
});
```

## Các phần của thư viện

Mỗi phần là một điểm nhập riêng (`animejs/timeline`, `animejs/svg`…), nên chỉ phần được import mới vào bundle.

| Module | Hàm chính | Dùng để |
|---|---|---|
| `animation` | `animate` | Hoạt ảnh cơ bản, keyframe, giá trị dạng hàm |
| `timer` | `createTimer` | Bộ đếm thời gian có callback, không gắn với phần tử nào |
| `timeline` | `createTimeline` | Xếp nhiều hoạt ảnh theo trình tự, có nhãn và vị trí tương đối |
| `animatable` | `createAnimatable` | Thuộc tính đổi liên tục (bám theo con trỏ chuột) |
| `draggable` | `createDraggable` | Kéo thả có quán tính, bắt dính, giới hạn vùng |
| `events` | `onScroll` | Đồng bộ hoạt ảnh với vị trí cuộn |
| `scope` | `createScope` | Gom hoạt ảnh theo vùng DOM và media query, dọn sạch một lần; hợp với React/Vue |
| `layout` | `createLayout` | Hoạt ảnh khi bố cục thay đổi (module lớn nhất, ~1.600 dòng) |
| `easings` | `createSpring`, cubic-bezier, steps… | Hàm làm mượt; lò xo theo vật lý |
| `svg` | `createDrawable`, `createMotionPath`, `morphTo` | Vẽ nét, chạy theo đường, biến hình |
| `text` | `splitText`, `scrambleText` | Tách chữ thành dòng/từ/ký tự để tạo hiệu ứng |
| `waapi` | `waapi.animate` | Cùng API nhưng chạy trên Web Animations API của trình duyệt |
| `adapters` | `registerAdapter` | Dạy `animate()` làm việc với lớp đối tượng khác; có sẵn bộ cho Three.js |
| `utils` | `stagger`, `utils.set`… | Lệch pha giữa nhiều phần tử, hàm số học |

## Cách nó hoạt động

- **Một động cơ duy nhất.** `engine` (`src/engine/engine.js`) là một vòng `requestAnimationFrame` chung (`setImmediate` trên Node). Nó ngủ khi không còn gì chạy và tự dừng khi tab bị ẩn.
- **Một lớp thời gian cho mọi thứ.** `Clock` (`src/core/clock.js`) quản lý tốc độ khung hình và tốc độ phát; `Engine`, `Timer`, `Animation` và `Timeline` đều kế thừa nó. Timeline vì thế chỉ là một đồng hồ chứa các đồng hồ con.
- **Danh sách liên kết thay cho mảng.** Các đối tượng đang chạy nối nhau qua `_head` / `_next`, nên thêm bớt trong lúc đang duyệt không tốn cấp phát bộ nhớ.
- **Bỏ khung hình có dung sai.** `requestTick` chấp nhận khung đến sớm tối đa 25% thời lượng khung (không quá 4 ms), tránh rớt khung do rAF dao động.
- **Một hàm render cho mọi loại** (`src/core/render.js`): cùng một đường mã xử lý timer, hoạt ảnh và timeline, kể cả lặp, đảo chiều và tua.

## Bài học đáng mang về

1. **JavaScript thuần nhưng vẫn có kiểu.** Mã nguồn là `.js` với chú thích JSDoc; `tsc` kiểm tra (`checkJs`) và sinh file `.d.ts`. Không có bước biên dịch TypeScript, nhưng người dùng vẫn nhận đủ kiểu.
2. **`package.json` là nguồn sự thật cho bản build.** `rollup.config.js` đọc trường `exports` để suy ra danh sách điểm nhập, nên thêm module mới chỉ cần khai báo một chỗ.
3. **Test cả sản phẩm đóng gói.** `tests/suites/build.test.js` kiểm tra mọi hàm công khai có mặt trong bản module, bản bundle và bản đã nén. Lỗi do nén mã sẽ lộ ra trước khi phát hành.
4. **Test rò rỉ.** `leaks.test.js` chạy sau cùng và yêu cầu động cơ không còn đối tượng nào đang chạy. Một test nào quên dọn dẹp là bị bắt.
5. **Đo hiệu năng ở mức engine.** Test trên Node chạy với `--allow-natives-syntax` để hỏi V8 xem hàm nóng có được tối ưu hay bị hủy tối ưu.
6. **Mở rộng qua bộ chuyển đổi, không sửa lõi.** `registerAdapter()` cho thư viện ngoài đăng ký cách đọc và ghi thuộc tính của lớp riêng. Hỗ trợ Three.js được viết hoàn toàn bằng API công khai này.
7. **Đánh dấu rõ phần có tác dụng phụ.** `sideEffects` trong `package.json` chỉ liệt kê thư mục adapters, phần còn lại bundler được phép loại bỏ nếu không dùng.
8. **Tài liệu trong repo có thể lệch với mã.** README còn nói bản build nằm ở `lib/`, và CONTRIBUTING nhắc các lệnh `dev-types`, `test-browser`, trong khi `package.json` dùng `dist/`, `dev` và `test:browser`. Khi hai bên khác nhau, tin `package.json`.

## Áp dụng cho tài khoản

| Muốn gì | Cách |
|---|---|
| Dùng trong dự án có bundler | `npm i animejs`, rồi import theo module như bảng trên |
| Dùng trong trang HTML đơn hoặc artifact | Nạp bản UMD qua CDN. `package.json` trỏ jsDelivr tới `dist/bundles/anime.umd.min.js` (khoảng 118 KB chưa gzip, gồm mọi module); ghim đúng phiên bản, ví dụ `animejs@4.5.0` |
| Nhờ Claude viết hoạt ảnh | Nói rõ là dùng **Anime.js v4**. API v4 khác v3 (import theo tên thay cho hàm `anime()` toàn cục), nên mã mẫu cũ trên mạng thường không chạy được. Có [hướng dẫn chuyển từ v3](https://github.com/juliangarnier/anime/wiki/Migrating-from-v3-to-v4) |
| Học qua ví dụ | Thư mục `examples/` có 24 ví dụ chạy được (kéo thả, cuộn, timeline, SVG, Three.js); `npm run open:examples` để mở |
| Chạy test tại chỗ | `npm i && npm run build`, rồi `npm run test:node`. Phần lớn test chạy trong trình duyệt qua `npm run test:browser` |

## Giấy phép

MIT. Dùng tự do, kể cả thương mại, miễn giữ dòng bản quyền của Julian Garnier trong bản sao. Dự án sống nhờ tài trợ qua GitHub Sponsors.
