const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const PUBLIC_DIR = path.join(__dirname, 'public');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Gera um PNG sólido com um ícone simples desenhado (não renderiza SVG, mas cria um placeholder bonito)
function generatePng(width, height, fileName) {
  const png = new PNG({ width, height });

  // Fundo turquesa
  const bg = { r: 6, g: 182, b: 212, a: 255 };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = bg.r;
      png.data[idx + 1] = bg.g;
      png.data[idx + 2] = bg.b;
      png.data[idx + 3] = bg.a;
    }
  }

  // Desenha um glifo branco simples (quatro quadrados) centralizados
  const unit = Math.floor(Math.min(width, height) / 4);
  const padding = Math.floor(unit / 2);
  const blocks = [
    { x: padding, y: padding },
    { x: padding + unit + padding, y: padding },
    { x: padding, y: padding + unit + padding },
    { x: padding + unit + padding, y: padding + unit + padding },
  ];
  const blockSize = unit;

  blocks.forEach(({ x, y }) => {
    for (let yy = 0; yy < blockSize; yy++) {
      for (let xx = 0; xx < blockSize; xx++) {
        const px = x + xx;
        const py = y + yy;
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (width * py + px) << 2;
          png.data[idx] = 255;
          png.data[idx + 1] = 255;
          png.data[idx + 2] = 255;
          png.data[idx + 3] = 255;
        }
      }
    }
  });

  const outPath = path.join(PUBLIC_DIR, fileName);
  png.pack().pipe(fs.createWriteStream(outPath));
  return new Promise((resolve) => {
    png.on('end', () => resolve(outPath));
  });
}

async function main() {
  ensureDir(PUBLIC_DIR);

  const tasks = [
    generatePng(16, 16, 'favicon-16x16.png'),
    generatePng(32, 32, 'favicon-32x32.png'),
    generatePng(180, 180, 'apple-touch-icon.png'),
    generatePng(1200, 630, 'og-image.png'),
  ];

  await Promise.all(tasks);
  console.log('PNG favicons and OG image generated in /public');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
