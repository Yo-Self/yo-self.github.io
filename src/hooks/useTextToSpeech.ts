import React, { useState, useRef, useCallback, useEffect } from 'react';

interface UseTextToSpeechReturn {
  isEnabled: boolean;
  isSpeaking: boolean;
  toggleSpeech: () => void;
  speak: (text: string, isManual?: boolean) => void;
  stop: () => void;
  clearReadHistory: () => void;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set());
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Verificar se o navegador suporta speech synthesis
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Carregar vozes disponíveis e definir Luciana como fixa
  const loadVoices = useCallback(() => {
    if (!isSupported) return;

    const voices = window.speechSynthesis.getVoices();
    
    // Buscar especificamente pela voz Luciana (pt-BR)
    const lucianaVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('luciana') && 
      (voice.lang.startsWith('pt-BR') || voice.lang.startsWith('pt'))
    );
    
    // Se não encontrar Luciana, buscar por qualquer voz em português brasileiro
    const fallbackVoice = lucianaVoice || voices.find(voice => 
      voice.lang.startsWith('pt-BR')
    ) || voices.find(voice => 
      voice.lang.startsWith('pt')
    );
    
    // Definir a voz selecionada
    if (fallbackVoice && !selectedVoice) {
      setSelectedVoice(fallbackVoice);
    }
  }, [isSupported, selectedVoice]);

  // Carregar vozes quando o componente montar
  useEffect(() => {
    if (isSupported) {
      loadVoices();
      
      // Alguns navegadores carregam as vozes de forma assíncrona
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, [isSupported, loadVoices]);

  const toggleSpeech = useCallback(() => {
    if (!isSupported) {
      console.warn('Speech synthesis não é suportado neste navegador');
      return;
    }
    setIsEnabled(prev => !prev);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;

    if (speechRef.current) {
      window.speechSynthesis.cancel();
      speechRef.current = null;
    }
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback((text: string, isManual: boolean = false) => {
    if (!isSupported || !text.trim()) return;
    
    // Se não está habilitado e não é manual, não ler
    if (!isEnabled && !isManual) return;

    // Para leitura automática, verificar se já foi lida
    if (!isManual && readMessages.has(text)) {
      return; // Já foi lida automaticamente, não repetir
    }

    // Parar qualquer fala em andamento
    stop();

    // Criar nova utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configurar a voz selecionada
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Configurar propriedades da fala
    utterance.rate = 0.9; // Velocidade (0.1 a 10)
    utterance.pitch = 1.0; // Tom (0 a 2)
    utterance.volume = 1.0; // Volume (0 a 1)
    utterance.lang = selectedVoice?.lang || 'pt-BR';

    // Event listeners
    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      speechRef.current = null;
      
      // Marcar como lida se foi leitura automática
      if (!isManual) {
        setReadMessages(prev => new Set(prev).add(text));
      }
    };

    utterance.onerror = (event) => {
      console.error('Erro na síntese de fala:', event);
      setIsSpeaking(false);
      speechRef.current = null;
    };

    // Armazenar referência e iniciar fala
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, isEnabled, selectedVoice, readMessages, stop]);

  const clearReadHistory = useCallback(() => {
    setReadMessages(new Set());
  }, []);

  return {
    isEnabled,
    isSpeaking,
    toggleSpeech,
    speak,
    stop,
    clearReadHistory,
  };
}
