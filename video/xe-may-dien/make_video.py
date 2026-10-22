"""Dựng video hoạt hình giải thích cấu tạo & nguyên lý hoạt động của xe máy điện.

Chạy:  python3 make_video.py [out.mp4]
Cần:   Pillow, numpy, ffmpeg, font DejaVu Sans.
"""
import math
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 720
SS = 2  # supersampling để nét vẽ mịn
FPS = 24

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
_fonts = {}

BG = (14, 20, 32)
PANEL = (26, 36, 54)
FG = (235, 240, 248)
MUTED = (150, 165, 190)
BLUE = (64, 160, 255)
YELLOW = (255, 196, 61)
GREEN = (70, 210, 130)
RED = (255, 92, 92)
PURPLE = (170, 120, 255)
ORANGE = (255, 140, 60)


def font(size, bold=False):
    key = (size, bold)
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(FONT_B if bold else FONT, size * SS)
    return _fonts[key]


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def mix(c1, c2, k):
    return tuple(int(a + (b - a) * k) for a, b in zip(c1, c2))


class Canvas:
    """Bọc ImageDraw, nhận toạ độ theo khung 1280x720."""

    def __init__(self):
        self.img = Image.new("RGB", (W * SS, H * SS), BG)
        self.d = ImageDraw.Draw(self.img)

    def p(self, pts):
        return [(x * SS, y * SS) for x, y in pts]

    def line(self, pts, fill, width=3):
        self.d.line(self.p(pts), fill=fill, width=int(width * SS), joint="curve")

    def rect(self, box, fill=None, outline=None, width=3, r=10):
        x0, y0, x1, y1 = box
        self.d.rounded_rectangle([x0 * SS, y0 * SS, x1 * SS, y1 * SS], radius=r * SS,
                                 fill=fill, outline=outline, width=int(width * SS))

    def circle(self, c, r, fill=None, outline=None, width=3):
        x, y = c
        self.d.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS],
                       fill=fill, outline=outline, width=int(width * SS))

    def poly(self, pts, fill=None, outline=None, width=3):
        self.d.polygon(self.p(pts), fill=fill, outline=outline, width=int(width * SS))

    def pie(self, c, r, a0, a1, fill):
        x, y = c
        self.d.pieslice([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS], a0, a1, fill=fill)

    def text(self, xy, s, size=24, fill=FG, bold=False, anchor="la"):
        self.d.text((xy[0] * SS, xy[1] * SS), s, font=font(size, bold), fill=fill, anchor=anchor)

    def text_w(self, s, size=24, bold=False):
        return self.d.textlength(s, font=font(size, bold)) / SS

    def arrow(self, a, b, fill, width=4, head=14):
        self.line([a, b], fill, width)
        ang = math.atan2(b[1] - a[1], b[0] - a[0])
        p1 = (b[0] - head * math.cos(ang - 0.45), b[1] - head * math.sin(ang - 0.45))
        p2 = (b[0] - head * math.cos(ang + 0.45), b[1] - head * math.sin(ang + 0.45))
        self.poly([b, p1, p2], fill=fill)

    def frame(self):
        return self.img.resize((W, H), Image.LANCZOS)


# ---------- khung chung ----------

def header(cv, idx, title, t):
    a = ease(t / 0.6)
    cv.rect((0, 0, W, 64), fill=PANEL, r=0)
    cv.rect((24, 14, 64, 50), fill=BLUE, r=8)
    cv.text((44, 32), str(idx), 22, (10, 20, 40), True, "mm")
    cv.text((80, 32), title, 26, mix(PANEL, FG, a), True, "lm")


def caption(cv, lines, t, dur):
    """Phụ đề ở đáy khung, mờ dần vào/ra."""
    a = ease(t / 0.5) * ease((dur - t) / 0.4)
    cv.rect((60, 610, W - 60, 700), fill=mix(BG, (8, 12, 20), a), r=14)
    for i, s in enumerate(lines):
        cv.text((W / 2, 637 + i * 34), s, 23, mix(BG, FG, a), anchor="mm")


