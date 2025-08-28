#!/usr/bin/env node

/**
 * Script de teste para notificações do Telegram em supergrupos
 * 
 * Uso:
 * 1. Configure as variáveis de ambiente:
 *    export TELEGRAM_BOT_TOKEN="seu_token_aqui"
 *    export TELEGRAM_CHAT_ID="-1002990879666"
 * 
 * 2. Execute o script:
 *    node test-telegram-supergroup.js
 */

const https = require('https');

// Configurações
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MESSAGE_THREAD_ID = 2; // ID da aba CI/CD

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('❌ Erro: Configure as variáveis de ambiente:');
  console.error('   export TELEGRAM_BOT_TOKEN="seu_token_aqui"');
  console.error('   export TELEGRAM_CHAT_ID="-1002990879666"');
  process.exit(1);
}

/**
 * Envia mensagem para o Telegram
 */
function sendTelegramMessage(text, parseMode = 'Markdown') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: CHAT_ID,
      message_thread_id: MESSAGE_THREAD_ID,
      text: text,
      parse_mode: parseMode
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          if (response.ok) {
            resolve(response);
          } else {
            reject(new Error(`Telegram API error: ${response.description}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.write(data);
    req.end();
  });
}

/**
 * Executa os testes
 */
async function runTests() {
  console.log('🧪 Iniciando testes de notificação do Telegram...\n');
  
  const tests = [
    {
      name: 'Teste 1: Mensagem simples',
      text: '🧪 **Teste de Notificação**\n\n✅ Esta mensagem deve aparecer na aba CI/CD\n\n🔧 Teste realizado via Node.js\n\n⏰ Data: ' + new Date().toLocaleString('pt-BR'),
      parseMode: 'Markdown'
    },
    {
      name: 'Teste 2: Formatação HTML',
      text: '<b>🧪 Teste de Notificação - HTML</b>\n\n✅ Esta mensagem deve aparecer na aba CI/CD\n\n🔧 Teste realizado via Node.js\n\n⏰ Data: ' + new Date().toLocaleString('pt-BR'),
      parseMode: 'HTML'
    },
    {
      name: 'Teste 3: Emojis e formatação',
      text: '🚀 **GitHub Actions - Teste**\n\n📋 **Status:** ✅ Sucesso\n\n🌿 **Branch:** main\n\n📝 **Detalhes:** Teste de notificação para supergrupo\n\n🔗 **Link:** [GitHub](https://github.com)\n\n⏰ **Data:** ' + new Date().toLocaleString('pt-BR'),
      parseMode: 'Markdown'
    }
  ];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`📝 ${test.name}...`);
    
    try {
      const result = await sendTelegramMessage(test.text, test.parseMode);
      console.log(`   ✅ Sucesso! Message ID: ${result.result.message_id}`);
    } catch (error) {
      console.log(`   ❌ Falha: ${error.message}`);
    }
    
    // Aguarda 2 segundos entre os testes
    if (i < tests.length - 1) {
      console.log('   ⏳ Aguardando 2 segundos...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🎉 Testes concluídos!');
  console.log('📱 Verifique se as mensagens apareceram na aba CI/CD do supergrupo');
  console.log(`🔗 Chat ID: ${CHAT_ID}`);
  console.log(`📌 Message Thread ID: ${MESSAGE_THREAD_ID} (aba CI/CD)`);
}

// Executa os testes
runTests().catch(error => {
  console.error('❌ Erro durante os testes:', error.message);
  process.exit(1);
});
