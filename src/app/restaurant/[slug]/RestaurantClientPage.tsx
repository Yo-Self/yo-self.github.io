"use client";
import React, { useState, useEffect, Suspense } from "react";
import { Restaurant } from "@/components/data";
import Header from "@/components/Header";
import Carousel from "@/components/Carousel";
import MenuSection from "@/components/MenuSection";
import SearchBar from "@/components/SearchBar";
import AnimatedCategoryGrid from "@/components/AnimatedCategoryGrid";
import { useSearchParams } from "next/navigation";
import { SortOption } from "@/components/SortModal";
import { useModalScroll } from "@/hooks/useModalScroll";

interface RestaurantClientPageProps {
  initialRestaurant: Restaurant;
  restaurants: Restaurant[];
}

// Steps fixos fora do componente para evitar recalculo
const getGridSteps = (hasMultiple: boolean) => [
  ...(hasMultiple ? [{
    selector: '[data-tutorial="restaurant-switch"]',
    text: 'Aqui você pode trocar de restaurante.',
    arrow: 'down',
  }] : []),
  {
    selector: '[data-tutorial="carousel"]',
    text: 'Aqui estão os pratos em destaque do restaurante.',
    arrow: 'down',
  },
];

const getJournalSteps = (hasMultiple: boolean) => [
  ...(hasMultiple ? [{
    selector: '[data-tutorial="restaurant-switch"]',
    text: 'Aqui você pode trocar de restaurante.',
    arrow: 'left',
  }] : []),
  {
    selector: '[data-tutorial="journal-button"]',
    text: 'Aqui você acessa o modo jornal e ter a experiência de folhear o menu.',
    arrow: 'left',
  },
  {
    selector: '[data-tutorial="waiter-button"]',
    text: 'Aqui você pode chamar o garçom.',
    arrow: 'left',
  },
  {
    selector: '[data-tutorial="search-button"]',
    text: 'Aqui você pode realizar buscas ou conversar com a nossa Inteligência Artificial.',
    arrow: 'left',
  },
];

const FirstTimeTutorialGrid = ({ onDone }: { onDone: () => void }) => {
  const searchParams = useSearchParams();
  const hasMultiple = searchParams.has("multiple");
  const steps = React.useMemo(() => getGridSteps(hasMultiple), [hasMultiple]);
  const [step, setStep] = React.useState(0);
  const [show, setShow] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const [pos, setPos] = React.useState({top:0,left:0,width:0,height:0});
  
  // Use useRef to store timers instead of state to avoid re-renders
  const tutorialTimersRef = React.useRef<NodeJS.Timeout[]>([]);
  
  // Função para limpar todos os timers de tutorial
  const clearTutorialTimers = React.useCallback(() => {
    tutorialTimersRef.current.forEach(timer => clearTimeout(timer));
    tutorialTimersRef.current = [];
  }, []);
  
  // Função para pular para o próximo tutorial
  const skipToNextTutorial = React.useCallback(() => {
    clearTutorialTimers();
    
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setShow(false);
      if (typeof window !== 'undefined') localStorage.setItem('gridTutorialDone', '1');
      onDone();
    }
  }, [step, steps.length, clearTutorialTimers, onDone]);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('gridTutorialDone')) {
      setShow(true);
    }
    setIsClient(true);
  }, []);
  
  React.useEffect(() => {
    if (!show) return;
    if (step >= steps.length) return;
    
    const el = document.querySelector(steps[step].selector) as HTMLElement;
    if (el) {
      const rect = el.getBoundingClientRect();
      setPos({top:rect.top,left:rect.left,width:rect.width,height:rect.height});
    }
    
    // Timer automático para avançar para o próximo passo
    const timer = setTimeout(() => {
      if (step < steps.length - 1) {
        setStep(step + 1);
      } else {
        setShow(false);
        if (typeof window !== 'undefined') localStorage.setItem('gridTutorialDone', '1');
        onDone();
      }
    }, 5000); // 5 segundos por passo
    
    // Store timer in ref instead of state
    tutorialTimersRef.current = [timer];
    
    return () => {
      clearTimeout(timer);
      tutorialTimersRef.current = [];
    };
  }, [step, show, steps, onDone]); // Removed clearTutorialTimers from dependencies
  if (!isClient || !show || step >= steps.length) return null;
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
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={skipToNextTutorial} style={{cursor:'pointer', zIndex: 9999}} />
      {/* Destaque do elemento e caixa de texto não interativos exceto botão */}
      <div className="pointer-events-none">
        <div style={{position:'absolute',top:pos.top-8,left:pos.left-8,width:pos.width+16,height:pos.height+16,borderRadius:16,border:'3px solid #06b6d4',boxShadow:'0 0 0 9999px rgba(0,0,0,0.5)',pointerEvents:'none'}} />
        <div style={{position:'absolute',top:boxTop,left:boxLeft,width:boxWidth,zIndex:10000}} className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-4 text-gray-900 dark:text-gray-100 animate-fade-in">
          <div className="mb-2">{steps[step].text}</div>
          <div className="mt-2 text-xs text-gray-500">Clique para pular.</div>
        </div>
      </div>
    </div>
  );
}

