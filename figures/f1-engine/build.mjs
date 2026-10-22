// Fig 1 · Động cơ thử nghiệm một xi-lanh của F1 (V6 1.6 L, luật 2026), bổ đôi trên bệ thử.
// node build.mjs [--light] [--audit]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../../.claude/skills/anatomy/kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../.claude/skills/anatomy/kit/tube.mjs";
import * as A from "../../.claude/skills/anatomy/kit/audit.mjs";
import * as M from "./model.mjs";
import * as MV from "./moving.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT = join(HERE, "../../.claude/skills/anatomy/kit");
const THEME = process.argv.includes("--light") ? "light" : "dark";
const DEG = Math.PI / 180;

const W = 900;
const H = 760;
const AZIMUTH = 62;
const ELEVATION = 22;

// ---------- bố cục (mm) ----------
const PLATE = { x: -235, y: -95, w: 470, d: 220, r: 10 };
const PLATE_Z = -150; // mặt dưới tấm đế
const PLATE_TOP = -138;
const FOOT_H = 10;
const CASE = { x0: -80, x1: 80, back: -50, inner: -40, z0: -95, z1: 60, lip: -60 };
const DECK = 155; // mặt tiếp giáp nắp máy
const HEAD = { x0: -75, x1: 75, back: -55, top: 255 };
const COVER = { x0: -66, x1: 66, top: 308 };
const BLOCK = { x0: -62, x1: 62, back: -55 };
const PED = [-1, 1].map((s) => ({ x: s < 0 ? -78 : 38, y: -44, w: 40, d: 84, r: 3 }));
const BEARING_Y = [24, 32];
const SCOPE = { x: 70, y: 62, w: 128, d: 50, r: 4 };
const SCOPE_Z = [PLATE_TOP, -58];

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, PLATE_Z - FOOT_H, PLATE_TOP),
    [HEAD.x0, HEAD.back, COVER.top + 40],
    [HEAD.x1, HEAD.back, COVER.top + 30],
    [-185, -20, 300],
  ],
  W,
  H,
  { pad: 30, azimuth: AZIMUTH, elevation: ELEVATION },
);
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const box = (plan, z, h, style = {}, bevel = 0.6, steps = 3) => S(k.slabOf(plan, z, h, P, steps, bevel), { tone: "mid", ...style });
const zFrame = (x, y, z = 0) => G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const yAxis = (x, z, y = 0) => G.frameOf([x, y, z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
const xAxis = (y, z, x = 0) => G.frameOf([x, y, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
// mặt phẳng cắt y = yc: đa giác (x, z) → path
const onCut = (pts, yc = 0) => k.pathOf(pts.map(([x, z]) => at([x, yc, z])), true);
const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const roundRect = (x0, z0, x1, z1, r, n = 5) => {
  const out = [];
  const cs = [[x1 - r, z0 + r, -90], [x1 - r, z1 - r, 0], [x0 + r, z1 - r, 90], [x0 + r, z0 + r, 180]];
  for (const [cx, cz, a0] of cs) for (let i = 0; i <= n; i++) {
    const a = (a0 + (90 * i) / n) * DEG;
    out.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]);
  }
  return out;
};
const voidSvg = (pts, yc = 0, extra = "") => `<path class="f1-void" d="${onCut(pts, yc)}"/>` + Ln(onCut(pts, yc), { tone: "lo" }) + extra;

// ---------- tấm đế, chân, thước ----------
function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, PLATE_Z - FOOT_H, PLATE_TOP - PLATE_Z + FOOT_H, P)}"/>`];
  const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of byDepth(k.corners(PLATE, 26))) {
    out.push(S(k.cylinder(x, y, 9, PLATE_Z - FOOT_H, 2, P, 32), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 7, PLATE_Z - FOOT_H + 2, FOOT_H - 2, P, 32), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, PLATE_Z, PLATE_TOP - PLATE_Z, P, 8, 1.6), { tone: "mid", inner: Ln(k.sideSeam(PLATE, PLATE_Z + 5, P, 8), { tone: "faint" }) }));
  out.push(Ln(k.planOutline(k.insetPlan(PLATE, 6), PLATE_TOP, P), { tone: "lo" }));
  // rãnh chữ T trên bàn máy, chạy hết chiều ngang rãnh viền
  for (const y of [-60, -10]) out.push(Ln(k.planOutline({ x: PLATE.x + 14, y, w: PLATE.w - 28, d: 6, r: 3 }, PLATE_TOP, P, 4), { tone: "faint" }));
  const screws = k.corners(PLATE, 12);
  out.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2.6, PLATE_TOP, P, 16)).join(""), { tone: "lo" }));
  out.push(Dots(screws.map(([x, y]) => at([x, y, PLATE_TOP])), { size: 0.55 }));
  // thước góc: dải thước dọc mép trước
  const strip = { x: -200, y: PLATE.y + PLATE.d - 16, w: 230, d: 8, r: 1 };
  out.push(S(k.slabOf(strip, PLATE_TOP, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 5, 5, strip.y + 0.8, PLATE_TOP + 0.6, [2.2, 4], P);
  out.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  out.push(Dots([at([strip.x + 2, strip.y + 4, PLATE_TOP + 0.6]), at([strip.x + strip.w - 2, strip.y + 4, PLATE_TOP + 0.6])], { size: 0.45 }));
  // biển tên
  const label = { x: -200, y: PLATE.y + PLATE.d - 46, w: 62, d: 22, r: 1.5 };
  out.push(S(k.slabOf(label, PLATE_TOP, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(Ln(k.planOutline(k.insetPlan(label, 1.8), PLATE_TOP + 0.8, P, 3), { tone: "faint" }));
  [[36, 6], [26, 11], [42, 16]].forEach(([len, y]) => out.push(Ln(k.lineOnTop([label.x + 6, label.y + y], [label.x + 6 + len, label.y + y], PLATE_TOP + 0.8, P), { tone: "lo", free: true })));
  out.push(Dots([at([label.x + 3, label.y + 3, PLATE_TOP + 0.8]), at([label.x + label.w - 3, label.y + label.d - 3, PLATE_TOP + 0.8])], { size: 0.45 }));
  return out.join("");
}

// ---------- bệ đỡ và các-te ----------
function pedestals() {
  const out = [];
  for (const plan of PED) {
    out.push(box(plan, PLATE_TOP, CASE.z0 - PLATE_TOP - 6, { tone: "mid" }, 0.8, 4));
    out.push(box(k.insetPlan(plan, -2), CASE.z0 - 6, 6, { tone: "mid" }, 0.6, 4));
    // gân tăng cứng trên mặt trước (chạy hết chiều cao mặt)
    const yF = plan.y + plan.d;
    out.push(Ln(k.segment([plan.x + plan.w / 2, yF, PLATE_TOP], [plan.x + plan.w / 2, yF, CASE.z0 - 6], P), { tone: "faint" }));
    const bolts = [[plan.x + 6, yF - 6], [plan.x + plan.w - 6, yF - 6], [plan.x + 6, plan.y + 6], [plan.x + plan.w - 6, plan.y + 6]];
    out.push(Ln(bolts.map(([x, y]) => k.ring(x, y, 2.4, CASE.z0, P, 14)).join(""), { tone: "lo" }));
    out.push(Dots(bolts.map(([x, y]) => at([x, y, CASE.z0])), { size: 0.6 }));
  }
  return out.join("");
}

function crankcase() {
  const out = [];
  const { x0, x1, back, inner, z0, z1, lip } = CASE;
  out.push(box({ x: x0, y: back, w: x1 - x0, d: inner - back, r: 2 }, z0, z1 - z0, { tone: "mid" }, 0.8, 3)); // vách sau
  out.push(box({ x: x0, y: inner, w: x1 - x0, d: 80, r: 1.5 }, z0, 8, { tone: "mid" }, 0.6, 3)); // đáy (các-te dầu)
  // vách bên: phần dưới đủ, phần trên cắt ở y = 0
  for (const x of [x0, x1 - 8]) {
    out.push(box({ x, y: inner, w: 8, d: 80, r: 1 }, z0 + 8, lip - z0 - 8, { tone: "mid" }, 0.5, 2));
    out.push(box({ x, y: inner, w: 8, d: -inner, r: 1 }, lip, z1 - lip, { tone: "mid" }, 0.5, 2));
  }
  // gối đỡ sau: ổ trục trên vách sau
  const FB = yAxis(0, 0);
  out.push(S(G.disc(inner, -30, 34, FB, P), { tone: "mid" }) + Dots(G.dotsOf(FB, -30, 28, 6, P, { all: true, phase: 0.5 }), { size: 0.6 }));
  out.push(S(G.disc(-30, -18, MV.CRANK.journal, FB, P), { tone: "hi" }));
  // nút xả dầu ở đáy, mặt bên phải
  out.push(S(G.disc(0, 5, 6, xAxis(10, z0 + 4, x1), P), { tone: "mid" }));
  return out.join("");
}

function crankcaseFront() {
  const out = [];
  const { x0, x1, z0, lip } = CASE;
  // gờ trước của các-te dầu (phần không bị cắt) và giá đỡ bộ mã hoá góc gắn lên mặt trước của gờ
  out.push(box({ x: x0 + 8, y: 34, w: x1 - x0 - 16, d: 6, r: 1 }, z0 + 8, lip - z0 - 8, { tone: "mid" }, 0.5, 2));
  out.push(Ln(k.sideSeam({ x: x0, y: -40, w: x1 - x0, d: 80, r: 1.5 }, z0 + 4, P, 3), { tone: "faint" }));
  return out.join("");
}

// ---------- thân máy và lót xi-lanh (nửa sau) ----------
const LINER_R = M.BORE / 2;
function innerHalfCylinder(r, z0, z1, a0 = Math.PI, a1 = 2 * Math.PI, n = 60) {
  const L = G.lightOf(P);
  const shades = [[], [], [], []];
  for (let i = 0; i < n; i++) {
    const t0 = a0 + ((a1 - a0) * i) / n;
    const t1 = a0 + ((a1 - a0) * (i + 1)) / n;
    const tm = (t0 + t1) / 2;
    const normal = [-Math.cos(tm), -Math.sin(tm), 0];
    if (G.dot3(normal, V) <= 0) continue;
    const tone = Math.min(3, G.bandOf(G.dot3(normal, L)));
    shades[tone].push(k.pathOf([at([r * Math.cos(t0), r * Math.sin(t0), z0]), at([r * Math.cos(t1), r * Math.sin(t1), z0]), at([r * Math.cos(t1), r * Math.sin(t1), z1]), at([r * Math.cos(t0), r * Math.sin(t0), z1])], true));
  }
  const rim = (z) => k.pathOf(Array.from({ length: n + 1 }, (_, i) => a0 + ((a1 - a0) * i) / n).map((t) => at([r * Math.cos(t), r * Math.sin(t), z])));
  const fill = k.pathOf([...Array.from({ length: n + 1 }, (_, i) => a0 + ((a1 - a0) * i) / n).map((t) => at([r * Math.cos(t), r * Math.sin(t), z0])), ...Array.from({ length: n + 1 }, (_, i) => a1 - ((a1 - a0) * i) / n).map((t) => at([r * Math.cos(t), r * Math.sin(t), z1]))], true);
  return `<g class="iso-solid f1-bore"><path class="iso-fill" d="${fill}"/>${shades.map((list, i) => (list.length ? `<path class="iso-shade" data-shade="${i}" d="${list.join("")}"/>` : "")).join("")}${Ln(rim(z0), { tone: "lo" })}${Ln(rim(z1), { tone: "lo" })}${Ln([0.35, 0.65].map((f) => rim(z0 + (z1 - z0) * f)).join(""), { tone: "faint" })}</g>`;
}

function block() {
  const out = [];
  const zB = CASE.z1;
  out.push(box({ x: -LINER_R, y: BLOCK.back, w: 2 * LINER_R, d: 15, r: 1 }, zB, DECK - zB, { tone: "mid" }, 0.6, 3));
  for (const [x, w] of [[BLOCK.x0, 22], [LINER_R, 22]]) {
    const plan = { x, y: BLOCK.back, w, d: -BLOCK.back, r: 1.5 };
    out.push(box(plan, zB, DECK - zB, { tone: "mid", inner: Ln(k.sideSeam(plan, zB + 10, P, 3), { tone: "faint" }) }, 0.6, 3));
  }
  out.push(innerHalfCylinder(LINER_R, zB, DECK - 0.01));
  // mặt cắt của thân máy: lót xi-lanh 4 mm và áo nước
  for (const s of [-1, 1]) {
    const xo = s * (LINER_R + 4);
    out.push(Ln(k.pathOf([at([xo, 0, zB]), at([xo, 0, DECK])]), { tone: "lo" }));
    const xs = [s * (LINER_R + 7), s * (LINER_R + 17)].sort((a, b) => a - b);
    out.push(voidSvg(roundRect(xs[0], zB + 12, xs[1], DECK - 10, 3)));
  }
  // gioăng mặt máy (hai nửa hai bên lỗ xi-lanh)
  for (const [x0, x1] of [[BLOCK.x0, -LINER_R], [LINER_R, BLOCK.x1]]) out.push(box({ x: x0, y: BLOCK.back, w: x1 - x0, d: -BLOCK.back, r: 0.5 }, DECK - 1.5, 1.5, { tone: "lo" }, 0, 2));
  return out.join("");
}

// ---------- nắp máy (nửa sau, mặt cắt y = 0) ----------
const roofZ = (x) => 168 - Math.abs(x) * 0.27;
const CHAMBER = (() => {
  const pts = [[-LINER_R, DECK]];
  for (let i = 0; i <= 16; i++) {
    const x = -LINER_R + (i / 16) * M.BORE;
    pts.push([x, Math.max(DECK, roofZ(x))]);
  }
  pts.push([LINER_R, DECK]);
  return pts;
})();

function portPath(side) {
  // ống nạp/xả trong nắp máy: từ đế van đi ra mặt bên
  const F = MV.valveFrame(side);
  const seat = F.o;
  const r = side < 0 ? 15 : 12.5;
  const exitZ = side < 0 ? 222 : 192;
  const exitX = side < 0 ? HEAD.x0 : HEAD.x1;
  const n = 18;
  const centre = (t) => {
    const p0 = [seat[0], seat[2] + 6];
    const p1 = [seat[0] + side * 4, exitZ];
    const p2 = [exitX, exitZ];
    const a = (1 - t) * (1 - t);
    const b = 2 * t * (1 - t);
    const c = t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]];
  };
  const left = [];
  const right = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = centre(t);
    const q = centre(Math.min(1, t + 0.01));
    const p0 = centre(Math.max(0, t - 0.01));
    const d = [q[0] - p0[0], q[1] - p0[1]];
    const len = Math.hypot(d[0], d[1]);
    const nrm = [-d[1] / len, d[0] / len];
    left.push([p[0] + nrm[0] * r, p[1] + nrm[1] * r]);
    right.push([p[0] - nrm[0] * r, p[1] - nrm[1] * r]);
  }
  return [...left, ...right.reverse()];
}

function head() {
  const out = [];
  const plan = { x: HEAD.x0, y: HEAD.back, w: HEAD.x1 - HEAD.x0, d: -HEAD.back, r: 2 };
  out.push(S(k.slabOf(plan, DECK, HEAD.top - DECK, P, 3, 0.8), { tone: "mid", inner: Ln(k.sideSeam(plan, DECK + 26, P, 3), { tone: "faint" }) }));
  // các hốc trên mặt cắt
  out.push(voidSvg(portPath(-1)));
  out.push(voidSvg(portPath(1)));
  for (const side of [-1, 1]) {
    const F = MV.valveFrame(side);
    const p = (s, r) => [F.o[0] + F.a[0] * s + F.u[0] * r, F.o[2] + F.a[2] * s + F.u[2] * r];
    // dẫn hướng van, buồng lò xo khí nén, ống con đội
    out.push(voidSvg([p(40, -4.2), p(40, 4.2), p(72, 4.2), p(72, -4.2)]));
    out.push(voidSvg([p(72, -12.5), p(72, 12.5), p(90, 12.5), p(90, -12.5)]));
    out.push(voidSvg([p(90, -15), p(90, 15), p(HEAD.top - 160, 15), p(HEAD.top - 160, -15)].map(([x, z], i) => (i > 1 ? [x, HEAD.top] : [x, z]))));
  }
  // ống bugi ở giữa
  out.push(voidSvg(rect(-9.5, roofZ(0) + 14, 9.5, HEAD.top)));
  // áo nước trong nắp
  out.push(voidSvg(roundRect(-60, DECK + 8, -46, 190, 3)));
  out.push(voidSvg(roundRect(46, DECK + 8, 62, 175, 3)));
  out.push(voidSvg(roundRect(-26, 205, -14, 240, 3)));
  out.push(voidSvg(roundRect(14, 205, 26, 240, 3)));
  // bu lông nắp máy: đầu bu lông trên mặt trên
  const studs = [[-68, -48], [68, -48], [-68, -8], [68, -8]];
  out.push(Ln(studs.map(([x, y]) => k.ring(x, y, 3, HEAD.top, P, 14)).join(""), { tone: "lo" }));
  out.push(Dots(studs.map(([x, y]) => at([x, y, HEAD.top])), { size: 0.7 }));
  return out.join("");
}

function chamberOutline() {
  return Ln(k.pathOf(CHAMBER.map(([x, z]) => at([x, 0, z]))), { tone: "lo" });
}

// Nắp cam (nửa sau) + giá đỡ trục cam
function cover() {
  const out = [];
  const plan = { x: COVER.x0, y: HEAD.back + 4, w: COVER.x1 - COVER.x0, d: -HEAD.back - 4, r: 4 };
  out.push(S(k.slabOf(plan, HEAD.top, COVER.top - HEAD.top, P, 4, 0.8), { tone: "mid", inner: Ln(k.sideSeam(plan, HEAD.top + 6, P, 4), { tone: "faint" }) }));
  for (const side of [-1, 1]) {
    const C = MV.camCentre(side);
    out.push(voidSvg(roundRect(C[0] - 30, HEAD.top + 2, C[0] + 30, COVER.top - 6, 8)));
  }
  out.push(voidSvg(rect(-9.5, HEAD.top, 9.5, COVER.top)));
  // gân trên nắp cam
  for (const x of [-40, -20, 20, 40]) out.push(Ln(k.pathOf([at([x, plan.y, COVER.top]), at([x, 0, COVER.top])]), { tone: "faint" }));
  return out.join("");
}

function camshafts() {
  const out = [];
  for (const side of [-1, 1]) {
    const C = MV.camCentre(side);
    const F = yAxis(C[0], C[2]);
    out.push(S(G.disc(-36, -24, 22, F, P), { tone: "mid" })); // ổ đỡ trục cam
    out.push(Dots(G.dotsOf(F, -24, 17, 4, P, { all: true, phase: Math.PI / 4 }), { size: 0.6 }));
    out.push(S(G.disc(-24, -7, 11, F, P), { tone: "hi", inner: Ln(G.arcOf(F, -16, 11, P), { tone: "faint" }) }));
  }
  return out.join("");
}

// ---------- bugi + buồng đốt trước, kim phun ----------
function plug() {
  const F = zFrame(0, 0, roofZ(0));
  const profile = [
    [-1.5, 2.6], [5, 2.6], [5, 5], [24, 5], [24, 7], [34, 7], [34, 5.5], [82, 5.5], [82, 4.5, 1], [98, 4.5], [98, 2.6],
    [108, 2.6],
  ];
  const id = "plug";
  const tip = Dots([at([0, 0, roofZ(0) - 1.5])], { size: 1.2, tone: "hi" });
  const coilF = zFrame(0, 0, COVER.top - 8);
  const coil = S(G.solidOf([[0, 12], [10, 12], [10, 10], [30, 10], [30, 10.6], [33, 10.6], [33, 10], [44, 10], [44, 13], [52, 13]], coilF, P), { tone: "mid" });
  const conn = box({ x: 13, y: -6, w: 14, d: 12, r: 1.5 }, COVER.top + 30, 12, { tone: "mid" }, 0.4, 2);
  return S(G.solidOf(profile, F, P), { tone: "hi", inner: Ln([10, 16].map((s) => G.arcOf(F, s, 5, P)).join(""), { tone: "faint" }) }) + tip + coil + conn;
}

const INJ = (() => {
  const tip = [-31, 0, 162];
  const a = G.unit3([-1, 0, 0.42]);
  return { tip, a, F: G.frameAlong(tip, a) };
})();
function injector() {
  const profile = [[0, 2], [5, 3], [5, 4.5], [44, 4.5], [44, 7], [62, 7], [62, 9], [76, 9], [76, 5], [84, 5]];
  return S(G.solidOf(profile, INJ.F, P), { tone: "hi" });
}

// ---------- đường ống (ghi hình để kiểm định) ----------
const R = A.recorder(P, {});
const rec = (shape) => R.solid(shape);
const tubes = [];
// Ống: điểm đầu và cuối nằm đúng trên mặt lắp; mặt bích (nếu có) chiếm đoạn đầu/cuối, ống bị cắt dưới mặt bích.
function pipe(name, control, r, { bend = 2.6, tone = "hi", rings, flanges = [0, 0], thick = 5, bolts = [0, 0], limp = false } = {}) {
  const line = G.fillet(control, Math.max(r * bend, 3), 14, { P, tube: r });
  const total = G.pathLength(line);
  const gaps = [];
  const collars = [];
  flanges.forEach((fr, i) => {
    if (!fr) return;
    const along = i ? total - thick / 2 : thick / 2;
    gaps.push(i ? [total - thick, total] : [0, thick]);
    collars.push({ centre: G.pointAlong(line, along), axis: G.tangentAlong(line, along), r: fr, bolts: bolts[i] });
  });
  R.route(name, line, r, { gaps, limp, rims: flanges.map((fr) => fr || r) });
  const parts = tubePieces(line, r, P, { maxLength: 400, gaps, rings });
  tubes.push(name);
  const flangeSvg = collars.map(({ centre, axis, r: fr, bolts: nb }) => {
    rec(A.disc(G.frameAlong(centre, axis), -thick / 2, thick / 2, fr, { name: `${name}.flange`, owner: name }));
    return flange(centre, axis, fr, thick, { bolts: nb });
  }).join("");
  return { line, svg: parts.map((part) => tubeSvg(part, { tone })).join(""), flanges: flangeSvg };
}
function flange(centre, axis, r, thick, { bolts = 6, tone = "mid" } = {}) {
  const F = G.frameAlong(centre, axis);
  const towards = G.dot3(F.a, V) > 0 ? thick / 2 : -thick / 2;
  const face = Math.abs(G.dot3(F.a, V)) > 0.12 && bolts ? Dots(G.dotsOf(F, towards, r * 0.72, bolts, P, { all: true }), { size: 0.55, tone: "mid" }) : "";
  return S(G.disc(-thick / 2, thick / 2, r, F, P), { tone }) + face;
}

// Hình khối của các chi tiết tĩnh mà ống và cáp chạy qua hoặc gá vào.
rec(A.slab(PLATE, PLATE_Z, PLATE_TOP - PLATE_Z, { name: "stand.plate" }));
PED.forEach((plan) => rec(A.slab(plan, PLATE_TOP, CASE.z0 - PLATE_TOP, { name: "stand.pedestal" })));
rec(A.box([CASE.x0, CASE.back, CASE.z0], [CASE.x1, CASE.inner, CASE.z1], { name: "case.back" }));
rec(A.box([CASE.x0, CASE.inner, CASE.z0], [CASE.x1, 40, CASE.z0 + 8], { name: "case.floor" }));
rec(A.box([CASE.x0 + 8, 34, CASE.z0 + 8], [CASE.x1 - 8, 40, CASE.lip], { name: "case.lip" }));
rec(A.box([-LINER_R, BLOCK.back, CASE.z1], [LINER_R, -40, DECK], { name: "block.back" }));
const HEAD_SHAPE = rec(A.box([HEAD.x0, HEAD.back, DECK], [HEAD.x1, 0, HEAD.top], { name: "head" }));
rec(A.box([COVER.x0, HEAD.back + 4, HEAD.top], [COVER.x1, 0, COVER.top], { name: "cover" }));
rec(A.box([BLOCK.x0, BLOCK.back, CASE.z1], [BLOCK.x0 + 22, 0, DECK], { name: "block.left" }));
rec(A.box([LINER_R, BLOCK.back, CASE.z1], [LINER_R + 22, 0, DECK], { name: "block.right" }));

// Ống xả: mặt bích ở mặt bên nắp máy, vòng xuống bình tiêu âm (giả lập áp ngược của tua-bin).
const EXH_R = 13;
const PORT_Y = -24;
const CAN = { x: 150, y: PORT_Y, r: 30, z0: PLATE_TOP, z1: -46, neck: 4 };
function exhaust() {
  const top = CAN.z1 + CAN.neck;
  const t = pipe("exhaust", [[HEAD.x1, PORT_Y, 192], [CAN.x, PORT_Y, 192], [CAN.x, PORT_Y, top]], EXH_R, { rings: { pitch: 3.2, twist: 0.6, cross: true, fade: [0.15, 0.6], tone: "lo" }, bend: 3, flanges: [22, 19], bolts: [0, 6] });
  const out = [];
  const Fc = zFrame(CAN.x, CAN.y);
  const prof = [[CAN.z0, CAN.r], [CAN.z1 - 8, CAN.r, 1], [CAN.z1 - 2, CAN.r - 6, 1], [CAN.z1, 21]];
  rec(A.solid(Fc, prof, { name: "stand.can" }));
  rec(A.disc(Fc, CAN.z1, top, 20, { name: "stand.can.neck" }));
  out.push(S(G.solidOf(prof, Fc, P), { tone: "mid", inner: Ln([CAN.z0 + 20, CAN.z0 + 60].map((s) => G.arcOf(Fc, s, CAN.r, P)).join(""), { tone: "faint" }) }));
  out.push(S(G.disc(CAN.z1, top, 20, Fc, P), { tone: "mid" }));
  return { back: out.join(""), pipe: t.svg, flanges: t.flanges };
}

// Đường nạp: ống nạp từ mặt bên trái nắp máy lên hộp gió (plenum) trên trụ đỡ.
const PLENUM = { x: -150, y: PORT_Y, z0: 228, z1: 300, r: 36 };
const POST = { x: PLENUM.x - 24, y: PLENUM.y, r: 6, top: PLENUM.z0 - 20 };
function intake() {
  const out = [];
  const t = pipe("runner", [[HEAD.x0, PORT_Y, 222], [PLENUM.x + 8, PORT_Y, 222], [PLENUM.x + 8, PORT_Y, PLENUM.z0]], 15, { bend: 2.2, flanges: [22, 20] });
  const Fp = zFrame(PLENUM.x, PLENUM.y);
  const prof = [[PLENUM.z0, PLENUM.r - 4], [PLENUM.z0 + 4, PLENUM.r, 1], [PLENUM.z1 - 4, PLENUM.r, 1], [PLENUM.z1, PLENUM.r - 4]];
  const bracket = { x: POST.x - 9, y: POST.y - 9, w: 18, d: 18, r: 2 };
  rec(A.cylinder(POST.x, POST.y, POST.r, PLATE_TOP, POST.top - PLATE_TOP, { name: "stand.post" }));
  rec(A.slab(bracket, POST.top, PLENUM.z0 - POST.top, { name: "stand.bracket" }));
  rec(A.solid(Fp, prof, { name: "plenum" }));
  // trụ đỡ hộp gió đứng trên tấm đế
  out.push(S(k.cylinder(POST.x, POST.y, 10, PLATE_TOP, 6, P, 28), { tone: "mid" }));
  out.push(S(k.cylinder(POST.x, POST.y, POST.r, PLATE_TOP + 6, POST.top - PLATE_TOP - 6, P, 24), { tone: "mid", crease: "none" }));
  out.push(box(bracket, POST.top, PLENUM.z0 - POST.top, { tone: "mid" }, 0.5, 2));
  out.push(S(G.solidOf(prof, Fp, P), { tone: "mid", inner: Ln([PLENUM.z0 + 24, PLENUM.z0 + 48].map((s) => G.arcOf(Fp, s, PLENUM.r, P)).join(""), { tone: "faint" }) }));
  out.push(Dots(G.dotsOf(Fp, PLENUM.z1, PLENUM.r - 9, 10, P, { all: true }), { size: 0.55 }));
  return { back: out.join(""), pipe: t.svg, flanges: t.flanges };
}

// Bơm nhiên liệu cao áp trên tấm đế, ống thép 350 bar lên kim phun, đồng hồ áp suất trên nắp bơm.
const PUMP = { x: -168, y: 22, w: 56, d: 44, r: 3 };
const PUMP_TOP = -96;
const GAUGE = { x: PUMP.x + 16, y: PUMP.y + 22, r: 12 };
function fuel() {
  const out = [];
  rec(A.slab(PUMP, PLATE_TOP, PUMP_TOP - PLATE_TOP, { name: "stand.pump" }));
  out.push(`<path class="iso-halo" d="${k.haloOf(PUMP, PLATE_TOP, 3, P)}" style="filter:blur(4px)"/>`);
  out.push(box(PUMP, PLATE_TOP, PUMP_TOP - PLATE_TOP, { tone: "mid", inner: Ln(k.sideSeam(PUMP, PUMP_TOP - 10, P, 4), { tone: "faint" }) }, 0.8, 4));
  out.push(Ln(k.planOutline(k.insetPlan(PUMP, 3), PUMP_TOP, P, 4), { tone: "faint" }));
  out.push(Dots(k.corners(PUMP, 5).map(([x, y]) => at([x, y, PUMP_TOP])), { size: 0.5 }));
  // đồng hồ áp suất nằm ngửa trên nắp bơm
  const gz = PUMP_TOP + 7;
  out.push(S(k.cylinder(GAUGE.x, GAUGE.y, GAUGE.r, PUMP_TOP, 7, P, 48, 0.6), { tone: "hi", crease: "lo" }));
  out.push(Ln(k.ring(GAUGE.x, GAUGE.y, GAUGE.r - 1.6, gz, P, 48), { tone: "lo" }));
  const ticks = k.radialTicks(GAUGE.x, GAUGE.y, GAUGE.r - 2.2, 40, 5, gz, [1, 2.2], P, -Math.PI * 0.75, Math.PI * 1.5);
  out.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  const needle = -Math.PI * 0.75 + Math.PI * 1.5 * (350 / 500);
  out.push(Ln(k.lineOnTop([GAUGE.x - Math.sin(needle) * 2.4, GAUGE.y + Math.cos(needle) * 2.4], [GAUGE.x + Math.sin(needle) * (GAUGE.r - 3.5), GAUGE.y - Math.cos(needle) * (GAUGE.r - 3.5)], gz + 0.1, P), { tone: "lit", free: true }));
  out.push(Ln(k.ring(GAUGE.x, GAUGE.y, 1.3, gz + 0.1, P, 12), { tone: "mid" }));
  // đầu nối ra của bơm
  const Fo = zFrame(PUMP.x + 42, PUMP.y + 22, PUMP_TOP);
  const oprof = [[0, 5], [4, 5], [4, 3.6], [8, 3.6]];
  rec(A.solid(Fo, oprof, { name: "stand.pump.out" }));
  out.push(S(G.solidOf(oprof, Fo, P), { tone: "mid" }));
  // ống cao áp: từ đầu nối của bơm lên đuôi kim phun
  const tail = G.add3(INJ.tip, G.mul3(INJ.a, 84));
  const up = G.add3(G.add3(tail, G.mul3(INJ.a, 24)), [0, 0, 14]);
  const line = pipe("fuel", [[PUMP.x + 42, PUMP.y + 22, PUMP_TOP + 8], [PUMP.x + 42, PUMP.y + 22, up[2]], [up[0], PUMP.y + 22, up[2]], up, G.add3(tail, G.mul3(INJ.a, 10)), tail], 1.8, { bend: 6, tone: "hi" });
  return { body: out.join(""), line: line.svg };
}
rec(A.solid(INJ.F, [[0, 2], [5, 3], [5, 4.5], [44, 4.5], [44, 7], [62, 7], [62, 9], [76, 9], [76, 5], [84, 5]], { name: "injector", seated: true, cut: [HEAD_SHAPE] }));

// ---------- máy hiện sóng / bộ đo áp suất ----------
const SCREEN = { x0: SCOPE.x + 10, x1: SCOPE.x + 84, z0: SCOPE_Z[0] + 22, z1: SCOPE_Z[1] - 10 };
function scope() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(SCOPE, SCOPE_Z[0], 4, P)}" style="filter:blur(5px)"/>`);
  out.push(box(SCOPE, SCOPE_Z[0], SCOPE_Z[1] - SCOPE_Z[0], { tone: "mid", inner: Ln(k.sideSeam(SCOPE, SCOPE_Z[0] + 8, P, 4), { tone: "faint" }) }, 0.8, 4));
  const yF = SCOPE.y + SCOPE.d;
  // khung màn hình (lõm vào 2 mm)
  const win = rect(SCREEN.x0, SCREEN.z0, SCREEN.x1, SCREEN.z1);
  const deep = 2;
  const walls = [];
  for (let i = 0; i < 4; i++) {
    const [a, b] = [win[i], win[(i + 1) % 4]];
    walls.push(`<path class="iso-shade" data-shade="${i % 2 ? 1 : 2}" d="${k.pathOf([at([a[0], yF, a[1]]), at([b[0], yF, b[1]]), at([b[0], yF - deep, b[1]]), at([a[0], yF - deep, a[1]])], true)}"/>`);
  }
  out.push(`<g class="f1-screen-walls">${walls.join("")}</g>`);
  out.push(`<path class="f1-screen" d="${onCut(win, yF - deep)}"/>`);
  out.push(Ln(onCut(win, yF), { tone: "lo" }));
  // núm chỉnh bên phải màn hình
  for (const [x, z] of [[SCOPE.x + 100, SCOPE_Z[1] - 22], [SCOPE.x + 116, SCOPE_Z[1] - 22], [SCOPE.x + 108, SCOPE_Z[0] + 32]]) {
    const F = yAxis(x, z, yF);
    out.push(S(G.disc(0, 4, 5, F, P), { tone: "mid" }) + Ln(k.pathOf([at([x, yF + 4, z]), at([x, yF + 4, z + 4.4])]), { tone: "hi" }));
  }
  // hai đầu nối BNC trên nóc
  for (const x of [SCOPE.x + 96, SCOPE.x + 114]) {
    const F = zFrame(x, SCOPE.y + 20, SCOPE_Z[1]);
    out.push(S(G.solidOf([[0, 5], [3, 5], [3, 3.5], [10, 3.5]], F, P), { tone: "mid" }));
  }
  return out.join("");
}

