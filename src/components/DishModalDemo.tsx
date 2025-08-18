"use client";

import React, { useState } from "react";
import DishModal from "./DishModal";
import { Dish } from "./data";

// Dados de exemplo para demonstração
const demoDish: Dish = {
  id: "demo-1",
  name: "Pasta Carbonara",
  description: "Uma deliciosa pasta italiana com molho cremoso de ovos, queijo parmesão, bacon crocante e pimenta preta fresca. Uma experiência gastronômica autêntica que transporta você diretamente para as ruas de Roma.",
  price: "32,90",
  image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800&h=600&fit=crop",
  ingredients: "Pasta fresca, ovos, queijo parmesão, bacon, pimenta preta, sal",
  allergens: "Ovos, leite (queijo), glúten",
  portion: "350g",
  tags: ["Italiana", "Cremosa", "Premium"],
  complement_groups: [
    {
      title: "Proteínas Adicionais",
      required: false,
      max_selections: 2,
      complements: [
        { name: "Frango Grelhado", price: "8,90" },
        { name: "Camarão", price: "12,90" },
        { name: "Salmão", price: "15,90" }
      ]
    },
    {
      title: "Vegetais",
      required: false,
      max_selections: 3,
      complements: [
        { name: "Brócolis", price: "4,90" },
        { name: "Espinafre", price: "3,90" },
        { name: "Tomate Cereja", price: "3,90" }
      ]
    },
    {
      title: "Molhos Extras",
      required: false,
      max_selections: 1,
      complements: [
        { name: "Molho de Trufas", price: "6,90" },
        { name: "Molho de Gorgonzola", price: "5,90" }
      ]
    }
  ]
};

export default function DishModalDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
          🍝 Demonstração do Modal Animado
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
          Clique no botão abaixo para ver as animações bonitas do modal de detalhes do prato.
          O modal inclui transições suaves, efeitos de entrada e saída, e uma experiência visual aprimorada.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-cyan-600 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            🎬 Abrir Modal Animado
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>✨ Animações incluídas:</p>
            <ul className="mt-2 space-y-1">
              <li>• Fade-in suave do backdrop</li>
              <li>• Slide-in com escala do modal</li>
              <li>• Zoom da imagem com delay</li>
              <li>• Rotação do botão de fechar</li>
              <li>• Slide do título</li>
              <li>• Entrada sequencial dos elementos</li>
              <li>• Bounce das tags</li>
              <li>• Pulse do preço total</li>
            </ul>
          </div>
        </div>
      </div>

      <DishModal
        open={isModalOpen}
        dish={demoDish}
        restaurantId="demo"
        restaurant={{ whatsapp_enabled: true }}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
