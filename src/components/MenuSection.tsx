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
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [checkCategoriesPosition]);

  // Verificar posição inicial
  useEffect(() => {
    checkCategoriesPosition();
  }, [checkCategoriesPosition]);
  
  // Forçar re-renderização quando a ordenação mudar
  useEffect(() => {
    console.log('🔄 MenuSection: Ordenação mudou para:', currentSort);
  }, [currentSort]);

  // Hook para controlar overflow - deve vir antes de qualquer return
  React.useEffect(() => {
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    return () => {
      document.documentElement.style.overflowX = '';
      document.body.style.overflowX = '';
    };
  }, []);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
  };

  let filteredItems: MenuItem[] = [];
  if (activeCategory === "all") {
    filteredItems = [...menuItems]; // Criar uma cópia para não modificar o array original
    console.log('🔍 Mostrando todos os itens:', menuItems.length);
  } else {
    filteredItems = menuItems.filter(item => 
      item.categories && Array.isArray(item.categories) && item.categories.includes(activeCategory)
    );
    console.log(`🔍 Filtrando por categoria "${activeCategory}":`, filteredItems.length, 'de', menuItems.length);
  }

  // Aplica ordenação se especificada
  console.log('🔍 Verificando ordenação:', { currentSort, filteredItemsLength: filteredItems.length });
  
  if (currentSort && currentSort.field !== "default") {
    console.log('🔍 Aplicando ordenação:', currentSort);
    console.log('📊 Itens antes da ordenação:', filteredItems.length);
    
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
        
        console.log(`📝 Comparando nomes: "${a.name}" vs "${b.name}" = ${result}`);
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
        
        console.log(`💰 Comparando preços: "${a.price}" (${priceA}) vs "${b.price}" (${priceB})`);
        
        const result = currentSort.direction === "asc" ? priceA - priceB : priceB - priceA;
        return result;
      }
      return 0;
    });
    
    // Atualizar a variável filteredItems com os itens ordenados
    filteredItems = itemsToSort;
    
    console.log('✅ Itens após ordenação:', filteredItems.length);
    console.log('📋 Primeiros itens ordenados:', filteredItems.slice(0, 3).map(item => ({ name: item.name, price: item.price })));
    console.log('🔄 Ordenação aplicada com sucesso!');
  } else {
    console.log('ℹ️ Nenhuma ordenação aplicada (campo padrão ou não especificado)');
  }
  
  console.log('🎨 Renderizando', filteredItems.length, 'itens na grade');
  console.log('📊 Estrutura dos dados:', {
    totalMenuItems: menuItems.length,
    filteredItemsCount: filteredItems.length,
    currentSort,
    activeCategory,
    sampleItems: filteredItems.slice(0, 2).map(item => ({
      name: item.name,
      price: item.price,
      categories: item.categories
    }))
  });
  
  // Teste de ordenação para debug
  if (filteredItems.length > 0) {
    const testSort = [...filteredItems].sort((a, b) => a.name.localeCompare(b.name));
    console.log('🧪 Teste de ordenação por nome:', {
      original: filteredItems.slice(0, 3).map(item => item.name),
      sorted: testSort.slice(0, 3).map(item => item.name)
    });
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
    <section className="menu-section py-0 bg-white dark:bg-black">
      <div className="container mx-auto px-0 pb-20">
        {/* Container de referência para detectar quando a barra atinge o topo */}
        <div ref={categoriesRef} className="h-0" />
        
        {/* Barra de categorias que pode ser fixa ou normal */}
        <div
          ref={categoriesContainerRef}
          className={`categories-container transition-all duration-300 ease-in-out ${
            isCategoriesFixed 
              ? 'fixed top-0 left-0 right-0 z-50 bg-white dark:bg-black shadow-lg border-b border-gray-200 dark:border-gray-700' 
              : 'relative'
          }`}
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
          <div className="h-32 md:h-36" />
        )}
        
        <div
          className="menu-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4"
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