// Khung toạ độ màn hình: (u, v) ∈ [0,1]² → điểm trên mặt kính.
const screenAt = (u, v) => at([SCREEN.x0 + 4 + u * (SCREEN.x1 - SCREEN.x0 - 8), SCOPE.y + SCOPE.d - 2, SCREEN.z0 + 4 + v * (SCREEN.z1 - SCREEN.z0 - 8)]);
const P_LO = Math.log(2);
const P_HI = Math.log(260);
const V_LO = Math.log(M.CLEAR * 0.9);
const V_HI = Math.log((M.CLEAR + M.SWEPT) * 1.12);
const pvAt = (c) => screenAt((Math.log(M.volumeOf(c)) - V_LO) / (V_HI - V_LO), (Math.log(M.pressureOf(c)) - P_LO) / (P_HI - P_LO));
function screenArt() {
  const loop = [];
  for (let c = 0; c <= 720; c += 2) loop.push(pvAt(c));
  const grid = [];
  for (const p of [5, 10, 20, 50, 100, 200]) {
    const v = (Math.log(p) - P_LO) / (P_HI - P_LO);
    grid.push(k.pathOf([screenAt(0, v), screenAt(1, v)]));
  }
  const frame = k.pathOf([screenAt(0, 0), screenAt(1, 0), screenAt(1, 1), screenAt(0, 1)], true);
  return `<g class="f1-trace">${Ln(frame, { tone: "faint", className: "f1-grid" })}${Ln(grid.join(""), { tone: "faint", className: "f1-grid" })}<path class="f1-loop" d="${k.pathOf(loop, true)}"/></g>`;
}