def label(cv, anchor_pt, text_pt, s, color, a):
    if a <= 0:
        return
    col = mix(BG, color, a)
    cv.line([anchor_pt, text_pt], col, 2)
    cv.circle(anchor_pt, 5, fill=col)
    w = cv.text_w(s, 20, True)
    x = text_pt[0] - (w + 20 if text_pt[0] < anchor_pt[0] else 0)
    cv.rect((x, text_pt[1] - 17, x + w + 20, text_pt[1] + 17), fill=mix(BG, PANEL, a), outline=col, width=2, r=8)
    cv.text((x + 10, text_pt[1]), s, 20, mix(BG, FG, a), True, "lm")


def flow_dots(cv, path, t, color, speed=0.5, n=6, r=6):
    """Các chấm năng lượng chạy dọc polyline."""
    segs = list(zip(path, path[1:]))
    lens = [math.dist(a, b) for a, b in segs]
    total = sum(lens)
    for k in range(n):
        s = ((t * speed + k / n) % 1.0) * total
        for (a, b), L in zip(segs, lens):
            if s <= L:
                f = s / L
                cv.circle((a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f), r, fill=color)
                break
            s -= L


# ---------- chiếc xe ----------

def wheel(cv, c, r, ang, hub=False, hub_col=PURPLE):
    cv.circle(c, r, fill=(30, 30, 36), outline=(70, 75, 90), width=10)
    cv.circle(c, r - 14, outline=(110, 120, 140), width=3)
    if hub:
        cv.circle(c, r * 0.48, fill=hub_col, outline=FG, width=2)
    else:
        cv.circle(c, r * 0.22, fill=(120, 125, 140))
    for i in range(6):
        a = ang + i * math.pi / 3
        cv.line([(c[0] + r * 0.2 * math.cos(a), c[1] + r * 0.2 * math.sin(a)),
                 (c[0] + (r - 16) * math.cos(a), c[1] + (r - 16) * math.sin(a))], (150, 155, 170), 2)


BIKE = dict(ox=330, oy=470)


def bike_pts():
    ox, oy = BIKE["ox"], BIKE["oy"]
    P = lambda x, y: (ox + x, oy + y)
    return dict(
        rear=P(0, 0), front=P(470, 0),
        battery=(ox + 150, oy - 100, ox + 330, oy - 50),
        controller=(ox + 40, oy - 150, ox + 120, oy - 110),
        throttle=P(430, -315), display=P(385, -285), brake=P(470, 0),
        port=P(110, -185), P=P,
    )


def draw_bike(cv, ang=0.0, glow=None, hub_col=PURPLE):
    b = bike_pts()
    P = b["P"]
    glow = glow or {}
    # thân xe tay ga
    body = [P(-70, -60), P(-60, -150), P(20, -205), P(250, -210), P(270, -170),
            P(150, -120), P(160, -50), P(340, -50), P(380, -120), P(395, -280),
            P(360, -285), P(345, -130), P(330, -40), P(130, -30), P(60, -60)]
    cv.poly(body, fill=(52, 72, 104), outline=(110, 140, 190), width=3)
    cv.rect((P(30, -235)[0], P(30, -235)[1], P(250, -205)[0], P(250, -205)[1]), fill=(28, 28, 34), r=14)  # yên
    cv.line([P(390, -270), P(470, 0)], (150, 160, 180), 8)  # càng trước
    cv.line([P(350, -300), P(440, -315)], (180, 185, 200), 8)  # ghi đông
    cv.line([P(0, 0), P(120, -60)], (120, 130, 150), 10)  # gắp sau
    # linh kiện
    bx = b["battery"]
    cv.rect(bx, fill=mix((40, 70, 50), GREEN, glow.get("battery", 0) * 0.8), outline=GREEN, width=3, r=6)
    cv.text(((bx[0] + bx[2]) / 2, (bx[1] + bx[3]) / 2), "PIN", 18, FG, True, "mm")
    cx = b["controller"]
    cv.rect(cx, fill=mix((60, 50, 30), YELLOW, glow.get("controller", 0) * 0.8), outline=YELLOW, width=3, r=6)
    cv.circle(b["display"], 13, fill=mix((30, 50, 80), BLUE, 0.4 + 0.6 * glow.get("display", 0)), outline=BLUE, width=2)
    cv.circle(b["throttle"], 9, fill=mix((80, 50, 30), ORANGE, 0.5 + 0.5 * glow.get("throttle", 0)))
    wheel(cv, b["rear"], 80, ang, hub=True, hub_col=mix(PURPLE, (230, 200, 255), glow.get("motor", 0)))
    wheel(cv, b["front"], 80, ang)
    cv.circle(b["front"], 34, outline=mix((120, 120, 120), RED, 0.5 + 0.5 * glow.get("brake", 0)), width=5)


