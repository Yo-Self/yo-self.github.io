"use client";

import React, { useState } from "react";
import DishModal from "./DishModal";
import { Dish } from "./data";

// Dados de exemplo para demonstração
const demoDish: Dish = {
  name: "Prato de Demonstração",
  description: "Este é um prato de exemplo para demonstrar as animações de abertura e fechamento do modal. Ele contém ingredientes frescos e é preparado com técnicas culinárias tradicionais.",
  price: "29,90",
  image: "/window.svg",
  ingredients: "Ingrediente 1, Ingrediente 2, Ingrediente 3",
  allergens: "Contém glúten, leite",
  portion: "300g",
  tags: ["Popular", "Vegetariano", "Fresco"],
  complement_groups: [
    {
      title: "Molhos",
      required: false,
      max_selections: 2,
      complements: [
        { name: "Molho Branco", price: "3,00", description: "Molho cremoso branco", image: "/window.svg" },
        { name: "Molho de Ervas", price: "2,50", description: "Molho com ervas frescas", image: "/window.svg" },
        { name: "Molho Picante", price: "2,00", description: "Molho apimentado", image: "/window.svg" }
      ]
    },
    {
      title: "Acompanhamentos",
      required: true,
      max_selections: 1,
      complements: [
        { name: "Arroz", price: "4,00", description: "Arroz branco cozido", image: "/window.svg" },
        { name: "Feijão", price: "3,50", description: "Feijão carioca", image: "/window.svg" },
        { name: "Salada", price: "5,00", description: "Salada verde mista", image: "/window.svg" }
      ]
    }
  ]
};

export default function DishModalDemo() {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
          Demonstração das Animações
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Clique no botão abaixo para abrir o modal e ver as animações de abertura e fechamento em ação.
        </p>
        
        <button
          onClick={handleOpen}
          className="px-8 py-4 bg-primary hover:bg-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          🍽️ Abrir Modal de Prato
        </button>
        
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
          <p>✨ Animações suaves de entrada</p>
          <p>🎭 Animações inversas de saída</p>
          <p>⚡ Transições sincronizadas</p>
          <p>🎨 Efeitos visuais elegantes</p>
        </div>
      </div>

      <DishModal
        open={isOpen}
        dish={demoDish}
        restaurantId="demo"
        restaurant={{ whatsapp_enabled: true }}
        onClose={handleClose}
      />
    </div>
  );
}
