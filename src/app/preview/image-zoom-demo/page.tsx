"use client";

import React from "react";
import ImageWithLoading from "../../../components/ImageWithLoading";

export default function ImageZoomDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          🔍 Demonstração do Zoom de Imagem
        </h1>
        
        <p className="text-lg text-center text-gray-600 dark:text-gray-300 mb-12">
          Clique em qualquer imagem abaixo para visualizá-la em tela cheia
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Exemplo 1: Prato principal */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <h3 className="p-4 font-semibold text-lg border-b border-gray-200 dark:border-gray-700">
              🍔 X-Burger
            </h3>
            <ImageWithLoading
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop"
              alt="X-Burger delicioso"
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Hambúrguer artesanal com queijo e molho especial
              </p>
              <p className="font-bold text-primary text-lg">R$ 25,90</p>
            </div>
          </div>

          {/* Exemplo 2: Pizza */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <h3 className="p-4 font-semibold text-lg border-b border-gray-200 dark:border-gray-700">
              🍕 Pizza Margherita
            </h3>
            <ImageWithLoading
              src="https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop"
              alt="Pizza Margherita tradicional"
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Pizza tradicional com molho de tomate e mussarela
              </p>
              <p className="font-bold text-primary text-lg">R$ 32,50</p>
            </div>
          </div>

          {/* Exemplo 3: Salada */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <h3 className="p-4 font-semibold text-lg border-b border-gray-200 dark:border-gray-700">
              🥗 Salada Caesar
            </h3>
            <ImageWithLoading
              src="https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop"
              alt="Salada Caesar fresca"
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Salada fresca com alface, croutons e molho caesar
              </p>
              <p className="font-bold text-primary text-lg">R$ 18,90</p>
            </div>
          </div>

          {/* Exemplo 4: Sushi */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <h3 className="p-4 font-semibold text-lg border-b border-gray-200 dark:border-gray-700">
              🍣 Sushi Combo
            </h3>
            <ImageWithLoading
              src="https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop"
              alt="Combo de sushi variado"
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Combo com 12 peças de sushi variado
              </p>
              <p className="font-bold text-primary text-lg">R$ 45,00</p>
            </div>
          </div>

          {/* Exemplo 5: Sobremesa */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <h3 className="p-4 font-semibold text-lg border-b border-gray-200 dark:border-gray-700">
              🍰 Cheesecake
            </h3>
            <ImageWithLoading
              src="https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&h=300&fit=crop"
              alt="Cheesecake cremoso"
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Cheesecake cremoso com calda de frutas vermelhas
              </p>
              <p className="font-bold text-primary text-lg">R$ 15,90</p>
            </div>
          </div>

          {/* Exemplo 6: Bebida */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <h3 className="p-4 font-semibold text-lg border-b border-gray-200 dark:border-gray-700">
              🥤 Smoothie Natural
            </h3>
            <ImageWithLoading
              src="https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=300&fit=crop"
              alt="Smoothie natural colorido"
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Smoothie natural com frutas da estação
              </p>
              <p className="font-bold text-primary text-lg">R$ 12,90</p>
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="mt-16 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-4">
            📱 Como Usar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                🖱️ Desktop
              </h3>
              <ul className="text-blue-600 dark:text-blue-400 space-y-1">
                <li>• Clique em qualquer imagem</li>
                <li>• Use ESC para fechar rapidamente</li>
                <li>• Clique fora para fechar</li>
                <li>• Hover para efeito visual</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                📱 Mobile
              </h3>
              <ul className="text-blue-600 dark:text-blue-400 space-y-1">
                <li>• Toque em qualquer imagem</li>
                <li>• Toque fora para fechar</li>
                <li>• Controles otimizados para touch</li>
                <li>• Responsivo para todas as telas</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Voltar */}
        <div className="mt-8 text-center">
          <a
            href="/preview"
            className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors"
          >
            ← Voltar para Preview
          </a>
        </div>
      </div>
    </div>
  );
}
