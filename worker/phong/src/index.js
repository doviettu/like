/* =====================================================================
   Máy chủ "phòng chùa" cho Lên Chùa Cầu An — Cloudflare Workers + Durable Objects
   - Mỗi phòng (/room/<tên>) là một Durable Object, tối đa MAX người
   - WebSocket Hibernation: phòng vắng thì ngủ, không tốn tiền
   - An toàn theo mô hình Sky/Journey: KHÔNG có chat tự do — chỉ vị trí, cử chỉ,
     câu soạn sẵn (gửi số thứ tự), tặng hoa sen; tên chỉ lộ khi HAI người cùng tặng nhau
   - Không lưu gì xuống ổ đĩa: rời phòng là hết
   ===================================================================== */
const MAX = 30, PHRASES = 6, MAX_LIST = 40;
const BAD = ['địt', 'đụ', 'đù', 'lồn', 'cặc', 'buồi', 'đéo', 'đĩ', 'đm', 'dm', 'đmm', 'dmm', 'vcl', 'vkl', 'cl', 'cc', 'clgt', 'fuck', 'shit', 'bitch', 'cứt', 'ngu'];
const STYLES = ['lam', 'trang', 'aodai', 'nau'], HAIRS = ['bui', 'ngan', 'dai', 'tet', 'cao'], AGES = ['tre', 'lon', 'gia'], ACCS = ['none', 'non', 'chuoi', 'tui'], FACES = ['hien', 'tuoi', 'an'], ROSES = ['do', 'trang'];
const EMOTES = ['chap', 'cui', 'vay', 'thien'];

export function cleanName(s) {
  s = String(s || '').normalize('NFC').replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
  const t = ' ' + s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ') + ' ';
  return BAD.some(w => t.includes(' ' + w + ' ')) ? '' : s;
}
const hex = v => /^#[0-9a-fA-F]{6}$/.test(v) ? v : null;
const oneOf = (v, list, d) => list.includes(v) ? v : d;
export function cleanLook(l = {}) {
  return { style: oneOf(l.style, STYLES, 'lam'), color: hex(l.color) || '#7f9fba', hair: oneOf(l.hair, HAIRS, 'bui'), hairColor: hex(l.hairColor) || '#1d1512', skin: hex(l.skin) || '#f3cba5',
    age: oneOf(l.age, AGES, 'lon'), acc: oneOf(l.acc, ACCS, 'none'), face: oneOf(l.face, FACES, 'hien'), rose: oneOf(l.rose, ROSES, null), aura: Math.max(1, Math.min(10, Math.floor(Number(l.aura)) || 1)) };
}
const num = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
const r2 = v => Math.round(v * 100) / 100;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/') return new Response('Lên Chùa Cầu An — máy chủ phòng chùa đang chạy 🙏', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    const m = url.pathname.match(/^\/room\/([a-z0-9-]{1,32})$/);
    if (!m) return new Response('không có', { status: 404 });
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('cần WebSocket', { status: 426 });
    const allow = (env.ALLOW_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (allow.length && !allow.includes(req.headers.get('Origin') || '')) return new Response('nguồn không được phép', { status: 403 });
    return env.ROOM.get(env.ROOM.idFromName(m[1])).fetch(req);
  }
};

