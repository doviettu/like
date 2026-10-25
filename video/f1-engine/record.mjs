// Xuất hình tương tác động cơ F1 thành MP4: vẽ từng khung bằng trình duyệt không giao diện rồi ghép bằng ffmpeg.
// node record.mjs [light|dark] [số chu trình] [giây mỗi chu trình]
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv[2] ?? "light";
const cycles = Number(process.argv[3] ?? 2);
const perCycle = Number(process.argv[4] ?? 6.4);
const FPS = 30;
const page_ = join(HERE, "../../figures/f1-engine", theme === "light" ? "f1-engine-light.html" : "f1-engine.html");
const out = join(HERE, `f1-engine-${theme}.mp4`);

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1000, height: 1100 }, deviceScaleFactor: 2 });
await page.goto(`file://${page_}#c=0`);
await page.waitForFunction(() => window.__f1);
const plate = page.locator(".iso-plate");
const box = await plate.boundingBox();
const W = Math.round(box.width * 2) & ~1;
const H = Math.round(box.height * 2) & ~1;
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-vf", `crop=${W}:${H}:0:0,scale=1440:-2`, "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
const total = Math.round(cycles * perCycle * FPS);
for (let i = 0; i < total; i++) {
  const t = i / FPS;
  const c = (t / perCycle) * 720;
  await page.evaluate(([c, t]) => window.__f1.frame(c, t), [c, t]);
  const png = await plate.screenshot({ type: "png" });
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
  if (i % 60 === 0) process.stdout.write(`${i}/${total}\n`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
await browser.close();
console.log("wrote", out);