# ---------- các cảnh ----------

def scene_title(cv, t, dur):
    a = ease(t / 1.0)
    cv.text((W / 2, 250), "XE MÁY ĐIỆN", 64, mix(BG, FG, a), True, "mm")
    cv.text((W / 2, 320), "Cấu tạo & nguyên lý hoạt động", 32, mix(BG, BLUE, ease((t - 0.5) / 1.0)), anchor="mm")
    k = ease((t - 1.2) / 1.0)
    cv.line([(W / 2 - 220 * k, 370), (W / 2 + 220 * k, 370)], YELLOW, 3)
    # tia sét
    c = (W / 2, 470)
    s = 1.0 + 0.05 * math.sin(t * 4)
    bolt = [(c[0] + x * s, c[1] + y * s) for x, y in [(10, -70), (-35, 10), (0, 10), (-10, 70), (35, -10), (0, -10)]]
    cv.poly(bolt, fill=mix(BG, YELLOW, ease((t - 1.5) / 0.8)))
    cv.text((W / 2, 680), "Video thử nghiệm – phụ đề tiếng Việt", 18, mix(BG, MUTED, a), anchor="mm")


OVERVIEW = [
    ("battery", "Pin Lithium + BMS", GREEN, lambda b: ((b["battery"][0] + b["battery"][2]) / 2, b["battery"][3]), (660, 572)),
    ("controller", "Bộ điều khiển (IC)", YELLOW, lambda b: ((b["controller"][0] + b["controller"][2]) / 2, b["controller"][1]), (220, 190)),
    ("motor", "Động cơ BLDC trong bánh", PURPLE, lambda b: b["rear"], (345, 568)),
    ("throttle", "Tay ga (cảm biến Hall)", ORANGE, lambda b: b["throttle"], (900, 130)),
    ("display", "Đồng hồ / màn hình", BLUE, lambda b: b["display"], (900, 230)),
    ("brake", "Phanh đĩa + ngắt điện", RED, lambda b: b["brake"], (980, 560)),
    ("port", "Cổng sạc", MUTED, lambda b: b["port"], (430, 120)),
]


def scene_overview(cv, t, dur):
    header(cv, 1, "Tổng quan các bộ phận chính", t)
    b = bike_pts()
    step = 1.5
    glow = {}
    for i, (key, *_rest) in enumerate(OVERVIEW):
        glow[key] = max(0.0, 1 - abs(t - (1 + i * step + 0.6)) / 0.9)
    draw_bike(cv, ang=0.0, glow=glow)
    for i, (key, name, col, ap, tp) in enumerate(OVERVIEW):
        label(cv, ap(b), tp, name, col, ease((t - 1 - i * step) / 0.6))
    caption(cv, ["Xe máy điện gọn hơn xe xăng nhiều: không có xăng, bugi, hộp số hay ống xả.",
                 "Chỉ gồm 4 khối chính: PIN → BỘ ĐIỀU KHIỂN → ĐỘNG CƠ, cùng tay ga và phanh để ra lệnh."], t, dur)


def box(cv, b, title, sub, col, a=1.0, glow=0.0):
    cv.rect(b, fill=mix(BG, mix(PANEL, col, 0.15 + 0.35 * glow), a), outline=mix(BG, col, a), width=3, r=14)
    cx = (b[0] + b[2]) / 2
    cv.text((cx, b[1] + 32), title, 22, mix(BG, FG, a), True, "mm")
    cv.text((cx, b[1] + 64), sub, 17, mix(BG, MUTED, a), anchor="mm")


