#!/usr/bin/env node
// Generates public/favicon.ico: a cyan "m" (Audiowide) with a magenta
// superscript "jr" -- a nod to the games.muffinjr.com domain, in the app's
// cyberpunk theme colors (see src/styles/theme.scss).
//
// Renders real HTML/CSS through headless Chromium (so the Audiowide font
// renders exactly as it does in the app) instead of drawing glyphs by hand.
// The two-letter "jr" is illegible once downsampled to 16px, so the 16px
// frame swaps to a simplified "m + dot" mark while 32/48px keep the full
// "m jr" wordmark.
//
// Usage: node scripts/generate-favicon.ts [--preview]
//   --preview  also writes scripts/favicon-preview.png for visual review

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import { chromium } from 'playwright-core';
import type { Browser } from 'playwright-core';

const scriptDir = import.meta.dirname;
const OUT_ICO = path.resolve(scriptDir, '../public/favicon.ico');
const PREVIEW = process.argv.includes('--preview');

interface DecodedImage {
  width: number;
  height: number;
  pixels: Uint8Array;
}

interface IcoFrame {
  size: number;
  pixels: Uint8Array;
}

// -------------------------------------------------------------------------
// HTML templates rendered in a real browser so fonts/antialiasing match
// what the app actually uses.
// -------------------------------------------------------------------------

const FONT_LINK = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap"
    rel="stylesheet"
  />`;

// Full "m" + superscript "jr" wordmark, used for the 32/48px frames.
const FULL_HTML = `<!doctype html>
<html><head><meta charset="UTF-8" />${FONT_LINK}
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  .icon {
    width: 256px; height: 256px;
    background: #0b0e17;
    border-radius: 56px;
    display: flex; align-items: center; justify-content: center;
  }
  .wrap { position: relative; display: inline-block; }
  .m {
    font-family: 'Audiowide', sans-serif;
    font-size: 176px;
    line-height: 1;
    color: #00e5ff;
    text-shadow: 0 0 20px rgba(0, 229, 255, 0.65);
  }
  .jr {
    position: absolute;
    top: -20px; right: -70px;
    font-family: 'Audiowide', sans-serif;
    font-size: 82px;
    line-height: 1;
    color: #ff2bd6;
    text-shadow: 0 0 6px rgba(255, 43, 214, 0.5);
  }
</style></head>
<body>
  <div class="icon" id="icon">
    <div class="wrap">
      <div class="m">m</div>
      <div class="jr">jr</div>
    </div>
  </div>