// ---------- cảm biến và cáp tín hiệu ----------
const BNC = [SCOPE.x + 96, SCOPE.x + 114].map((x) => [x, SCOPE.y + 20]);
const BNC_TOP = SCOPE_Z[1] + 10;
const ENC = { y0: 60, y1: 76, r: 16 };
const EBRACKET = { x: -12, y: 40, w: 24, d: 34, r: 1.5 };
const ARM = { x: -3, y: 64, w: 6, d: 8, r: 1 };
function sensors() {
  const out = [];
  // cảm biến áp suất buồng đốt: thân trên mặt bên phải nắp máy
  const F = xAxis(-20, 236, HEAD.x1);
  const prof = [[0, 6], [5, 6], [5, 4.5], [16, 4.5], [16, 3.2], [22, 3.2]];
  rec(A.solid(F, prof, { name: "sensor.pressure" }));
  out.push(S(G.solidOf(prof, F, P), { tone: "hi" }));
  // bộ mã hoá góc trên đầu trục khuỷu, cần chống xoay đứng trên giá gắn vào gờ trước các-te
  rec(A.slab(EBRACKET, CASE.lip - 6, 6, { name: "encoder.bracket" }));
  out.push(box(EBRACKET, CASE.lip - 6, 6, { tone: "mid" }, 0.4, 2));
  out.push(Ln([[EBRACKET.x + 4, EBRACKET.y + EBRACKET.d - 4], [EBRACKET.x + EBRACKET.w - 4, EBRACKET.y + EBRACKET.d - 4]].map(([x, y]) => k.ring(x, y, 1.6, CASE.lip, P, 12)).join(""), { tone: "lo" }));
  out.push(Dots([at([EBRACKET.x + 4, EBRACKET.y + EBRACKET.d - 4, CASE.lip]), at([EBRACKET.x + EBRACKET.w - 4, EBRACKET.y + EBRACKET.d - 4, CASE.lip])], { size: 0.5 }));
  rec(A.slab(ARM, CASE.lip, -ENC.r - CASE.lip, { name: "encoder.arm" }));
  out.push(box(ARM, CASE.lip, -ENC.r - CASE.lip, { tone: "mid" }, 0.3, 2));
  const Fe = yAxis(0, 0);
  const eprof = [[ENC.y0, ENC.r - 2], [ENC.y0 + 2, ENC.r], [ENC.y1 - 2, ENC.r], [ENC.y1, ENC.r - 2]];
  rec(A.solid(Fe, eprof, { name: "encoder" }));
  out.push(S(G.solidOf(eprof, Fe, P), { tone: "mid", inner: Ln(G.arcOf(Fe, ENC.y0 + 8, ENC.r, P), { tone: "faint" }) }));
  out.push(Ln(G.circleOf(Fe, ENC.y1, ENC.r - 5, P), { tone: "faint" }) + Dots(G.dotsOf(Fe, ENC.y1, ENC.r - 3.5, 4, P, { all: true, phase: Math.PI / 4 }), { size: 0.5 }));
  const Fj = yAxis(0, 7, ENC.y1);
  rec(A.solid(Fj, [[0, 3.2], [6, 3.2], [6, 2.4], [9, 2.4]], { name: "encoder.plug" }));
  out.push(S(G.solidOf([[0, 3.2], [6, 3.2], [6, 2.4], [9, 2.4]], Fj, P), { tone: "mid" }));
  // đầu nối BNC trên nóc máy đo
  for (const [x, y] of BNC) {
    const Fb = zFrame(x, y, SCOPE_Z[1]);
    const bprof = [[0, 5], [3, 5], [3, 3.5], [10, 3.5]];
    rec(A.solid(Fb, bprof, { name: "scope.bnc" }));
  }
  const cableA = pipe("cable.pressure", [[HEAD.x1 + 22, -20, 236], [BNC[0][0] + 40, -20, 236], [BNC[0][0] + 40, -20, 30], [BNC[0][0], BNC[0][1], 30], [BNC[0][0], BNC[0][1], BNC_TOP]], 1.4, { bend: 9, tone: "lo", limp: true });
  const J = [0, ENC.y1 + 9, 7];
  const cableB = pipe("cable.encoder", [J, [0, ENC.y1 + 22, 7], [BNC[1][0], ENC.y1 + 22, 7], [BNC[1][0], BNC[1][1], 7], [BNC[1][0], BNC[1][1], BNC_TOP]], 1.4, { bend: 8, tone: "lo", limp: true });
  return { sensors: out.join(""), cables: cableA.svg + cableB.svg };
}