def scene_flow(cv, t, dur):
    header(cv, 2, "Dòng năng lượng: từ ổ điện đến bánh xe", t)
    B = [((40, 160, 240, 260), "Ổ điện 220V", "điện xoay chiều AC", MUTED),
         ((290, 160, 490, 260), "Bộ sạc", "AC → DC ~ 54–84V", BLUE),
         ((540, 160, 740, 260), "Pin + BMS", "tích trữ điện DC", GREEN),
         ((790, 160, 1000, 260), "Bộ điều khiển", "DC → 3 pha", YELLOW),
         ((1050, 160, 1240, 260), "Động cơ", "điện → cơ năng", PURPLE)]
    for i, (bb, ti, su, col) in enumerate(B):
        a = ease((t - i * 0.6) / 0.6)
        box(cv, bb, ti, su, col, a)
        if i and a > 0:
            cv.arrow((B[i - 1][0][2] + 4, 210), (bb[0] - 4, 210), mix(BG, FG, a), 3)
    # tay ga gửi tín hiệu
    ta = ease((t - 3.5) / 0.6)
    tb = (790, 400, 1000, 490)
    box(cv, tb, "Tay ga", "tín hiệu 0,8–4,2V", ORANGE, ta)
    if ta > 0:
        for y in range(400, 266, -16):
            cv.line([(895, y), (895, y - 8)], mix(BG, ORANGE, ta), 3)
        cv.arrow((895, 280), (895, 266), mix(BG, ORANGE, ta), 3)
    # bánh xe
    wa = ease((t - 3.0) / 0.6)
    if wa > 0:
        cv.arrow((1145, 264), (1145, 360), mix(BG, FG, wa), 3)
        wheel(cv, (1145, 450), 70, t * 3 * ease((t - 5) / 2), hub=True)
    if t > 4.5:
        flow_dots(cv, [(240, 210), (290, 210)], t, MUTED, 0.6, 3)
        flow_dots(cv, [(490, 210), (540, 210)], t, BLUE, 0.6, 3)
        flow_dots(cv, [(740, 210), (790, 210)], t, GREEN, 0.6, 3)
        flow_dots(cv, [(1000, 210), (1050, 210)], t, YELLOW, 0.6, 3)
        flow_dots(cv, [(895, 400), (895, 266)], t, ORANGE, 0.5, 4, 4)
    cv.text((140, 450), "Hiệu suất cả chuỗi ≈ 75–85%", 22, mix(BG, GREEN, ease((t - 6) / 0.8)), True)
    cv.text((140, 485), "(động cơ xăng chỉ ≈ 20–30%)", 20, mix(BG, MUTED, ease((t - 6) / 0.8)))
    caption(cv, ["Khi sạc, bộ sạc đổi điện AC 220V thành DC để nạp vào pin.",
                 "Khi chạy, tay ga ra lệnh – bộ điều khiển lấy điện từ pin, cấp cho động cơ quay bánh."], t, dur)


def cell(cv, c, col, a):
    x, y = c
    cv.rect((x - 11, y - 30, x + 11, y + 30), fill=mix(BG, col, a * 0.85), outline=mix(BG, FG, a * 0.6), width=1, r=5)
    cv.rect((x - 5, y - 35, x + 5, y - 30), fill=mix(BG, (200, 200, 210), a), r=1)


def scene_battery(cv, t, dur):
    header(cv, 3, "Pin – \"bình xăng\" của xe điện", t)
    rows, cols = 4, 13
    ox, oy = 90, 170
    for r in range(rows):
        for c in range(cols):
            k = ease((t - 0.2 - (r * cols + c) * 0.02) / 0.4)
            cell(cv, (ox + c * 34, oy + r * 80), GREEN, k)
    g = ease((t - 2.5) / 0.6)
    if g > 0:
        for c in range(cols):
            cv.rect((ox + c * 34 - 15, oy - 42, ox + c * 34 + 15, oy + 3 * 80 + 36), outline=mix(BG, BLUE, g), width=2, r=8)
        cv.text((ox + 6 * 34, oy + 300), "13 nhóm nối tiếp × 3,7V ≈ 48V", 22, mix(BG, BLUE, g), True, "mm")
        cv.text((ox + 6 * 34, oy + 332), "4 cell song song trong mỗi nhóm → tăng dung lượng (Ah)", 18, mix(BG, MUTED, g), anchor="mm")
    # BMS
    ba = ease((t - 4.5) / 0.6)
    bms = (640, 150, 1220, 540)
    cv.rect(bms, fill=mix(BG, PANEL, ba), outline=mix(BG, GREEN, ba), width=3, r=16)
    cv.text((930, 185), "Mạch BMS (quản lý pin)", 24, mix(BG, GREEN, ba), True, "mm")
    items = ["• Chống sạc quá đầy, xả quá cạn", "• Cân bằng điện áp giữa các cell",
             "• Ngắt khi quá dòng, quá nhiệt", "• Báo % pin lên đồng hồ"]
    for i, s in enumerate(items):
        cv.text((670, 230 + i * 40), s, 20, mix(BG, FG, ease((t - 5 - i * 0.5) / 0.5)))
    ca = ease((t - 7.5) / 0.6)
    cv.text((670, 420), "Lithium-ion: nhẹ, bền 1.000–2.000 lần sạc", 19, mix(BG, GREEN, ca))
    cv.text((670, 452), "Ắc quy chì (axit): rẻ, nặng, ~300–500 lần sạc", 19, mix(BG, ORANGE, ca))
    cv.text((670, 495), "Thông số hay gặp: 48V / 60V / 72V · 20–40Ah", 19, mix(BG, MUTED, ca))
    caption(cv, ["Pin ghép từ hàng chục cell nhỏ: nối tiếp để tăng điện áp (V), song song để tăng dung lượng (Ah).",
                 "Năng lượng (Wh) = V × Ah, ví dụ 60V × 30Ah = 1,8 kWh → quyết định quãng đường đi được."], t, dur)


