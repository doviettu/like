// Các chi tiết chuyển động, vẽ lại mỗi khung hình theo góc trục khuỷu c (độ, 0–720).
// Dùng chung cho bản dựng (Node) và cho trang web (nhúng vào, k / G / M là namespace).
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../../.claude/skills/anatomy/kit/lathe.mjs";
import * as M from "./model.mjs";

const DEG = Math.PI / 180;
const Y = [0, 1, 0];
const X = [1, 0, 0];
const Z = [0, 0, 1];

// Khung toạ độ có trục dọc y (trục khuỷu, trục cam): toạ độ phẳng (x, z) quanh tâm.
export const yFrame = (x, z) => G.frameOf([x, 0, z], Y, X, Z);
const circle = (cx, cz, r, n = 40) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * 2 * Math.PI), cz + r * Math.sin((i / n) * 2 * Math.PI)]);
const hull2 = (points) => {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (const p of pts.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
};

export const CRANK = {
  journal: 21,
  pin: 17,
  web: [9, 18], // má khuỷu: y từ 9 đến 18 (và đối xứng phía sau)
  rodHalf: 8,
  bigEnd: 26,
  smallEnd: 15,
};

// Má khuỷu: bao lồi của đối trọng (tròn lớn, lệch ngược chốt) và vấu quanh chốt.
export function webPolygon(c) {
  const t = c * DEG;
  const d = [Math.sin(t), Math.cos(t)];
  return hull2([...circle(-9 * d[0], -9 * d[1], 45, 48), ...circle(M.THROW * d[0], M.THROW * d[1], 23, 32)]);
}

export function crankParts(P, c) {
  const S = (paths, style) => k.solidSvg(paths, style);
  const F = yFrame(0, 0);
  const t = c * DEG;
  const pin = [M.THROW * Math.sin(t), M.THROW * Math.cos(t)];
  const web = webPolygon(c);
  const [w0, w1] = CRANK.web;
  const PF = yFrame(pin[0], pin[1]);
  // đường dầu khoan xiên trên mặt má trước (một vạch, hai đầu chạm vành và chốt)
  const holeAt = (y) => k.pointsAt([[pin[0] * 0.25, y, pin[1] * 0.25]], P);
  return {
    rear: S(G.prismOf(F, web, -w1, -w0, P), { tone: "hi" }),
    pin: S(G.disc(-w0 - 0.2, w0 + 0.2, CRANK.pin, PF, P), { tone: "hi" }),
    front:
      S(G.prismOf(F, web, w0, w1, P), { tone: "hi", inner: k.lineSvg(k.pathOf(web.map(([x, z]) => k.iso([x * 0.86, w1, z * 0.86], P)), true), { tone: "faint" }) }) +
      k.dotsSvg(holeAt(w1), { size: 0.9, tone: "lo" }),
  };
}

// Thanh truyền: đầu to quanh chốt khuỷu, đầu nhỏ quanh chốt piston.
export function rodSvg(P, c) {
  const { pinX, pinZ, pin } = M.crank(c);
  const top = [0, pin];
  const big = [pinX, pinZ];
  const F = yFrame(0, 0);
  const h = CRANK.rodHalf;
  const outline = hull2([...circle(big[0], big[1], CRANK.bigEnd, 40), ...circle(top[0], top[1], CRANK.smallEnd, 28)]);
  const paths = G.prismOf(F, outline, -h, h, P);
  const along = [top[0] - big[0], top[1] - big[1]];
  const len = Math.hypot(along[0], along[1]);
  const u = [along[0] / len, along[1] / len];
  const n = [-u[1], u[0]];
  const on = (x, z) => k.iso([x, h, z], P);
  // mặt cắt chữ I: rãnh giữa thân, hai đầu khép kín
  const groove = hull2([...circle(big[0] + u[0] * 36, big[1] + u[1] * 36, 5.5, 16), ...circle(top[0] - u[0] * 22, top[1] - u[1] * 22, 4, 16)]);
  // đường chia nắp đầu to: cắt ngang qua tâm chốt, hai đầu nằm trên viền
  const split = [-1, 1].map((sgn) => on(big[0] + n[0] * CRANK.bigEnd * sgn, big[1] + n[1] * CRANK.bigEnd * sgn));
  const bolts = [-1, 1].map((sgn) => on(big[0] + n[0] * 19 * sgn - u[0] * 4, big[1] + n[1] * 19 * sgn - u[1] * 4));
  const inner =
    k.lineSvg(k.pathOf(groove.map(([x, z]) => on(x, z)), true), { tone: "faint" }) +
    k.lineSvg(k.pathOf(split), { tone: "lo" }) +
    k.lineSvg(k.pathOf(circle(big[0], big[1], CRANK.pin + 1.4, 40).map(([x, z]) => on(x, z)), true), { tone: "lo" }) +
    k.lineSvg(k.pathOf(circle(top[0], top[1], 10.6, 28).map(([x, z]) => on(x, z)), true), { tone: "lo" });
  return k.solidSvg(paths, { tone: "hi", lit: true, inner }) + k.dotsSvg(bolts, { size: 1.1, tone: "mid" }) + k.dotsSvg(circle(top[0], top[1], 7, 1).map(([x, z]) => on(x, z)), { size: 0.6, tone: "lo" });
}

// Van: khung dọc trục van, gốc ở tâm đế van, trục a hướng lên (nghiêng ra ngoài).
export const VALVE_TILT = 12;
export function valveFrame(side) {
  const a = [side * Math.sin(VALVE_TILT * DEG), 0, Math.cos(VALVE_TILT * DEG)];
  return G.frameAlong([side * 17, 0, 163.4], a);
}
export const VALVE = { stemTop: 92, tappet: 12, base: 18 };
export const camCentre = (side) => {
  const F = valveFrame(side);
  return G.add3(F.o, G.mul3(F.a, VALVE.stemTop + VALVE.tappet + VALVE.base));
};

// Cam: bán kính theo góc γ = vòng cơ sở + độ nâng tại thời điểm điểm đó hướng xuống con đội.
export function camPolygon(side, valve, c) {
  const F = valveFrame(side);
  const alpha = Math.atan2(-F.a[2], -F.a[0]);
  const n = 72;
  return Array.from({ length: n }, (_, i) => {
    const g = (i / n) * 2 * Math.PI;
    const r = VALVE.base + M.liftOf(valve, c + (2 * (g - alpha)) / DEG);
    return [r * Math.cos(g), r * Math.sin(g)];
  });
}

export function camSvg(P, side, valve, c) {
  const C = camCentre(side);
  const F = yFrame(C[0], C[2]);
  const lobe = camPolygon(side, valve, c);
  const face = (y) => k.lineSvg(k.pathOf(circle(0, 0, 8, 24).map(([x, z]) => k.iso([C[0] + x, y, C[2] + z], P)), true), { tone: "faint" });
  return k.solidSvg(G.prismOf(F, lobe, -7, 7, P), { tone: "hi", inner: face(7) });
}

// Bánh răng cảm biến 60-2 trên đầu trục khuỷu: vạch răng trên mặt trước quay theo trục.
export const TRIGGER = { y0: 46, y1: 49, r: 27 };
export function triggerTeeth(P, c) {
  const out = [];
  for (let i = 0; i < 60; i++) {
    if (i >= 58) continue;
    const g = (i / 60) * 2 * Math.PI - c * DEG;
    const a = [Math.sin(g), Math.cos(g)];
    out.push(k.pathOf([k.iso([a[0] * (TRIGGER.r - 4), TRIGGER.y1, a[1] * (TRIGGER.r - 4)], P), k.iso([a[0] * TRIGGER.r, TRIGGER.y1, a[1] * TRIGGER.r], P)]));
  }
  const g = (59 / 60) * 2 * Math.PI - c * DEG;
  return { teeth: out.join(""), gap: k.iso([Math.sin(g) * (TRIGGER.r - 2), TRIGGER.y1, Math.cos(g) * 37], P) };
}
