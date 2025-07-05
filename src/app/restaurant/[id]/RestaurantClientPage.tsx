"use client";
import React, { useState, useEffect } from "react";
import { Restaurant } from "@/components/data";
import Header from "@/components/Header";
import Carousel from "@/components/Carousel";
import MenuSection from "@/components/MenuSection";
import SearchBar from "@/components/SearchBar";
import CategoryGrid from "@/components/CategoryGrid";

interface RestaurantClientPageProps {
  initialRestaurant: Restaurant;
  restaurants: Restaurant[];
}

function FirstTimeTutorial() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('tutorialDone')) {
      setShow(true);
    }
  }, []);
  const [pos, setPos] = useState({top:0,left:0,width:0,height:0});
  const steps = [
    {
      selector: '[data-tutorial="restaurant-switch"]',
      text: 'Aqui você pode trocar de restaurante.',
      arrow: 'down',
    },
    {
      selector: '[data-tutorial="journal-button"]',
      text: 'Aqui você acessa o modo jornal para ver os pratos por categoria.',
      arrow: 'left',
    },
    {
      selector: '[data-tutorial="search-button"]',
      text: 'Aqui você pode buscar pratos rapidamente.',
      arrow: 'left',
    },
  ];
  useEffect(() => {
    if (!show) return;
    const el = document.querySelector(steps[step].selector) as HTMLElement;
    if (el) {
      const rect = el.getBoundingClientRect();
      setPos({top:rect.top,left:rect.left,width:rect.width,height:rect.height});
    }
  }, [step, show]);
  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else {
      setShow(false);
      if (typeof window !== 'undefined') localStorage.setItem('tutorialDone', '1');
    }
  };
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  if (!isClient || !show) return null;
  // Lógica para posicionar a caixa de texto do tutorial
  let boxLeft = pos.left;
  let boxTop = steps[step].arrow === 'down' ? pos.top + pos.height + 16 : pos.top;
  const boxWidth = 260;
  const padding = 12;
  if (steps[step].arrow === 'left') {
    // Para a primeira dica (chevron), priorize mostrar à esquerda se não couber à direita
    if (step === 0) {
      // Sempre priorize centralizar abaixo do botão do dropdown
      boxLeft = Math.max(8, pos.left + pos.width/2 - boxWidth/2);
      // Se a caixa sair da tela para a direita, tente alinhar à direita do botão
      if (boxLeft + boxWidth > window.innerWidth - 8) {
        let tryRight = pos.left + pos.width + padding;
        if (tryRight + boxWidth <= window.innerWidth - 8) {
          boxLeft = tryRight;
        } else {
          // Se não couber à direita, alinhar à esquerda do botão
          let tryLeft = pos.left - boxWidth - padding;
          if (tryLeft >= 8) {
            boxLeft = tryLeft;
          } else {
            // Se não couber, força à esquerda da tela
            boxLeft = 8;
          }
        }
      }
    } else {
      // Outras dicas: lógica padrão
      if (pos.left + pos.width + boxWidth + padding > window.innerWidth) {
        boxLeft = pos.left - boxWidth - padding;
        if (boxLeft < 0) boxLeft = Math.max(0, window.innerWidth/2 - boxWidth/2);
      } else {
        boxLeft = pos.left + pos.width + padding;
      }
    }
  }
  // Se a caixa sair da tela para baixo, ajusta para cima
  if (boxTop + 120 > window.innerHeight) {
    boxTop = Math.max(0, window.innerHeight - 140);
  }
  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay escuro que captura todos os cliques */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={() => setShow(false)} style={{cursor:'pointer', zIndex: 9999}} />
      {/* Destaque do elemento e caixa de texto não interativos exceto botão */}
      <div className="pointer-events-none">
        <div style={{position:'absolute',top:pos.top-8,left:pos.left-8,width:pos.width+16,height:pos.height+16,borderRadius:16,border:'3px solid #06b6d4',boxShadow:'0 0 0 9999px rgba(0,0,0,0.5)',pointerEvents:'none'}} />
        <div style={{position:'absolute',top:boxTop,left:boxLeft,width:boxWidth,zIndex:10000}} className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-4 text-gray-900 dark:text-gray-100 animate-fade-in">
          <div className="mb-2">{steps[step].text}</div>
          <button className="mt-2 px-4 py-2 bg-primary text-white rounded-lg pointer-events-auto" onClick={next}>Próximo</button>
        </div>
      </div>
    </div>
  );
}

export default function RestaurantClientPage({ initialRestaurant, restaurants }: RestaurantClientPageProps) {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(initialRestaurant.id);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid"|"list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId) ?? initialRestaurant;

  // Quando uma categoria é selecionada no grid, muda para o modo lista e seleciona a categoria
  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setViewMode("list");
  };

  // Função para voltar ao grid de categorias
  const handleGridClick = () => {
    setViewMode("grid");
    setSelectedCategory("grid");
  };

  // Quando muda de restaurante, volta para o grid
  useEffect(() => {
    setViewMode("grid");
    setSelectedCategory("all");
    setSearchTerm("");
  }, [selectedRestaurantId]);

  // Tutorial de primeira vez
  // Adiciona data-tutorial nos elementos alvo
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100">
      <FirstTimeTutorial />
      <Header
        restaurant={selectedRestaurant}
        restaurants={restaurants}
        selectedRestaurantId={selectedRestaurantId}
        onSelectRestaurant={setSelectedRestaurantId}
        data-tutorial="restaurant-switch"
      />
      <Carousel restaurant={selectedRestaurant} />
      {viewMode === "grid" ? (
        <CategoryGrid
          categories={selectedRestaurant.menu_categories}
          menuItems={selectedRestaurant.menu_items}
          onSelectCategory={handleSelectCategory}
          fallbackImage={selectedRestaurant.image}
        />
      ) : (
        <>
          <MenuSection
            menuItems={selectedRestaurant.menu_items}
            categories={selectedRestaurant.menu_categories}
            searchTerm={searchTerm}
            fallbackImage={selectedRestaurant.image}
            activeCategory={selectedCategory}
            setActiveCategory={setSelectedCategory}
            onGridClick={handleGridClick}
          />
          <SearchBar
            restaurant={selectedRestaurant}
            restaurants={restaurants}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            data-tutorial-search
          />
        </>
      )}
    </div>
  );
} 