export class Room {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }
  async fetch() {
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    if (this.joined().length >= MAX) { server.send(JSON.stringify({ t: 'full' })); server.close(4001, 'full'); return new Response(null, { status: 101, webSocket: client }); }
    server.serializeAttachment({ id: crypto.randomUUID().slice(0, 8), name: '', look: null, x: 0, z: 33, yaw: 3.14, a: 0, gifts: [], bonds: [], reports: [], joined: false, rt: 0, rn: 0 });
    return new Response(null, { status: 101, webSocket: client });
  }
  info(ws) { try { return ws.deserializeAttachment(); } catch { return null; } }
  joined() { return this.ctx.getWebSockets().map(w => [w, this.info(w)]).filter(([, p]) => p && p.joined); }
  send(ws, o) { try { ws.send(JSON.stringify(o)); } catch { } }
  bcast(from, o) { const s = JSON.stringify(o); for (const [w] of this.joined()) if (w !== from) { try { w.send(s); } catch { } } }
  find(id) { const r = this.joined().find(([, p]) => p.id === id); return r ? r[0] : null; }
  async webSocketMessage(ws, raw) {
    if (typeof raw !== 'string' || raw.length > 800) return;
    const me = this.info(ws); if (!me) return;
    const now = Date.now(); if (now - me.rt > 1000) { me.rt = now; me.rn = 0; } me.rn++; ws.serializeAttachment(me); if (me.rn > 20) return; // chống spam: tối đa 20 tin/giây
    let m; try { m = JSON.parse(raw); } catch { return; }
    switch (m.t) {
      case 'hi': {
        Object.assign(me, { name: cleanName(m.name), look: cleanLook(m.look), x: r2(num(m.x, -25, 25)), z: r2(num(m.z, -36, 40)), yaw: r2(num(m.yaw, -7, 7)), joined: true });
        ws.serializeAttachment(me);
        const peers = this.joined().filter(([w]) => w !== ws).map(([, p]) => ({ id: p.id, look: p.look, x: p.x, z: p.z, yaw: p.yaw, a: p.a, name: p.bonds.includes(me.id) ? p.name : '' }));
        this.send(ws, { t: 'welcome', id: me.id, peers });
        this.bcast(ws, { t: 'join', id: me.id, look: me.look, x: me.x, z: me.z, yaw: me.yaw, a: me.a });
        return;
      }
      case 'look': if (!me.joined) return; me.look = cleanLook(m.look); ws.serializeAttachment(me); this.bcast(ws, { t: 'look', id: me.id, look: me.look }); return;
      case 'p': if (!me.joined) return;
        me.x = r2(num(m.x, -25, 25)); me.z = r2(num(m.z, -36, 40)); me.yaw = r2(num(m.yaw, -7, 7)); me.a = num(m.a, 0, 9) | 0; ws.serializeAttachment(me);
        this.bcast(ws, { t: 'p', id: me.id, x: me.x, z: me.z, yaw: me.yaw, a: me.a }); return;
      case 'e': if (me.joined && EMOTES.includes(m.e)) this.bcast(ws, { t: 'e', id: me.id, e: m.e }); return;
      case 'say': if (me.joined) this.bcast(ws, { t: 'say', id: me.id, k: num(m.k, 0, PHRASES - 1) | 0 }); return;
      case 'gift': { // tặng hoa sen; hai người cùng tặng nhau thì "kết duyên" và thấy tên nhau
        const tw = this.find(m.to); if (!tw || tw === ws) return; const t = this.info(tw);
        if (!me.gifts.includes(t.id)) me.gifts = [...me.gifts, t.id].slice(-MAX_LIST);
        if (t.gifts.includes(me.id)) {
          if (!me.bonds.includes(t.id)) me.bonds = [...me.bonds, t.id].slice(-MAX_LIST);
          if (!t.bonds.includes(me.id)) t.bonds = [...t.bonds, me.id].slice(-MAX_LIST);
          tw.serializeAttachment(t); ws.serializeAttachment(me);
          this.send(ws, { t: 'bond', id: t.id, name: t.name }); this.send(tw, { t: 'bond', id: me.id, name: me.name });
        } else { ws.serializeAttachment(me); this.send(tw, { t: 'gift', from: me.id }); }
        return;
      }
      case 'report': { // 3 người khác nhau báo cáo thì mời rời phòng
        const tw = this.find(m.id); if (!tw || tw === ws) return; const t = this.info(tw);
        if (!t.reports.includes(me.id)) t.reports = [...t.reports, me.id].slice(-MAX_LIST);
        tw.serializeAttachment(t);
        if (t.reports.length >= 3) { this.send(tw, { t: 'kicked' }); try { tw.close(4003, 'reported'); } catch { } this.bcast(tw, { t: 'leave', id: t.id }); }
        return;
      }
    }
  }
  async webSocketClose(ws, code) { const me = this.info(ws); if (me && me.joined) this.bcast(ws, { t: 'leave', id: me.id }); try { ws.close(code === 1005 ? 1000 : code, 'bye'); } catch { } }
  async webSocketError(ws) { const me = this.info(ws); if (me && me.joined) this.bcast(ws, { t: 'leave', id: me.id }); }
}