def scene_controller(cv, t, dur):
    header(cv, 4, "Bộ điều khiển – \"bộ não\" của xe", t)
    # tay ga → MCU
    a1 = ease(t / 0.6)
    box(cv, (40, 150, 230, 240), "Tay ga", "vặn càng nhiều…", ORANGE, a1)
    box(cv, (40, 300, 230, 390), "Cảm biến Hall", "vị trí rôto", PURPLE, a1)
    a2 = ease((t - 0.8) / 0.6)
    box(cv, (310, 200, 520, 340), "Vi xử lý", "tính độ rộng xung", YELLOW, a2)
    if a2 > 0:
        cv.arrow((232, 195), (306, 250), mix(BG, ORANGE, a2), 3)
        cv.arrow((232, 345), (306, 290), mix(BG, PURPLE, a2), 3)
    # cầu MOSFET
    a3 = ease((t - 1.6) / 0.6)
    br = (600, 130, 900, 420)
    cv.rect(br, fill=mix(BG, PANEL, a3), outline=mix(BG, YELLOW, a3), width=3, r=14)
    cv.text((750, 155), "Cầu 6 MOSFET", 20, mix(BG, FG, a3), True, "mm")
    phase = int(t * 2) % 6
    pairs = [(0, 4), (0, 5), (1, 5), (1, 3), (2, 3), (2, 4)]  # bước chuyển mạch 6 bước
    for i in range(6):
        x = 650 + (i % 3) * 100
        y = 210 if i < 3 else 330
        on = a3 > 0.5 and i in pairs[phase]
        cv.rect((x - 26, y - 22, x + 26, y + 22), fill=mix(BG, YELLOW if on else (60, 60, 70), a3), r=6)
        cv.text((x, y), "ON" if on else "", 16, (20, 20, 20), True, "mm")
    if a3 > 0:
        cv.arrow((522, 270), (596, 270), mix(BG, FG, a3), 3)
    # 3 pha ra động cơ
    a4 = ease((t - 2.4) / 0.6)
    for i, (n, col) in enumerate([("U", RED), ("V", GREEN), ("W", BLUE)]):
        y = 200 + i * 70
        cv.arrow((902, y), (990, y), mix(BG, col, a4), 4)
        cv.text((1000, y), f"Pha {n}", 20, mix(BG, col, a4), True, "lm")
    # sóng PWM
    a5 = ease((t - 3.5) / 0.6)
    thr = 0.2 + 0.6 * (0.5 + 0.5 * math.sin(t * 0.9))
    gx, gy = 600, 470
    cv.text((gx - 20, gy - 10), "PWM", 18, mix(BG, MUTED, a5), True, "rm")
    pts = []
    for k in range(10):
        x0 = gx + k * 60
        pts += [(x0, gy + 40), (x0, gy), (x0 + 60 * thr, gy), (x0 + 60 * thr, gy + 40), (x0 + 60, gy + 40)]
    cv.line(pts, mix(BG, YELLOW, a5), 3)
    cv.text((40, 470), f"Ga: {int(thr * 100)}%", 26, mix(BG, ORANGE, a5), True)
    cv.text((40, 510), "→ xung càng rộng, động cơ càng mạnh", 18, mix(BG, MUTED, a5))
    caption(cv, ["Bộ điều khiển đọc tay ga và cảm biến Hall, rồi đóng/ngắt 6 MOSFET hàng nghìn lần mỗi giây.",
                 "Nó biến điện DC của pin thành dòng 3 pha, đổi chiều đúng lúc để động cơ quay liên tục."], t, dur)


