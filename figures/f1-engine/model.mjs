// Mô hình một xi-lanh của động cơ F1 V6 1.6 L (luật 2026): cơ cấu tay quay – thanh truyền,
// thời điểm van và áp suất trong xi-lanh. Đơn vị: mm, độ góc trục khuỷu, bar tuyệt đối.
// Không import gì, để trang web nhúng thẳng được.

export const BORE = 80; // giới hạn theo luật
export const STROKE = 53;
export const THROW = STROKE / 2;
export const ROD = 100; // tâm–tâm thanh truyền (ước lượng, đội đua không công bố)
export const CR = 16; // tỉ số nén tối đa theo luật 2026
export const AREA = (Math.PI * BORE * BORE) / 4; // mm²
export const SWEPT = AREA * STROKE; // mm³, ≈ 266,4 cm³
export const CLEAR = SWEPT / (CR - 1); // thể tích buồng đốt khi piston ở điểm chết trên
export const PIN_TDC = ROD + THROW; // độ cao chốt piston so với tâm trục khuỷu ở điểm chết trên
export const CROWN = 26; // từ chốt piston lên đỉnh piston
export const RPM = 10500;
export const RPM_MAX = 15000;
export const BOOST = 3.5; // áp suất khí nạp (bar tuyệt đối), giả định
export const BACK = 3.8; // áp suất ống xả trước tua-bin, giả định

// Chu trình 0–720°: 0 = điểm chết trên cuối kỳ xả / đầu kỳ nạp.
export const STROKES = [
  { from: 0, to: 180, name: "Nạp", say: "piston đi xuống, hút khí nạp tăng áp qua van nạp" },
  { from: 180, to: 360, name: "Nén", say: "hai van đóng, piston nén hỗn hợp tới 1/16 thể tích" },
  { from: 360, to: 540, name: "Nổ", say: "buồng đốt trước bắn tia lửa, khí cháy đẩy piston xuống" },
  { from: 540, to: 720, name: "Xả", say: "van xả mở, piston đẩy khí cháy ra tua-bin" },
];
export const SPARK = 345; // đánh lửa 15° trước điểm chết trên
export const BURN = 45; // thời gian cháy (độ)
export const INTAKE = { open: -20, close: 240, lift: 13 }; // van nạp
export const EXHAUST = { open: 490, close: 740, lift: 12 }; // van xả

const wrap = (c) => ((c % 720) + 720) % 720;
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function strokeOf(c) {
  const at = wrap(c);
  return STROKES.find((s) => at >= s.from && at < s.to) ?? STROKES[0];
}

// Độ cao chốt piston (z) và góc thanh truyền tại góc trục khuỷu θ (độ).
export function crank(c) {
  const t = (c * Math.PI) / 180;
  const px = THROW * Math.sin(t);
  const pz = THROW * Math.cos(t);
  const side = Math.asin(px / ROD);
  const pin = pz + ROD * Math.cos(side);
  return { pinX: px, pinZ: pz, pin, side, crown: pin + CROWN };
}

export const volumeOf = (c) => CLEAR + AREA * (PIN_TDC - crank(c).pin); // mm³

// Độ nâng van (mm) theo góc chu trình: hình sin² trong khoảng mở.
export function liftOf(valve, c) {
  const span = valve.close - valve.open;
  let at = wrap(c - valve.open);
  if (at > span) return 0;
  return valve.lift * Math.sin((Math.PI * at) / span) ** 2;
}

// Phần nhiên liệu đã cháy (hàm Wiebe).
export function burnedOf(c) {
  const at = wrap(c) - SPARK;
  if (at <= 0) return 0;
  return 1 - Math.exp(-5 * Math.pow(Math.min(at, 200) / BURN, 3));
}

const POLY = 1.32;
const V_IVC = volumeOf(INTAKE.close);
const RISE = 2.1; // áp suất tăng thêm do cháy so với nén suông
const motored = (c) => BOOST * Math.pow(V_IVC / volumeOf(c), POLY);
const P_EVO = motored(EXHAUST.open) * (1 + RISE);

// Áp suất trong xi-lanh (bar tuyệt đối).
export function pressureOf(c) {
  const at = wrap(c);
  if (at >= INTAKE.close && at < EXHAUST.open) return motored(at) * (1 + RISE * burnedOf(at));
  if (at >= EXHAUST.open) {
    const blow = BACK + (P_EVO - BACK) * Math.exp(-(at - EXHAUST.open) / 22);
    return blow + (BOOST - blow) * smooth(700, 740, at);
  }
  const before = BACK + (P_EVO - BACK) * Math.exp(-(at + 720 - EXHAUST.open) / 22);
  return before + (BOOST - before) * smooth(-20, 20, at);
}

export const PEAK = (() => {
  let best = { c: 0, p: 0 };
  for (let c = 0; c < 720; c += 0.5) {
    const p = pressureOf(c);
    if (p > best.p) best = { c, p };
  }
  return best;
})();

// Trạng thái khí trong xi-lanh: 0..1 cho khí mới, lửa, khí xả (để tô màu). Liên tục qua 720° → 0°.
export function gasOf(c) {
  const since = wrap(c - SPARK); // độ kể từ lúc đánh lửa
  const burned = 1 - Math.exp(-5 * Math.pow(Math.min(since, 200) / BURN, 3));
  const flame = Math.min(1, 4 * burned * (1 - burned) + 0.25 * burned * (1 - smooth(25, 110, since)));
  const exhaust = burned * (1 - smooth(345, 395, since));
  return { fresh: 1 - exhaust, flame, exhaust, burned };
}

export const ms = (deg, rpm = RPM) => (deg / 360) * (60000 / rpm); // thời gian thật (ms) của một góc quay
export const pistonSpeed = (rpm = RPM) => (2 * STROKE * rpm) / 60000; // m/s, tốc độ trung bình

// Ngọn lửa (cho shader): tia lửa từ buồng đốt trước, mặt lửa lan ra, khí cháy còn nóng,
// và luồng khí nóng vào cửa xả khi van xả mở. Mọi giá trị liên tục theo góc trục khuỷu.
export function flameOf(c) {
  const since = wrap(c - SPARK);
  const burned = since < 200 ? 1 - Math.exp(-5 * Math.pow(since / BURN, 3)) : 1;
  const jet = smooth(1, 10, since) * (1 - smooth(14, 32, since));
  const jetLen = 6 + 34 * smooth(2, 13, since);
  const front = 4 + 58 * Math.pow(burned, 0.45);
  const shell = smooth(3, 15, since) * (1 - smooth(0.82, 0.995, burned));
  const hot = burned * Math.exp(-Math.max(0, since - 22) / 48);
  const s = wrap(c - EXHAUST.open);
  const blow = s < 260 ? smooth(0, 9, s) * Math.exp(-s / 38) : 0;
  return { since, burned, jet, jetLen, front, shell, hot, blow };
}
