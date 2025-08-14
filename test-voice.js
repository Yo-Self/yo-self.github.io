#!/usr/bin/env node

/**
 * Script de teste para verificar a funcionalidade de text-to-speech
 * 
 * Uso:
 * node test-voice.js
 * 
 * Este script testa a Web Speech API no navegador
 */

console.log('🔊 Testando Funcionalidade de Text-to-Speech...\n');

// Verificar se estamos no navegador
if (typeof window === 'undefined') {
  console.log('❌ Este script deve ser executado no navegador');
  console.log('💡 Abra o console do navegador e cole o código abaixo:\n');
  
  const testCode = `
// Teste de compatibilidade
console.log('🔍 Verificando compatibilidade...');
const isSupported = 'speechSynthesis' in window;
console.log('✅ Web Speech API suportada:', isSupported);

if (isSupported) {
  // Carregar vozes
  const voices = window.speechSynthesis.getVoices();
  console.log('🎤 Vozes disponíveis:', voices.length);
  
  // Mostrar vozes em português
  const portugueseVoices = voices.filter(v => v.lang.startsWith('pt'));
  console.log('🇧🇷 Vozes em português:', portugueseVoices.length);
  
  if (portugueseVoices.length > 0) {
    console.log('📋 Vozes em português:');
    portugueseVoices.forEach((voice, index) => {
      console.log(\`  \${index + 1}. \${voice.name} (\${voice.lang})\`);
    });
  }
  
  // Teste de fala
  const testText = 'Olá! Esta é uma mensagem de teste para verificar se a funcionalidade de voz está funcionando corretamente.';
  const utterance = new SpeechSynthesisUtterance(testText);
  
  // Configurar voz em português se disponível
  if (portugueseVoices.length > 0) {
    utterance.voice = portugueseVoices[0];
    utterance.lang = portugueseVoices[0].lang;
  }
  
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  utterance.onstart = () => {
    console.log('🎵 Iniciando fala...');
  };
  
  utterance.onend = () => {
    console.log('✅ Fala concluída com sucesso!');
  };
  
  utterance.onerror = (event) => {
    console.error('❌ Erro na fala:', event.error);
  };
  
  console.log('🔊 Iniciando teste de fala...');
  window.speechSynthesis.speak(utterance);
  
} else {
  console.log('❌ Web Speech API não é suportada neste navegador');
  console.log('💡 Tente usar Chrome, Firefox, Safari ou Edge');
}
  `;
  
  console.log(testCode);
  process.exit(0);
}

// Código para execução no navegador
console.log('🔍 Verificando compatibilidade...');
const isSupported = 'speechSynthesis' in window;
console.log('✅ Web Speech API suportada:', isSupported);

if (isSupported) {
  // Função para carregar vozes
  function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    console.log('🎤 Vozes disponíveis:', voices.length);
    
    // Mostrar vozes em português
    const portugueseVoices = voices.filter(v => v.lang.startsWith('pt'));
    console.log('🇧🇷 Vozes em português:', portugueseVoices.length);
    
    if (portugueseVoices.length > 0) {
      console.log('📋 Vozes em português:');
      portugueseVoices.forEach((voice, index) => {
        console.log(`  ${index + 1}. ${voice.name} (${voice.lang})`);
      });
    }
    
    // Mostrar todas as vozes
    console.log('\n📋 Todas as vozes disponíveis:');
    voices.forEach((voice, index) => {
      const isPortuguese = voice.lang.startsWith('pt');
      const flag = isPortuguese ? '🇧🇷' : '🌍';
      console.log(`  ${index + 1}. ${flag} ${voice.name} (${voice.lang})`);
    });
    
    return voices;
  }
  
  // Carregar vozes
  let voices = loadVoices();
  
  // Se não há vozes carregadas, aguardar
  if (voices.length === 0) {
    console.log('⏳ Aguardando carregamento das vozes...');
    window.speechSynthesis.onvoiceschanged = () => {
      voices = loadVoices();
      runTest(voices);
    };
  } else {
    runTest(voices);
  }
  
  function runTest(voices) {
    const portugueseVoices = voices.filter(v => v.lang.startsWith('pt'));
    
    // Teste de fala
    const testText = 'Olá! Esta é uma mensagem de teste para verificar se a funcionalidade de voz está funcionando corretamente.';
    const utterance = new SpeechSynthesisUtterance(testText);
    
    // Configurar voz em português se disponível
    if (portugueseVoices.length > 0) {
      utterance.voice = portugueseVoices[0];
      utterance.lang = portugueseVoices[0].lang;
      console.log(`\n🎤 Usando voz: ${portugueseVoices[0].name}`);
    } else {
      utterance.lang = 'pt-BR';
      console.log('\n⚠️  Nenhuma voz em português encontrada, usando configuração padrão');
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => {
      console.log('🎵 Iniciando fala...');
    };
    
    utterance.onend = () => {
      console.log('✅ Fala concluída com sucesso!');
      console.log('\n🎉 Teste concluído! A funcionalidade de voz está funcionando.');
    };
    
    utterance.onerror = (event) => {
      console.error('❌ Erro na fala:', event.error);
      console.log('\n💡 Possíveis soluções:');
      console.log('  1. Verificar se o som está ligado');
      console.log('  2. Verificar permissões de áudio');
      console.log('  3. Tentar em outro navegador');
    };
    
    console.log('🔊 Iniciando teste de fala...');
    window.speechSynthesis.speak(utterance);
  }
  
} else {
  console.log('❌ Web Speech API não é suportada neste navegador');
  console.log('\n💡 Navegadores suportados:');
  console.log('  • Chrome 33+');
  console.log('  • Firefox 49+');
  console.log('  • Safari 7+');
  console.log('  • Edge 79+');
  console.log('\n💡 Tente usar um navegador mais recente');
}
