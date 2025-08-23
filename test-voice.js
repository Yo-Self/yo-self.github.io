#!/usr/bin/env node

/**
 * Script de teste para verificar a funcionalidade de text-to-speech
 * 
 * Uso:
 * node test-voice.js
 * 
 * Este script testa a Web Speech API no navegador
 */

// Verificar se estamos no navegador
if (typeof window === 'undefined') {
  const testCode = `
// Teste de compatibilidade
const isSupported = 'speechSynthesis' in window;

if (isSupported) {
  // Carregar vozes
  const voices = window.speechSynthesis.getVoices();
  
  // Mostrar vozes em português
  const portugueseVoices = voices.filter(v => v.lang.startsWith('pt'));
  
  if (portugueseVoices.length > 0) {
    // Vozes em português disponíveis
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
    // Iniciando fala
  };
  
  utterance.onend = () => {
    // Fala concluída
  };
  
  utterance.onerror = (event) => {
    // Erro na fala
  };
  
  window.speechSynthesis.speak(utterance);
  
} else {
  // Web Speech API não suportada
}
  `;
  
  process.exit(0);
}

// Código para execução no navegador
const isSupported = 'speechSynthesis' in window;

if (isSupported) {
  // Função para carregar vozes
  function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    
    // Mostrar vozes em português
    const portugueseVoices = voices.filter(v => v.lang.startsWith('pt'));
    
    if (portugueseVoices.length > 0) {
      // Vozes em português disponíveis
    }
    
    // Mostrar todas as vozes
    voices.forEach((voice, index) => {
      const isPortuguese = voice.lang.startsWith('pt');
      const flag = isPortuguese ? '🇧🇷' : '🌍';
    });
    
    return voices;
  }
  
  // Carregar vozes
  let voices = loadVoices();
  
  // Se não há vozes carregadas, aguardar
  if (voices.length === 0) {
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
    } else {
      utterance.lang = 'pt-BR';
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => {
      // Iniciando fala
    };
    
    utterance.onend = () => {
      // Fala concluída
    };
    
    utterance.onerror = (event) => {
      // Erro na fala
    };
    
    window.speechSynthesis.speak(utterance);
  }
  
} else {
  // Web Speech API não suportada
}
