# Kiến trúc chùa Việt áp dụng vào "Lên Chùa Cầu An"

Ghi chú nghiên cứu và đối chiếu với bảng tham chiếu "Temple3D Pack" (ảnh khái niệm chính điện). Mục tiêu: hình ảnh trang nghiêm, đúng tinh thần chùa Bắc Bộ, mà vẫn chạy mượt trong **một file HTML** trên điện thoại tầm trung.

## 1. Kiến trúc chùa Việt — những điểm đã áp dụng

| Yếu tố kiến trúc | Trong thực tế | Trong game |
|---|---|---|
| **Bố cục** | Các toà sắp theo hình chữ Nhất, Nhị, Tam, Đinh, Công, Quốc; trục chính: tam quan → sân → tiền đường/bái đường → chính điện (thượng điện) | Trục thần đạo thẳng từ cổng tam quan → lư hương giữa sân → **Đại Hùng Bảo Điện**; gác chuông bên trái, quầy xin xăm bên phải, cây bồ đề và hồ sen hai bên sân |
| **Nền & tam cấp** | Chính điện đặt trên nền bệ đá cao, lên bằng ba bậc (tam cấp), hai bên có bó vỉa | Nền bệ cao 0,6 m, ba bậc rộng 12 m, hai khối đá chặn hai bên; nhân vật **bước lên bậc** vào điện |
| **Hệ cột** | Cột gỗ lim sơn son, kê trên chân tảng đá tạc hoa sen; đầu cột đỡ câu đầu, xà | 18 cột trong điện + 8 cột hiên: chân tảng hoa sen, thân son đỏ, **3 đai vàng**, đấu đỡ, câu đầu & xà dọc viền vàng |
| **Mái chồng diêm** | Mái hai tầng, ngói âm dương / ngói mũi hài, góc mái cong vút thành **đầu đao** | Mái hai tầng có dải diềm ở giữa; **texture ngói âm dương** vẽ bằng canvas; đầu đao là **ống cong Bezier** kèm lá lật thếp vàng (áp dụng cho mọi mái: tam quan, gác chuông, quầy xăm) |
| **Bờ nóc** | "Lưỡng long chầu nguyệt": hai rồng chầu mặt trăng/ngọc lửa giữa bờ nóc | Hai rồng thân uốn lượn (Catmull-Rom), vây lưng vàng, chầu viên ngọc có tia lửa |
| **Cửa bức bàn** | Cửa gỗ nhiều cánh, phần trên song thưa, dưới bưng kín chạm hoa | 8 bộ cửa bức bàn mặt tiền (texture song + ô chạm vàng), ban đêm hắt ánh đèn trong điện |
| **Hoành phi** | Bảng chữ treo trên cửa / trước bàn thờ | "ĐẠI HÙNG BẢO ĐIỆN" ở mặt tiền, "PHẬT PHÁP TĂNG" trên cửa võng — **chữ quốc ngữ** theo yêu cầu, không dùng chữ Hán |
| **Cửa võng** | Khung gỗ chạm thủng, sơn son thếp vàng, treo trước Phật điện | Khung vàng chạm hoa văn, lòng cửa vòm (texture có kênh trong suốt), phản chiếu kim loại |
| **Phật điện** | Phật đài nhiều cấp; tượng ngồi kiết già trên toà sen; hào quang sau tượng; hương án, đỉnh đồng, chân nến, mâm ngũ quả | Phật đài 2 cấp viền vàng; **tượng vàng phản chiếu** (thiền định ấn, tóc xoắn ốc, nhục kế, tai dài, bạch hào) trên toà sen ba tầng; **hào quang mandala** xoay rất chậm; hương án, đỉnh đồng có khói, chân nến đồng cao, bình sen, mâm quả; **hai ban thờ phụ** hai bên |
| **Không gian lễ** | Phật tử quỳ trên bồ đoàn hai bên lối giữa, đèn dầu, phướn | ~150 bồ đoàn (InstancedMesh), thảm đỏ lối giữa, hai kệ đèn dầu 60 ngọn, 4 phướn "Nam mô A Di Đà Phật"…; khách AI vào điện ngồi đúng bồ đoàn, đi qua cửa giữa |
| **Ánh sáng** | Nắng chiều xiên qua song cửa, khói hương, ánh nến | Vệt nắng (god rays giả) qua song cửa phía tây, tắt dần khi tối; đèn lồng cung đình trong điện; vầng sáng (bloom) cho nến, đèn, hào quang |