rec(A.slab(SCOPE, SCOPE_Z[0], SCOPE_Z[1] - SCOPE_Z[0], { name: "stand.scope" }));

// ---------- lắp ráp ----------
const C0 = 112; // góc ban đầu (kỳ nạp)
const crank0 = MV.crankParts(P, C0);
const piston0 = (() => {
  const top = M.crank(0).crown;
  const F = zFrame(0, 0, top - 40);
  const seams = Ln([30, 33.5, 37].map((s) => G.arcOf(F, s, 39.6, P)).join(""), { tone: "lo" });
  return S(G.solidOf([[0, 39.2], [28, 39.2], [28, 39.6], [40, 39.6]], F, P, { bevel: 0.8 }), { tone: "hi", lit: true, inner: seams });
})();
const valve0 = (side) => {
  const F = MV.valveFrame(side);
  const rh = side < 0 ? 16 : 13.5;
  const tulip = [[-2.5, rh], [-0.8, rh], [2, rh - 3.5, 1], [5, 6, 1], [9, 3.4, 1], [11, 3.2]];
  const stem = S(G.disc(10.6, MV.VALVE.stemTop, 3.2, F, P), { tone: "hi" }) + S(G.solidOf(tulip, F, P), { tone: "hi" });
  const air = S(G.disc(78, 84, 11.4, F, P), { tone: "hi" });
  const tappet = S(G.disc(MV.VALVE.stemTop, MV.VALVE.stemTop + MV.VALVE.tappet, 13, F, P), { tone: "hi", inner: Ln(G.arcOf(F, MV.VALVE.stemTop + 3, 13, P), { tone: "faint" }) });
  return stem + air + tappet;
};
const valveShift = (side, lift) => {
  const F = MV.valveFrame(side);
  return k.translateAlong(P, G.mul3(F.a, -lift));
};
const NOSE = { y0: 18, y1: 28, shaft: 6, coup: [50, 56, 10] };
const markAt = (c) => {
  const t = c * DEG;
  return k.pathOf([at([0, NOSE.coup[1], 0]), at([Math.sin(t) * (NOSE.coup[2] - 1.5), NOSE.coup[1], Math.cos(t) * (NOSE.coup[2] - 1.5)])]);
};
const nose = () => {
  const F = yAxis(0, 0);
  return S(G.disc(NOSE.y0, NOSE.y1, MV.CRANK.journal, F, P), { tone: "hi", inner: Ln(G.arcOf(F, NOSE.y0 + 4, MV.CRANK.journal, P), { tone: "faint" }) }) +
    S(G.disc(NOSE.y1, NOSE.coup[0], NOSE.shaft, F, P), { tone: "hi" }) +
    S(G.disc(NOSE.coup[0], NOSE.coup[1], NOSE.coup[2], F, P), { tone: "hi" }) +
    `<path data-part="teeth" class="iso-line" data-tone="hi" data-free="end" d="${markAt(C0)}"/>` +
    S(G.disc(NOSE.coup[1], ENC.y0, 4, F, P), { tone: "hi" });
};

