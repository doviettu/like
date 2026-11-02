/* =====================================================================
   Worker nhận ủng hộ cho "Lên Chùa Cầu An" — chạy trên Cloudflare Workers (gói miễn phí)
   - POST /create          : tạo link/QR thanh toán payOS cho một khoản ủng hộ
   - GET  /status/:order   : game hỏi trạng thái (PAID / PENDING / CANCELLED / EXPIRED)
   - POST /payos-webhook   : payOS báo đã nhận tiền (kiểm chữ ký HMAC-SHA256)
   - GET  /honor           : bảng công đức chung — tên ghi danh + gói (đã lọc từ thô tục)
   - GET|POST /visit       : đếm số người vào chùa hôm nay (POST = cộng 1)
   Bí mật (đặt bằng `wrangler secret put`): PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY
   Biến thường (wrangler.toml): GAME_URL, ALLOW_ORIGIN
   KV binding: DB
   ===================================================================== */
const PAYOS = 'https://api-merchant.payos.vn';
// Gói phát tâm (khớp TIERS trong index.html): ngưỡng số tiền → id gói
const TIER_MIN = [[5, 500000], [4, 200000], [3, 100000], [2, 50000], [1, 20000]];
export const tierOf = a => { for (const [id, min] of TIER_MIN) if (a >= min) return id; return 0; };
const BAD = ['địt', 'đụ', 'lồn', 'cặc', 'buồi', 'đéo', 'đĩ', 'đm', 'dm', 'đmm', 'dmm', 'vcl', 'vkl', 'cl', 'cc', 'fuck', 'shit', 'cứt', 'ngu'];

const enc = new TextEncoder();
async function hmacHex(key, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}
// Chuỗi ký của payOS: sắp xếp khoá theo bảng chữ cái, nối key=value bằng &
export function payosQuery(data) {
  const sortObj = o => Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
  const d = sortObj(data);
  return Object.keys(d).filter(k => d[k] !== undefined).map(k => {
    let v = d[k];
    if (v && Array.isArray(v)) v = JSON.stringify(v.map(sortObj));
    if ([null, undefined, 'undefined', 'null'].includes(v)) v = '';
    return `${k}=${v}`;
  }).join('&');
}
export const signCreate = (key, { amount, cancelUrl, description, orderCode, returnUrl }) =>
  hmacHex(key, `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`);
export const verifyWebhook = async (key, body) => !!(body && body.data && body.signature) && (await hmacHex(key, payosQuery(body.data))) === body.signature;

function cleanName(s) {
  s = String(s || '').normalize('NFC').replace(/[<>&"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
  const t = ' ' + s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ') + ' ';
  return BAD.some(w => t.includes(' ' + w + ' ')) ? '' : s;
}
const today = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); // giờ Việt Nam

export default {
  async fetch(req, env) {
    const url = new URL(req.url), path = url.pathname.replace(/\/+$/, '');
    const cors = { 'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      // --- tạo khoản ủng hộ ---
      if (path === '/create' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        const amount = Math.round(Number(b.amount));
        if (!(amount >= 10000 && amount <= 50000000)) return json({ error: 'amount' }, 400);
        const orderCode = Date.now() * 100 + Math.floor(Math.random() * 100);
        const description = `BDTAM${String(orderCode).slice(-4)}`; // "Bồ đề tâm", ≤ 9 ký tự để hợp mọi ngân hàng
        const returnUrl = env.GAME_URL, cancelUrl = env.GAME_URL;
        const signature = await signCreate(env.PAYOS_CHECKSUM_KEY, { amount, cancelUrl, description, orderCode, returnUrl });
        const r = await fetch(`${PAYOS}/v2/payment-requests`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-client-id': env.PAYOS_CLIENT_ID, 'x-api-key': env.PAYOS_API_KEY },
          body: JSON.stringify({ orderCode, amount, description, returnUrl, cancelUrl, signature, expiredAt: Math.floor(Date.now() / 1000) + 15 * 60 })
        });
        const j = await r.json();
        if (j.code !== '00' || !j.data) return json({ error: j.desc || 'payos' }, 502);
        await env.DB.put(`o:${orderCode}`, JSON.stringify({ status: 'PENDING', amount, name: cleanName(b.name), at: Date.now() }), { expirationTtl: 86400 * 3 });
        return json({ orderCode, checkoutUrl: j.data.checkoutUrl, qrCode: j.data.qrCode });
      }
      // --- trạng thái: ưu tiên KV (webhook đã ghi), không có thì hỏi thẳng payOS ---
      const m = path.match(/^\/status\/(\d{1,16})$/);
      if (m && req.method === 'GET') {
        const rec = JSON.parse(await env.DB.get(`o:${m[1]}`) || 'null');
        if (!rec) return json({ status: 'UNKNOWN' }, 404);
        if (rec.status === 'PAID') return json({ status: 'PAID' });
        const r = await fetch(`${PAYOS}/v2/payment-requests/${m[1]}`, { headers: { 'x-client-id': env.PAYOS_CLIENT_ID, 'x-api-key': env.PAYOS_API_KEY } });
        const j = await r.json().catch(() => ({}));
        const st = j.data && j.data.status || rec.status;
        if (st === 'PAID') await markPaid(env, m[1], rec, Number(j.data && (j.data.amountPaid || j.data.amount)) || 0);
        return json({ status: st });
      }
      // --- webhook payOS ---
      if (path === '/payos-webhook' && req.method === 'POST') {
        const body = await req.json().catch(() => null);
        if (!(await verifyWebhook(env.PAYOS_CHECKSUM_KEY, body))) return json({ success: false }, 400);
        if (body.code === '00' && body.data && body.data.orderCode) {
          const key = String(body.data.orderCode), rec = JSON.parse(await env.DB.get(`o:${key}`) || 'null');
          if (rec && rec.status !== 'PAID' && Number(body.data.amount) >= rec.amount) await markPaid(env, key, rec, Number(body.data.amount));
        }
        return json({ success: true }); // luôn 200 để payOS không gửi lại mãi (kể cả bản tin thử)
      }
      if (path === '/honor' && req.method === 'GET') return json({ list: JSON.parse(await env.DB.get('honor') || '[]') });
      if (path === '/visit') {
        const k = `v:${today()}`; let n = Number(await env.DB.get(k) || 0);
        if (req.method === 'POST') { n++; await env.DB.put(k, String(n), { expirationTtl: 86400 * 3 }); }
        return json({ count: n });
      }
      return json({ error: 'not found' }, 404);
    } catch (e) { return json({ error: 'server' }, 500); }
  }
};
// Ghi danh theo số tiền THỰC NHẬN (từ payOS), không theo số trình duyệt gửi lên
async function markPaid(env, key, rec, paid) {
  const amount = Math.max(rec.amount, paid || 0);
  await env.DB.put(`o:${key}`, JSON.stringify({ ...rec, status: 'PAID', amount }), { expirationTtl: 86400 * 3 });
  const list = JSON.parse(await env.DB.get('honor') || '[]');
  list.unshift({ n: rec.name || 'Phật tử ẩn danh', t: tierOf(amount), at: Date.now() });
  await env.DB.put('honor', JSON.stringify(list.slice(0, 200)));
}