def scene_motor(cv, t, dur):
    header(cv, 5, "Động cơ BLDC gắn trong bánh (hub motor)", t)
    c = (400, 345)
    R_out, R_mag, R_st = 250, 225, 175
    spin = ease((t - 1.5) / 1.5)
    omega = 0.9
    rot = spin * omega * max(0.0, t - 1.5)
    # vỏ ngoài (rôto) + nam châm
    cv.circle(c, R_out, fill=(40, 44, 56), outline=(110, 115, 130), width=6)
    npoles = 10
    for i in range(npoles):
        a0 = math.degrees(rot) + i * 360 / npoles
        cv.pie(c, R_out - 8, a0 + 2, a0 + 360 / npoles - 2, RED if i % 2 == 0 else BLUE)
    cv.circle(c, R_mag - 4, fill=BG)
    for i in range(npoles):
        a = rot + (i + 0.5) * 2 * math.pi / npoles
        cv.text((c[0] + (R_out - 22) * math.cos(a), c[1] + (R_out - 22) * math.sin(a)),
                "N" if i % 2 == 0 else "S", 18, FG, True, "mm")
    # stato + cuộn dây 3 pha
    ncoil = 9
    cols = [RED, GREEN, BLUE]
    active = int((rot / (2 * math.pi / npoles)) * 3) % 3 if spin > 0 else -1
    cv.circle(c, 70, fill=(70, 75, 90))
    for i in range(ncoil):
        a = i * 2 * math.pi / ncoil - math.pi / 2
        ph = i % 3
        on = ph == active
        col = cols[ph] if on else mix(cols[ph], (60, 60, 70), 0.7)
        tip = (c[0] + R_st * math.cos(a), c[1] + R_st * math.sin(a))
        cv.line([(c[0] + 70 * math.cos(a), c[1] + 70 * math.sin(a)), tip], (150, 150, 165), 16)
        cv.circle(((c[0] + tip[0] * 2) / 3 + (tip[0] - c[0]) / 6, (c[1] + tip[1] * 2) / 3 + (tip[1] - c[1]) / 6),
                  24, fill=col, outline=FG if on else None, width=2)
        cv.text(tip, "UVW"[ph], 15, FG, True, "mm")
    cv.circle(c, 22, fill=(180, 180, 190))
    cv.text((c[0], c[1]), "trục", 12, (30, 30, 30), True, "mm")
    # chú thích bên phải
    notes = [(RED, "Vỏ ngoài + nam châm vĩnh cửu = RÔTO (quay)"),
             (MUTED, "Lõi thép + cuộn dây đồng = STATO (đứng yên,"),
             (MUTED, "    gắn chặt vào trục xe)"),
             (YELLOW, "Bộ điều khiển cấp điện lần lượt U → V → W"),
             (YELLOW, "→ tạo từ trường quay"),
             (GREEN, "Nam châm bị hút/đẩy theo → bánh xe quay"),
             (GREEN, "Không chổi than, không xích, ít bảo dưỡng")]
    for i, (col, s) in enumerate(notes):
        cv.text((700, 140 + i * 50), s, 20, mix(BG, col, ease((t - 0.5 - i * 0.9) / 0.6)), i in (0, 3, 5))
    if active >= 0:
        cv.text((700, 520), f"Đang cấp điện: pha {'UVW'[active]}", 22, cols[active], True)
    caption(cv, ["Cuộn dây được cấp điện theo thứ tự, biến thành nam châm điện “đuổi” các nam châm vĩnh cửu.",
                 "Vì nam châm gắn vào vỏ bánh, cả bánh xe quay trực tiếp – không cần hộp số hay xích."], t, dur)


