const fs = require('fs');
const path = require('path');

// Lê o SVG
const svgContent = fs.readFileSync('./public/favicon.svg', 'utf8');

// Cria um favicon.ico básico (placeholder)
// Na prática, você precisaria de uma biblioteca como sharp ou jimp para converter SVG para ICO
// Por enquanto, vamos criar um arquivo ICO simples

// Cria um arquivo ICO básico (16x16 pixels, formato simples)
const icoHeader = Buffer.from([
  0x00, 0x00, // Reserved
  0x01, 0x00, // Type (1 = ICO)
  0x01, 0x00, // Number of images
  0x10, 0x00, // Width (16)
  0x10, 0x00, // Height (16)
  0x00, 0x00, // Color count
  0x00, 0x00, // Reserved
  0x01, 0x00, // Planes
  0x20, 0x00, // Bits per pixel
  0x00, 0x00, 0x00, 0x00, // Size of image data
  0x16, 0x00, 0x00, 0x00  // Offset to image data
]);

// Cria um pixel simples (16x16, 32-bit RGBA)
const pixelData = Buffer.alloc(16 * 16 * 4);
for (let i = 0; i < pixelData.length; i += 4) {
  pixelData[i] = 0x00;     // R
  pixelData[i + 1] = 0x00; // G
  pixelData[i + 2] = 0x00; // B
  pixelData[i + 3] = 0xFF; // A
}

// Atualiza o tamanho no header
const totalSize = icoHeader.length + pixelData.length;
icoHeader.writeUInt32LE(totalSize, 8);

// Escreve o arquivo ICO
fs.writeFileSync('./public/favicon.ico', Buffer.concat([icoHeader, pixelData]));

console.log('Favicon.ico criado!');
