// Vygeneruje OG obrázek a ikony ze zdrojové fotky (spouští se ručně: npm run assets).
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

await sharp('src/assets/photos/hero-zima-dum.jpg').resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 82, mozjpeg: true }).toFile('public/og.jpg');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#14203a"/><text x="32" y="45" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="34" fill="#f0b44c">48</text></svg>`;
writeFileSync('public/favicon.svg', svg);
await sharp(Buffer.from(svg)).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(svg)).resize(32, 32).png().toFile('public/favicon-32.png');
console.log('ok');
