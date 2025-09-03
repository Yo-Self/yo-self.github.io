"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import CategoriesBar from "./CategoriesBar";
import useSwipeCategory from "./useSwipeCategory";
import { MenuItem } from "./data";
import DishModal from "./DishModal";
import { useTranslation } from "./i18n";
import AnimatedDishCard from "./AnimatedDishCard";
import { SortOption } from "./SortModal";

interface MenuSectionProps {
  searchTerm?: string;
  menuItems: MenuItem[];
  categories: string[];
  fallbackImage: string;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  onGridClick?: () => void;
  currentSort?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  restaurantId?: string;
  restaurant?: any; // Para acessar configurações do restaurante
}

export default function MenuSection({ 
  searchTerm = "", 
  menuItems, 
  categories, 
  fallbackImage, 
  activeCategory, 
  setActiveCategory, 
  onGridClick, 
  currentSort, 
  onSortChange, 
  restaurantId, 
  restaurant 
}: MenuSectionProps) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const isSearching = !!searchTerm.trim();
  const [isCategoriesFixed, setIsCategoriesFixed] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const prevSearchTerm = useRef(searchTerm);
  
  // Check if we're in webapp mode
  const isWebAppMode = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );

  // Filtra categorias para mostrar apenas as que possuem produtos
  const availableCategories = categories.filter(category =>
    menuItems.some(item => item.categories && item.categories.includes(category))
  );

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeCategory(activeCategory, setActiveCategory, availableCategories);

  // Só força 'all' quando sair do modo busca
  useEffect(() => {
    if (prevSearchTerm.current && !searchTerm) {
      setActiveCategory("all");
    }
    prevSearchTerm.current = searchTerm;
  }, [searchTerm, setActiveCategory]);

  useEffect(() => {
    // Sempre que a categoria ativa mudar, rolar para ela
    // Se necessário, implemente scroll para a categoria ativa aqui
  }, [activeCategory, isSearching]);

  // Função para verificar se a barra de categorias deve ser fixada
  const checkCategoriesPosition = useCallback(() => {
    if (!categoriesRef.current) return;
    
    const rect = categoriesRef.current.getBoundingClientRect();
    const shouldBeFixed = rect.top <= 0;
    
    if (shouldBeFixed !== isCategoriesFixed) {
      setIsCategoriesFixed(shouldBeFixed);
    }
  }, [isCategoriesFixed]);

  // Listener de scroll para controlar a fixação da barra de categorias
  useEffect(() => {
    const handleScroll = () => {
      checkCategoriesPosition();
    };
    
    // Adicionar listener tanto no window quanto no container do menu
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    const menuSection = document.querySelector('.menu-section');
    if (menuSection) {
      menuSection.addEventListener("scroll", handleScroll, { passive: true });
    }
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (menuSection) {
        menuSection.removeEventListener("scroll", handleScroll);
      }
    };
  }, [checkCategoriesPosition]);

  // Verificar posição inicial
  useEffect(() => {
    checkCategoriesPosition();
  }, [checkCategoriesPosition]);
  
  // No modo webapp, sempre fixar o categories bar
  useEffect(() => {
    if (isWebAppMode) {
      setIsCategoriesFixed(true);
    }
    // No modo navegador, deixar a lógica de scroll funcionar normalmente
  }, [isWebAppMode]);
  
  // Forçar re-renderização quando a ordenação mudar
  useEffect(() => {
    // Ordenação mudou
  }, [currentSort]);



  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
  };

  let filteredItems: MenuItem[] = [];
  if (activeCategory === "all") {
    filteredItems = [...menuItems]; // Criar uma cópia para não modificar o array original
  } else {
    filteredItems = menuItems.filter(item => 
      item.categories && Array.isArray(item.categories) && item.categories.includes(activeCategory)
    );
  }

  // Aplica ordenação se especificada
  
  if (currentSort && currentSort.field !== "default") {
    
    // Criar uma cópia para ordenação
    const itemsToSort = [...filteredItems];
    
    itemsToSort.sort((a, b) => {
      if (currentSort.field === "name") {
        const nameA = a.name.toLowerCase().trim();
        const nameB = b.name.toLowerCase().trim();
        
        // Verificar se os nomes são válidos
        if (!nameA || !nameB) {
          console.warn(`⚠️ Nome inválido detectado: "${a.name}" ou "${b.name}"`);
          return 0;
        }
        
        // Usar localeCompare para ordenação correta em português
        const result = currentSort.direction === "asc" 
          ? nameA.localeCompare(nameB, 'pt-BR')
          : nameB.localeCompare(nameA, 'pt-BR');
        
        return result;
      } else if (currentSort.field === "price") {
        // Ordenação por preço - melhorada para diferentes formatos
        const extractPrice = (priceStr: string): number => {
          // Remove R$, espaços e outros caracteres, converte vírgula para ponto
          const cleanPrice = priceStr
            .replace(/[R$\s]/g, '') // Remove R$, espaços
            .replace(/[^\d,.-]/g, '') // Remove tudo exceto números, vírgula, ponto e hífen
            .replace(',', '.') // Converte vírgula para ponto
            .replace(/\.(?=.*\.)/g, ''); // Remove pontos extras (mantém apenas o último)
          
          const price = parseFloat(cleanPrice);
          return isNaN(price) ? 0 : price;
        };
        
        const priceA = extractPrice(a.price);
        const priceB = extractPrice(b.price);
        
        const result = currentSort.direction === "asc" ? priceA - priceB : priceB - priceA;
        return result;
      }
      return 0;
    });
    
    // Atualizar a variável filteredItems com os itens ordenados
    filteredItems = itemsToSort;
  }
  

  
  // Verificar se há itens para renderizar
  if (filteredItems.length === 0) {
    console.warn('⚠️ Nenhum item encontrado para renderizar');
    return (
      <section className="menu-section py-0 bg-white dark:bg-black">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-500 dark:text-gray-100">
            Nenhum item encontrado para a categoria selecionada.
          </p>
        </div>
      </section>
    );
  }

  const handleCardClick = (item: MenuItem) => {
    setSelectedDish(item);
    setModalOpen(true);
  };

  return (
    <section className="menu-section py-0 bg-white dark:bg-black relative">
      <div className="container mx-auto px-0 pb-20">
        {/* Container de referência para detectar quando a barra atinge o topo */}
        <div ref={categoriesRef} className="h-0" />
        
        {/* Barra de categorias que pode ser fixa ou normal */}
        <div
          ref={categoriesContainerRef}
          className={`categories-container transition-all duration-300 ease-in-out ${
            isCategoriesFixed 
              ? 'webapp-categories-fixed' 
              : 'relative'
          }`}
          style={{
            ...(isCategoriesFixed && {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 20,
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              borderBottom: '1px solid #e5e7eb'
            })
          }}
        >
          <div className={`px-0 pb-1 md:pb-2 pl-4 ${isCategoriesFixed ? 'pt-2' : ''}`}>
            <CategoriesBar
              allCategories={availableCategories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              t={t}
              menuItems={menuItems}
              fallbackImage={fallbackImage}
              onGridClick={onGridClick}
            />
          </div>
        </div>
        
        {/* Espaçador para compensar a altura da barra quando fixa */}
        {isCategoriesFixed && (
          <div className="h-32 md:h-36 webapp-categories-spacer" />
        )}
        
        <div
          className="menu-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-3"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {filteredItems.map((item, index) => (
            <AnimatedDishCard 
              key={`${item.name}-${item.category}`} 
              dish={item} 
              onClick={() => handleCardClick(item)} 
              size="large" 
              fallbackImage={fallbackImage}
              index={index}
            />
          ))}
        </div>
      </div>
      <DishModal 
        open={modalOpen} 
        dish={selectedDish} 
        restaurantId={restaurantId} 
        restaurant={restaurant} 
        onClose={() => setModalOpen(false)} 
      />
    </section>
  );
}
