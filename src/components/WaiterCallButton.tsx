"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useWaiterCalls } from '@/hooks/useWaiterCalls';

interface WaiterCallButtonProps {
  restaurantId: string;
  waiterCallEnabled?: boolean;
  className?: string;
  'data-tutorial'?: string;
}

export default function WaiterCallButton({ restaurantId, waiterCallEnabled = false, className = "", ...props }: WaiterCallButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCall, error, clearError } = useWaiterCalls();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tableNumber.trim()) {
      alert('Por favor, informe o número da mesa');
      return;
    }

    const tableNum = parseInt(tableNumber);
    if (isNaN(tableNum) || tableNum <= 0) {
      alert('Por favor, informe um número de mesa válido');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const result = await createCall(restaurantId, tableNum, notes.trim() || undefined);
      
              if (result) {
          // Tocar o som quando a chamada for enviada com sucesso
          await playBellSound();
          alert('Chamada de garçom enviada com sucesso!');
          setIsClosing(true);
          // Aguardar a animação terminar antes de fechar
          setTimeout(() => {
            setShowModal(false);
            setIsClosing(false);
            setTableNumber('');
            setNotes('');
          }, 250);
        } else {
          alert('Erro ao enviar chamada de garçom. Tente novamente.');
        }
    } catch (err) {
      console.error('Error creating waiter call:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsClosing(true);
    // Aguardar a animação terminar antes de fechar
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
      setTableNumber('');
      setNotes('');
      clearError();
    }, 250); // Tempo da animação de fechamento
  };

  // Inicializar contexto de áudio
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        // Silenciar erro
      }
    }
  };

  // Carregar arquivo de áudio
  const loadAudioFile = async () => {
    if (!audioContextRef.current || audioBufferRef.current) return;
    
    try {
      const response = await fetch('/restaurant-bell.mp3');
      const arrayBuffer = await response.arrayBuffer();
      audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
    } catch (error) {
      // Silenciar erro
    }
  };

  // Gerar som de sino programaticamente como fallback
  const generateBellSound = () => {
    if (!audioContextRef.current) return null;
    
    try {
      const sampleRate = audioContextRef.current.sampleRate;
      const duration = 2.0; // 2 segundos
      const numSamples = Math.floor(sampleRate * duration);
      
      const buffer = audioContextRef.current.createBuffer(1, numSamples, sampleRate);
      const channelData = buffer.getChannelData(0);
      
      // Frequência base do sino (aproximadamente 800Hz)
      const baseFreq = 800;
      
      // Harmônicos do sino
      const harmonics = [
        { freq: baseFreq, amplitude: 1.0, decay: 0.1 },
        { freq: baseFreq * 2, amplitude: 0.5, decay: 0.15 },
        { freq: baseFreq * 3, amplitude: 0.3, decay: 0.2 },
        { freq: baseFreq * 4, amplitude: 0.2, decay: 0.25 }
      ];
      
      // Gerar o som
      for (let i = 0; i < numSamples; i++) {
        const time = i / sampleRate;
        let sample = 0;
        
        // Adicionar cada harmônico
        harmonics.forEach(harmonic => {
          const envelope = Math.exp(-time / harmonic.decay);
          sample += harmonic.amplitude * envelope * Math.sin(2 * Math.PI * harmonic.freq * time);
        });
        
        // Aplicar envelope geral
        const overallEnvelope = Math.exp(-time / 0.5);
        channelData[i] = sample * overallEnvelope * 0.3; // Reduzir volume
      }
      
      return buffer;
    } catch (error) {
      return null;
    }
  };

  const playBellSound = async () => {
    // Primeiro, tentar com o elemento de áudio HTML (com timeout rápido)
    try {
      if (audioRef.current) {
        // Verificar e definir src se necessário
        if (!audioRef.current.src || audioRef.current.src === '') {
          audioRef.current.src = '/restaurant-bell.mp3';
        }
        
        // Se o áudio não está pronto, pular para Web Audio API
        if (audioRef.current.readyState < 2) {
          throw new Error('Audio not ready');
        }
        
        audioRef.current.muted = false;
        audioRef.current.volume = 0.5;
        audioRef.current.currentTime = 0;
        
        const playPromise = audioRef.current.play();
        
        try {
          await Promise.race([
            playPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('HTML Audio timeout')), 1000))
          ]);
          return;
        } catch (playError: any) {
          // Silenciar erro
        }
      }
    } catch (error) {
      // Silenciar erro
    }

    // Se HTML Audio falhar, tentar com Web Audio API
    try {
      initAudioContext();
      await loadAudioFile();
      
      if (audioContextRef.current && audioBufferRef.current) {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(audioContextRef.current.destination);
        source.start(0);
        return;
      } else {
        const generatedBuffer = generateBellSound();
        if (generatedBuffer && audioContextRef.current) {
          const source = audioContextRef.current.createBufferSource();
          source.buffer = generatedBuffer;
          source.connect(audioContextRef.current.destination);
          source.start(0);
          return;
        }
      }
    } catch (error) {
      // Silenciar erro
    }
  };

  const handleButtonClick = async () => {
    // Adicionar efeito de clique no botão
    const button = document.querySelector('[data-waiter-button]') as HTMLElement;
    if (button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 150);
    }
    
    setShowModal(true);
  };



  return (
    <>

      
      {/* Áudio do sino de restaurante */}
      <audio 
        ref={audioRef} 
        preload="auto" 
        muted
        src="/restaurant-bell.mp3"
      >
        Seu navegador não suporta o elemento de áudio.
      </audio>

      {/* Botão de chamar garçom */}
      <button
        onClick={handleButtonClick}
        className={`${className || "w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg flex items-center justify-center"} transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-xl`}
        aria-label="Chamar garçom"
        title="Chamar garçom"
        data-waiter-button
        {...props}
      >
        <svg width="45" height="45" viewBox="0 0 258 234" fill="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="waiter-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4">
                <animate attributeName="stop-color" values="#06b6d4;#818cf8;#f472b6;#facc15;#06b6d4" dur="2.5s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#facc15">
                <animate attributeName="stop-color" values="#facc15;#06b6d4;#818cf8;#f472b6;#facc15" dur="2.5s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
          <g transform="translate(0.000000,234.000000) scale(0.100000,-0.100000)" fill="url(#waiter-gradient)" stroke="none">
            <path d="M2014 2098 c-34 -34 -131 -98 -319 -210 -303 -181 -982 -644 -1003 -684 -29 -56 21 -134 87 -134 31 0 83 33 351 219 l315 219 40 -28 c22 -15 73 -46 114 -71 l74 -43 -189 -182 c-186 -180 -189 -182 -189 -224 0 -35 6 -47 33 -71 23 -20 43 -29 68 -29 32 0 52 17 231 188 187 179 197 187 243 193 147 20 360 229 360 355 0 28 12 44 89 116 l89 83 -173 176 -173 177 -48 -50z m196 -150 c77 -78 140 -146 140 -151 0 -13 -129 -135 -136 -128 -3 3 -4 2 -3 -4 6 -23 -36 -151 -59 -177 -8 -10 -13 -18 -10 -18 10 0 -95 -105 -138 -138 -23 -18 -51 -32 -62 -32 -12 0 -23 -4 -27 -9 -3 -5 -29 -15 -58 -21 -42 -9 -63 -21 -112 -68 -269 -255 -323 -302 -349 -302 -31 0 -66 32 -66 60 0 22 82 117 142 165 20 17 37 36 37 43 1 6 5 12 10 12 16 0 171 163 171 180 0 9 -9 26 -20 38 -21 22 -135 92 -151 92 -5 0 -9 4 -9 8 0 11 -45 32 -67 32 -17 0 -35 -11 -146 -86 -32 -21 -65 -43 -74 -49 -9 -5 -26 -18 -37 -28 -11 -10 -31 -20 -43 -23 -13 -4 -23 -10 -23 -14 0 -5 -33 -30 -72 -56 -40 -27 -75 -50 -78 -54 -3 -3 -27 -21 -55 -39 -27 -19 -53 -40 -57 -45 -4 -6 -8 -7 -8 -2 0 5 -8 2 -17 -6 -34 -30 -61 -31 -88 -4 -46 46 -31 71 90 154 34 23 64 42 67 42 7 0 45 30 84 66 12 12 25 20 28 17 3 -3 12 2 21 10 9 9 64 49 123 88 59 39 126 87 150 106 23 19 42 32 42 28 0 -3 12 6 27 20 15 14 31 25 35 25 4 0 32 16 62 35 30 19 58 35 61 35 4 0 25 13 48 29 50 34 145 91 153 91 5 0 64 40 74 50 3 3 23 14 45 26 81 42 105 58 164 111 20 18 40 33 44 33 4 0 71 -64 147 -142z"/>
            <path d="M1338 1402 c-94 -65 -98 -69 -124 -135 -36 -90 -29 -105 66 -140 l72 -27 69 63 c38 34 69 64 69 67 0 3 -20 12 -45 19 -25 7 -45 16 -45 20 0 4 16 47 35 96 51 130 42 133 -97 37z m66 -24 c-4 -13 -11 -34 -17 -48 -17 -43 -15 -63 10 -87 12 -13 23 -28 23 -32 0 -19 -72 -72 -89 -66 -9 4 -29 12 -46 17 -53 19 -60 30 -44 83 15 49 41 79 110 124 54 36 62 37 53 9z"/>
            <path d="M1463 1361 l-30 -79 41 -16 41 -16 43 44 44 44 -52 17 c-41 13 -50 20 -45 34 11 26 11 44 -1 48 -6 2 -25 -32 -41 -76z m51 -27 c17 -7 10 -34 -9 -34 -17 0 -28 17 -20 30 7 12 8 12 29 4z"/>
            <path d="M1802 1178 c-31 -33 -31 -33 -13 -57 l19 -24 26 26 c17 17 26 37 26 57 0 39 -18 39 -58 -2z"/>
            <path d="M1680 1060 c-35 -32 -62 -62 -58 -66 4 -3 28 -9 53 -12 38 -4 50 -1 70 18 13 12 26 32 29 45 6 25 -8 75 -21 75 -5 -1 -37 -27 -73 -60z"/>
            <path d="M693 994 c-9 -24 15 -35 72 -32 42 3 50 6 50 23 0 17 -8 20 -58 23 -46 2 -59 0 -64 -14z"/>
            <path d="M710 910 c0 -5 20 -10 45 -10 25 0 45 5 45 10 0 6 -20 10 -45 10 -25 0 -45 -4 -45 -10z"/>
            <path d="M625 866 c-61 -20 -136 -60 -181 -100 -84 -72 -163 -226 -134 -261 18 -22 871 -22 889 -1 18 21 4 77 -36 143 -93 156 -231 234 -411 232 -48 0 -105 -6 -127 -13z m230 -28 c22 -5 68 -23 102 -39 94 -46 199 -168 210 -246 l4 -23 -411 0 c-347 0 -411 2 -416 14 -6 15 23 86 35 86 3 0 12 12 19 28 18 39 30 52 97 103 66 50 118 74 186 84 24 4 46 9 48 11 5 5 72 -5 126 -18z"/>
            <path d="M530 448 l0 -23 225 0 225 0 0 23 0 22 -225 0 -225 0 0 -22z"/>
            <path d="M312 388 c-13 -17 -48 -146 -40 -153 7 -7 959 -7 967 0 7 8 -26 135 -40 152 -16 19 -871 19 -887 1z m862 -40 c24 -38 30 -70 15 -79 -18 -11 -850 -11 -868 0 -11 7 -11 15 -1 45 6 20 19 40 28 46 10 6 174 10 414 10 l398 0 14 -22z"/>
          </g>
        </svg>
      </button>

      {/* Modal */}
      {showModal && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
            isClosing 
              ? 'animate-waiter-backdrop-close' 
              : 'animate-waiter-backdrop-open'
          }`}
          style={{
            background: isClosing 
              ? 'rgba(0, 0, 0, 0.3)' 
              : 'rgba(0, 0, 0, 0.5)',
            backdropFilter: isClosing ? 'blur(4px)' : 'blur(8px)'
          }}
        >
          <div 
            className={`bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 waiter-modal-transition ${
              isClosing 
                ? 'animate-waiter-modal-close' 
                : 'animate-waiter-modal-open'
            }`}
          >
                          <div 
                className="flex items-center justify-between mb-4 transform transition-all duration-300 delay-25"
                style={{
                  animation: isClosing ? 'none' : 'fadeInUp 0.4s ease-out forwards'
                }}
              >
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Chamar Garçom
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 hover:scale-110 active:scale-95 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Fechar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div 
                className="transform transition-all duration-300 delay-75"
                style={{
                  animation: isClosing ? 'none' : 'fadeInUp 0.4s ease-out forwards'
                }}
              >
                <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número da Mesa *
                </label>
                <input
                  type="number"
                  id="tableNumber"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200 hover:border-orange-400 focus:border-orange-500"
                  placeholder="Ex: 5"
                  min="1"
                  required
                />
              </div>

              <div 
                className="transform transition-all duration-300 delay-150"
                style={{
                  animation: isClosing ? 'none' : 'fadeInUp 0.4s ease-out forwards'
                }}
              >
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200 hover:border-orange-400 focus:border-orange-500"
                  placeholder="Ex: Preciso de mais água, tem alguma dúvida sobre o cardápio..."
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div 
                className="flex gap-3 pt-2 transform transition-all duration-300 delay-200"
                style={{
                  animation: isClosing ? 'none' : 'fadeInUp 0.4s ease-out forwards'
                }}
              >
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105 active:scale-95"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 disabled:bg-orange-400 disabled:cursor-not-allowed hover:scale-105 active:scale-95 hover:shadow-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </div>
                  ) : (
                    'Chamar Garçom'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