const EX = exhaust();
const IN = intake();
const SEN = sensors();
const FUEL = fuel();
const pistonShift = (c) => k.translateAlong(P, [0, 0, M.crank(c).crown - M.crank(0).crown]);

const gasPolys = (c) => {
  const crown = M.crank(c).crown;
  const cyl = onCut(rect(-LINER_R, crown, LINER_R, DECK));
  return { cyl, chamber: onCut(CHAMBER) };
};
const g0 = gasPolys(C0);
const PLUG_TIP = at([0, 0, roofZ(0) - 1.5]);
const GAS0 = M.gasOf(C0);
const gas = (where, d) => `<g class="f1-gas" data-gas="${where}"><path class="f1-fresh" style="fill-opacity:${(0.2 * GAS0.fresh).toFixed(3)}" d="${d}"/><path class="f1-exh" style="fill-opacity:${(0.32 * GAS0.exhaust).toFixed(3)}" d="${d}"/><path class="f1-flame" style="opacity:${GAS0.flame.toFixed(3)}" d="${d}"/></g>`;

const body = [
  `<defs><radialGradient id="f1-flame-grad" gradientUnits="userSpaceOnUse" cx="${PLUG_TIP[0].toFixed(1)}" cy="${PLUG_TIP[1].toFixed(1)}" r="60"><stop offset="0" stop-color="var(--f1-flame-core)"/><stop offset=".45" stop-color="var(--f1-flame)"/><stop offset="1" stop-color="var(--f1-flame)" stop-opacity="0"/></radialGradient></defs>`,
  plate(),
  pedestals(),
  FUEL.body,
  IN.back.split("<g").length ? IN.back : "",
  EX.back,
  crankcase(),
  `<g data-part="crank-rear">${crank0.rear}${crank0.pin}</g>`,
  block(),
  gas("cyl", g0.cyl),
  `<g data-part="rod">${MV.rodSvg(P, C0)}</g>`,
  `<g data-part="crank-front">${crank0.front}</g>`,
  crankcaseFront(),
  `<g data-part="nose">${nose()}</g>`,
  `<g data-part="piston" transform="${pistonShift(C0)}">${piston0}</g>`,
  head(),
  gas("chamber", g0.chamber),
  chamberOutline(),
  cover(),
  camshafts(),
  ...[-1, 1].map((side) => `<g data-part="valve${side}" transform="${valveShift(side, M.liftOf(side < 0 ? M.INTAKE : M.EXHAUST, C0))}">${valve0(side)}</g>`),
  ...[-1, 1].map((side) => `<g data-part="cam${side}">${MV.camSvg(P, side, side < 0 ? M.INTAKE : M.EXHAUST, C0)}</g>`),
  injector(),
  FUEL.line,
  plug(),
  IN.pipe,
  IN.flanges,
  EX.pipe,
  EX.flanges,
  SEN.sensors,
  scope(),
  screenArt(),
  `<circle data-part="dot" class="f1-dot" r="2.2" cx="${pvAt(C0)[0].toFixed(1)}" cy="${pvAt(C0)[1].toFixed(1)}"/>`,
  SEN.cables,
];

