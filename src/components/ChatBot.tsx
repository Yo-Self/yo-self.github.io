"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useWebLLM, ChatMessage } from '../hooks/useWebLLM';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { Restaurant, Dish } from './data';
import ChatDishCards from './ChatDishCards';
import VoiceNotification from './VoiceNotification';

interface ChatBotProps {
  restaurant: Restaurant;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatBot({ restaurant, isOpen, onClose }: ChatBotProps) {
  const { messages, isLoading, sendMessage, clearChat } = useWebLLM();
  const { 
    isEnabled: isSpeechEnabled, 
    isSpeaking, 
    toggleSpeech, 
    speak, 
    stop,
    clearReadHistory,
    availableVoices,
    selectedVoice,
    setVoice
  } = useTextToSpeech();
  const [inputMessage, setInputMessage] = useState('');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [showDishModal, setShowDishModal] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showVoiceNotification, setShowVoiceNotification] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Mostrar notificação de voz na primeira vez que abrir o chat
  useEffect(() => {
    if (isOpen && !localStorage.getItem('voice-notification-shown')) {
      setTimeout(() => {
        setShowVoiceNotification(true);
        localStorage.setItem('voice-notification-shown', 'true');
      }, 1000);
    }
  }, [isOpen]);

  // Ler automaticamente novas mensagens do assistente
  useEffect(() => {
    if (isSpeechEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'model' && !isSpeaking) {
        // Aguardar um pouco para a mensagem aparecer na tela
        setTimeout(() => {
          speak(lastMessage.content, false); // false = leitura automática
        }, 500);
      }
    }
  }, [messages, isSpeechEnabled, speak, isSpeaking]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message, restaurant);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleDishClick = (dish: Dish) => {
    setSelectedDish(dish);
    setShowDishModal(true);
  };

  const handleCloseDishModal = () => {
    setShowDishModal(false);
    setSelectedDish(null);
  };

  const handleClearChat = () => {
    clearChat();
    clearReadHistory(); // Limpar histórico de mensagens lidas
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl flex flex-col h-[80vh] max-h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Assistente {restaurant.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isLoading ? 'Digitando...' : 'Online'}
                {isSpeechEnabled && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                    🔊 Voz ativada
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Botão de configurações de voz */}
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Configurações de voz"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            {/* Botão de ativar/desativar leitura */}
            <button
              onClick={toggleSpeech}
              className={`p-2 transition-colors ${
                isSpeechEnabled 
                  ? 'text-green-500 hover:text-green-600' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              title={isSpeechEnabled ? 'Desativar leitura de voz' : 'Ativar leitura de voz'}
            >
              {isSpeaking ? (
                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
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
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Fechar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Painel de configurações de voz */}
        {showVoiceSettings && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Configurações de Voz
                </h4>
                <button
                  onClick={() => setShowVoiceSettings(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Seletor de voz */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Voz
                </label>
                <select
                  value={selectedVoice?.name || ''}
                  onChange={(e) => {
                    const voice = availableVoices.find(v => v.name === e.target.value);
                    setVoice(voice || null);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Status da funcionalidade */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                  Leitura automática: {isSpeechEnabled ? 'Ativada' : 'Desativada'}
                </span>
                {isSpeaking && (
                  <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Falando...
                  </span>
                )}
              </div>
              
              {/* Botões de ação */}
              <div className="flex gap-2">
                <button
                  onClick={() => speak('Olá! Esta é uma mensagem de teste para verificar se a leitura de voz está funcionando corretamente.', true)}
                  disabled={isSpeaking}
                  className="flex-1 px-3 py-2 text-sm bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 text-white rounded-md transition-colors"
                >
                  Testar Voz
                </button>
                <button
                  onClick={clearReadHistory}
                  className="px-3 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                  title="Limpar histórico de mensagens lidas"
                >
                  🔄
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Olá! 👋
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Sou o assistente do {restaurant.name}. Como posso te ajudar hoje?
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Você pode me perguntar sobre:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Pratos populares', 'Ingredientes', 'Preços', 'Recomendações'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendMessage(suggestion, restaurant)}
                      className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-xs ${
                      message.role === 'user' ? 'text-cyan-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                    <div className="flex items-center gap-2">
                      {message.role === 'model' && message.model && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {message.model === 'gemma-3-superto' ? '🤖 Gemma 3' : 
                           message.model === 'gemma-3-flash' ? '⚡ Gemma 3 Flash' :
                           message.model === 'gemini-1.5-flash' ? '💎 Gemini' : message.model}
                        </p>
                      )}
                      {message.role === 'model' && (
                        <button
                          onClick={() => speak(message.content, true)} // true = leitura manual
                          disabled={isSpeaking}
                          className="text-xs text-cyan-500 hover:text-cyan-600 disabled:text-gray-400"
                          title="Ler mensagem"
                        >
                          🔊
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Cards dos pratos recomendados */}
                  {message.role === 'model' && message.recommendedDishes && message.recommendedDishes.length > 0 && (
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
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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
