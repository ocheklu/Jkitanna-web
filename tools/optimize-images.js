// One-off image optimizer for the Jkitanna site.
// Reads originals from images/ and writes web-ready files to images/optimized/.
// Run: npm run optimize-images
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, '..', 'images');
const OUT = path.join(SRC, 'optimized');
fs.mkdirSync(OUT, { recursive: true });

// Each job: source file, output base name, target widths, and quality.
// Portraits get a .jpg fallback alongside .webp; backgrounds are .webp only.
const jobs = [
  { src: 'jk-4.png',        base: 'hero',       widths: [1600, 900], quality: 80, jpgFallback: true },
  { src: 'jk.jpg',          base: 'about',      widths: [1000, 700], quality: 80, jpgFallback: true },
  { src: 'background.png',  base: 'services-bg', widths: [1920, 960], quality: 68, jpgFallback: false },
  { src: 'background-2.png', base: 'zaprosy-bg', widths: [1920, 960], quality: 68, jpgFallback: false },
];

async function run() {
  for (const job of jobs) {
    const srcPath = path.join(SRC, job.src);
    if (!fs.existsSync(srcPath)) {
      console.warn(`skip (missing): ${job.src}`);
      continue;
    }
    const meta = await sharp(srcPath).metadata();
    for (const w of job.widths) {
      const suffix = w === Math.max(...job.widths) ? '' : '-sm';
      const targetW = Math.min(w, meta.width);

      const webpName = `${job.base}${suffix}.webp`;
      await sharp(srcPath)
        .resize({ width: targetW, withoutEnlargement: true })
        .webp({ quality: job.quality })
        .toFile(path.join(OUT, webpName));
      report(webpName);

      if (job.jpgFallback) {
        const jpgName = `${job.base}${suffix}.jpg`;
        await sharp(srcPath)
          .resize({ width: targetW, withoutEnlargement: true })
          .jpeg({ quality: job.quality, mozjpeg: true })
          .toFile(path.join(OUT, jpgName));
        report(jpgName);
      }
    }
  }
  console.log('\nDone. Optimized files are in images/optimized/');
}

function report(name) {
  const kb = (fs.statSync(path.join(OUT, name)).size / 1024).toFixed(0);
  console.log(`  ${name.padEnd(20)} ${kb} KB`);
}

run().catch((e) => { console.error(e); process.exit(1); });
