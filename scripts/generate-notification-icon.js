// scripts/generate-notification-icon.js
// Generates assets/images/notification-icon.png — a 96×96 white coffee-cup
// silhouette on a transparent background, used as the Android notification
// icon via the expo-notifications config plugin in app.json (which expects a
// white-on-transparent asset so it renders correctly in the status bar).
// Run: node scripts/generate-notification-icon.js
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const SIZE = 96;
const SS = 4; // supersampling factor — smooths edges via 4×4 coverage sampling

// Signed distance functions: negative = inside the shape.
function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}

function sdAnnulus(px, py, cx, cy, rOuter, rInner) {
  const d = Math.hypot(px - cx, py - cy);
  return Math.max(rInner - d, d - rOuter);
}

function insideShape(px, py) {
  // Cup body: rounded rect x∈[25,63], y∈[34,70]
  const body = sdRoundRect(px, py, 44, 52, 19, 18, 7);
  // Handle: full annulus centered (70,50) — left side tucks behind the cup
  const handle = sdAnnulus(px, py, 70, 50, 11, 5);
  // Saucer: rounded rect x∈[17,71], y∈[75,81]
  const saucer = sdRoundRect(px, py, 44, 78, 27, 3, 3);
  // Steam: two short rounded bars above the cup
  const steamL = sdRoundRect(px, py, 38, 26, 2.5, 5, 2.5);
  const steamR = sdRoundRect(px, py, 50, 26, 2.5, 5, 2.5);
  return Math.min(body, handle, saucer, steamL, steamR) <= 0;
}

function coverage(x, y) {
  let hit = 0;
  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      if (insideShape(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS)) hit++;
    }
  }
  return hit / (SS * SS);
}

let CRC_TABLE;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++)
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function buildPng() {
  const raw = Buffer.alloc(SIZE * (1 + SIZE * 4));
  for (let y = 0; y < SIZE; y++) {
    const rowStart = y * (1 + SIZE * 4);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < SIZE; x++) {
      const o = rowStart + 1 + x * 4;
      raw[o] = 255; // R
      raw[o + 1] = 255; // G
      raw[o + 2] = 255; // B
      raw[o + 3] = Math.round(coverage(x, y) * 255); // A
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outPath = path.join(
  __dirname,
  "..",
  "assets",
  "images",
  "notification-icon.png",
);
fs.writeFileSync(outPath, buildPng());

// Sanity check: signature + IHDR dimensions must read back correctly.
const written = fs.readFileSync(outPath);
if (
  written.slice(0, 8).toString("hex") !== "89504e470d0a1a0a" ||
  written.readUInt32BE(16) !== SIZE ||
  written.readUInt32BE(20) !== SIZE
) {
  console.error("Generated PNG failed verification");
  process.exit(1);
}
console.log(`Wrote ${outPath} (${written.length} bytes, ${SIZE}x${SIZE} RGBA)`);
