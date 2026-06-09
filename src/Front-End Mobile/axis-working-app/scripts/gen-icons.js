/**
 * Gera os ícones do app (PNG) sem dependências externas.
 * Fundo navy (#0A2A44) + monograma "AW" em traço claro, estilo do logo do login.
 *
 *   node scripts/gen-icons.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const NAVY  = [10, 42, 68, 255];   // #0A2A44
const LIGHT = [235, 241, 246, 255]; // #EBF1F6

// ── PNG encoder (RGBA, 8-bit) ────────────────────────────────
function crc32(buf) {
  return zlib.crc32(buf) >>> 0;
}
function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  // 10,11,12 = compression, filter, interlace = 0
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ── Geometria: distância de ponto a segmento ─────────────────
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// Monograma "AW" centralizado. Retorna lista de segmentos [ax,ay,bx,by].
function monogramSegments(S, scale) {
  const lh = S * 0.42 * scale;
  const lw = S * 0.30 * scale;
  const gap = S * 0.05 * scale;
  const total = lw * 2 + gap;
  const x0 = (S - total) / 2;
  const x1 = x0 + lw + gap;
  const top = (S - lh) / 2;
  const bottom = top + lh;
  const segs = [];

  // A
  const apex = [x0 + lw / 2, top];
  const bl = [x0, bottom];
  const br = [x0 + lw, bottom];
  segs.push([...apex, ...bl]);
  segs.push([...apex, ...br]);
  const f = 0.62; // posição da barra transversal
  const lxL = apex[0] + (bl[0] - apex[0]) * f;
  const lxR = apex[0] + (br[0] - apex[0]) * f;
  const yBar = top + lh * f;
  segs.push([lxL, yBar, lxR, yBar]);

  // W
  const TL = [x1, top];
  const TR = [x1 + lw, top];
  const B1 = [x1 + lw * 0.28, bottom];
  const B2 = [x1 + lw * 0.72, bottom];
  const Mtop = [x1 + lw / 2, top + lh * 0.18];
  segs.push([...TL, ...B1]);
  segs.push([...B1, ...Mtop]);
  segs.push([...Mtop, ...B2]);
  segs.push([...B2, ...TR]);

  return { segs, thickness: S * 0.052 * scale };
}

function render(S, { background, scale = 1 }) {
  const rgba = Buffer.alloc(S * S * 4);
  // fundo
  for (let i = 0; i < S * S; i++) {
    const o = i * 4;
    if (background) {
      rgba[o] = background[0]; rgba[o + 1] = background[1]; rgba[o + 2] = background[2]; rgba[o + 3] = background[3];
    } else {
      rgba[o + 3] = 0; // transparente
    }
  }
  const { segs, thickness } = monogramSegments(S, scale);
  const r = thickness / 2;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let dmin = Infinity;
      for (const s of segs) {
        const d = distSeg(x + 0.5, y + 0.5, s[0], s[1], s[2], s[3]);
        if (d < dmin) dmin = d;
      }
      // antialiasing de 1px
      const a = Math.max(0, Math.min(1, r + 0.5 - dmin));
      if (a > 0) {
        const o = (y * S + x) * 4;
        for (let c = 0; c < 3; c++) {
          rgba[o + c] = Math.round(LIGHT[c] * a + rgba[o + c] * (1 - a));
        }
        rgba[o + 3] = Math.max(rgba[o + 3], Math.round(255 * a));
      }
    }
  }
  return encodePng(S, S, rgba);
}

const dir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(dir, { recursive: true });

// Ícone principal (navy de fundo)
fs.writeFileSync(path.join(dir, 'icon.png'), render(1024, { background: NAVY, scale: 1 }));
// Splash (navy de fundo, monograma menor)
fs.writeFileSync(path.join(dir, 'splash.png'), render(1024, { background: NAVY, scale: 0.8 }));
// Adaptive (Android): fundo transparente, monograma dentro da safe zone
fs.writeFileSync(path.join(dir, 'adaptive-icon.png'), render(1024, { background: null, scale: 0.62 }));
// Favicon (web)
fs.writeFileSync(path.join(dir, 'favicon.png'), render(64, { background: NAVY, scale: 1 }));

console.log('Ícones gerados em assets/:', fs.readdirSync(dir).join(', '));
