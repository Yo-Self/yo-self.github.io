"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useWebLLM } from '../hooks/useWebLLM';
import ChatDishCard from './ChatDishCard';
import ChatDishLink from './ChatDishLink';

interface AIChatbotProps {
  menuData: any;
  isOpen: boolean;
  onClose: () => void;
  onOpenDishModal?: (dish: any) => void;
}

export default function AIChatbot({ menuData, isOpen, onClose, onOpenDishModal }: AIChatbotProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    messages,
    isLoading,
    isInitialized,
    isWebLLMAvailable,
    sendMessage,
    clearChat,
    initialize,
    openDishModal
  } = useWebLLM(menuData, onOpenDishModal);

  // Inicializa o chatbot quando o componente é montado
  useEffect(() => {
    if (isOpen && !isInitialized) {
      initialize();
    }
  }, [isOpen, isInitialized, initialize]);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Foca no input quando o chatbot abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Esconde sugestões quando pressiona Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const message = inputMessage.trim();
    setInputMessage('');
    setShowSuggestions(false);
    await sendMessage(message);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputMessage(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInputMessage(suggestion);
    setShowSuggestions(false);
    await sendMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Função para gerar sugestões dinâmicas baseadas no texto digitado
  const getDynamicSuggestions = (text: string): string[] => {
    const lowerText = text.toLowerCase();
    const suggestions: string[] = [];

    // Se o texto estiver vazio, mostra sugestões gerais
    if (!text.trim()) {
      return [
        "Quais são os pratos mais populares?",
        "Tem opções sem glúten?",
        "Quais são as sobremesas?",
        "Pratos vegetarianos?"
      ];
    }

    // Sugestões baseadas em palavras-chave
    if (lowerText.includes('popular') || lowerText.includes('destaque') || lowerText.includes('recomend')) {
      suggestions.push("Quais são os pratos mais populares?");
      suggestions.push("Mostre os pratos em destaque");
    }

    if (lowerText.includes('glúten') || lowerText.includes('gluten') || lowerText.includes('celíac')) {
      suggestions.push("Tem opções sem glúten?");
      suggestions.push("Quais pratos são seguros para celíacos?");
    }

    if (lowerText.includes('vegetar') || lowerText.includes('vegan')) {
      suggestions.push("Pratos vegetarianos?");
      suggestions.push("Opções veganas disponíveis?");
    }

    if (lowerText.includes('ingrediente') || lowerText.includes('contém') || lowerText.includes('tem')) {
      const dishes = menuData.menu_items?.slice(0, 3) || [];
      dishes.forEach((dish: any) => {
        suggestions.push(`Quais são os ingredientes do ${dish.name}?`);
      });
    }

    if (lowerText.includes('preço') || lowerText.includes('quanto') || lowerText.includes('valor') || lowerText.includes('barato')) {
      suggestions.push("Pratos mais acessíveis?");
      suggestions.push("Quais são os preços?");
    }

    if (lowerText.includes('sobremesa') || lowerText.includes('doce') || lowerText.includes('sobremesas')) {
      suggestions.push("Quais são as sobremesas?");
      suggestions.push("Tem doces caseiros?");
    }

    if (lowerText.includes('peixe') || lowerText.includes('camarão') || lowerText.includes('frutos do mar')) {
      suggestions.push("Pratos de frutos do mar?");
      suggestions.push("Opções de peixe?");
    }

    // Se não encontrou sugestões específicas, mostra sugestões gerais
    if (suggestions.length === 0) {
      return [
        "Quais são os pratos mais populares?",
        "Tem opções sem glúten?",
        "Quais são as sobremesas?",
        "Pratos vegetarianos?"
      ];
    }

    return suggestions.slice(0, 4); // Limita a 4 sugestões
  };

  // Função para renderizar mensagens com cards e links
  const renderMessageContent = (content: string) => {
    // Busca por padrões de pratos específicos
    const dishPattern = /"([^"]+)"\s+é\s+([^.]+)\./g;
    const matches = Array.from(content.matchAll(dishPattern));
    
    if (matches.length > 0) {
      // Encontrou um prato específico, renderiza card
      const dishName = matches[0][1];
      const dish = menuData.menu_items?.find((item: any) => 
        item.name.toLowerCase().includes(dishName.toLowerCase())
      ) || menuData.featured_dishes?.find((item: any) => 
        item.name.toLowerCase().includes(dishName.toLowerCase())
      );
      
      if (dish) {
        return (
          <div className="space-y-3">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {content.replace(dishPattern, '')}
            </div>
            <ChatDishCard 
              dish={dish} 
              onClick={() => openDishModal(dish)}
            />
          </div>
        );
      }
    }

    // Busca por listas de pratos
    const listPattern = /•\s+([^:]+):\s+R\$\s+([^\n]+)/g;
    const listMatches = Array.from(content.matchAll(listPattern));
    
    if (listMatches.length > 0) {
      const parts = content.split(listPattern);
      const elements: React.ReactNode[] = [];
      
      for (let i = 0; i < parts.length; i++) {
        if (i % 3 === 0) {
          // Texto normal
          elements.push(
            <span key={i} className="whitespace-pre-wrap">
              {parts[i]}
            </span>
          );
        } else if (i % 3 === 1) {
          // Nome do prato
          const dishName = parts[i];
          const dish = menuData.menu_items?.find((item: any) => 
            item.name.toLowerCase().includes(dishName.toLowerCase())
          ) || menuData.featured_dishes?.find((item: any) => 
            item.name.toLowerCase().includes(dishName.toLowerCase())
          );
          
          if (dish) {
            elements.push(
              <ChatDishLink 
                key={i} 
                dish={dish} 
                onClick={() => openDishModal(dish)}
              />
            );
          } else {
            elements.push(
              <span key={i} className="font-medium">
                {dishName}
              </span>
            );
          }
        } else {
          // Preço
          elements.push(
            <span key={i} className="text-gray-600 dark:text-gray-400">
              : R$ {parts[i]}
            </span>
          );
        }
      }
      
      return <div className="whitespace-pre-wrap text-sm leading-relaxed">{elements}</div>;
    }

    // Texto normal
    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {content}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Chat Container */}
      <div className="relative w-full max-w-md h-[80vh] sm:h-[600px] bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Assistente IA</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400' : isWebLLMAvailable ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                <p className="text-sm text-white text-opacity-80">
                  {isLoading ? 'Carregando...' : isWebLLMAvailable ? 'IA Ativa' : 'Modo Inteligente'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                {renderMessageContent(message.content)}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Digitando...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          {/* Dynamic Suggestions */}
          {showSuggestions && (
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                💡 Sugestões:
              </div>
              <div className="flex flex-wrap gap-2">
                {getDynamicSuggestions(inputMessage).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-cyan-300 dark:hover:border-cyan-500 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 