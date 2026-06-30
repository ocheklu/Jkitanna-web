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
  { src: '2.jpg',           base: 'beliefs-bg', widths: [2000, 1000], quality: 70, jpgFallback: false },
  { src: '3.jpg',           base: 'cta-bg',     widths: [1600, 900], quality: 72, jpgFallback: true, rotate: 90 },
  // Mobile quick-link strip backgrounds (airy, pale photos under the section names)
  { src: '1.jpg', base: 'strip1', widths: [1000], quality: 72, jpgFallback: true },
  { src: '2.jpg', base: 'strip2', widths: [1000], quality: 72, jpgFallback: true },
  { src: '3.jpg', base: 'strip3', widths: [1000], quality: 72, jpgFallback: true },
  { src: '4.png', base: 'strip4', widths: [1000], quality: 72, jpgFallback: true },
  { src: '6.jpg', base: 'strip5', widths: [1000], quality: 72, jpgFallback: true },
];

async function run() {
  for (const job of jobs) {
    const srcPath = path.join(SRC, job.src);
    if (!fs.existsSync(srcPath)) {
      console.warn(`skip (missing): ${job.src}`);
      continue;
    }
    const meta = await sharp(srcPath).metadata();
    // After a 90°/270° rotate the usable width comes from the source height.
    const rotated = job.rotate === 90 || job.rotate === 270;
    const srcW = rotated ? meta.height : meta.width;
    const start = () => (job.rotate ? sharp(srcPath).rotate(job.rotate) : sharp(srcPath));
    for (const w of job.widths) {
      const suffix = w === Math.max(...job.widths) ? '' : '-sm';
      const targetW = Math.min(w, srcW);

      const webpName = `${job.base}${suffix}.webp`;
      await start()
        .resize({ width: targetW, withoutEnlargement: true })
        .webp({ quality: job.quality })
        .toFile(path.join(OUT, webpName));
      report(webpName);

      if (job.jpgFallback) {
        const jpgName = `${job.base}${suffix}.jpg`;
        await start()
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