const FirstTimeTutorialJournal = ({ onDone }: { onDone: () => void }) => {
  const searchParams = useSearchParams();
  const hasMultiple = searchParams.has("multiple");
  const steps = React.useMemo(() => getJournalSteps(hasMultiple), [hasMultiple]);
  const [step, setStep] = React.useState(0);
  const [show, setShow] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const [pos, setPos] = React.useState({top:0,left:0,width:0,height:0});
  
  // Use useRef to store timers instead of state to avoid re-renders
  const tutorialTimersRef = React.useRef<NodeJS.Timeout[]>([]);
  
  // Função para limpar todos os timers de tutorial
  const clearTutorialTimers = React.useCallback(() => {
    tutorialTimersRef.current.forEach(timer => clearTimeout(timer));
    tutorialTimersRef.current = [];
  }, []);
  
  // Função para pular para o próximo tutorial
  const skipToNextTutorial = React.useCallback(() => {
    clearTutorialTimers();
    
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setShow(false);
      if (typeof window !== 'undefined') localStorage.setItem('journalTutorialDone', '1');
      onDone();
    }
  }, [step, steps.length, clearTutorialTimers, onDone]);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('journalTutorialDone')) {
      setShow(true);
    }
    setIsClient(true);
  }, []);

  // Controlar o scroll do body quando o tutorial abrir/fechar
  useModalScroll(show);
  
  React.useEffect(() => {
    if (!show) return;
    if (step >= steps.length) return;
    
    const el = document.querySelector(steps[step].selector) as HTMLElement;
    if (!el) return;
    
    const rect = el.getBoundingClientRect();
    setPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    
    const timer = setTimeout(() => {
      if (step < steps.length - 1) {
        setStep(step + 1);
      } else {
        setShow(false);
        if (typeof window !== 'undefined') localStorage.setItem('journalTutorialDone', '1');
        onDone();
      }
    }, 4000); // 4 segundos por passo
    
    // Store timer in ref instead of state
    tutorialTimersRef.current = [timer];
    
    return () => {
      clearTimeout(timer);
      tutorialTimersRef.current = [];
    };
  }, [step, show, steps, onDone]); // Removed clearTutorialTimers from dependencies
  if (!isClient || !show || step >= steps.length) return null;
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
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={skipToNextTutorial} style={{cursor:'pointer', zIndex: 9999}} />
      {/* Destaque do elemento e caixa de texto não interativos exceto botão */}
      <div className="pointer-events-none">
        <div style={{position:'absolute',top:pos.top-8,left:pos.left-8,width:pos.width+16,height:pos.height+16,borderRadius:16,border:'3px solid #06b6d4',boxShadow:'0 0 0 9999px rgba(0,0,0,0.5)',pointerEvents:'none'}} />
        <div style={{position:'absolute',top:boxTop,left:boxLeft,width:boxWidth,zIndex:10000}} className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-4 text-gray-900 dark:text-gray-100 animate-fade-in">
          <div className="mb-2">{steps[step].text}</div>
          <div className="mt-2 text-xs text-gray-500">Clique para pular</div>
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
  const [currentSort, setCurrentSort] = useState<SortOption>({ field: "default", direction: "asc" });
  
  // Log para debug da ordenação
  const handleSortChange = (sort: SortOption) => {
    setCurrentSort(sort);
  };
  const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId) ?? initialRestaurant;
  

  const carouselRef = React.useRef<HTMLDivElement | null>(null);

  // Quando uma categoria é selecionada no grid, muda para o modo lista e seleciona a categoria
  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setViewMode("list");
  };

  // Função para voltar ao grid de categorias
  const handleGridClick = () => {
    setViewMode("grid");
    setSelectedCategory("all");
  };

  // Quando muda de restaurante, volta para o grid
  useEffect(() => {
    setViewMode("grid");
    setSelectedCategory("all");
    setSearchTerm("");
  }, [selectedRestaurantId]);

  // Tutorial de primeira vez
  // Adiciona data-tutorial nos elementos alvo
  const [gridTutorialDone, setGridTutorialDone] = React.useState(false);
  const [journalTutorialDone, setJournalTutorialDone] = React.useState(false);
  // Estado para o background personalizado
  const [customBackground, setCustomBackground] = useState<{ type: 'image' | 'color', value: string } | null>(null);

  // Aplicar background personalizado
  useEffect(() => {
    if (!selectedRestaurant) return;
    
    console.log('🎨 RestaurantClientPage - Restaurant data:', {
      id: selectedRestaurant.id,
      name: selectedRestaurant.name,
      background_light: selectedRestaurant.background_light,
      background_night: selectedRestaurant.background_night
    });
    
    // Detectar modo escuro/claro
    const isDarkMode = document.documentElement.classList.contains('dark') || 
                      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    console.log('🌙 RestaurantClientPage - Dark mode detection:', {
      hasDarkClass: document.documentElement.classList.contains('dark'),
      prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
      isDarkMode
    });
    
    const backgroundField = isDarkMode ? selectedRestaurant.background_night : selectedRestaurant.background_light;
    
    console.log('🎨 RestaurantClientPage - Background field selected:', backgroundField);
    
    if (!backgroundField) {
      console.log('❌ RestaurantClientPage - No background field found');
      setCustomBackground(null);
      return;
    }
    
    let backgroundType: 'image' | 'color' | null = null;
    
    // Verificar se é uma URL de imagem
    if (backgroundField.startsWith('http') || backgroundField.startsWith('/')) {
      backgroundType = 'image';
      console.log('✅ RestaurantClientPage - Background type: image');
    }
    // Verificar se é um código de cor (hex, rgb, hsl, etc.)
    else if (backgroundField.startsWith('#') || 
             backgroundField.startsWith('rgb') || 
             backgroundField.startsWith('hsl') ||
             backgroundField.startsWith('var(')) {
      backgroundType = 'color';
      console.log('✅ RestaurantClientPage - Background type: color');
    }
    // Verificar se é uma cor CSS válida
    else {
      const tempDiv = document.createElement('div');
      tempDiv.style.color = backgroundField;
      if (tempDiv.style.color !== '') {
        backgroundType = 'color';
        console.log('✅ RestaurantClientPage - Background type: CSS color');
      }
    }
    
    if (backgroundType) {
      const newBackground = { type: backgroundType, value: backgroundField };
      console.log('🎨 RestaurantClientPage - Setting custom background:', newBackground);
      setCustomBackground(newBackground);
    } else {
      console.log('❌ RestaurantClientPage - Invalid background field format');
      setCustomBackground(null);
    }
  }, [selectedRestaurant]);

  // Observer para mudanças no modo escuro
  useEffect(() => {
    const checkDarkMode = () => {
      if (!selectedRestaurant) return;
      
      const isDarkMode = document.documentElement.classList.contains('dark') || 
                        window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      console.log('🌙 RestaurantClientPage - Dark mode changed:', {
        hasDarkClass: document.documentElement.classList.contains('dark'),
        prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
        isDarkMode
      });
      
      const backgroundField = isDarkMode ? selectedRestaurant.background_night : selectedRestaurant.background_light;
      
      if (backgroundField) {
        // Verificar se é uma URL de imagem
        if (backgroundField.startsWith('http') || backgroundField.startsWith('/')) {
          const newBackground = { type: 'image' as const, value: backgroundField };
          console.log('🎨 RestaurantClientPage - Updating background for mode change:', newBackground);
          setCustomBackground(newBackground);
        }
      }
    };
    
    // Observer para mudanças na classe dark
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    // Listener para mudanças na preferência do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
    
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, [selectedRestaurant]);

  // Log do estilo final aplicado
  const finalStyle = {
    background: customBackground?.type === 'image' 
      ? `url(${customBackground.value})` 
      : customBackground?.type === 'color' 
        ? customBackground.value 
        : undefined,
    backgroundSize: customBackground?.type === 'image' ? 'cover' : 'auto',
    backgroundPosition: customBackground?.type === 'image' ? 'center' : 'auto',
    backgroundRepeat: customBackground?.type === 'image' ? 'no-repeat' : 'auto',
    backgroundAttachment: customBackground?.type === 'image' ? 'fixed' : 'auto'
  };

  // CSS customizado para forçar o background
  useEffect(() => {
    if (customBackground?.type === 'image') {
      // Aplicar background diretamente no body também
      document.body.style.background = `url(${customBackground.value})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
      
      const style = document.createElement('style');
      style.id = 'custom-background-style';
      style.textContent = `
        .custom-background-container {
          background: url(${customBackground.value}) !important;
          background-size: cover !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          background-attachment: fixed !important;
        }
        
        /* Forçar background em todos os elementos filhos */
        .custom-background-container * {
          background: transparent !important;
        }
        
        /* Corrigir ícones e menus para modo claro */
        .custom-background-container .bg-white {
          background-color: rgba(255, 255, 255, 0.9) !important;
        }
        
        .custom-background-container .text-gray-900 {
          color: #111827 !important;
        }
        
        .custom-background-container .text-gray-100 {
          color: #f3f4f6 !important;
        }
        
        /* Corrigir carousel - fundo transparente para mostrar imagem de fundo */
        .custom-background-container .carousel-section,
        .custom-background-container section.carousel-section,
        .custom-background-container div[class*="carousel-section"] {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        .custom-background-container .carousel-section.bg-white.dark\\:bg-black,
        .custom-background-container section.carousel-section.bg-white.dark\\:bg-black {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Corrigir menu de acessibilidade - fundo claro no modo claro, escuro no modo escuro */
        .custom-background-container .accessibility-menu {
          background-color: rgba(255, 255, 255, 0.95) !important;
          background: rgba(255, 255, 255, 0.95) !important;
        }
        
        .custom-background-container .accessibility-menu.dark\\:bg-gray-800 {
          background-color: #1f2937 !important;
          background: #1f2937 !important;
        }
        
        /* Corrigir textos do menu de acessibilidade no modo escuro */
        .custom-background-container .accessibility-menu.dark\\:bg-gray-800 .text-gray-900 {
          color: #f9fafb !important;
        }
        
        .custom-background-container .accessibility-menu.dark\\:bg-gray-800 .text-gray-700 {
          color: #d1d5db !important;
        }
        
        .custom-background-container .accessibility-menu.dark\\:bg-gray-800 .text-gray-400 {
          color: #9ca3af !important;
        }
        
        /* Corrigir menu de acessibilidade no modo escuro - fundo escuro e texto claro */
        .custom-background-container.dark .accessibility-menu,
        .custom-background-container .accessibility-menu.dark\\:bg-gray-800,
        .custom-background-container .accessibility-menu[class*="dark:bg-gray-800"] {
          background-color: #1f2937 !important;
          background: #1f2937 !important;
        }
        
        /* Garantir que todos os textos do menu de acessibilidade no modo escuro sejam claros */
        .custom-background-container.dark .accessibility-menu *,
        .custom-background-container .accessibility-menu.dark\\:bg-gray-800 *,
        .custom-background-container .accessibility-menu[class*="dark:bg-gray-800"] * {
          color: #f9fafb !important;
        }
        
        /* Exceções específicas para botões e elementos interativos */
        .custom-background-container.dark .accessibility-menu button,
        .custom-background-container .accessibility-menu.dark\\:bg-gray-800 button {
          color: #ffffff !important;
        }
        
        /* Corrigir botão de acessibilidade na home - sempre visível */
        .custom-background-container button[aria-label="Configurações de acessibilidade"],
        .custom-background-container .bg-blue-500,
        .custom-background-container .bg-blue-600 {
          background-color: #2563eb !important;
          background: #2563eb !important;
        }
        
        /* Garantir que o texto do botão de acessibilidade seja sempre visível */
        .custom-background-container button[aria-label="Configurações de acessibilidade"] span,
        .custom-background-container button[aria-label="Configurações de acessibilidade"] div {
          color: #ffffff !important;
          font-weight: bold !important;
        }
        
        /* Corrigir categories bar - fundo transparente para mostrar imagem */
        .custom-background-container .categories-bar,
        .custom-background-container .categories-bar.bg-white,
        .custom-background-container .categories-bar.dark\\:bg-black,
        .custom-background-container div.categories-bar {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Corrigir lista de pratos - fundo transparente para mostrar imagem */
        .custom-background-container .menu-section,
        .custom-background-container .menu-section.bg-white,
        .custom-background-container .menu-section.dark\\:bg-black,
        .custom-background-container section.menu-section {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Corrigir categories bar e menu section no modo escuro - fundo transparente */
        .custom-background-container.dark .categories-bar,
        .custom-background-container.dark .menu-section,
        .custom-background-container .categories-bar.dark\\:bg-black,
        .custom-background-container .menu-section.dark\\:bg-black,
        .custom-background-container .categories-bar[class*="dark:bg-black"],
        .custom-background-container .menu-section[class*="dark:bg-black"] {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Forçar transparência no categories bar e menu section quando tem dark:bg-black */
        .custom-background-container .categories-bar.dark\\:bg-black,
        .custom-background-container .menu-section.dark\\:bg-black,
        .custom-background-container .categories-bar[class*="dark:bg-black"],
        .custom-background-container .menu-section[class*="dark:bg-black"] {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Regras específicas para sobrescrever classes inline */
        .custom-background-container .categories-bar.bg-white.dark\\:bg-black {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        .custom-background-container .menu-section.bg-white.dark\\:bg-black {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Regras ultra-específicas para sobrescrever qualquer fundo preto */
        .custom-background-container [class*="bg-white"][class*="dark:bg-black"] {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        .custom-background-container [class*="bg-white"][class*="dark:bg-black"].header,
        .custom-background-container [class*="bg-white"][class*="dark:bg-black"].categories-bar,
        .custom-background-container [class*="bg-white"][class*="dark:bg-black"].menu-section {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Regras para quando o modo escuro está ativo */
        .custom-background-container.dark [class*="bg-black"],
        .custom-background-container.dark [class*="dark:bg-black"] {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* REGRAS DE EMERGÊNCIA - Forçar transparência em elementos específicos */
        /* Header - sempre transparente quando tem dark:bg-black */
        .custom-background-container header.dark\\:bg-black,
        .custom-background-container .header.dark\\:bg-black,
        .custom-background-container [class*="header"][class*="dark:bg-black"] {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Categories bar - sempre transparente quando tem dark:bg-black */
        .custom-background-container .categories-bar.dark\\:bg-black,
        .custom-background-container [class*="categories-bar"][class*="dark:bg-black"] {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Menu section - sempre transparente quando tem dark:bg-black */
        .custom-background-container .menu-section.dark\\:bg-black,
        .custom-background-container [class*="menu-section"][class*="dark:bg-black"] {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Regra universal para qualquer elemento com dark:bg-black */
        .custom-background-container [class*="dark:bg-black"] {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Regra para elementos com classes específicas */
        .custom-background-container .bg-white.dark\\:bg-black {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Corrigir botões do modal de detalhes - restaurar cores originais */
        .custom-background-container .modal-button,
        .custom-background-container .dish-modal button,
        .custom-background-container [role="dialog"] button {
          /* Manter cores originais dos botões */
          background: inherit !important;
          background-color: inherit !important;
          color: inherit !important;
        }
        
        /* Garantir que botões específicos mantenham suas cores */
        .custom-background-container button.bg-blue-500,
        .custom-background-container button.bg-green-500 {
          background: inherit !important;
          background-color: inherit !important;
        }
        
        /* Garantir cores específicas dos botões do modal */
        .custom-background-container button[aria-label="Adicionar à comanda"] {
          background-color: #3b82f6 !important;  /* Azul */
          background: #3b82f6 !important;
          color: #ffffff !important;
        }
        
        .custom-background-container button[aria-label="Adicionar à comanda"]:hover {
          background-color: #2563eb !important;  /* Azul mais escuro no hover */
          background: #2563eb !important;
        }
        
        .custom-background-container button[aria-label="Pedir pelo WhatsApp"] {
          background-color: #10b981 !important;  /* Verde */
          background: #10b981 !important;
          color: #ffffff !important;
        }
        
        .custom-background-container button[aria-label="Pedir pelo WhatsApp"]:hover {
          background-color: #059669 !important;  /* Verde mais escuro no hover */
          background: #059669 !important;
        }
        
        /* Corrigir modal de detalhes no modo escuro - fundo escuro e texto claro */
        .custom-background-container .dish-modal,
        .custom-background-container .dish-modal.bg-white,
        .custom-background-container .dish-modal.dark\\:bg-gray-900 {
          background-color: #111827 !important;
          background: #111827 !important;
        }
        
        /* Corrigir textos do modal no modo escuro */
        .custom-background-container .dish-modal.dark\\:bg-gray-900 .text-gray-600 {
          color: #d1d5db !important;
        }
        
        .custom-background-container .dish-modal.dark\\:bg-gray-900 .text-gray-700 {
          color: #e5e7eb !important;
        }
        
        .custom-background-container .dish-modal.dark\\:bg-gray-900 .text-gray-900 {
          color: #f9fafb !important;
        }
        
        /* Corrigir modal de detalhes no modo escuro - fundo escuro e texto claro */
        .custom-background-container.dark .dish-modal,
        .custom-background-container .dish-modal.dark\\:bg-gray-900,
        .custom-background-container .dish-modal[class*="dark:bg-gray-900"] {
          background-color: #111827 !important;
          background: #111827 !important;
        }
        
        /* Garantir que todos os textos do modal no modo escuro sejam claros */
        .custom-background-container.dark .dish-modal *,
        .custom-background-container .dish-modal.dark\\:bg-gray-900 *,
        .custom-background-container .dish-modal[class*="dark:bg-gray-900"] * {
          color: #d1d5db !important;
        }
        
        /* Exceções específicas para botões e elementos interativos */
        .custom-background-container.dark .dish-modal button,
        .custom-background-container .dish-modal.dark\\:bg-gray-900 button {
          color: #ffffff !important;
        }
        
        /* Garantir que o fundo do modal seja sempre escuro no modo escuro */
        .custom-background-container.dark .dish-modal .bg-white,
        .custom-background-container .dish-modal.dark\\:bg-gray-900 .bg-white {
          background-color: #111827 !important;
          background: #111827 !important;
        }
        
        /* Corrigir header - fundo transparente sempre para mostrar imagem de fundo */
        .custom-background-container .header,
        .custom-background-container header.header,
        .custom-background-container .header.bg-white,
        .custom-background-container .header.dark\\:bg-black {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Corrigir botões e elementos do header - fundo claro sempre */
        .custom-background-container .bg-white.dark\\:bg-gray-900,
        .custom-background-container .bg-white.dark\\:bg-black {
          background-color: rgba(255, 255, 255, 0.9) !important;
          background: rgba(255, 255, 255, 0.9) !important;
        }
        
        /* Garantir que textos sejam visíveis sempre */
        .custom-background-container .text-gray-900.dark\\:text-gray-100,
        .custom-background-container .text-gray-900.dark\\:text-white {
          color: #111827 !important;
        }
        
        /* Corrigir título do restaurante - sempre visível */
        .custom-background-container .logo,
        .custom-background-container h1.logo {
          color: #111827 !important;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.8) !important;
        }
        
        /* Corrigir ícones do header - sempre visíveis */
        .custom-background-container .header svg,
        .custom-background-container .header button svg,
        .custom-background-container .header .absolute svg {
          color: #111827 !important;
          fill: #111827 !important;
        }
        
        /* Corrigir header no modo escuro - fundo transparente e texto claro */
        .custom-background-container.dark .header,
        .custom-background-container .header.dark\\:bg-black,
        .custom-background-container .header[class*="dark:bg-black"] {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Forçar transparência no header quando tem dark:bg-black */
        .custom-background-container .header.dark\\:bg-black,
        .custom-background-container .header[class*="dark:bg-black"] {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Garantir que textos do header no modo escuro sejam claros */
        .custom-background-container.dark .header .text-gray-900,
        .custom-background-container.dark .header .text-gray-700,
        .custom-background-container .header.dark\\:bg-black .text-gray-900,
        .custom-background-container .header.dark\\:bg-black .text-gray-700 {
          color: #f9fafb !important;
        }
        
        /* Corrigir título do restaurante no modo escuro */
        .custom-background-container.dark .logo,
        .custom-background-container .header.dark\\:bg-black .logo {
          color: #f9fafb !important;
          text-shadow: 0 0 10px rgba(0, 0, 0, 0.8) !important;
        }
        
        /* Corrigir ícones do header no modo escuro */
        .custom-background-container.dark .header svg,
        .custom-background-container .header.dark\\:bg-black svg {
          color: #f9fafb !important;
          fill: #f9fafb !important;
        }
        
        /* Remover faixa branca entre header e carousel */
        .custom-background-container .header + *,
        .custom-background-container .header + div,
        .custom-background-container .header + section {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
        
        /* Forçar transparência em todos os elementos com fundo branco/preto */
        .custom-background-container [class*="bg-white"],
        .custom-background-container [class*="bg-black"] {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* REGRA NUCLEAR - Forçar transparência em qualquer elemento com fundo preto */
        .custom-background-container *[class*="bg-black"],
        .custom-background-container *[class*="dark:bg-black"],
        .custom-background-container *[class*="bg-black"] *,
        .custom-background-container *[class*="dark:bg-black"] * {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Regra específica para elementos com múltiplas classes */
        .custom-background-container *[class*="bg-white"][class*="dark:bg-black"] {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* CORREÇÃO ESPECÍFICA PARA O MODAL DE DETALHES DO PRATO */
        /* Modal principal - fundo preto semi-transparente no modo escuro */
        .custom-background-container .bg-white.dark\\:bg-gray-900,
        .custom-background-container [class*="bg-white"][class*="dark:bg-gray-900"] {
          background: rgba(0, 0, 0, 0.85) !important;
          background-color: rgba(0, 0, 0, 0.85) !important;
        }
        
        /* Conteúdo do modal - fundo preto semi-transparente no modo escuro */
        .custom-background-container .modal-content {
          background: rgba(0, 0, 0, 0.7) !important;
          background-color: rgba(0, 0, 0, 0.7) !important;
        }
        
        /* Textos do modal - garantir legibilidade no modo escuro */
        .custom-background-container .text-gray-700.dark\\:text-gray-300,
        .custom-background-container .text-gray-800.dark\\:text-gray-200 {
          color: #f3f4f6 !important; /* Branco para modo escuro */
        }
        
        /* Títulos e labels do modal - garantir legibilidade */
        .custom-background-container .font-semibold.text-gray-800.dark\\:text-gray-200 {
          color: #ffffff !important; /* Branco puro para títulos */
        }
        
        /* Botões do modal - restaurar cores originais */
        .custom-background-container .bg-blue-500.dark\\:bg-blue-600,
        .custom-background-container .bg-green-500.dark\\:bg-green-600 {
          background-color: #3b82f6 !important; /* Azul para botão principal */
        }
        
        .custom-background-container .bg-green-500.dark\\:bg-green-600 {
          background-color: #10b981 !important; /* Verde para botão WhatsApp */
        }
        
        /* CORREÇÃO PARA NOME DAS CATEGORIAS NO MODO ESCURO */
        /* Título das categorias - branco no modo escuro */
        .custom-background-container .text-gray-900.dark\\:text-gray-100,
        .custom-background-container [class*="text-gray-900"][class*="dark:text-gray-100"] {
          color: #ffffff !important; /* Branco puro para modo escuro */
        }
        
        /* CORREÇÃO PARA TELA DE ORDENAÇÃO NO MODO ESCURO */
        /* Modal de ordenação - fundo preto no modo escuro */
        .custom-background-container .bg-white.dark\\:bg-gray-800,
        .custom-background-container [class*="bg-white"][class*="dark:bg-gray-800"] {
          background: rgba(0, 0, 0, 0.9) !important;
          background-color: rgba(0, 0, 0, 0.9) !important;
        }
        
        /* REGRAS ESPECÍFICAS PARA O MODAL DE ORDENAÇÃO */
        /* Modal principal de ordenação - fundo preto no modo escuro */
        .custom-background-container .sort-modal.bg-white.dark\\:bg-gray-900,
        .custom-background-container .sort-modal[class*="bg-white"][class*="dark:bg-gray-900"] {
          background: rgba(0, 0, 0, 0.9) !important;
          background-color: rgba(0, 0, 0, 0.9) !important;
        }
        
        /* Qualquer elemento com sort-modal e dark:bg-gray-900 */
        .custom-background-container [class*="sort-modal"][class*="dark:bg-gray-900"] {
          background: rgba(0, 0, 0, 0.9) !important;
          background-color: rgba(0, 0, 0, 0.9) !important;
        }
        
        /* REGRA NUCLEAR para modal de ordenação */
        .custom-background-container *[class*="sort-modal"] *[class*="dark:bg-gray-900"],
        .custom-background-container *[class*="sort-modal"] *[class*="bg-white"] {
          background: rgba(0, 0, 0, 0.9) !important;
          background-color: rgba(0, 0, 0, 0.9) !important;
        }
        
        /* Conteúdo do modal de ordenação - fundo preto no modo escuro */
        .custom-background-container .sort-modal-content,
        .custom-background-container [class*="sort-modal"] {
          background: rgba(0, 0, 0, 0.8) !important;
          background-color: rgba(0, 0, 0, 0.8) !important;
        }
        
        /* Textos do modal de ordenação - brancos no modo escuro */
        .custom-background-container .sort-modal-content .text-gray-700,
        .custom-background-container .sort-modal-content .text-gray-800 {
          color: #ffffff !important; /* Branco para modo escuro */
        }
        
        /* CORREÇÃO ESPECÍFICA PARA OS BOTÕES DE ORDENAÇÃO */
        /* Botões de ordenação - fundo escuro e texto branco no modo escuro */
        .custom-background-container .sort-modal .bg-gray-100.dark\\:bg-gray-800,
        .custom-background-container .sort-modal [class*="bg-gray-100"][class*="dark:bg-gray-800"] {
          background-color: #374151 !important; /* Cinza escuro para fundo */
          color: #ffffff !important; /* Branco para texto */
        }
        
        /* Hover dos botões de ordenação */
        .custom-background-container .sort-modal .hover\\:bg-gray-200.dark\\:hover\\:bg-gray-700,
        .custom-background-container .sort-modal [class*="hover:bg-gray-200"][class*="dark:hover:bg-gray-700"] {
          background-color: #4b5563 !important; /* Cinza mais claro no hover */
        }
        
        /* Texto dos botões de ordenação */
        .custom-background-container .sort-modal .text-gray-700.dark\\:text-gray-300,
        .custom-background-container .sort-modal [class*="text-gray-700"][class*="dark:text-gray-300"] {
          color: #ffffff !important; /* Branco para texto */
        }
        
        /* REGRA UNIVERSAL para botões de ordenação */
        .custom-background-container .sort-modal button[class*="bg-gray-100"],
        .custom-background-container .sort-modal button[class*="dark:bg-gray-800"] {
          background-color: #374151 !important; /* Cinza escuro */
          color: #ffffff !important; /* Branco */
        }
        
        /* CORREÇÃO PARA BOTÃO CHAMAR O GARÇOM NO MODO ESCURO */
        /* Botão principal de chamar garçom - restaurar cor original */
        .custom-background-container .bg-blue-500.dark\\:bg-blue-600,
        .custom-background-container [class*="bg-blue-500"][class*="dark:bg-blue-600"],
        .custom-background-container .bg-blue-500,
        .custom-background-container [class*="bg-blue-500"] {
          background-color: #3b82f6 !important; /* Azul original */
          color: #ffffff !important; /* Branco para texto */
        }
        
        /* Hover do botão chamar garçom */
        .custom-background-container .hover\\:bg-blue-600.dark\\:hover\\:bg-blue-700,
        .custom-background-container [class*="hover:bg-blue-600"][class*="dark:hover:bg-blue-700"],
        .custom-background-container .hover\\:bg-blue-600,
        .custom-background-container [class*="hover:bg-blue-600"] {
          background-color: #2563eb !important; /* Azul mais escuro no hover */
        }
        
        /* CORREÇÃO PARA TEXTOS DO CHAT NO MODO ESCURO */
        /* Textos das mensagens do chat - brancos no modo escuro */
        .custom-background-container .text-gray-800.dark\\:text-gray-200,
        .custom-background-container .text-gray-700.dark\\:text-gray-300,
        .custom-background-container [class*="text-gray-800"][class*="dark:text-gray-200"],
        .custom-background-container [class*="text-gray-700"][class*="dark:text-gray-300"] {
          color: #ffffff !important; /* Branco para modo escuro */
        }
        
        /* Textos específicos do chat */
        .custom-background-container .chat-message,
        .custom-background-container [class*="chat"],
        .custom-background-container .message-text,
        .custom-background-container [class*="message"] {
          color: #ffffff !important; /* Branco para modo escuro */
        }
        
        /* Input do chat */
        .custom-background-container .chat-input,
        .custom-background-container [class*="chat-input"],
        .custom-background-container input[type="text"] {
          color: #ffffff !important; /* Branco para texto digitado */
          background-color: rgba(0, 0, 0, 0.7) !important; /* Fundo escuro */
        }
        
        /* CORREÇÃO UNIVERSAL PARA TODOS OS TEXTOS INVISÍVEIS NO MODO ESCURO */
        /* Títulos e textos principais - sempre brancos no modo escuro */
        .custom-background-container .text-gray-900,
        .custom-background-container [class*="text-gray-900"] {
          color: #ffffff !important; /* Branco para modo escuro */
        }
        
        /* Textos secundários - sempre brancos no modo escuro */
        .custom-background-container .text-gray-800,
        .custom-background-container [class*="text-gray-800"] {
          color: #f3f4f6 !important; /* Branco suave para modo escuro */
        }
        
        /* Textos de descrição - sempre brancos no modo escuro */
        .custom-background-container .text-gray-700,
        .custom-background-container [class*="text-gray-700"] {
          color: #e5e7eb !important; /* Branco acinzentado para modo escuro */
        }
        
        /* Textos de exemplo e placeholders - sempre brancos no modo escuro */
        .custom-background-container .text-gray-600,
        .custom-background-container [class*="text-gray-600"] {
          color: #d1d5db !important; /* Branco mais suave para modo escuro */
        }
        
        /* REGRA NUCLEAR para qualquer texto que possa estar invisível */
        .custom-background-container *[class*="text-gray"] {
          color: #ffffff !important; /* Branco universal para modo escuro */
        }
        
        /* Títulos específicos do chat/busca */
        .custom-background-container .chat-title,
        .custom-background-container [class*="chat"],
        .custom-background-container .search-title,
        .custom-background-container [class*="search"],
        .custom-background-container .ai-title,
        .custom-background-container [class*="ai"] {
          color: #ffffff !important; /* Branco para títulos */
        }
        
        /* Exemplos e perguntas do chat */
        .custom-background-container .examples,
        .custom-background-container [class*="example"],
        .custom-background-container .questions,
        .custom-background-container [class*="question"] {
          color: #ffffff !important; /* Branco para exemplos */
        }
        
        /* Placeholder dos inputs */
        .custom-background-container input::placeholder,
        .custom-background-container textarea::placeholder {
          color: #d1d5db !important; /* Branco suave para placeholders */
        }
        
        /* CORREÇÃO FINAL PARA OS TÍTULOS INVISÍVEIS DO CHAT/BUSCA */
        /* REGRA NUCLEAR para qualquer texto que possa estar invisível */
        .custom-background-container * {
          color: #ffffff !important; /* Branco universal para TODOS os textos */
        }
        
        /* Exceções para elementos que devem manter cores específicas */
        .custom-background-container .bg-blue-500,
        .custom-background-container .bg-green-500,
        .custom-background-container .bg-cyan-500,
        .custom-background-container [class*="bg-blue"],
        .custom-background-container [class*="bg-green"],
        .custom-background-container [class*="bg-cyan"] {
          color: #ffffff !important; /* Branco para texto dos botões coloridos */
        }
        
        /* REGRA ESPECÍFICA para os títulos problemáticos */
        .custom-background-container h1,
        .custom-background-container h2,
        .custom-background-container h3,
        .custom-background-container h4,
        .custom-background-container h5,
        .custom-background-container h6,
        .custom-background-container .title,
        .custom-background-container [class*="title"],
        .custom-background-container .heading,
        .custom-background-container [class*="heading"] {
          color: #ffffff !important; /* Branco para TODOS os títulos */
        }
        
        /* REGRA PARA TEXTOS ESPECÍFICOS DO CHAT/BUSCA */
        .custom-background-container .chat-header,
        .custom-background-container .search-header,
        .custom-background-container .ai-header,
        .custom-background-container [class*="chat-header"],
        .custom-background-container [class*="search-header"],
        .custom-background-container [class*="ai-header"] {
          color: #ffffff !important; /* Branco para cabeçalhos */
        }
        
        /* REGRA PARA QUALQUER TEXTO COM CLASSE DE COR */
        .custom-background-container [class*="text-"] {
          color: #ffffff !important; /* Branco para qualquer texto com classe de cor */
        }
        
        /* SOLUÇÃO GLOBAL PARA O MODO ESCURO - FUNCIONA EM QUALQUER LUGAR */
        /* Regra universal para modo escuro - sobrescreve TODAS as cores de texto */
        .dark *[class*="text-gray-900"],
        .dark *[class*="text-gray-800"],
        .dark *[class*="text-gray-700"],
        .dark *[class*="text-gray-600"],
        .dark *[class*="text-gray-500"],
        .dark *[class*="text-gray-400"],
        .dark *[class*="text-gray-300"],
        .dark *[class*="text-gray-200"],
        .dark *[class*="text-gray-100"] {
          color: #ffffff !important; /* Branco universal para modo escuro */
        }
        
        /* Regra específica para o título "Busca & IA" */
        .dark h3.text-gray-900.dark\\:text-white,
        .dark h3[class*="text-gray-900"][class*="dark:text-white"] {
          color: #ffffff !important; /* Branco para o título */
        }
        
        /* Regra para qualquer h3 no modo escuro */
        .dark h3 {
          color: #ffffff !important; /* Branco para todos os h3 */
        }
        
        /* Regra para qualquer texto com dark:text-white */
        .dark *[class*="dark:text-white"] {
          color: #ffffff !important; /* Branco para dark:text-white */
        }
        
        /* Regra para qualquer texto com dark:text-gray-400 */
        .dark *[class*="dark:text-gray-400"] {
          color: #e5e7eb !important; /* Branco suave para dark:text-gray-400 */
        }
        
        /* REGRA NUCLEAR FINAL - Força branco em qualquer texto no modo escuro */
        .dark * {
          color: #ffffff !important; /* Branco universal para modo escuro */
        }
        
        /* Exceções para elementos que devem manter cores específicas */
        .dark .bg-blue-500,
        .dark .bg-green-500,
        .dark .bg-cyan-500,
        .dark [class*="bg-blue"],
        .dark [class*="bg-green"],
        .dark [class*="bg-cyan"] {
          color: #ffffff !important; /* Branco para texto dos botões coloridos */
        }
        
        /* CORREÇÕES ESPECÍFICAS PARA MODO CLARO - RESTAURAR CORES ORIGINAIS */
        /* Ícones de ordenação e compartilhar - pretos no modo claro */
        .custom-background-container:not(.dark) .text-gray-500,
        .custom-background-container:not(.dark) [class*="text-gray-500"] {
          color: #6b7280 !important; /* Cinza original para modo claro */
        }
        
        /* Textos de descrição e preço dos cards - pretos no modo claro */
        .custom-background-container:not(.dark) .text-gray-700,
        .custom-background-container:not(.dark) [class*="text-gray-700"],
        .custom-background-container:not(.dark) .text-gray-800,
        .custom-background-container:not(.dark) [class*="text-gray-800"] {
          color: #374151 !important; /* Cinza escuro para modo claro */
        }
        
        /* Ícone de voltar às categorias - preto no modo claro */
        .custom-background-container:not(.dark) .text-gray-600,
        .custom-background-container:not(.dark) [class*="text-gray-600"] {
          color: #4b5563 !important; /* Cinza médio para modo claro */
        }
        
        /* Telas que devem ser brancas no modo claro */
        .custom-background-container:not(.dark) .bg-white,
        .custom-background-container:not(.dark) [class*="bg-white"] {
          background-color: #ffffff !important; /* Branco para modo claro */
        }
        
        /* Modal de detalhes do prato - branco com transparência no modo claro */
        .custom-background-container:not(.dark) .bg-white.dark\\:bg-gray-900,
        .custom-background-container:not(.dark) [class*="bg-white"][class*="dark:bg-gray-900"] {
          background-color: rgba(255, 255, 255, 0.95) !important; /* Branco com 95% de opacidade */
        }
        
        /* Conteúdo do modal - branco com transparência no modo claro */
        .custom-background-container:not(.dark) .modal-content,
        .custom-background-container:not(.dark) [class*="modal-content"] {
          background-color: rgba(255, 255, 255, 0.9) !important; /* Branco com 90% de opacidade */
        }
        
        /* CORREÇÕES ESPECÍFICAS PARA TEXTOS DO MODAL NO MODO CLARO */
        /* Títulos do modal (Ingredientes, Alérgenos, Porção) - pretos no modo claro */
        .custom-background-container:not(.dark) .modal-content .text-gray-800,
        .custom-background-container:not(.dark) .modal-content [class*="text-gray-800"],
        .custom-background-container:not(.dark) .modal-content .text-gray-700,
        .custom-background-container:not(.dark) .modal-content [class*="text-gray-700"],
        .custom-background-container:not(.dark) .modal-content .text-gray-900,
        .custom-background-container:not(.dark) .modal-content [class*="text-gray-900"] {
          color: #1f2937 !important; /* Cinza muito escuro para modo claro */
        }
        
        /* Ícones do modal (alérgenos, etc.) - pretos no modo claro */
        .custom-background-container:not(.dark) .modal-content .text-gray-500,
        .custom-background-container:not(.dark) .modal-content [class*="text-gray-500"],
        .custom-background-container:not(.dark) .modal-content .text-gray-600,
        .custom-background-container:not(.dark) .modal-content [class*="text-gray-600"] {
          color: #4b5563 !important; /* Cinza médio para modo claro */
        }
        
        /* CORREÇÃO ESPECÍFICA PARA ÍCONE DE ALÉRGENOS NO MODO CLARO */
        .custom-background-container:not(.dark) .modal-content .text-orange-600,
        .custom-background-container:not(.dark) .modal-content [class*="text-orange-600"],
        .custom-background-container:not(.dark) .modal-content .text-orange-400,
        .custom-background-container:not(.dark) .modal-content [class*="text-orange-400"] {
          color: #ea580c !important; /* Laranja escuro para modo claro */
        }
        
        /* CORREÇÃO ESPECÍFICA PARA SVG DE ALÉRGENOS NO MODO CLARO */
        .custom-background-container:not(.dark) .modal-content svg.text-orange-600,
        .custom-background-container:not(.dark) .modal-content svg[class*="text-orange-600"],
        .custom-background-container:not(.dark) .modal-content svg.text-orange-400,
        .custom-background-container:not(.dark) .modal-content svg[class*="text-orange-400"] {
          color: #ea580c !important; /* Laranja escuro para modo claro */
        }
        
        /* CORREÇÃO ESPECÍFICA PARA STROKE DE SVG DE ALÉRGENOS NO MODO CLARO */
        .custom-background-container:not(.dark) .modal-content svg[stroke="currentColor"] {
          stroke: #ea580c !important; /* Laranja escuro para modo claro */
        }
        
        /* CORREÇÃO ESPECÍFICA PARA TAG "OBRIGATÓRIO" NO MODO CLARO */
        .custom-background-container:not(.dark) .modal-content .bg-red-500,
        .custom-background-container:not(.dark) .modal-content [class*="bg-red-500"],
        .custom-background-container:not(.dark) .modal-content .bg-red-600,
        .custom-background-container:not(.dark) .modal-content [class*="bg-red-600"] {
          background-color: #dc2626 !important; /* Vermelho para modo claro */
          color: #ffffff !important; /* Branco para texto */
        }
        
        /* CORREÇÃO ESPECÍFICA PARA TAG "MÁXIMO X OPÇÃO" NO MODO CLARO */
        .custom-background-container:not(.dark) .modal-content .bg-blue-500,
        .custom-background-container:not(.dark) .modal-content [class*="bg-blue-500"],
        .custom-background-container:not(.dark) .modal-content .bg-blue-600,
        .custom-background-container:not(.dark) .modal-content [class*="bg-blue-600"] {
          background-color: #2563eb !important; /* Azul para modo claro */
          color: #ffffff !important; /* Branco para texto */
        }
        
        /* REGRA UNIVERSAL para textos do modal no modo claro */
        .custom-background-container:not(.dark) .modal-content *[class*="text-gray"] {
          color: #374151 !important; /* Cinza escuro para qualquer texto gray no modal */
        }
        
        /* Tela de ordenação - branca no modo claro */
        .custom-background-container:not(.dark) .sort-modal.bg-white.dark\\:bg-gray-900,
        .custom-background-container:not(.dark) [class*="sort-modal"][class*="dark:bg-gray-900"] {
          background-color: #ffffff !important; /* Branco para modo claro */
        }
        
        /* Tela de chamar garçom - branca no modo claro */
        .custom-background-container:not(.dark) .bg-white.dark\\:bg-gray-900,
        .custom-background-container:not(.dark) [class*="bg-white"][class*="dark:bg-gray-900"] {
          background-color: #ffffff !important; /* Branco para modo claro */
        }
        
        /* Tela de chat/busca - branca no modo claro */
        .custom-background-container:not(.dark) .bg-white.dark\\:bg-gray-900,
        .custom-background-container:not(.dark) [class*="bg-white"][class*="dark:bg-gray-900"] {
          background-color: #ffffff !important; /* Branco para modo claro */
        }
        
        /* CORREÇÃO PARA BOTÃO CHAMAR O GARÇOM NO MODO ESCURO */
        /* Botão principal de chamar garçom - azul no modo escuro */
        .dark .bg-orange-500,
        .dark [class*="bg-orange-500"] {
          background-color: #3b82f6 !important; /* Azul igual ao botão de acessibilidade */
          color: #ffffff !important; /* Branco para texto */
        }
        
        /* Hover do botão chamar garçom no modo escuro */
        .dark .hover\\:bg-orange-600,
        .dark [class*="hover:bg-orange-600"] {
          background-color: #2563eb !important; /* Azul mais escuro no hover */
        }
        
        /* Estado disabled do botão chamar garçom no modo escuro */
        .dark .disabled\\:bg-orange-400,
        .dark [class*="disabled:bg-orange-400"] {
          background-color: #60a5fa !important; /* Azul mais claro quando disabled */
        }
        
        /* REGRA ESPECÍFICA para o botão de chamar garçom */
        .dark button[type="submit"].bg-orange-500,
        .dark button[type="submit"][class*="bg-orange-500"] {
          background-color: #3b82f6 !important; /* Azul forçado */
        }
        

        
        /* Proteger botões do modal de ordenação - restaurar cores originais */
        .custom-background-container .sort-modal button,
        .custom-background-container .sort-modal .bg-gray-100,
        .custom-background-container .sort-modal .bg-gray-800,
        .custom-background-container .sort-modal .bg-cyan-500,
        .custom-background-container .sort-modal .bg-gray-200,
        .custom-background-container .sort-modal .bg-gray-700 {
          background: inherit !important;
          background-color: inherit !important;
        }
        
        /* Garantir que botões específicos do modal de ordenação mantenham suas cores */
        .custom-background-container .sort-modal .bg-gray-100 {
          background-color: #f3f4f6 !important;
          background: #f3f4f6 !important;
        }
        
        .custom-background-container .sort-modal .bg-gray-800 {
          background-color: #1f2937 !important;
          background: #1f2937 !important;
        }
        
        .custom-background-container .sort-modal .bg-cyan-500 {
          background-color: #06b6d4 !important;
          background: #06b6d4 !important;
        }
        
        .custom-background-container .sort-modal .bg-gray-200 {
          background-color: #e5e7eb !important;
          background: #e5e7eb !important;
        }
        
        .custom-background-container .sort-modal .bg-gray-700 {
          background-color: #374151 !important;
          background: #374151 !important;
        }
        
        /* Proteger o modal inteiro de ordenação - fundo branco no modo claro, cinza escuro no modo escuro */
        .custom-background-container .sort-modal {
          background-color: #ffffff !important;
          background: #ffffff !important;
        }
        
        .custom-background-container .sort-modal.dark\\:bg-gray-900 {
          background-color: #111827 !important;
          background: #111827 !important;
        }
        
        /* Garantir que o fundo do modal seja sempre visível */
        .custom-background-container .sort-modal.bg-white {
          background-color: #ffffff !important;
          background: #ffffff !important;
        }
        
        .custom-background-container .sort-modal.bg-gray-900 {
          background-color: #111827 !important;
          background: #111827 !important;
        }
        
        /* Corrigir textos do modal de ordenação no modo escuro */
        .custom-background-container .sort-modal.dark\\:bg-gray-900 .text-gray-900 {
          color: #f9fafb !important;
        }
        
        .custom-background-container .sort-modal.dark\\:bg-gray-900 .text-gray-100 {
          color: #f9fafb !important;
        }
        
        /* Garantir que o container principal tenha o background */
        .custom-background-container {
          background: url(${customBackground.value}) !important;
          background-size: cover !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          background-attachment: fixed !important;
          min-height: 100vh !important;
        }
        
        /* Aplicar background também no html e body */
        html, body {
          background: url(${customBackground.value}) !important;
          background-size: cover !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          background-attachment: fixed !important;
          min-height: 100vh !important;
        }
      `;
      document.head.appendChild(style);
      
      // Log para debug
      console.log('🎨 RestaurantClientPage - CSS customizado aplicado:', style.textContent);
      console.log('🎨 RestaurantClientPage - Background aplicado no body:', document.body.style.background);
      
      return () => {
        const existingStyle = document.getElementById('custom-background-style');
        if (existingStyle) {
          existingStyle.remove();
        }
        // Limpar background do body
        document.body.style.background = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundRepeat = '';
        document.body.style.backgroundAttachment = '';
      };
    }
  }, [customBackground]);

  console.log('🎨 RestaurantClientPage - Final style object:', finalStyle);
  console.log('🎨 RestaurantClientPage - customBackground state:', customBackground);

  // Testar se a imagem está acessível
  useEffect(() => {
    if (customBackground?.type === 'image') {
      const img = new Image();
      img.onload = () => {
        console.log('✅ RestaurantClientPage - Background image loaded successfully:', customBackground.value);
      };
      img.onerror = () => {
        console.log('❌ RestaurantClientPage - Background image failed to load:', customBackground.value);
      };
      img.src = customBackground.value;
    }
  }, [customBackground]);

  return (
    <div 
      className={`min-h-screen text-gray-900 dark:text-gray-100 relative ${
        customBackground?.type === 'image' ? 'custom-background-container' : ''
      }`}
    >

      
      {/* Overlay sutil apenas para melhorar legibilidade do texto */}
      {customBackground && customBackground.type === 'image' && (
        <div className="absolute inset-0 bg-black bg-opacity-10" />
      )}
      
      <div className="relative z-10">
        <Suspense fallback={null}>
          {!gridTutorialDone && <FirstTimeTutorialGrid onDone={() => setGridTutorialDone(true)} />}
          {viewMode === 'list' && !journalTutorialDone && <FirstTimeTutorialJournal onDone={() => setJournalTutorialDone(true)} />}
        </Suspense>
      <Header
        restaurant={selectedRestaurant}
        restaurants={restaurants}
        selectedRestaurantId={selectedRestaurantId}
        onSelectRestaurant={setSelectedRestaurantId}
        currentSort={viewMode === "list" ? currentSort : undefined}
        onSortChange={viewMode === "list" ? handleSortChange : undefined}
        data-tutorial="restaurant-switch"
      />
      {/* Anchor do Carousel para scroll controlado */}
      <div ref={carouselRef} />
      {/* Carousel: mostra apenas na home (modo grid) */}
      {viewMode === 'grid' && (
        <Carousel 
          restaurant={{
            ...selectedRestaurant,
            featured_dishes: Array.isArray(selectedRestaurant.featured_dishes) 
              ? (selectedRestaurant.featured_dishes || []).filter(dish => dish && dish.name && dish.name.trim() !== '')
              : []
          }} 
          data-tutorial="carousel" 
        />
      )}
      {viewMode === "grid" ? (
        <>
          <div className="flex items-center px-4 mt-4 relative z-1" style={{marginBottom: '0.2em'}}>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-700" style={{marginTop: '0.2em'}}></div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100 mx-3 whitespace-nowrap text-center">Categorias</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-700" style={{marginTop: '0.2em'}}></div>
          </div>
          <AnimatedCategoryGrid
            categories={selectedRestaurant.menu_categories}
            menuItems={selectedRestaurant.menu_items}
            onSelectCategory={handleSelectCategory}
            fallbackImage={selectedRestaurant.image}
          />
        </>
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
            currentSort={currentSort}
            onSortChange={handleSortChange}
            restaurantId={selectedRestaurant.id}
            restaurant={selectedRestaurant}
          />
          <SearchBar
            restaurant={selectedRestaurant}
            restaurants={restaurants}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            selectedCategory={selectedCategory}
            data-tutorial="search-button"
          />
        </>
      )}
      </div>
    </div>
  );
} 