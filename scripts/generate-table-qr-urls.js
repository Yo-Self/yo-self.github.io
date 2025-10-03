#!/usr/bin/env node

/**
 * Script para gerar URLs de QR Code para mesas
 * 
 * Uso:
 *   node scripts/generate-table-qr-urls.js <restaurant-slug> <numero-de-mesas>
 * 
 * Exemplo:
 *   node scripts/generate-table-qr-urls.js bahamas-burguer 20
 */

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yo-self.github.io/web-version';

function generateTableQRUrls(restaurantSlug, numberOfTables) {
  const urls = [];
  
  for (let i = 1; i <= numberOfTables; i++) {
    const url = `${baseUrl}/restaurant/${restaurantSlug}?table=${i}`;
    urls.push({
      table: i,
      url: url,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`
    });
  }
  
  return urls;
}

// Parse argumentos da linha de comando
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Erro: Argumentos insuficientes');
  console.log('\nUso:');
  console.log('  node scripts/generate-table-qr-urls.js <restaurant-slug> <numero-de-mesas>');
  console.log('\nExemplo:');
  console.log('  node scripts/generate-table-qr-urls.js bahamas-burguer 20');
  process.exit(1);
}

const [restaurantSlug, numberOfTables] = args;
const tableCount = parseInt(numberOfTables, 10);

if (isNaN(tableCount) || tableCount <= 0) {
  console.error('❌ Erro: Número de mesas deve ser um número positivo');
  process.exit(1);
}

console.log(`\n🍽️  Gerando QR Codes para ${tableCount} mesas do restaurante "${restaurantSlug}"\n`);
console.log(`Base URL: ${baseUrl}\n`);
console.log('─'.repeat(80));

const urls = generateTableQRUrls(restaurantSlug, tableCount);

// Formato tabela
urls.forEach(({ table, url, qrCodeUrl }) => {
  console.log(`\nMesa ${table}:`);
  console.log(`  URL: ${url}`);
  console.log(`  QR Code: ${qrCodeUrl}`);
});

console.log('\n' + '─'.repeat(80));
console.log(`\n✅ ${tableCount} URLs geradas com sucesso!`);
console.log('\n💡 Dicas:');
console.log('  - Copie as URLs de QR Code e cole no navegador para baixar as imagens');
console.log('  - Use ferramentas como qr-code-generator.com para personalizar os QR Codes');
console.log('  - Imprima os QR Codes e coloque nas mesas do restaurante');
console.log('  - Teste escaneando com um smartphone\n');

// Salvar em arquivo JSON se especificado
if (args[2] === '--json') {
  const fs = require('fs');
  const outputFile = `qr-codes-${restaurantSlug}.json`;
  fs.writeFileSync(outputFile, JSON.stringify(urls, null, 2));
  console.log(`📄 Arquivo JSON salvo em: ${outputFile}\n`);
}

// Gerar HTML com todos os QR Codes se especificado
if (args[2] === '--html') {
  const fs = require('fs');
  const outputFile = `qr-codes-${restaurantSlug}.html`;
  
  let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Codes - ${restaurantSlug}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 {
      text-align: center;
      color: #333;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center;
      page-break-inside: avoid;
    }
    .card h2 {
      margin: 0 0 15px 0;
      color: #2563eb;
      font-size: 24px;
    }
    .card img {
      width: 100%;
      max-width: 200px;
      height: auto;
    }
    .card .url {
      font-size: 10px;
      color: #666;
      word-break: break-all;
      margin-top: 10px;
    }
    @media print {
      .card {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <h1>🍽️ QR Codes - ${restaurantSlug}</h1>
  <div class="grid">
`;

  urls.forEach(({ table, url, qrCodeUrl }) => {
    html += `
    <div class="card">
      <h2>Mesa ${table}</h2>
      <img src="${qrCodeUrl}" alt="QR Code Mesa ${table}">
      <div class="url">${url}</div>
    </div>
`;
  });

  html += `
  </div>
</body>
</html>
`;

  fs.writeFileSync(outputFile, html);
  console.log(`📄 Arquivo HTML salvo em: ${outputFile}`);
  console.log(`   Abra no navegador e use Ctrl+P para imprimir\n`);
}
