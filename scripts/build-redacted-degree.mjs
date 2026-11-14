// Produces a PUBLIC-SAFE copy of the degree certificate: identifiers are covered with opaque bars BEFORE the image
// is written, so the personal data never exists in the published file.
// Redacted: university UID, serial number, QR code, photograph, parents' names, barcode.
// Kept: the degree, the name, the university, the grade, the dates.
// Usage: node scripts/build-redacted-degree.mjs "<path to original Degree.jpg>"
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const src = process.argv[2];
if (!src) { console.error('Pass the path to the original degree image.'); process.exit(1); }

// [left, top, width, height] in the ORIGINAL pixel grid (3509 x 2479).
const BARS = [
  [440, 262, 410, 70],    // university UID
  [2660, 260, 320, 70],   // serial number
  [455, 428, 250, 235],   // QR code
  [2660, 318, 310, 390],  // photograph
  [1700, 1140, 1280, 80], // "son/daughter of Shri. ... & Smt." (parents' names)
  [455, 1245, 495, 78],   // second line of the parents' names
  [1625, 2118, 335, 105], // barcode
];

const meta = await sharp(src).metadata();
if (meta.width !== 3509 || meta.height !== 2479) console.warn(`Unexpected size ${meta.width}x${meta.height}; box positions assume 3509x2479.`);

const overlay = BARS.map(([left, top, width, height]) => ({
  input: { create: { width, height, channels: 3, background: '#0e1a33' } }, left, top,
}));

await mkdir('src/assets/certificates', { recursive: true });
// Stage 1: draw the bars on the FULL-RESOLUTION image and flatten (sharp resizes before it composites within one
// pipeline, so doing both at once would put the bars in the wrong place). Stage 2: resize the already-redacted pixels.
const redacted = await sharp(src).composite(overlay).jpeg({ quality: 95 }).toBuffer();
await sharp(redacted).resize({ width: 1800 }).jpeg({ quality: 82, mozjpeg: true }).toFile('src/assets/certificates/degree-redacted.jpg');
console.log('written src/assets/certificates/degree-redacted.jpg');
