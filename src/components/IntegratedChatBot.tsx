"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useIntegratedSearch, SearchResult } from '../hooks/useIntegratedSearch';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useModalScroll } from '../hooks/useModalScroll';
import { Restaurant, Dish, MenuItem } from './data';
import ChatDishCards from './ChatDishCards';
import VoiceNotification from './VoiceNotification';
import DishModal from './DishModal';
import DishCard from './DishCard';
import Analytics from '../lib/analytics';

interface IntegratedChatBotProps {
  restaurant: Restaurant;
  restaurants: Restaurant[];
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement>; // Referência para o botão de busca
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type: 'search' | 'llm';
  items?: any[];
  recommendedDishes?: any[];
  model?: string;
}

export default function IntegratedChatBot({ restaurant, restaurants, isOpen, onClose, buttonRef }: IntegratedChatBotProps) {
  const { results, isLoading, error, search, clearResults } = useIntegratedSearch();
  const { 
    isEnabled: isSpeechEnabled, 
    isSpeaking, 
    toggleSpeech, 
    speak, 
    stop,
    clearReadHistory,
    resetStopFlag
  } = useTextToSpeech();
  

  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedDish, setSelectedDish] = useState<Dish | MenuItem | null>(null);
  const [showDishModal, setShowDishModal] = useState(false);
  const [chatOpenTime, setChatOpenTime] = useState<number | null>(null);

  const [showVoiceNotification, setShowVoiceNotification] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Track chatbot session
  useEffect(() => {
    if (isOpen) {
      const openTime = Date.now();
      setChatOpenTime(openTime);
      Analytics.trackChatbotOpened(restaurant.id, 'integrated');
    } else if (chatOpenTime) {
      const sessionLength = Math.round((Date.now() - chatOpenTime) / 1000);
      Analytics.trackChatbotClosed(restaurant.id, sessionLength, messages.length);
      setChatOpenTime(null);
    }
  }, [isOpen, restaurant.id, messages.length, chatOpenTime]);

  // Auto-scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Resetar flag de parada quando abrir o chatbot
  useEffect(() => {
    if (isOpen) {
      resetStopFlag();
    }
  }, [isOpen, resetStopFlag]);

  // Mostrar notificação de voz na primeira vez que abrir o chat
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && !localStorage.getItem('voice-notification-shown')) {
      setTimeout(() => {
        setShowVoiceNotification(true);
        localStorage.setItem('voice-notification-shown', 'true');
      }, 1000);
    }
  }, [isOpen]);

  // Controlar o scroll do body quando o chat abrir/fechar
  useModalScroll(isOpen);

  // Parar a leitura quando o componente for desmontado
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Efeito de entrada animada
  useEffect(() => {
    if (isOpen) {
      // Iniciar animação
      setAnimationStarted(true);
      setIsEntering(true);
      
      // Aplicar animação diretamente via JavaScript
      if (chatRef.current) {
        const element = chatRef.current;
        
        // Estado inicial
        element.style.transform = 'scale(0.1) translateY(100px)';
        element.style.opacity = '0';
        
        // Forçar reflow
        element.offsetHeight;
        
        // Aplicar animação
        element.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        element.style.transform = 'scale(1) translateY(0)';
        element.style.opacity = '1';
        
      }
      
      // Aplicar animação de entrada após um pequeno delay
      setTimeout(() => {
        setIsEntering(false);
        // Removido o bounce sutil para evitar chacoalhada
      }, 400); // Reduzido para sincronizar com a nova duração da animação
    } else {
      // Resetar estados quando fechar
      setAnimationStarted(false);
      setIsEntering(false);
    }
  }, [isOpen]);

  // Processar resultados da busca/LLM
  useEffect(() => {
    if (results) {
      setMessages(prev => {
        if (prev.length === 0) return prev;
        
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role === 'user') {
          // Adicionar resposta do assistente
          const assistantMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: results.type === 'llm' ? results.message || '' : 
                     results.items && results.items.length > 0 
                       ? `Encontrei ${results.items.length} resultado(s) para "${lastMessage.content}":`
                       : `Nenhum resultado encontrado para "${lastMessage.content}".`,
            timestamp: new Date(),
            type: results.type,
            items: results.items,
            recommendedDishes: results.recommendedDishes,
            model: results.model,
          };

          return [...prev, assistantMessage];
        }
        return prev;
      });
    }
  }, [results]);

  // Efeito separado para leitura automática
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content) {
        // Ler automaticamente a resposta se a voz estiver ativada
        if (isSpeechEnabled && lastMessage.content && !isSpeaking) {
          setTimeout(() => {
            speak(lastMessage.content, false);
          }, 500);
        }
      }
    }
  }, [messages, isSpeechEnabled, speak, isSpeaking]);

  // Processar erros
  useEffect(() => {
    if (error && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Desculpe, ocorreu um erro: ${error}`,
          timestamp: new Date(),
          type: 'llm',
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    }
  }, [error, messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');

    // Adicionar mensagem do usuário
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      type: 'search', // Será atualizado baseado no resultado
    };

    setMessages(prev => [...prev, userMessage]);

    // Executar busca/LLM
    await search(message, restaurant, restaurants);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleDishClick = useCallback((dish: Dish | MenuItem) => {
    setSelectedDish(dish);
    setShowDishModal(true);
  }, []);

  const handleCloseDishModal = () => {
    setShowDishModal(false);
    setSelectedDish(null);
  };

  const handleClearChat = () => {
    setMessages([]);
    clearResults();
    clearReadHistory();
  };

  const handleClose = () => {
    if (isAnimating) return;
    
    // Parar a leitura de voz imediatamente quando fechar o chatbot
    stop();
    
    setIsAnimating(true);
    
    // Aplicar animação de saída via JavaScript
    if (chatRef.current) {
      const element = chatRef.current;
      
      // Aplicar animação de saída
      element.style.transition = 'all 0.4s cubic-bezier(0.55, 0.055, 0.675, 0.19)';
      element.style.transform = 'scale(0.1) translateY(100px)';
      element.style.opacity = '0';
      
    }
    
    // Animar o backdrop blur também
    const backdrop = document.querySelector('.chat-backdrop');
    if (backdrop) {
      backdrop.classList.add('bg-black/0');
    }
    
    // Aguardar a animação terminar antes de fechar
    setTimeout(() => {
      setIsAnimating(false);
      onClose();
    }, 400);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Função para processar o conteúdo das mensagens e transformar nomes de pratos com asteriscos em links
  const processMessageContent = (content: string) => {
    // Regex para encontrar nomes de pratos entre asteriscos (*nome do prato*)
    const dishNameRegex = /\*([^*]+)\*/g;
    
    // Substituir nomes de pratos por links clicáveis
    const processedContent = content.replace(dishNameRegex, (match, dishName) => {
      // Buscar o prato no cardápio do restaurante
      const foundDish = restaurant.menu_items?.find(item => 
        item.name.toLowerCase().includes(dishName.toLowerCase()) ||
        dishName.toLowerCase().includes(item.name.toLowerCase())
      );
      
      if (foundDish) {
        // Se encontrou o prato, criar um link clicável
        return `<span class="inline-block px-2 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 rounded-md cursor-pointer hover:bg-cyan-200 dark:hover:bg-cyan-800 transition-colors" onclick="window.dishClickHandler && window.dishClickHandler('${foundDish.name}')">${dishName}</span>`;
      }
      
      // Se não encontrou, apenas remover os asteriscos
      return dishName;
    });
    
    return processedContent;
  };

  // Função para lidar com cliques nos nomes dos pratos
  const handleDishNameClick = useCallback((dishName: string) => {
    const foundDish = restaurant.menu_items?.find(item => 
      item.name.toLowerCase().includes(dishName.toLowerCase()) ||
      dishName.toLowerCase().includes(item.name.toLowerCase())
    );
    
    if (foundDish) {
      handleDishClick(foundDish);
    }
  }, [restaurant.menu_items, handleDishClick]);

  // Expor a função globalmente para o onclick funcionar
  useEffect(() => {
    (window as any).dishClickHandler = handleDishNameClick;
    
    return () => {
      delete (window as any).dishClickHandler;
    };
  }, [handleDishNameClick]);

  // Calcular posição do botão para a animação
  const getButtonPosition = () => {
    if (!buttonRef?.current) return { x: 0, y: 0 };
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    return { x: centerX, y: centerY };
  };

  if (!isOpen) return null;

  const buttonPos = getButtonPosition();

  return (
    <div className={`fixed inset-0 z-[200] flex items-end justify-center backdrop-blur-sm transition-all duration-400 chat-backdrop ${
      animationStarted && isEntering ? 'bg-black/0' : 'bg-black/50'
    }`}>
      <div 
        ref={chatRef}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl flex flex-col h-[80vh] max-h-[600px] transform-gpu chat-transition"
        style={{
          transformOrigin: `${buttonPos.x}px ${buttonPos.y}px`,
        }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 rounded-t-3xl transition-all duration-500 delay-100 ${
          animationStarted && isEntering ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {restaurant.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isLoading ? 'Processando...' : 'Online'}
                {isSpeechEnabled && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                    🔊 Voz ativada
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0">
            {/* Switch de ativar/desativar leitura */}
            <button
              onClick={toggleSpeech}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
                isSpeechEnabled ? 'bg-cyan-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              title={isSpeechEnabled ? 'Desativar leitura de voz' : 'Ativar leitura de voz'}
            >
              {/* Texto "Voz" - posição e cor dinâmicas */}
              <span
                className={`absolute text-sm font-medium transition-all duration-200 ${
                  isSpeechEnabled 
                    ? 'left-2 text-white' 
                    : 'right-2 text-gray-600 dark:text-gray-400'
                }`}
              >
                Ler
              </span>
              
              {/* Bola */}
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                  isSpeechEnabled ? 'translate-x-9' : 'translate-x-1'
                } ${isSpeaking ? 'animate-pulse' : ''}`}
              />
            </button>
            
            <button
              onClick={handleClearChat}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Limpar conversa"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Fechar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>



        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 transition-all duration-500 delay-200 ${
          animationStarted && isEntering ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}>
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Busca & IA Integrada! 🔍🤖
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Digite um ingrediente ou prato para buscar, ou faça uma pergunta para o assistente IA.
              </p>
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Exemplos de busca:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['frango', 'arroz', 'salada', 'sobremesa'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInputMessage(suggestion);
                        setTimeout(() => {
                          const form = document.querySelector('form');
                          if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                        }, 100);
                      }}
                      className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                  Exemplos de perguntas:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Qual o prato mais popular?', 'Recomende algo vegetariano', 'Tem opções sem glúten?'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInputMessage(suggestion);
                        setTimeout(() => {
                          const form = document.querySelector('form');
                          if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                        }, 100);
                      }}
                      className="px-3 py-1 text-xs bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 rounded-full hover:bg-cyan-200 dark:hover:bg-cyan-800 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: processMessageContent(message.content) }}></p>
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-xs ${
                      message.role === 'user' ? 'text-cyan-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                    <div className="flex items-center gap-2">
                      {message.role === 'assistant' && (
                        <button
                          onClick={() => speak(message.content, true)}
                          disabled={isSpeaking}
                          className="text-lg text-cyan-500 hover:text-cyan-600 disabled:text-gray-400"
                          title="Ler mensagem"
                        >
                          🔊
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Cards dos pratos encontrados (busca) */}
                  {message.role === 'assistant' && message.type === 'search' && message.items && message.items.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.items.map((item, index) => (
                        <div key={index} onClick={() => handleDishClick(item)}>
                          <DishCard dish={item} size="small" fallbackImage={restaurant.image} />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Cards dos pratos recomendados (LLM) */}
                  {message.role === 'assistant' && message.type === 'llm' && message.recommendedDishes && message.recommendedDishes.length > 0 && (
                    <ChatDishCards
                      dishes={message.recommendedDishes}
                      onDishClick={handleDishClick}
                    />
                  )}
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t border-gray-200 dark:border-gray-700 transition-all duration-500 delay-300 ${
          animationStarted && isEntering ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Buscar pratos ou fazer perguntas..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
      
      {/* Modal de detalhes do prato */}
      {showDishModal && selectedDish && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="relative">
              <img
                src={selectedDish.image}
                alt={selectedDish.name}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={handleCloseDishModal}
                className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedDish.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary dark:text-cyan-500">
                    R$ {selectedDish.price}
                  </span>
                  {selectedDish.tags && selectedDish.tags.length > 0 && (
                    <div className="flex gap-1">
                      {selectedDish.tags.map(tag => (
                        <span key={tag} className="bg-primary dark:bg-cyan-700 text-white text-xs px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {selectedDish.description}
              </p>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Ingredientes
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedDish.ingredients}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Porção
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedDish.portion}
                  </p>
                </div>
                {selectedDish.allergens && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      Alergênicos
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedDish.allergens}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notificação de voz */}
      <VoiceNotification 
        isVisible={showVoiceNotification}
        onClose={() => setShowVoiceNotification(false)}
      />
    </div>
  );
}
