/*
 * gen-assets.js - dependency-free PNG placeholder generator.
 *
 * Generates clean gradient backgrounds + simple character/icon silhouettes
 * into /assets/images so the game is fully demoable before real art exists.
 *
 * Run:  node scripts/gen-assets.js
 *
 * These are PLACEHOLDERS. To use real art, just drop a PNG with the same
 * filename into /assets/images - no code changes needed (see README).
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'assets', 'images');
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// Tiny RGBA canvas + PNG encoder
// ---------------------------------------------------------------------------
function Canvas(w, h) {
  this.w = w;
  this.h = h;
  this.data = new Uint8Array(w * h * 4); // RGBA, all zero (transparent)
}
Canvas.prototype.idx = function (x, y) { return (y * this.w + x) * 4; };
Canvas.prototype.set = function (x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
  const i = this.idx(x, y);
  const sa = a / 255;
  const da = this.data[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa === 0) return;
  this.data[i]     = Math.round((r * sa + this.data[i]     * da * (1 - sa)) / oa);
  this.data[i + 1] = Math.round((g * sa + this.data[i + 1] * da * (1 - sa)) / oa);
  this.data[i + 2] = Math.round((b * sa + this.data[i + 2] * da * (1 - sa)) / oa);
  this.data[i + 3] = Math.round(oa * 255);
};

function hex(c) {
  c = c.replace('#', '');
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
}
function lerp(a, b, t) { return a + (b - a) * t; }
function mix(c1, c2, t) {
  return [Math.round(lerp(c1[0], c2[0], t)), Math.round(lerp(c1[1], c2[1], t)), Math.round(lerp(c1[2], c2[2], t))];
}

// Diagonal gradient fill (matches the CSS 135deg gradients used in the game)
function gradient(cv, from, to) {
  const a = hex(from), b = hex(to);
  for (let y = 0; y < cv.h; y++) {
    for (let x = 0; x < cv.w; x++) {
      const t = (x / cv.w + y / cv.h) / 2;
      const c = mix(a, b, t);
      cv.set(x, y, c[0], c[1], c[2], 255);
    }
  }
}

// Soft-edged filled circle (anti-aliased)
function circle(cv, cx, cy, r, color, alpha) {
  const c = hex(color);
  const a0 = alpha == null ? 255 : alpha;
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) {
    for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const edge = r - d;
      if (edge > -1.5) {
        const a = Math.max(0, Math.min(1, edge + 0.5)) * (a0 / 255);
        cv.set(x, y, c[0], c[1], c[2], Math.round(a * 255));
      }
    }
  }
}

// Rounded-rect fill
function roundRect(cv, x0, y0, w, h, rad, color, alpha) {
  const c = hex(color);
  const a0 = alpha == null ? 255 : alpha;
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      let inside = true;
      const corners = [[x0 + rad, y0 + rad], [x0 + w - rad, y0 + rad], [x0 + rad, y0 + h - rad], [x0 + w - rad, y0 + h - rad]];
      if (x < x0 + rad && y < y0 + rad) inside = Math.hypot(x - corners[0][0], y - corners[0][1]) <= rad;
      else if (x > x0 + w - rad && y < y0 + rad) inside = Math.hypot(x - corners[1][0], y - corners[1][1]) <= rad;
      else if (x < x0 + rad && y > y0 + h - rad) inside = Math.hypot(x - corners[2][0], y - corners[2][1]) <= rad;
      else if (x > x0 + w - rad && y > y0 + h - rad) inside = Math.hypot(x - corners[3][0], y - corners[3][1]) <= rad;
      if (inside) cv.set(x, y, c[0], c[1], c[2], a0);
    }
  }
}

// Encode canvas → PNG buffer
function encodePNG(cv) {
  const raw = Buffer.alloc((cv.w * 4 + 1) * cv.h);
  let p = 0;
  for (let y = 0; y < cv.h; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < cv.w; x++) {
      const i = cv.idx(x, y);
      raw[p++] = cv.data[i];
      raw[p++] = cv.data[i + 1];
      raw[p++] = cv.data[i + 2];
      raw[p++] = cv.data[i + 3];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0, 0);
    return Buffer.concat([len, body, crc]);
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(cv.w, 0);
  ihdr.writeUInt32BE(cv.h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

function save(name, cv) {
  fs.writeFileSync(path.join(OUT, name), encodePNG(cv));
  console.log('  ✓', name);
}

// ---------------------------------------------------------------------------
// Asset definitions
// ---------------------------------------------------------------------------
console.log('Generating placeholder art →', OUT);

// Backgrounds - colors mirror each scenario's CSS gradient
const BGS = {
  'bg-title.png':      ['#2D4A3E', '#1A2E26'],
  'bg-final.png':      ['#2D4A3E', '#1A2E26'],
  'bg-scenario-1.png': ['#1D9E75', '#0F6E56'],
  'bg-scenario-2.png': ['#378ADD', '#185FA5'],
  'bg-scenario-3.png': ['#D4537E', '#993556'],
  'bg-scenario-4.png': ['#EF9F27', '#BA7517'],
  'bg-scenario-5.png': ['#7F77DD', '#534AB7'],
  'bg-scenario-6.png': ['#1D9E75', '#0F6E56'],
};
for (const [name, cols] of Object.entries(BGS)) {
  const cv = new Canvas(1200, 800);
  gradient(cv, cols[0], cols[1]);
  // soft decorative light blobs for depth
  circle(cv, 950, 180, 220, '#ffffff', 22);
  circle(cv, 250, 650, 300, '#000000', 18);
  save(name, cv);
}

// Character silhouettes (transparent background, soft rounded "blob" figures)
function character(bodyColor, headColor, opts = {}) {
  const cv = new Canvas(400, 400);
  // soft ground shadow
  circle(cv, 200, 350, 90, '#000000', 30);
  // body
  roundRect(cv, 120, 190, 160, 170, 70, bodyColor, 255);
  // head
  circle(cv, 200, 150, 78, headColor, 255);
  // cheeks
  circle(cv, 168, 165, 12, '#ffffff', 60);
  circle(cv, 232, 165, 12, '#ffffff', 60);
  // eyes
  circle(cv, 178, 145, 9, '#2b2b2b', 235);
  circle(cv, 222, 145, 9, '#2b2b2b', 235);
  if (opts.halo) {
    // angel halo ring
    circle(cv, 200, 70, 52, '#FCE38A', 255);
    circle(cv, 200, 70, 40, '#FCE38A', 0); // punch a hole → ring look via redraw below
  }
  return cv;
}

// Angel - cream body, gold halo
(() => {
  const cv = new Canvas(400, 400);
  circle(cv, 200, 350, 90, '#000000', 25);
  // halo (drawn as ring: outer gold, inner transparent by drawing outer then bg-colored inner is tricky
  // on transparent - instead draw a thin ring by two circles with the inner matching nothing)
  for (let a = 0; a < 360; a += 2) {
    const rad = 46;
    const x = 200 + Math.cos(a * Math.PI / 180) * rad;
    const y = 70 + Math.sin(a * Math.PI / 180) * rad * 0.55;
    circle(cv, x, y, 7, '#FCE38A', 255);
  }
  roundRect(cv, 118, 175, 164, 180, 78, '#FFF7E8', 255);
  circle(cv, 200, 150, 80, '#FFF1D6', 255);
  circle(cv, 176, 150, 10, '#2b2b2b', 235);
  circle(cv, 224, 150, 10, '#2b2b2b', 235);
  circle(cv, 168, 172, 13, '#F6B9A8', 120);
  circle(cv, 232, 172, 13, '#F6B9A8', 120);
  // little smile
  for (let x = 185; x <= 215; x++) circle(cv, x, 180 + Math.sin((x - 185) / 30 * Math.PI) * 6, 2.5, '#2b2b2b', 210);
  save('angel.png', cv);
})();

save('milo.png',  character('#1D9E75', '#F6C9A0'));
save('priya.png', character('#D4537E', '#E9B48C'));
save('jai.png',   character('#185FA5', '#F0C39A'));
save('sam.png',   character('#BA7517', '#EAC29B'));

// App logo (rounded gold badge with halo)
(() => {
  const cv = new Canvas(300, 300);
  roundRect(cv, 30, 30, 240, 240, 60, '#1D9E75', 255);
  for (let a = 0; a < 360; a += 3) {
    const x = 150 + Math.cos(a * Math.PI / 180) * 60;
    const y = 110 + Math.sin(a * Math.PI / 180) * 32;
    circle(cv, x, y, 6, '#FCE38A', 255);
  }
  circle(cv, 150, 165, 62, '#FFF7E8', 255);
  circle(cv, 132, 160, 8, '#2b2b2b', 235);
  circle(cv, 168, 160, 8, '#2b2b2b', 235);
  save('logo.png', cv);
})();

// Simple icon tiles (rounded square + drawn glyph) - decorative placeholders
function iconTile(color) {
  const cv = new Canvas(128, 128);
  roundRect(cv, 8, 8, 112, 112, 30, color, 255);
  return cv;
}
function drawHeart(cv, color) {
  const c = hex(color);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const px = (x - 64) / 42, py = (y - 58) / 42;
    const v = Math.pow(px * px + py * py - 1, 3) - px * px * py * py * py;
    if (v < 0) cv.set(x, y, c[0], c[1], c[2], 255);
  }
}
function drawStar(cv, color) {
  const c = hex(color);
  const cx = 64, cy = 66, R = 46, r = 19, pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + i * Math.PI / 5;
    const rad = i % 2 === 0 ? R : r;
    pts.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]);
  }
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    if (inside) cv.set(x, y, c[0], c[1], c[2], 255);
  }
}

let t;
t = iconTile('#FBEAF0'); drawHeart(t, '#D4537E'); save('icon-heart.png', t);
t = iconTile('#FAEEDA'); drawStar(t, '#BA7517');  save('icon-star.png', t);
t = iconTile('#E6F1FB'); drawHeart(t, '#185FA5'); save('icon-honesty.png', t);
t = iconTile('#E1F5EE'); drawStar(t, '#0F6E56');  save('icon-courage.png', t);
t = iconTile('#EEEDFE'); drawStar(t, '#534AB7');  save('icon-respect.png', t);
t = iconTile('#F1EFE8'); drawHeart(t, '#5F5E5A'); save('icon-reflection.png', t);

console.log('Done.');