A.auditOrExit(R, P, {});

const svg = k.figureSvg({
  width: W,
  height: H,
  label:
    "Động cơ thử nghiệm một xi-lanh của F1 bổ đôi trên bệ thử: trục khuỷu, thanh truyền, piston đường kính 80 mm hành trình 53 mm, hai trục cam đẩy van nạp và van xả có lò xo khí nén, bugi với buồng đốt trước, kim phun trực tiếp, ống nạp từ hộp gió, ống xả bọc cách nhiệt, và máy đo vẽ đồ thị áp suất – thể tích của chu trình bốn kỳ.",
  body,
});

const CSS = `
.iso{--f1-void:#0b0b0b;--f1-fresh:#6b9bff;--f1-exh:#8a8a8f;--f1-flame:#ff7a2e;--f1-flame-core:#ffe2a8;--f1-screen:#0a120d;--f1-trace:#6be0a0;--f1-trace-dim:#1f3a2a}
.iso[data-theme="light"]{--f1-void:#d6d6d2;--f1-fresh:#3e63dd;--f1-exh:#6a6a70;--f1-flame:#e8590c;--f1-flame-core:#ffb84d;--f1-screen:#e7efe9;--f1-trace:#1f8a55;--f1-trace-dim:#bcd4c5}
.f1-void{fill:var(--f1-void);stroke:none}
.f1-gas path{stroke:none}
.f1-fresh{fill:var(--f1-fresh)}
.f1-exh{fill:var(--f1-exh)}
.f1-flame{fill:url(#f1-flame-grad);opacity:0}
.iso[data-theme="light"] .f1-gas{mix-blend-mode:multiply}
.f1-screen{fill:var(--f1-screen)}
.f1-trace .f1-grid{stroke:var(--f1-trace-dim)}
.f1-loop{fill:none;stroke:var(--f1-trace);stroke-width:.9;stroke-linejoin:round;opacity:.85}
.f1-dot{fill:var(--f1-trace);stroke:var(--f1-screen);stroke-width:.6}
.iso-stage{outline:none;touch-action:pan-y;cursor:ew-resize}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

// Trang web: nhúng kit, lathe, mô hình và phần chuyển động vào namespace riêng.
const strip = (src) => src.replace(/^import[^\n]*\n/gm, "");
const ns = (name, src, prelude = "") => {
  const ids = [...src.matchAll(/^export (?:function|const) ([A-Za-z0-9_]+)/gm)].map((m) => m[1]);
  return `const ${name} = (() => {${prelude}\n${strip(src).replace(/^export /gm, "")}\nreturn { ${ids.join(", ")} };\n})();\n`;
};
const script =
  ns("k", readFileSync(join(KIT, "iso-kit.mjs"), "utf8")) +
  ns("G", readFileSync(join(KIT, "lathe.mjs"), "utf8"), "const { cameraOf, iso, pathOf } = k;") +
  ns("M", readFileSync(join(HERE, "model.mjs"), "utf8")) +
  ns("MV", readFileSync(join(HERE, "moving.mjs"), "utf8")) +
  `