## 2. Đối chiếu với bảng tham chiếu "Temple3D Pack"

**Đã áp dụng**
- Bố cục mặt bằng: lối giữa, hai khối bồ đoàn, Phật đài cuối điện, hàng cột hai bên.
- Bảng màu: đỏ son, nâu gỗ, vàng thếp, kem, đá xám — đúng tông tham chiếu.
- Vật liệu: gỗ sơn son, vàng thếp (PBR kim loại + phản chiếu môi trường), đá, kính song cửa, hoa văn chạm khắc (texture canvas).
- Ánh sáng & hiệu ứng: nắng xiên cửa, đèn lồng, khói hương, hạt sáng.
- Tối ưu: **instancing** (bồ đoàn, khách, đèn lồng, lụa, hoa đăng), **gộp hình tĩnh** (~60 draw call cả cảnh), **3 mức đồ hoạ** + tự hạ khi chậm.

**Không áp dụng (và lý do)**
| Đề xuất trong bảng | Lý do không làm |
|---|---|
| Kích thước 120 × 60 m, cao 36–48 m, 800–1.200 chỗ | Thu về 30 × 16 m, cao 8 m, ~150 bồ đoàn: vừa với sân chùa và màn hình điện thoại; người chơi đi bộ hết trong vài giây |
| Mô hình glTF/GLB, texture PBR 2K–4K (300–800 MB) | Yêu cầu gốc: **một file, không tải tài nguyên ngoài** — mọi thứ dựng bằng code, file ~200 KB |
| 3–6 triệu tam giác, LOD0–2 | Cả cảnh ~190 nghìn tam giác, không cần LOD; vẫn giữ ≥ 30 fps trên máy tầm trung |
| Ảnh chân thực (photoreal) | Giữ phong cách low-poly ấm, trang nghiêm; thêm chiều sâu bằng bloom, bóng đổ, phản chiếu |

## 3. Mức đồ hoạ

| Mức | Bloom | Bóng đổ thật | Pixel ratio tối đa | Mặc định cho |
|---|---|---|---|---|
| Cao | ✓ | ✓ (2048²) | 2 | Máy tính |
| Vừa | ✓ | — | 1,75 | Điện thoại |
| Nhẹ | — | — | 1,25 | Chọn tay |

Khi khung hình chậm (< ~40 fps), game tự tắt lần lượt: bloom → bóng đổ → giảm pixel ratio. Đổi mức trong **Sổ cầu an → Đồ hoạ**.
Bloom và phản chiếu nạp từ `three/addons` sau khi game đã chạy; nếu không tải được, game vẫn chơi bình thường.

## Nguồn tham khảo
- [Vietnamese architecture — Wikipedia](https://en.wikipedia.org/wiki/Vietnamese_architecture)
- [Pagoda of Vietnam (VA: Part 2) — bố cục Nhất, Nhị, Tam, Đinh, Công, Quốc](https://www.vietnammonpaysnatal.fr/pagoda-of-vietnam-va-part-2/)
- [Tìm hiểu sơ lược về chùa Việt Nam — Vinwonders](https://vinwonders.com/?p=45954)
- [Tuyệt tác kiến trúc đầu đao — Tiền Phong](https://tienphong.vn/dia-oc/579076/Tuye%CC%A3t-ta%CC%81c-kie%CC%81n-tru%CC%81c-da%CC%80u-dao-tpov.html)
- [Lưỡng long chầu nguyệt — Vietnam+](https://www.vietnamplus.vn/photo-gin-giu-va-bao-ton-di-tich-lich-su-dinh-co-hung-lo-post784744.vnp)
- [Chùa Đẩu Long — ngói âm dương, góc đao](https://sunparadiseland.com/SunParadiseLandHaNam/tin-tuc/du-khach-kham-pha-kien-truc-va-van-hoa-tai-chua-dau-long-28113)
- [Vietnamese dragon — Wikipedia](https://en.wikipedia.org/wiki/Vietnamese_dragon)
