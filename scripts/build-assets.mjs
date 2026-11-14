// Regenerates derived public assets (favicons, social preview) from the sources in assets-source/.
// Run: npm run assets
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

await mkdir('public/og', { recursive: true });

// Favicons from the square source (the original was 2000x2000 px, 376 KB: far too heavy for a favicon).
for (const [name, size] of [['favicon-32.png', 32], ['favicon-192.png', 192], ['apple-touch-icon.png', 180]]) {
  await sharp('assets-source/favicon-source.png').resize(size, size, { fit: 'cover' }).png({ compressionLevel: 9 }).toFile(`public/${name}`);
}

// Social preview: 1200x630, JPEG, well under common crawler size limits (the original was 3556x2000 px, 7 MB).
const out = await sharp('assets-source/journal-logo-source.png')
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile('public/og/default.jpg');
console.log(`og/default.jpg: ${out.width}x${out.height}, ${(out.size / 1024).toFixed(0)} KB`);