const P = ${JSON.stringify(P)};
const C0 = ${C0};
const CREST = ${M.crank(0).crown};
const DECK = ${DECK}, LINER_R = ${LINER_R};
const SCREEN = ${JSON.stringify(SCREEN)}, SCOPE_Y = ${SCOPE.y + SCOPE.d - 2};
const PV = ${JSON.stringify({ P_LO, P_HI, V_LO, V_HI })};
const DEG = Math.PI / 180, NOSE = ${JSON.stringify(NOSE)};
const markAt = ${markAt.toString()};
${live()}
`;

function live() {
  return `
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const parts = { rear: part("crank-rear"), front: part("crank-front"), rod: part("rod"), piston: part("piston"), teeth: part("teeth"), dot: part("dot"), cams: [part("cam-1"), part("cam1")], valves: [part("valve-1"), part("valve1")] };
const gas = [...svg.querySelectorAll(".f1-gas")];
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const at = (p) => k.iso(p, P);
const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const onCut = (pts) => k.pathOf(pts.map(([x, z]) => at([x, 0, z])), true);
const screenAt = (u, v) => at([SCREEN.x0 + 4 + u * (SCREEN.x1 - SCREEN.x0 - 8), SCOPE_Y, SCREEN.z0 + 4 + v * (SCREEN.z1 - SCREEN.z0 - 8)]);
const pvAt = (c) => screenAt((Math.log(M.volumeOf(c)) - PV.V_LO) / (PV.V_HI - PV.V_LO), (Math.log(M.pressureOf(c)) - PV.P_LO) / (PV.P_HI - PV.P_LO));
const SLOW = Math.round((720 / 6.4) / (M.RPM * 6 / 1000));
const fmt = (x, d = 0) => x.toFixed(d).replace(".", ",");
const HASH = /c=([0-9.]+)/.exec(location.hash);
let angle = HASH ? +HASH[1] : C0, target = angle, speed = 720 / 6.4, running = !still.matches && !HASH, frame = 0, last = 0, visible = false, idle = 0, lastText = "";
function draw(c) {
  const cr = MV.crankParts(P, c);
  parts.rear.innerHTML = cr.rear + cr.pin;
  parts.front.innerHTML = cr.front;
  parts.rod.innerHTML = MV.rodSvg(P, c);
  parts.piston.setAttribute("transform", k.translateAlong(P, [0, 0, M.crank(c).crown - CREST]));
  parts.teeth.setAttribute("d", markAt(c));
  [-1, 1].forEach((side, i) => {
    const valve = side < 0 ? M.INTAKE : M.EXHAUST;
    const F = MV.valveFrame(side);
    const lift = M.liftOf(valve, c);
    parts.valves[i].setAttribute("transform", k.translateAlong(P, [-F.a[0] * lift, 0, -F.a[2] * lift]));
    parts.cams[i].innerHTML = MV.camSvg(P, side, valve, c);
  });
  const g = M.gasOf(c);
  const crown = M.crank(c).crown;
  gas[0].querySelectorAll("path").forEach((p) => p.setAttribute("d", onCut(rect(-LINER_R, crown, LINER_R, DECK))));
  for (const el of gas) {
    el.querySelector(".f1-fresh").style.fillOpacity = (0.2 * g.fresh).toFixed(3);
    el.querySelector(".f1-exh").style.fillOpacity = (0.32 * g.exhaust).toFixed(3);
    el.querySelector(".f1-flame").style.opacity = g.flame.toFixed(3);
  }
  const d = pvAt(c);
  parts.dot.setAttribute("cx", d[0].toFixed(1));
  parts.dot.setAttribute("cy", d[1].toFixed(1));
  const s = M.strokeOf(c);
  const cyc = ((c % 720) + 720) % 720;
  const text = s.name + " · " + fmt(cyc) + "° · " + fmt(M.pressureOf(c), M.pressureOf(c) < 20 ? 1 : 0) + " bar";
  if (text !== lastText) { readout.textContent = text; lastText = text; }
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (running) { angle += speed * dt; target = angle; }
  else angle += (target - angle) * (1 - Math.exp(-dt / 0.12));
  if (!running && Math.abs(target - angle) < 0.02) angle = target;
  draw(angle);
  const settled = !running && angle === target;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const hold = () => { running = false; clearTimeout(idle); idle = setTimeout(() => { if (!still.matches) { running = true; run(); } }, 3600); };
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => {
  const box = svg.getBoundingClientRect();
  const share = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
  const want = share * 720;
  const base = Math.floor(angle / 720) * 720;
  let next = base + want;
  if (next - angle > 360) next -= 720;
  if (angle - next > 360) next += 720;
  target = next; hold(); run();
});
stage.addEventListener("keydown", (event) => {
  let step = 0;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") step = event.shiftKey ? 90 : 10;
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") step = event.shiftKey ? -90 : -10;
  if (event.key === "Home") { target = Math.floor(angle / 720) * 720; hold(); run(); event.preventDefault(); return; }
  if (event.key === " " || event.key === "Enter") { running = !running; if (running) clearTimeout(idle); target = angle; run(); event.preventDefault(); return; }
  if (!step) return;
  event.preventDefault();
  target = (running ? angle : target) + step; hold(); run();
});
stage.addEventListener("focus", () => stage.setAttribute("aria-valuetext", M.strokeOf(angle).name + ", " + Math.round(((angle % 720) + 720) % 720) + " độ"));
draw(angle);
`;
}

const body2 = k.plateHtml({
  fig: "Fig 1",
  title: "F1 · một xi-lanh, bốn kỳ",
  hint: "Rê chuột để quay trục khuỷu",
  readout: `${M.strokeOf(C0).name} · ${C0}° · 3,5 bar`,
  keys: [
    { mark: "lit", label: "Piston và thanh truyền: biến áp suất khí cháy thành mô-men quay" },
    { mark: "raised", label: "Hai trục cam quay bằng nửa tốc độ trục khuỷu, mở van nạp (trái) và van xả (phải)" },
    { mark: "green", label: "Đồ thị áp suất – thể tích (log–log) trên máy đo, chấm sáng là thời điểm hiện tại" },
  ],
  caption: `Mỗi xi-lanh của động cơ V6 1,6 L tăng áp: đường kính 80 mm, hành trình 53 mm, ${fmtCc(M.SWEPT)} cm³, tỉ số nén ${M.CR}:1 (luật 2026). Ở ${M.RPM.toLocaleString("vi-VN")} vòng/phút một chu trình 720° chỉ mất ${(M.ms(720)).toFixed(1).replace(".", ",")} ms; hình chạy chậm khoảng ${Math.round((720 / 6.4) / (M.RPM * 6 / 1000))} lần. Áp suất là mô hình đơn giản (khí nạp ${M.BOOST} bar, đỉnh ≈ ${Math.round(M.PEAK.p)} bar), chiều dài thanh truyền ước lượng. Mặt cắt chỉ thấy một van mỗi bên; thật ra có hai van nạp và hai van xả.`,
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Động cơ F1 một xi-lanh: rê chuột ngang hoặc dùng phím mũi tên để quay trục khuỷu, Space để chạy hoặc dừng" aria-valuemin="0" aria-valuemax="720" aria-valuenow="${C0}">${svg}</div>`,
});
function fmtCc(mm3) {
  return (mm3 / 1000).toFixed(1).replace(".", ",");
}

const out = join(HERE, THEME === "light" ? "f1-engine-light.html" : "f1-engine.html");
writeFileSync(out, k.pageHtml({ title: "Động cơ F1 một xi-lanh", theme: THEME, body: body2, script, width: 920 }).replace("</style>", CSS + "</style>"));
console.log("wrote", out, "tubes", tubes.length);