def scene_regen(cv, t, dur):
    header(cv, 6, "Phanh & thu hồi năng lượng", t)
    b = bike_pts()
    braking = t > 2.5
    k = ease((t - 2.5) / 1.0)
    speed = 6 * (1 - 0.6 * k)
    draw_bike(cv, ang=t * speed, glow={"brake": k, "motor": 0.4 + 0.6 * k, "battery": k * (0.5 + 0.5 * math.sin(t * 6))})
    if not braking:
        flow_dots(cv, [((b["battery"][0] + b["battery"][2]) / 2, b["battery"][1]), (b["controller"][2], b["controller"][3]), b["rear"]], t, YELLOW, 0.8, 5)
        cv.text((900, 160), "Đang chạy: Pin → Động cơ", 24, YELLOW, True, "mm")
    else:
        flow_dots(cv, [b["rear"], (b["controller"][2], b["controller"][3]), ((b["battery"][0] + b["battery"][2]) / 2, b["battery"][1])], t, GREEN, 0.8, 5)
        cv.text((900, 160), "Bóp phanh: Động cơ → Pin", 24, mix(BG, GREEN, k), True, "mm")
        cv.text((900, 200), "động cơ thành máy phát điện", 19, mix(BG, MUTED, k), anchor="mm")
    items = ["1. Công tắc ở tay phanh báo bộ điều khiển → ngắt ga ngay",
             "2. (Xe có tính năng tái sinh) động cơ hãm và phát điện ngược về pin",
             "3. Phanh đĩa / phanh cơ vẫn là phanh chính để dừng hẳn"]
    for i, s in enumerate(items):
        cv.text((760, 260 + i * 44), s, 17, mix(BG, FG, ease((t - 3.5 - i * 0.8) / 0.6)))
    caption(cv, ["Khi bóp phanh, xe ngắt điện động cơ để an toàn. Nhiều mẫu còn có phanh tái sinh:",
                 "bánh xe quay động cơ ngược lại như máy phát, nạp lại một phần nhỏ năng lượng cho pin."], t, dur)


def scene_summary(cv, t, dur):
    header(cv, 7, "Tóm tắt", t)
    rows = [(GREEN, "PIN + BMS", "tích trữ điện, tự bảo vệ"),
            (YELLOW, "BỘ ĐIỀU KHIỂN", "đọc tay ga, chuyển DC → 3 pha"),
            (PURPLE, "ĐỘNG CƠ BLDC", "từ trường quay → bánh xe quay"),
            (ORANGE, "TAY GA / PHANH", "người lái ra lệnh tăng tốc, dừng"),
            (BLUE, "BỘ SẠC", "nạp lại pin từ ổ điện 220V")]
    for i, (col, a, s) in enumerate(rows):
        k = ease((t - 0.3 - i * 0.6) / 0.6)
        y = 120 + i * 85
        cv.rect((180, y, 1100, y + 66), fill=mix(BG, PANEL, k), outline=mix(BG, col, k), width=3, r=14)
        cv.circle((225, y + 33), 14, fill=mix(BG, col, k))
        cv.text((260, y + 33), a, 24, mix(BG, col, k), True, "lm")
        cv.text((560, y + 33), s, 22, mix(BG, FG, k), anchor="lm")
    caption(cv, ["Điện năng → (điều khiển) → từ trường quay → chuyển động.",
                 "Ít bộ phận chuyển động nên êm, sạch, rẻ khi vận hành và ít phải bảo dưỡng."], t, dur)


SCENES = [(scene_title, 4.5), (scene_overview, 13.5), (scene_flow, 12), (scene_battery, 13),
          (scene_controller, 13), (scene_motor, 15), (scene_regen, 11), (scene_summary, 9)]


def render(out):
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-shortest",
         "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-movflags", "+faststart", out],
        stdin=subprocess.PIPE)
    for fn, dur in SCENES:
        for f in range(int(dur * FPS)):
            t = f / FPS
            cv = Canvas()
            fn(cv, t, dur)
            img = cv.frame()
            # chuyển cảnh: mờ dần từ đen
            fade = min(1.0, t / 0.3, (dur - t) / 0.3)
            if fade < 1:
                img = Image.blend(Image.new("RGB", (W, H), BG), img, max(0.0, fade))
            ff.stdin.write(img.tobytes())
    ff.stdin.close()
    ff.wait()


if __name__ == "__main__":
    render(sys.argv[1] if len(sys.argv) > 1 else "xe-may-dien.mp4")
