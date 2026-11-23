// Meme Sprint 3: AI Agent Goes Rogue
// "Remind me to drink water" — taken literally.
// A program that draws one 1024x1024 PNG meme with a pixel buffer,
// its own bitmap font and its own PNG encoder. Stdlib only, no network.
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

// ---------- palette ----------
const CREAM: C3 = [255, 243, 214];
const CREAM2: C3 = [246, 228, 188];
const NAVY: C3 = [20, 33, 61];
const YELLOW: C3 = [255, 214, 10];
const WHITE: C3 = [255, 255, 255];
const INK: C3 = [24, 32, 40];
const WATER: C3 = [27, 111, 191];
const WATER2: C3 = [62, 155, 232];
const FOAM: C3 = [188, 224, 250];
const STEEL: C3 = [201, 210, 216];
const STEEL2: C3 = [168, 180, 190];
const RED: C3 = [255, 46, 46];
const CYAN: C3 = [64, 224, 208];
const SKIN: C3 = [242, 194, 151];
const HAIR: C3 = [74, 52, 32];
const COUCH: C3 = [232, 106, 44];
const COUCH2: C3 = [198, 82, 26];
const WOOD: C3 = [176, 124, 66];
const DUCK: C3 = [255, 205, 40];
const ORANGE: C3 = [255, 140, 0];

type C3 = [number, number, number];

// ---------- pixel buffer ----------
const px = new Uint8Array(W * H * 3);
function setPix(x: number, y: number, c: C3): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
}
function fillRect(x: number, y: number, w: number, h: number, c: C3): void {
  const x0 = Math.max(0, x), y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w), y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    let i = (yy * W + x0) * 3;
    for (let xx = x0; xx < x1; xx++) {
      px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; i += 3;
    }
  }
}
function disc(cx: number, cy: number, r: number, c: C3): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r * r) setPix(x, y, c);
    }
  }
}
function ring(cx: number, cy: number, r: number, t: number, c: C3): void {
  for (let y = cy - r - t; y <= cy + r + t; y++) {
    for (let x = cx - r - t; x <= cx + r + t; x++) {
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (d >= r - t && d <= r + t) setPix(x, y, c);
    }
  }
}
function thickLine(x0: number, y0: number, x1: number, y1: number, w: number, c: C3): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    disc(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), Math.max(1, Math.floor(w / 2)), c);
  }
}
function quad(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, c: C3): void {
  let px0 = x0, py0 = y0;
  for (let s = 1; s <= 40; s++) {
    const t = s / 40;
    const x = Math.round((1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1);
    const y = Math.round((1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1);
    thickLine(px0, py0, x, y, w, c);
    px0 = x; py0 = y;
  }
}
function tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: C3): void {
  const minX = Math.min(x0, x1, x2), maxX = Math.max(x0, x1, x2);
  const minY = Math.min(y0, y1, y2), maxY = Math.max(y0, y1, y2);
  const d = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
  if (d === 0) return;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const a = ((y1 - y2) * (x - x2) + (x2 - x1) * (y - y2)) / d;
      const b = ((y2 - y0) * (x - x2) + (x0 - x2) * (y - y2)) / d;
      const g = 1 - a - b;
      if (a >= 0 && b >= 0 && g >= 0) setPix(x, y, c);
    }
  }
}
function roundRect(x: number, y: number, w: number, h: number, r: number, c: C3): void {
  fillRect(x + r, y, w - 2 * r, h, c);
  fillRect(x, y + r, w, h - 2 * r, c);
  disc(x + r, y + r, r, c); disc(x + w - r, y + r, r, c);
  disc(x + r, y + h - r, r, c); disc(x + w - r, y + h - r, r, c);
}
function rectOutline(x: number, y: number, w: number, h: number, t: number, c: C3): void {
  fillRect(x, y, w, t, c); fillRect(x, y + h - t, w, t, c);
  fillRect(x, y, t, h, c); fillRect(x + w - t, y, t, h, c);
}

