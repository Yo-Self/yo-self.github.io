import React, { useState, useRef, useCallback, useEffect } from 'react';

interface UseTextToSpeechReturn {
  isEnabled: boolean;
  isSpeaking: boolean;
  toggleSpeech: () => void;
  speak: (text: string, isManual?: boolean) => void;
  stop: () => void;
  clearReadHistory: () => void;
  resetStopFlag: () => void;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isEnabled, setIsEnabled] = useState(() => {
    // Tentar carregar o estado do localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('speech-enabled');
      return saved === 'true';
    }
    return false;
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set());
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const shouldStopRef = useRef(false);

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
    setIsEnabled(prev => {
      const newValue = !prev;
      // Salvar no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('speech-enabled', newValue.toString());
      }

      return newValue;
    });
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;

    // Marcar que deve parar
    shouldStopRef.current = true;

    // Cancelar todas as falas em andamento
    window.speechSynthesis.cancel();
    
    // Limpar referência
    if (speechRef.current) {
      speechRef.current = null;
    }
    
    // Forçar parada do estado
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback((text: string, isManual: boolean = false) => {
    if (!isSupported || !text.trim()) return;
    
    // Se não está habilitado e não é manual, não ler
    if (!isEnabled && !isManual) {
      return;
    }

    // Para leitura automática, verificar se já foi lida
    if (!isManual && readMessages.has(text)) {
      return; // Já foi lida automaticamente, não repetir
    }

    // Se já está falando, não iniciar nova fala
    if (isSpeaking) {
      return;
    }

    // Se foi solicitado para parar, não iniciar nova fala
    if (shouldStopRef.current) {
      return;
    }

    // Cancelar qualquer fala em andamento sem usar a função stop()
    window.speechSynthesis.cancel();

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
      // Se foi solicitado para parar, cancelar imediatamente
      if (shouldStopRef.current) {
        window.speechSynthesis.cancel();
        return;
      }
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
      setIsSpeaking(false);
      speechRef.current = null;
      
      // Se foi interrompido, não mostrar erro nem log
      if (event.error === 'interrupted') {
        return;
      }
      
      // Só mostrar erro se não for interrupção
      console.error('Erro na síntese de fala:', event);
    };

    // Armazenar referência e iniciar fala
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, isEnabled, selectedVoice, readMessages, stop]);

  const clearReadHistory = useCallback(() => {
    setReadMessages(new Set());
  }, []);

  // Resetar a flag de parada quando necessário
  const resetStopFlag = useCallback(() => {
    shouldStopRef.current = false;
  }, []);

  return {
    isEnabled,
    isSpeaking,
    toggleSpeech,
    speak,
    stop,
    clearReadHistory,
    resetStopFlag,
  };
}
