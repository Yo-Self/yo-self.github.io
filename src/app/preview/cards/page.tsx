"use client";

import React from "react";
import Carousel from "../../../components/Carousel";
import { Restaurant, Dish } from "../../../components/data";

// Dados de exemplo para testar o carrossel
const mockRestaurant: Restaurant = {
  id: "demo-restaurant",
  name: "Restaurante Demo",
  welcome_message: "Bem-vindo ao nosso restaurante de demonstração",
  image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
  slug: "demo-restaurant",
  waiter_call_enabled: true,
  menu_categories: ["Massas", "Saladas", "Carnes", "Japonesa", "Sobremesas"],
  featured_dishes: [
    {
      name: "Pasta Carbonara",
      description: "Massa fresca com molho cremoso de ovos, queijo parmesão e bacon",
      price: "45,90",
      image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800&h=600&fit=crop",
      category: "Massas",
      tags: ["Destaque", "Mais Pedido"],
      ingredients: "Massa fresca, ovos, queijo parmesão, bacon, pimenta preta",
      allergens: "Gluten, Lactose, Ovos",
      portion: "Serve 1 pessoa"
    },
    {
      name: "Salada Caesar",
      description: "Alface romana, croutons, parmesão e molho caesar caseiro",
      price: "28,50",
      image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&h=600&fit=crop",
      category: "Saladas",
      tags: ["Vegetariano", "Leve"],
      ingredients: "Alface romana, croutons, queijo parmesão, molho caesar",
      allergens: "Gluten, Lactose",
      portion: "Serve 1 pessoa"
    },
    {
      name: "Bife Grelhado",
      description: "Bife de alcatra grelhado com batatas rústicas e legumes",
      price: "65,00",
      image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop",
      category: "Carnes",
      tags: ["Destaque", "Sem Gluten"],
      ingredients: "Bife de alcatra, batatas, legumes da estação",
      allergens: "Nenhum",
      portion: "Serve 1 pessoa"
    },
    {
      name: "Sushi Roll",
      description: "Rolo de sushi com salmão, abacate e cream cheese",
      price: "38,90",
      image: "https://images.unsplash.com/photo-1579584425555-c3d17c4f4b6c?w=800&h=600&fit=crop",
      category: "Japonesa",
      tags: ["Sem Gluten", "Fresco"],
      ingredients: "Arroz, salmão, abacate, cream cheese, nori",
      allergens: "Peixe",
      portion: "Serve 1 pessoa"
    },
    {
      name: "Tiramisu",
      description: "Sobremesa italiana com café, mascarpone e cacau",
      price: "22,00",
      image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop",
      category: "Sobremesas",
      tags: ["Vegetariano", "Tradicional"],
      ingredients: "Café, mascarpone, ovos, açúcar, cacau em pó",
      allergens: "Gluten, Lactose, Ovos",
      portion: "Serve 1 pessoa"
    }
  ],
  menu_items: [],
  whatsapp_phone: "+5511999999981",
  whatsapp_enabled: true,
  whatsapp_custom_message: "Olá! Gostaria de fazer um pedido."
};

export default function CardsPreviewPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          Demonstração do Carrossel Melhorado
        </h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
            Carrossel com Animações Suaves
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Este carrossel agora possui animações suaves e funcionais que mostram claramente 
            o movimento das imagens entre as posições. Teste:
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
            <li>Clique nas setas de navegação</li>
            <li>Use o swipe no mobile</li>
            <li>Observe a rotação automática a cada 5 segundos</li>
          </ul>
        </div>

        <Carousel 
          restaurant={mockRestaurant} 
          showMostOrderedTitle={true}
          className="mb-8"
        />

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Características do Carrossel Melhorado:
          </h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Animações:</h4>
              <ul className="space-y-1">
                <li>• Transições 3D de 600ms</li>
                <li>• Efeito roda gigante com rotação 3D</li>
                <li>• Movimento circular e profundidade</li>
                <li>• Animações imersivas e realistas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Funcionalidades:</h4>
              <ul className="space-y-1">
                <li>• Navegação por setas</li>
                <li>• Suporte a swipe no mobile</li>
                <li>• Rotação automática inteligente</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