</body></html>`;

// Simplified "m" + accent dot, used for the 16px frame where "jr" would
// just smear into an illegible blob once downsampled.
const SIMPLE_HTML = `<!doctype html>
<html><head><meta charset="UTF-8" />${FONT_LINK}
<style>
  html, body { margin: 0; padding: 0; }
  .icon {
    width: 256px; height: 256px;
    background: #0b0e17;
    border-radius: 56px;
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .m {
    font-family: 'Audiowide', sans-serif;
    font-size: 200px;
    line-height: 1;
    color: #00e5ff;
  }
  .dot {
    position: absolute;
    width: 46px; height: 46px;
    border-radius: 50%;
    background: #ff2bd6;
    top: 48px; right: 48px;
  }
</style></head>
<body>
  <div class="icon" id="icon">
    <div class="m">m</div>
    <div class="dot"></div>
  </div>
</body></html>`;

// -------------------------------------------------------------------------
// Screenshot rendering
// -------------------------------------------------------------------------

async function renderHtml(
  browser: Browser,
  html: string,
  { centerWordmark = false }: { centerWordmark?: boolean } = {},
): Promise<Buffer> {
  const page = await browser.newPage({
    viewport: { width: 400, height: 400 },
    deviceScaleFactor: 4, // supersample for antialiasing when downsampled
  });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300); // let the webfont finish swapping in

  if (centerWordmark) {
    // Center the union of .m + .jr (rather than just .m) so the
    // superscript's overhang doesn't visually unbalance the mark.
    await page.evaluate(() => {
      const wrap = document.querySelector<HTMLElement>('.wrap');
      const icon = document.getElementById('icon');
      wrap.style.transform = 'translate(0px, 0px)';
      const iconBox = icon.getBoundingClientRect();
      const mBox = document.querySelector('.m').getBoundingClientRect();
      const jrBox = document.querySelector('.jr').getBoundingClientRect();
      const left = Math.min(mBox.left, jrBox.left);
      const right = Math.max(mBox.right, jrBox.right);
      const top = Math.min(mBox.top, jrBox.top);
      const bottom = Math.max(mBox.bottom, jrBox.bottom);
      const dx = (iconBox.left + iconBox.right) / 2 - (left + right) / 2;
      const dy = (iconBox.top + iconBox.bottom) / 2 - (top + bottom) / 2;
      wrap.style.transform = `translate(${dx}px, ${dy}px)`;
    });
  }

  const el = await page.$('#icon');
  const buffer = await el.screenshot({ omitBackground: true });
  await page.close();
  return buffer;
}

// -------------------------------------------------------------------------
// Minimal PNG decoder (8-bit, non-interlaced, RGB/RGBA) -- just enough to
// read back what Chromium hands us, with no image-processing dependency.
// -------------------------------------------------------------------------

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePNG(buf: Buffer): DecodedImage {
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idatChunks: Buffer[] = [];
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8) throw new Error('expected 8-bit PNG');
      colorType = data[9];
      if (colorType !== 2 && colorType !== 6) {
        throw new Error(`expected RGB/RGBA PNG, got color type ${colorType}`);
      }
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 8 + len + 4;
  }

  const channels = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const stride = width * channels;
  const out = new Uint8Array(width * height * 4);
  let prevRow = new Uint8Array(stride);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos];
    pos += 1;
    const row = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const rawByte = raw[pos + x];
      const a = x >= channels ? row[x - channels] : 0;
      const b = prevRow[x];
      const c = x >= channels ? prevRow[x - channels] : 0;
      let val: number;
      if (filter === 0) val = rawByte;
      else if (filter === 1) val = (rawByte + a) & 0xff;
      else if (filter === 2) val = (rawByte + b) & 0xff;
      else if (filter === 3) val = (rawByte + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) val = (rawByte + paeth(a, b, c)) & 0xff;
      else throw new Error(`unsupported PNG filter ${filter}`);
      row[x] = val;
    }
    pos += stride;
    for (let x = 0; x < width; x++) {
      const sidx = x * channels;
      const didx = (y * width + x) * 4;
      out[didx] = row[sidx];
      out[didx + 1] = row[sidx + 1];
      out[didx + 2] = row[sidx + 2];
      out[didx + 3] = channels === 4 ? row[sidx + 3] : 255;
    }
    prevRow = row;
  }
  return { width, height, pixels: out };
}

function buildCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}
const CRC_TABLE = buildCrcTable();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(pixels: Uint8Array, size: number): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    for (let x = 0; x < stride; x++) {
      raw[y * (stride + 1) + 1 + x] = pixels[y * stride + x];
    }
  }
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdrData),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Box filter -- averages source pixels per destination cell for clean
// downsampling from the 4x-supersampled render.
function boxDownsample(
  src: Uint8Array,
  srcSize: number,
  dstSize: number,
): Uint8Array {
  const factor = srcSize / dstSize;
  const out = new Uint8Array(dstSize * dstSize * 4);
  for (let y = 0; y < dstSize; y++) {
    for (let x = 0; x < dstSize; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0,
        count = 0;
      const sy0 = Math.floor(y * factor);
      const sy1 = Math.floor((y + 1) * factor);
      const sx0 = Math.floor(x * factor);
      const sx1 = Math.floor((x + 1) * factor);
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const idx = (sy * srcSize + sx) * 4;
          r += src[idx];
          g += src[idx + 1];
          b += src[idx + 2];
          a += src[idx + 3];
          count++;
        }
      }
      const oidx = (y * dstSize + x) * 4;
      out[oidx] = Math.round(r / count);
      out[oidx + 1] = Math.round(g / count);
      out[oidx + 2] = Math.round(b / count);
      out[oidx + 3] = Math.round(a / count);
    }
  }
  return out;
}

// -------------------------------------------------------------------------
// ICO encoder (32bpp BGRA frames, one per requested size)
// -------------------------------------------------------------------------

function encodeICO(images: IcoFrame[]): Buffer {
  const n = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(n, 4);

  const entries: Buffer[] = [];
  const dataParts: Buffer[] = [];
  let offset = 6 + n * 16;

  for (const { size, pixels } of images) {
    const rowSize = size * 4;
    const xorData = Buffer.alloc(rowSize * size);
    // BMP rows are bottom-to-top, BGRA byte order.
    for (let y = 0; y < size; y++) {
      const srcRow = size - 1 - y;
      for (let x = 0; x < size; x++) {
        const sidx = (srcRow * size + x) * 4;
        const didx = (y * size + x) * 4;
        xorData[didx] = pixels[sidx + 2];
        xorData[didx + 1] = pixels[sidx + 1];
        xorData[didx + 2] = pixels[sidx];
        xorData[didx + 3] = pixels[sidx + 3];
      }
    }
    // AND mask is unused when the XOR data carries real alpha, but the
    // format still requires one (all-zero = fully opaque per its own bit).
    const andRowBytes = Math.ceil(size / 32) * 4;
    const andData = Buffer.alloc(andRowBytes * size, 0);

    const bmpHeader = Buffer.alloc(40);
    bmpHeader.writeUInt32LE(40, 0);
    bmpHeader.writeInt32LE(size, 4);
    bmpHeader.writeInt32LE(size * 2, 8); // height = xor + and
    bmpHeader.writeUInt16LE(1, 12);
    bmpHeader.writeUInt16LE(32, 14);
    bmpHeader.writeUInt32LE(0, 16);
    bmpHeader.writeUInt32LE(xorData.length + andData.length, 20);

    const imageData = Buffer.concat([bmpHeader, xorData, andData]);
    dataParts.push(imageData);

    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(imageData.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += imageData.length;
  }

  return Buffer.concat([header, ...entries, ...dataParts]);
}

// -------------------------------------------------------------------------
// Main
// -------------------------------------------------------------------------

const browser = await chromium.launch();
try {
  const [fullPng, simplePng] = await Promise.all([
    renderHtml(browser, FULL_HTML, { centerWordmark: true }),
    renderHtml(browser, SIMPLE_HTML),
  ]);

  const full = decodePNG(fullPng);
  const simple = decodePNG(simplePng);

  const icoImages: IcoFrame[] = [16, 32, 48].map((size) => {
    const source = size === 16 ? simple : full;
    return {
      size,
      pixels:
        size === source.width
          ? source.pixels
          : boxDownsample(source.pixels, source.width, size),
    };
  });

  fs.writeFileSync(OUT_ICO, encodeICO(icoImages));
  console.log(`Wrote ${path.relative(process.cwd(), OUT_ICO)}`);

  if (PREVIEW) {
    const previewSize = 256;
    const preview =
      previewSize === full.width
        ? full.pixels
        : boxDownsample(full.pixels, full.width, previewSize);
    const previewPath = path.join(scriptDir, 'favicon-preview.png');
    fs.writeFileSync(previewPath, encodePNG(preview, previewSize));
    console.log(`Wrote ${path.relative(process.cwd(), previewPath)}`);
  }
} finally {
  await browser.close();
}