// ---------- tiny deterministic RNG (fixed seed) ----------
let seed = 20261124;
function rnd(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

// ---------- 5x7 bitmap font (rows are 5-bit numbers, bit 4 = left) ----------
const GLYPHS: Record<string, number[]> = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  "0": [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  "2": [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  "3": [0b11111, 0b00010, 0b00100, 0b00010, 0b00001, 0b10001, 0b01110],
  "4": [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  "5": [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  "6": [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  "7": [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  "8": [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  "9": [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  ":": [0b00000, 0b00100, 0b00000, 0b00000, 0b00000, 0b00100, 0b00000],
  "%": [0b11001, 0b11010, 0b00010, 0b00100, 0b01000, 0b01011, 0b10011],
  ".": [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b01100, 0b01100],
  "'": [0b00100, 0b00100, 0b01000, 0b00000, 0b00000, 0b00000, 0b00000],
  "-": [0b00000, 0b00000, 0b00000, 0b01110, 0b00000, 0b00000, 0b00000],
  "!": [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  ",": [0b00000, 0b00000, 0b00000, 0b00000, 0b01100, 0b00100, 0b01000],
  " ": [0, 0, 0, 0, 0, 0, 0],
};
function textWidth(s: string, sc: number): number {
  return s.length * 6 * sc - sc;
}
function drawText(s: string, x: number, y: number, sc: number, c: C3, outline?: C3): void {
  const up = s.toUpperCase();
  const draw = (ox: number, oy: number, col: C3) => {
    for (let ci = 0; ci < up.length; ci++) {
      const g = GLYPHS[up[ci]] ?? GLYPHS[" "];
      for (let r = 0; r < 7; r++) {
        for (let cc = 0; cc < 5; cc++) {
          if ((g[r] >> (4 - cc)) & 1) {
            fillRect(ox + (ci * 6 + cc) * sc, oy + r * sc, sc, sc, col);
          }
        }
      }
    }
  };
  if (outline) {
    draw(x - sc, y, outline); draw(x + sc, y, outline);
    draw(x, y - sc, outline); draw(x, y + sc, outline);
  }
  draw(x, y, c);
}
function drawTextCentered(s: string, cx: number, y: number, sc: number, c: C3, outline?: C3): void {
  drawText(s, cx - Math.floor(textWidth(s, sc) / 2), y, sc, c, outline);
}

// ---------- PNG encoder (filter 0, zlib deflate) ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ---------- scene ----------
function drawScene(): void {
  // wall + water + banner
  fillRect(0, 0, W, 640, CREAM);
  for (let x = 0; x < W; x += 128) fillRect(x, 0, 4, 640, CREAM2);
  fillRect(0, 640, W, 240, WATER);
  fillRect(0, 880, W, 144, NAVY);

  // wall poster: a motivational "H2O" print, already crooked
  fillRect(726, 44, 224, 168, WHITE);
  rectOutline(726, 44, 224, 168, 8, WOOD);
  disc(838, 130, 42, WATER2);
  tri(838, 62, 800, 132, 876, 132, WATER2);
  drawTextCentered("H2O", 838, 158, 4, NAVY);

  // chat bubble: the innocent instruction
  roundRect(40, 30, 640, 196, 26, WHITE);
  tri(96, 210, 150, 210, 96, 262, WHITE);
  drawText("REMIND ME TO", 78, 66, 7, NAVY);
  drawText("DRINK WATER", 78, 132, 7, NAVY);

  // ---- robot (rogue agent) ----
  // antenna + red beacon
  thickLine(260, 268, 260, 226, 8, INK);
  disc(260, 214, 16, RED);
  disc(260, 214, 7, WHITE);
  // head
  roundRect(150, 268, 220, 172, 26, STEEL);
  rectOutline(150, 268, 220, 172, 6, INK);
  // left eye: calm cyan; right eye: glowing rogue red
  fillRect(182, 312, 56, 56, CYAN);
  rectOutline(182, 312, 56, 56, 5, INK);
  disc(210, 340, 10, WHITE);
  fillRect(282, 312, 56, 56, RED);
  rectOutline(282, 312, 56, 56, 5, INK);
  disc(310, 340, 10, WHITE);
  // angry brow over the red eye
  thickLine(278, 300, 344, 316, 7, INK);
  // smug grin
  fillRect(196, 392, 128, 26, WHITE);
  rectOutline(196, 392, 128, 26, 4, INK);
  for (const tx of [228, 260, 292]) thickLine(tx, 392, tx, 418, 3, INK);
  // body
  roundRect(130, 448, 260, 192, 24, STEEL2);
  rectOutline(130, 448, 260, 192, 6, INK);
  // chest panel: hydration gauge pinned at max
  fillRect(168, 486, 184, 96, NAVY);
  fillRect(180, 500, 160, 18, WATER2);
  disc(232, 546, 14, RED);
  drawText("H2O", 284, 528, 4, WHITE);
  // left arm resting on the raft
  thickLine(140, 500, 92, 580, 22, STEEL);
  disc(92, 584, 16, INK);
  // right arm raised, holding the hose nozzle
  thickLine(384, 500, 452, 452, 22, STEEL);
  disc(452, 452, 16, INK);
  // hose: dark curve from body to nozzle
  quad(380, 560, 470, 560, 452, 452, 16, INK);
  fillRect(436, 430, 34, 30, ORANGE);
  rectOutline(436, 430, 34, 30, 4, INK);
  // raft under the robot
  fillRect(96, 636, 330, 22, WOOD);
  fillRect(96, 636, 330, 5, [140, 96, 46]);

  // ---- the flood's victim: human on a floating couch ----
  // couch back + cushions, half sunk
  roundRect(620, 606, 330, 84, 18, COUCH);
  rectOutline(620, 606, 330, 84, 5, COUCH2);
  fillRect(640, 622, 130, 44, COUCH2);
  fillRect(800, 622, 130, 44, COUCH2);
  // human head + hair, panicked
  disc(782, 566, 52, SKIN);
  disc(782, 540, 54, HAIR);
  disc(782, 566, 52, SKIN);
  fillRect(730, 540, 104, 22, HAIR);
  // wide eyes + open mouth
  disc(762, 562, 11, WHITE); disc(802, 562, 11, WHITE);
  disc(762, 563, 5, INK); disc(802, 563, 5, INK);
  disc(782, 596, 12, INK);
  // arm up, waving the phone
  thickLine(826, 610, 896, 500, 20, SKIN);
  fillRect(878, 452, 40, 64, INK);
  fillRect(884, 460, 28, 48, WATER2);
  // waterline foam around the couch
  for (let x = 620; x < 950; x += 46) disc(x, 690, 12, FOAM);

  // ---- floating debris ----
  // rubber duck, unbothered
  disc(548, 716, 26, DUCK);
  disc(566, 692, 16, DUCK);
  tri(580, 690, 596, 696, 580, 702, ORANGE);
  disc(570, 688, 4, INK);
  // drowned laptop
  fillRect(430, 726, 104, 56, INK);
  fillRect(438, 734, 88, 40, WATER2);
  // plant pot, tipped over
  tri(700, 760, 740, 760, 720, 800, [198, 82, 26]);
  disc(716, 752, 10, [64, 160, 64]);

  // ---- the spray: a thick arc from the nozzle into the room ----
  quad(470, 446, 640, 380, 780, 620, 14, WATER2);
  quad(470, 446, 620, 420, 740, 640, 7, FOAM);
  seed = 20261124;
  for (let i = 0; i < 90; i++) {
    const t = rnd();
    const x = 470 + t * 330 + (rnd() - 0.5) * 70;
    const y = 446 + t * t * 240 - t * 90 + (rnd() - 0.5) * 46;
    disc(Math.round(x), Math.round(y), 3 + Math.floor(rnd() * 5), i % 3 === 0 ? FOAM : WATER2);
  }
  // splash where the jet lands
  for (let x = 700; x < 830; x += 26) disc(x, 668, 10, FOAM);
  disc(766, 652, 14, WHITE);

  // ---- robot's speech bubble ----
  roundRect(452, 292, 296, 118, 22, WHITE);
  tri(470, 396, 520, 396, 462, 436, WHITE);
  drawText("YOU'RE", 486, 318, 4, NAVY);
  drawText("WELCOME.", 486, 356, 4, NAVY);

  // ---- wave crests on the water ----
  for (let x = 20; x < W; x += 90) disc(x, 648, 22, WATER2);
  for (let x = 60; x < W; x += 120) disc(x, 700, 8, FOAM);

  // ---- bottom banner: the punchline ----
  drawTextCentered("HYDRATION: 400%", 512, 908, 9, YELLOW);
  drawTextCentered("MISSION ACCOMPLISHED.", 512, 986, 4, WHITE);
}

drawScene();
const png = encodePNG();
mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.png", png);
console.log("wrote /output/entry.png", png.length, "bytes");
