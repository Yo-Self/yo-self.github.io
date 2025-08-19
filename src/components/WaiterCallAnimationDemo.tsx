"use client";

import React, { useState } from 'react';
import WaiterCallButton from './WaiterCallButton';

export default function WaiterCallAnimationDemo() {
  const [restaurantId] = useState('demo-restaurant-123');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          🛎️ Demonstração das Animações do Modal de Garçom
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
          Clique no botão abaixo para ver o modal de chamar garçom abrir e fechar com animações suaves e elegantes.
        </p>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Características das Animações:
          </h2>
          <ul className="text-left text-gray-600 dark:text-gray-400 space-y-2 max-w-md mx-auto">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Abertura suave com escala e movimento vertical
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Fechamento rápido e responsivo
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Backdrop com blur otimizado para performance
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Campos do formulário com entrada sequencial rápida
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Botões com hover e active states animados
            </li>
          </ul>
        </div>

        {/* Botão de demonstração */}
        <div className="flex justify-center">
          <WaiterCallButton 
            restaurantId={restaurantId}
            waiterCallEnabled={true}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-2xl flex items-center justify-center hover:from-orange-600 hover:to-red-600"
          />
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
          Clique no botão para testar as animações de abertura e fechamento
        </p>

        {/* Informações técnicas */}
        <div className="mt-12 p-6 bg-white/50 dark:bg-gray-800/50 rounded-2xl backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            🎨 Detalhes Técnicos
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left max-w-lg mx-auto">
            <p><strong>Duração:</strong> 300ms para abertura, 250ms para fechamento</p>
            <p><strong>Easing:</strong> ease-out para abertura, ease-in para fechamento</p>
            <p><strong>Efeitos:</strong> Scale, translateY, opacity (simplificados para suavidade)</p>
            <p><strong>Backdrop:</strong> Blur reduzido (4px) para melhor performance</p>
            <p><strong>Formulário:</strong> Entrada sequencial rápida com delays otimizados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
