const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

const PUBLIC_DIR = path.join(__dirname, 'public');
const SVG_PATH = path.join(PUBLIC_DIR, 'favicon.svg');

async function ensurePng(width, height, fileName) {
  const out = path.join(PUBLIC_DIR, fileName);
  await sharp(SVG_PATH).resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(out);
  return out;
}

async function main() {
  if (!fs.existsSync(SVG_PATH)) {
    console.error('public/favicon.svg não encontrado. Coloque seu SVG em public/favicon.svg');
    process.exit(1);
  }

  const p16 = await ensurePng(16, 16, 'favicon-16x16.png');
  const p32 = await ensurePng(32, 32, 'favicon-32x32.png');
  await ensurePng(180, 180, 'apple-touch-icon.png');
  await ensurePng(1200, 630, 'og-image.png');
  fs.copyFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), path.join(PUBLIC_DIR, 'apple-touch-icon-precomposed.png'));

  // Não substituir o favicon.ico atual se já existe e usuário trocou manualmente
  const icoPath = path.join(PUBLIC_DIR, 'favicon.ico');
  if (!fs.existsSync(icoPath)) {
    const icoBuf = await pngToIco([p16, p32]);
    fs.writeFileSync(icoPath, icoBuf);
  }


}

main().catch((e) => { console.error(e); process.exit(1); });
