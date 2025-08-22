import React, { useState, useRef, useEffect, useCallback } from "react";
import { Restaurant, Dish } from "./data";
import CardJornal from "./CardJornal";
import DishModal from "./DishModal";
import { AnimatePresence, motion } from "framer-motion";
import { usePreloadDishImages } from "../hooks/useImageCache";

interface JournalViewProps {
  open: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  selectedCategory?: string;
}

export default function JournalView({ open, onClose, restaurant, selectedCategory: propSelectedCategory }: JournalViewProps) {
  const [page, setPage] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cardsPerPage, setCardsPerPage] = useState(6); // Inicial com 6, será calculado dinamicamente
  const [pinnedDishes, setPinnedDishes] = useState<Set<string>>(new Set()); // Set de IDs dos pratos pinados
  const [showSwipeTutorial, setShowSwipeTutorial] = useState(false);
  const [showCategoriesTutorial, setShowCategoriesTutorial] = useState(false);
  const [showPinTutorial, setShowPinTutorial] = useState(false);
  const [pinButtonPosition, setPinButtonPosition] = useState({ top: 0, left: 0 });
  
  // Use useRef instead of state for tutorial timers to avoid infinite re-renders
  const tutorialTimersRef = useRef<NodeJS.Timeout[]>([]);
  
  // Refs para áudio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const itemsPerPage = 3;
  const categories = Array.from(new Set(restaurant.menu_items.flatMap(item => item.categories || [item.category]).filter(Boolean)));
  
  // O JournalView deve funcionar independentemente da prop selectedCategory
  // A prop é apenas para referência, mas o JournalView mantém sua própria lógica
  
  // Função para limpar todos os timers de tutorial
  const clearTutorialTimers = useCallback(() => {
    tutorialTimersRef.current.forEach(timer => clearTimeout(timer));
    tutorialTimersRef.current = [];
  }, []);
  
  // Função para pular para o próximo tutorial
  const skipToNextTutorial = useCallback(() => {
    clearTutorialTimers();
    
    if (showSwipeTutorial) {
      setShowSwipeTutorial(false);
      setShowCategoriesTutorial(true);
      const categoriesTimer = setTimeout(() => {
        setShowCategoriesTutorial(false);
        setShowPinTutorial(true);
        // Calcular posição do botão de pin
        setTimeout(() => {
          const pinButton = document.querySelector('[data-tutorial="pin-button"]') as HTMLElement;
          
          if (pinButton) {
            const rect = pinButton.getBoundingClientRect();
            setPinButtonPosition({
              top: rect.top,
              left: rect.left
            });
          } else {
            setPinButtonPosition({
              top: 120,
              left: 20
            });
          }
        }, 300);
        const pinTimer = setTimeout(() => {
          setShowPinTutorial(false);
          localStorage.setItem('journalSwipeTutorialDone', '1');
        }, 6000);
        tutorialTimersRef.current = [pinTimer];
      }, 6000);
      tutorialTimersRef.current = [categoriesTimer];
    } else if (showCategoriesTutorial) {
      setShowCategoriesTutorial(false);
      setShowPinTutorial(true);
      // Calcular posição do botão de pin
      setTimeout(() => {
        const pinButton = document.querySelector('[data-tutorial="pin-button"]') as HTMLElement;
        
        if (pinButton) {
          const rect = pinButton.getBoundingClientRect();
          setPinButtonPosition({
            top: rect.top,
            left: rect.left
          });
        } else {
          setPinButtonPosition({
            top: 120,
            left: 20
          });
        }
      }, 300);
      const pinTimer = setTimeout(() => {
        setShowPinTutorial(false);
        localStorage.setItem('journalSwipeTutorialDone', '1');
      }, 6000);
      tutorialTimersRef.current = [pinTimer];
    } else if (showPinTutorial) {
      setShowPinTutorial(false);
      localStorage.setItem('journalSwipeTutorialDone', '1');
    }
  }, [showSwipeTutorial, showCategoriesTutorial, showPinTutorial, clearTutorialTimers]);

  // Funções de áudio para o som de virar página
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        // Silenciar erro
      }
    }
  };

  const loadAudioFile = async () => {
    if (!audioContextRef.current || audioBufferRef.current) return;
    
    try {
      const response = await fetch('/page-flip.mp3');
      const arrayBuffer = await response.arrayBuffer();
      audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
    } catch (error) {
      // Silenciar erro
    }
  };

  const playPageFlipSound = React.useCallback(async () => {
    // Parar qualquer som anterior
    try {
      if (currentAudioSourceRef.current) {
        currentAudioSourceRef.current.stop();
        currentAudioSourceRef.current = null;
      }
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch (error) {
      // Silenciar erro
    }

    // Garantir que o áudio esteja disponível
    if (!audioRef.current) {
      const audioElement = document.createElement('audio');
      audioElement.preload = 'auto';
      audioElement.src = '/page-flip.mp3';
      audioElement.muted = false;
      audioElement.volume = 0.15;
      audioRef.current = audioElement;
    }

    // Primeiro, tentar com o elemento de áudio HTML
    try {
      if (audioRef.current) {
        if (!audioRef.current.src || audioRef.current.src === '') {
          audioRef.current.src = '/page-flip.mp3';
        }
        
        // Para navegação rápida, não aguardar o carregamento completo
        // Se estiver pronto, tocar imediatamente
        if (audioRef.current.readyState >= 2) {
          audioRef.current.muted = false;
          audioRef.current.volume = 0.15; // Volume reduzido em 50% (de 0.3 para 0.15)
          audioRef.current.currentTime = 0;
          
          const playPromise = audioRef.current.play();
          
          try {
            await Promise.race([
              playPromise,
              new Promise((_, reject) => setTimeout(() => reject(new Error('HTML Audio timeout')), 500))
            ]);
            return;
          } catch (playError: any) {
            // Continuar para Web Audio API
          }
        }
      }
    } catch (error) {
      // Continuar para Web Audio API
    }

    // Se HTML Audio falhar ou não estiver pronto, usar Web Audio API
    try {
      initAudioContext();
      await loadAudioFile();
      
      if (audioContextRef.current && audioBufferRef.current) {
        const source = audioContextRef.current.createBufferSource();
        const gainNode = audioContextRef.current.createGain();
        
        source.buffer = audioBufferRef.current;
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        // Aplicar volume reduzido em 50% (0.15)
        gainNode.gain.setValueAtTime(0.15, audioContextRef.current.currentTime);
        
        // Salvar referência do source atual
        currentAudioSourceRef.current = source;
        
        source.start(0);
        
        // Limpar referência quando o som terminar
        source.onended = () => {
          if (currentAudioSourceRef.current === source) {
            currentAudioSourceRef.current = null;
          }
        };
        
        return;
      } else {
        // Fallback: gerar um som simples
        const fallbackContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = fallbackContext.createOscillator();
        const gainNode = fallbackContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(fallbackContext.destination);
        
        oscillator.frequency.setValueAtTime(800, fallbackContext.currentTime);
        // Volume reduzido em 50% (de 0.1 para 0.05)
        gainNode.gain.setValueAtTime(0.05, fallbackContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.005, fallbackContext.currentTime + 0.1);
        
        oscillator.start(fallbackContext.currentTime);
        oscillator.stop(fallbackContext.currentTime + 0.1);
      }
    } catch (error) {
      // Silenciar erro
    }
  }, []);

  // Tocar som quando a página mudar (mantido para compatibilidade)
  useEffect(() => {
    if (open && page > 0) { // Não tocar na primeira página
      // O som já foi tocado pelas funções de navegação, então não precisamos tocar novamente
    }
  }, [page, open]);

  // Inicializar áudio quando o componente for aberto
  useEffect(() => {
    if (open) {
      // Garantir que o elemento de áudio exista
      if (!audioRef.current) {
        const audioElement = document.createElement('audio');
        audioElement.preload = 'auto';
        audioElement.src = '/page-flip.mp3';
        audioElement.muted = false;
        audioElement.volume = 0.15;
        audioRef.current = audioElement;
        
        // Aguardar o carregamento do áudio
        audioElement.addEventListener('canplaythrough', () => {
        });
        
        audioElement.addEventListener('error', (e) => {
        });
      } else {
        // Se já existe, garantir que esteja configurado corretamente
        if (!audioRef.current.src || audioRef.current.src === '') {
          audioRef.current.src = '/page-flip.mp3';
        }
        audioRef.current.muted = false;
        audioRef.current.volume = 0.15;
        // Pré-carregar o áudio
        audioRef.current.load();
      }
    }
  }, [open]);
  
  // Tutorial de primeira acesso para swipe
  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      const hasSeenTutorial = localStorage.getItem('journalSwipeTutorialDone');
      if (!hasSeenTutorial) {
        setShowSwipeTutorial(true);
        const timer = setTimeout(() => {
          setShowSwipeTutorial(false);
          setShowCategoriesTutorial(true);
          const categoriesTimer = setTimeout(() => {
            setShowCategoriesTutorial(false);
            setShowPinTutorial(true);
            // Calcular posição do botão de pin
            setTimeout(() => {
              const pinButton = document.querySelector('[data-tutorial="pin-button"]') as HTMLElement;
              
              if (pinButton) {
                const rect = pinButton.getBoundingClientRect();
                setPinButtonPosition({
                  top: rect.top,
                  left: rect.left
                });
              } else {
                // Fallback: posição estimada no primeiro card
                setPinButtonPosition({
                  top: 120,
                  left: 20
                });
              }
            }, 300);
            const pinTimer = setTimeout(() => {
              setShowPinTutorial(false);
              localStorage.setItem('journalSwipeTutorialDone', '1');
            }, 6000);
            tutorialTimersRef.current = [pinTimer];
          }, 6000);
          tutorialTimersRef.current = [categoriesTimer];
        }, 4000);
        tutorialTimersRef.current = [timer];
      }
    }
    
    // Cleanup dos timers quando o componente for desmontado
    return () => {
      tutorialTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, [open]);
  
  // Calcular quantos cards cabem na tela
  useEffect(() => {
    const calculateCardsPerPage = () => {
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;
      
      // Altura disponível para os cards (subtraindo header, padding, etc.)
      const availableHeight = screenHeight - 80; // Reduzido para mobile para aproveitar mais espaço
      
      // Tamanho estimado de cada card (incluindo gap) - mais compacto para mobile
      let cardHeight;
      if (screenWidth < 768) {
        cardHeight = 160; // Mobile - mais compacto para caber mais cards
      } else if (screenWidth < 1024) {
        cardHeight = 180; // Tablet
      } else {
        cardHeight = 160; // Desktop - mantém o tamanho atual
      }
      
      // Calcular quantas linhas e colunas cabem com breakpoints mais específicos
      const rows = Math.floor(availableHeight / cardHeight);
      
      // Breakpoints mais específicos para diferentes tamanhos de tela
      let cols;
      if (screenWidth < 640) { // Mobile
        cols = 2;
      } else if (screenWidth < 768) { // Tablet pequeno
        cols = 2;
      } else if (screenWidth < 1024) { // Tablet
        cols = 3;
      } else if (screenWidth < 1280) { // Desktop pequeno
        cols = 2;
      } else if (screenWidth < 1536) { // Desktop médio
        cols = 3;
      } else { // Desktop grande
        cols = 4;
      }
      
      const calculatedCards = rows * cols;
      setCardsPerPage(calculatedCards); // Remove o limite mínimo, mostra quantos couberem
    };
    
    calculateCardsPerPage();
    window.addEventListener('resize', calculateCardsPerPage);
    
    return () => window.removeEventListener('resize', calculateCardsPerPage);
  }, []);

  // Detectar botão voltar do navegador e fechar o modo jornal
  useEffect(() => {
    if (!open) return;

    const handlePopState = (event: PopStateEvent) => {
      // Fechar o modo jornal quando o usuário clica no botão voltar
      onClose();
    };

    // Adicionar uma entrada no histórico quando o modo jornal é aberto
    window.history.pushState({ journalMode: true }, '', window.location.href);

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [open, onClose]);

  // Agrupa pratos por categoria para navegação
  const grouped = React.useMemo(() => {
    // O JournalView sempre deve mostrar todas as categorias, independentemente da prop
    // Agrupar todos por categoria (um prato pode aparecer em múltiplas categorias)
    const catMap: { [cat: string]: Dish[] } = {};
    restaurant.menu_items.forEach(item => {
      const categories = item.categories || [item.category];
      categories.forEach(category => {
        if (category && !catMap[category]) catMap[category] = [];
        if (category) catMap[category].push(item);
      });
    });
    return Object.entries(catMap).map(([category, items]) => ({ category, items }));
  }, [restaurant.menu_items]);
  
  // Função para alternar o pin de um prato
  const togglePin = (dishId: string) => {
    // Salvar a categoria atual antes da mudança
    const currentCategoryBefore = categoryList[pageToCategoryIdx[page] || 0];
    
    setPinnedDishes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dishId)) {
        newSet.delete(dishId);
      } else {
        newSet.add(dishId);
      }
      
      // Usar o novo estado para calcular a nova página
      const newPinnedDishes = newSet;
      
      // Recalcular páginas com o novo estado
      const newAllPinnedDishes = restaurant.menu_items.filter(dish => newPinnedDishes.has(dish.name));
      const newAllPinnedDishesUnique = newAllPinnedDishes.filter((dish, index, self) => 
        index === self.findIndex(d => d.name === dish.name)
      );
      
      // Recalcular pageToCategoryIdx para as novas páginas
      const newPageToCategoryIdx: number[] = [];
      let newPageIndex = 0;
      
      grouped.forEach((group, categoryIndex) => {
        const seen = new Set<string>();
        const categoryDishes = group.items.filter(dish => {
          if (seen.has(dish.name)) {
            return false; // Remover apenas duplicatas, manter pratos pinados na categoria
          }
          seen.add(dish.name);
          return true;
        });
        
        const dishesInCategory = categoryDishes;
        const availableSlotsPerPage = Math.max(0, cardsPerPage - newAllPinnedDishesUnique.length);
        
        if (availableSlotsPerPage <= 0) {
          const pagesForCategory = Math.ceil(newAllPinnedDishesUnique.length / cardsPerPage);
          for (let i = 0; i < pagesForCategory; i++) {
            newPageToCategoryIdx[newPageIndex] = categoryIndex;
            newPageIndex++;
          }
        } else {
          const pagesForCategory = Math.max(1, Math.ceil(dishesInCategory.length / availableSlotsPerPage));
          for (let i = 0; i < pagesForCategory; i++) {
            newPageToCategoryIdx[newPageIndex] = categoryIndex;
            newPageIndex++;
          }
        }
      });
      
      // Encontrar a nova página que corresponde à categoria anterior
      const targetCategoryIndex = categoryList.indexOf(currentCategoryBefore);
      const newTargetPage = newPageToCategoryIdx.findIndex(idx => idx === targetCategoryIndex);
      
      // Usar setTimeout para garantir que o estado foi atualizado antes de navegar
      setTimeout(() => {
        // Se encontrou uma página válida, navegar para ela
        if (newTargetPage !== -1 && newTargetPage < newPageIndex) {
          setPage(newTargetPage);
        } else {
          // Se não encontrou, ir para a primeira página da categoria ou página 0
          const firstPageOfCategory = newPageToCategoryIdx.findIndex(idx => idx === targetCategoryIndex);
          if (firstPageOfCategory !== -1) {
            setPage(firstPageOfCategory);
          } else {
            setPage(0);
          }
        }
      }, 0);
      
      return newSet;
    });
  };

  // Função para criar páginas com pratos pinados sempre nas primeiras posições
  const createPagesWithPinnedFirst = React.useMemo(() => {
    let pages: Array<Array<{ dish: Dish; category: string }>> = [];
    
    // Coletar TODOS os pratos pinados (independente da categoria) - REMOVENDO DUPLICATAS
    const pinnedDishesArray = restaurant.menu_items.filter(dish => pinnedDishes.has(dish.name));
    const allPinnedDishes = pinnedDishesArray.filter((dish, index, self) => 
      index === self.findIndex(d => d.name === dish.name)
    );

    // O JournalView sempre mostra todas as categorias
    grouped.forEach(group => {
      // Coletar pratos da categoria (removendo apenas duplicatas, NÃO os pinados)
      const seen = new Set<string>();
      const categoryDishes = group.items.filter(dish => {
        if (seen.has(dish.name)) {
          return false; // Remover apenas duplicatas, manter pratos pinados na categoria
        }
        seen.add(dish.name);
        return true;
      });
      
      // Pratos da categoria (incluindo os pinados para manter na categoria original)
      const dishesInCategory = categoryDishes;
      
      // Calcular quantos pratos cabem por página (reservando espaço para TODOS os pinados)
      const availableSlotsPerPage = Math.max(0, cardsPerPage - allPinnedDishes.length);
      
      if (availableSlotsPerPage <= 0) {
        // Se não há espaço para pratos não pinados, criar páginas apenas com pinados
        for (let i = 0; i < allPinnedDishes.length; i += cardsPerPage) {
          const pageDishes = allPinnedDishes.slice(i, i + cardsPerPage);
          pages.push(pageDishes.map(dish => ({ 
            dish, 
            category: group.category
          })));
        }
      } else {
        // Dividir pratos da categoria em páginas
        for (let i = 0; i < dishesInCategory.length; i += availableSlotsPerPage) {
          const pageCategoryDishes = dishesInCategory.slice(i, i + availableSlotsPerPage);
          // Cada página terá: TODOS os pinados + pratos da categoria da página (evitando duplicatas da mesma categoria)
          const pageDishes = [...allPinnedDishes, ...pageCategoryDishes];
          // Remover duplicatas da mesma categoria para evitar mostrar o mesmo prato duas vezes
          const uniquePageDishes = pageDishes.filter((dish, index, self) => 
            index === self.findIndex(d => d.name === dish.name)
          );
          pages.push(uniquePageDishes.map(dish => ({ 
            dish, 
            category: group.category
          })));
        }
      }
    });
    
    return pages;
  }, [restaurant.menu_items, pinnedDishes, cardsPerPage, grouped]);

  // Usar a nova lógica para criar páginas
  const pages = createPagesWithPinnedFirst;
  const totalPages = pages.length;

  // Função para navegar para a próxima página com som
  const goToNextPage = useCallback(() => {
    if (page < totalPages - 1) {
      setPage(prev => prev + 1);
      // Tocar som imediatamente ao navegar
      playPageFlipSound();
    }
  }, [page, totalPages, playPageFlipSound]);

  // Função para navegar para a página anterior com som
  const goToPrevPage = useCallback(() => {
    if (page > 0) {
      setPage(prev => prev - 1);
      // Tocar som imediatamente ao navegar
      playPageFlipSound();
    }
  }, [page, playPageFlipSound]);

  // Função para navegar para uma página específica com som
  const goToPage = useCallback((targetPage: number) => {
    if (targetPage >= 0 && targetPage < totalPages) {
      setPage(targetPage);
      // Tocar som imediatamente ao navegar
      playPageFlipSound();
    }
  }, [totalPages, playPageFlipSound]);

  // Remover este efeito:
  // useEffect(() => {
  //   if (grouped.length > 0) {
  //     const firstDish = grouped[page * itemsPerPage];
  //     if (firstDish && firstDish.category !== selectedCategory) {
  //       setSelectedCategory(firstDish.category);
  //     }
  //   }
  // }, [page]);

  // Atualiza página ao trocar categoria
  useEffect(() => {
    if (open) {
      setPage(0);
    }
  }, [open]);

  // Swipe handlers
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > 50) {
      let newDirection: 'next' | 'prev' | null = null;
      if (distance > 0 && page < totalPages - 1) {
        newDirection = 'next';
        setFlipDirection('next');
        goToNextPage();
      } else if (distance < 0 && page > 0) {
        newDirection = 'prev';
        setFlipDirection('prev');
        goToPrevPage();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Travar scroll do body ao abrir o modal
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Entrar em fullscreen automaticamente
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        (document.documentElement as any).webkitRequestFullscreen().catch(() => {});
      } else if ((document.documentElement as any).msRequestFullscreen) {
        (document.documentElement as any).msRequestFullscreen().catch(() => {});
      }
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Sair do fullscreen automaticamente
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen().catch(() => {});
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen().catch(() => {});
      }
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Garantir que saia do fullscreen ao desmontar o componente
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen().catch(() => {});
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen().catch(() => {});
      }
    };
  }, [open]);

  // --- NOVA LÓGICA DE INDICADOR DE CATEGORIA ---
  // Lista de categorias únicas na ordem de exibição
  const categoryList = React.useMemo(() => grouped.map(g => g.category), [grouped]);

  // Coletar TODOS os pratos pinados (independente da categoria) - REMOVENDO DUPLICATAS
  const allPinnedDishes = React.useMemo(() => {
    const pinnedDishesArray = restaurant.menu_items.filter(dish => pinnedDishes.has(dish.name));
    return pinnedDishesArray.filter((dish, index, self) => 
      index === self.findIndex(d => d.name === dish.name)
    );
  }, [restaurant.menu_items, pinnedDishes]);

  // Para cada página, descobrir a qual categoria ela pertence baseado na estrutura de criação
  const pageToCategoryIdx = React.useMemo(() => {
    let pageToCategoryIdx: number[] = [];
    let pageIndex = 0;
    
    // Replicar a mesma lógica de criação de páginas para determinar a categoria de cada página
    grouped.forEach((group, categoryIndex) => {
      // Coletar pratos da categoria (removendo apenas duplicatas, NÃO os pinados)
      const seen = new Set<string>();
      const categoryDishes = group.items.filter(dish => {
        if (seen.has(dish.name)) {
          return false; // Remover apenas duplicatas, manter pratos pinados na categoria
        }
        seen.add(dish.name);
        return true;
      });
      
      const dishesInCategory = categoryDishes;
      const availableSlotsPerPage = Math.max(0, cardsPerPage - allPinnedDishes.length);
      
      if (availableSlotsPerPage <= 0) {
        // Se não há espaço para pratos não pinados, criar páginas apenas com pinados
        const pagesForCategory = Math.ceil(allPinnedDishes.length / cardsPerPage);
        for (let i = 0; i < pagesForCategory; i++) {
          pageToCategoryIdx[pageIndex] = categoryIndex;
          pageIndex++;
        }
      } else {
        // Dividir pratos da categoria em páginas
        const pagesForCategory = Math.max(1, Math.ceil(dishesInCategory.length / availableSlotsPerPage));
        for (let i = 0; i < pagesForCategory; i++) {
          pageToCategoryIdx[pageIndex] = categoryIndex;
          pageIndex++;
        }
      }
    });
    
    return pageToCategoryIdx;
  }, [grouped, cardsPerPage, allPinnedDishes]);
  
  // Índice da categoria atual
  const currentCategoryIdx = React.useMemo(() => pageToCategoryIdx[page] || 0, [pageToCategoryIdx, page]);
  const currentCategory = React.useMemo(() => categoryList[currentCategoryIdx], [categoryList, currentCategoryIdx]);

  // Usar o hook de pré-carregamento de imagens
  const allDishes = React.useMemo(() => {
    return restaurant.menu_items;
  }, [restaurant.menu_items]);

  const { preloadProgress, isImageLoaded } = usePreloadDishImages(allDishes);

  // Pré-carregar imagens das próximas páginas quando a página atual mudar
  useEffect(() => {
    if (!open || pages.length === 0) return;

    // Pré-carregar imagens das próximas 2 páginas
    const nextPages = [];
    for (let i = page + 1; i < Math.min(page + 3, pages.length); i++) {
      if (pages[i]) {
        nextPages.push(...pages[i].map(item => item.dish));
      }
    }

    // Pré-carregar imagens das páginas anteriores também
    for (let i = Math.max(0, page - 2); i < page; i++) {
      if (pages[i]) {
        nextPages.push(...pages[i].map(item => item.dish));
      }
    }

    // Remover duplicatas
    const uniqueDishes = nextPages.filter((dish, index, self) => 
      index === self.findIndex(d => d.name === dish.name)
    );

    // As imagens serão pré-carregadas automaticamente pelo hook
  }, [page, pages, open]);

  if (!open) return null;
  return (
    <motion.div 
      className="journal-view fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white dark:bg-gray-900 select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
    >
      {/* Áudio para o som de virar página - criado dinamicamente */}
      {/* Áreas clicáveis para avançar/retroceder página - apenas nas bordas laterais */}
      <button
        className="fixed left-0 top-0 h-full w-1/8 z-10 bg-transparent p-0 m-0 border-none outline-none"
        style={{ cursor: 'pointer' }}
        aria-label="Retroceder"
        onClick={(e) => {
          // Verificar se o clique foi muito próximo da borda
          if (e.clientX < 32) {
            if (page > 0) {
              setFlipDirection('prev');
              goToPrevPage();
            }
          }
        }}
        tabIndex={-1}
      />
      <button
        className="fixed right-0 top-0 h-full w-1/8 z-10 bg-transparent p-0 m-0 border-none outline-none"
        style={{ cursor: 'pointer' }}
        aria-label="Avançar"
        onClick={(e) => {
          // Verificar se o clique foi muito próximo da borda
          if (e.clientX > window.innerWidth - 32) {
            if (page < totalPages - 1) {
              setFlipDirection('next');
              goToNextPage();
            }
          }
        }}
        tabIndex={-1}
      />

      {/* Botões visíveis de navegação (meio da página, cantos esquerdo e direito) */}
      <motion.button
        aria-label="Página anterior"
        className="fixed left-1 md:left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/50 hover:bg-black/60 text-white shadow-lg flex items-center justify-center"
        onClick={() => {
          if (page > 0) {
            setFlipDirection('prev');
            goToPrevPage();
          }
        }}
        disabled={page <= 0}
        style={{ opacity: page <= 0 ? 0.5 : 1 }}
        whileHover={{
          scale: 1.1,
          y: -2,
          transition: { duration: 0.2 }
        }}
        whileTap={{
          scale: 0.95,
          y: 0,
          transition: { duration: 0.1 }
        }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.12 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </motion.button>
      <motion.button
        aria-label="Próxima página"
        className="fixed right-1 md:right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/50 hover:bg-black/60 text-white shadow-lg flex items-center justify-center"
        onClick={() => {
          if (page < totalPages - 1) {
            setFlipDirection('next');
            goToNextPage();
          }
        }}
        disabled={page >= totalPages - 1}
        style={{ opacity: page >= totalPages - 1 ? 0.5 : 1 }}
        whileHover={{
          scale: 1.1,
          y: -2,
          transition: { duration: 0.2 }
        }}
        whileTap={{
          scale: 0.95,
          y: 0,
          transition: { duration: 0.1 }
        }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.12 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </motion.button>
      {/* Indicador de categoria no topo + botão de fechar alinhados */}
      <div className="flex flex-row items-center w-full justify-between z-30 gap-0 mt-0 mb-0.5 px-1" style={{maxWidth: 600, margin: '0 auto'}}>
        <div className="flex gap-1 flex-1 justify-center min-w-0 overflow-x-auto items-center" style={{maxWidth: 'calc(100vw - 64px)'}}>
          {categoryList.map((cat, idx) => (
            idx === currentCategoryIdx ? (
              <motion.span
                key={cat}
                className="text-xs font-bold text-white text-center leading-tight flex items-center justify-center bg-primary dark:bg-cyan-600 px-2 h-7 rounded-full shadow-lg whitespace-nowrap"
                style={{
                  minWidth: 'fit-content',
                  maxWidth: 150,
                  wordBreak: 'break-word',
                  display: 'inline-flex',
                  minHeight: 32
                }}
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.24, delay: idx * 0.06 }}
                whileHover={{
                  scale: 1.05,
                  y: -2,
                  transition: { duration: 0.2 }
                }}
              >
                {cat}
              </motion.span>
            ) : (
              <motion.button
                key={cat}
                className="h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 scale-100 transition-all duration-200 flex-shrink-0 border border-gray-400 dark:border-gray-500"
                onClick={() => {
                  // Navegar para a primeira página da categoria clicada
                  const catIdx = categoryList.indexOf(cat);
                  const targetPage = pageToCategoryIdx.findIndex(idx => idx === catIdx);
                  if (targetPage !== -1) {
                    goToPage(targetPage);
                  }
                }}
                aria-label={`Ir para categoria ${cat}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.24, delay: idx * 0.06 }}
                whileHover={{
                  scale: 1.2,
                  y: -2,
                  transition: { duration: 0.2 }
                }}
                whileTap={{
                  scale: 0.9,
                  transition: { duration: 0.1 }
                }}
              />
            )
          ))}
        </div>
        
        {/* Botão de fechar */}
        <div className="flex flex-row items-center gap-0">
          <motion.button
            className="w-8 h-8 flex items-center justify-center z-40 bg-transparent border-none shadow-none p-0 m-0 flex-shrink-0"
            onClick={onClose}
            aria-label="Fechar jornal"
            style={{ background: 'none', border: 'none', boxShadow: 'none' }}
            whileHover={{
              scale: 1.1,
              rotate: 90,
              transition: { duration: 0.3 }
            }}
            whileTap={{
              scale: 0.9,
              transition: { duration: 0.1 }
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.24, delay: 0.18 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </motion.button>
        </div>
      </div>
      {/* Cards de pratos em grid */}
      <div 
        className="flex flex-col items-center w-full flex-1 relative px-1 md:px-2 max-w-screen-md mx-auto z-10 pt-0" 
        style={{perspective: 2000}}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page + '-' + currentCategory}
            initial={{
              rotateY: flipDirection === 'next' ? 90 : -90,
              x: flipDirection === 'next' ? 100 : -100,
              opacity: 0,
              scale: 0.95,
              filter: 'blur(2px)',
              transformOrigin: flipDirection === 'next' ? 'left center' : 'right center',
            }}
            animate={{
              rotateY: 0,
              x: 0,
              opacity: 1,
              scale: 1,
              filter: 'blur(0px)',
              transition: { 
                duration: 0.48, 
                ease: [0.25, 0.46, 0.45, 0.94],
                rotateY: { duration: 0.36, ease: [0.25, 0.46, 0.45, 0.94] },
                x: { duration: 0.48, ease: [0.25, 0.46, 0.45, 0.94] },
                opacity: { duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] },
                scale: { duration: 0.36, ease: [0.25, 0.46, 0.45, 0.94] },
                filter: { duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }
              }
            }}
            exit={{
              rotateY: flipDirection === 'next' ? -90 : 90,
              x: flipDirection === 'next' ? -100 : 100,
              opacity: 0,
              scale: 0.95,
              filter: 'blur(2px)',
              transformOrigin: flipDirection === 'next' ? 'right center' : 'left center',
              transition: { 
                duration: 0.36, 
                ease: [0.25, 0.46, 0.45, 0.94],
                rotateY: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
                x: { duration: 0.36, ease: [0.25, 0.46, 0.45, 0.94] },
                opacity: { duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] },
                scale: { duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] },
                filter: { duration: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              left: 0,
              top: 0,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'center',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Efeito de sombra dinâmica durante a animação */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `linear-gradient(${flipDirection === 'next' ? '90deg' : '270deg'}, 
                  rgba(0,0,0,0.1) 0%, 
                  rgba(0,0,0,0.05) 50%, 
                  rgba(0,0,0,0) 100%)`,
                pointerEvents: 'none',
                zIndex: -1,
              }}
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                opacity: [0, 0.3, 0],
                scale: [0.8, 1.1, 1],
                transition: {
                  duration: 0.8,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  opacity: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
                  scale: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
                }
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                transition: { duration: 0.3 }
              }}
            />
            
            {/* Efeito de "dobra" da página - simula a curvatura da página sendo virada */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `linear-gradient(${flipDirection === 'next' ? '90deg' : '270deg'}, 
                  rgba(255,255,255,0.8) 0%, 
                  rgba(255,255,255,0.4) 30%, 
                  rgba(255,255,255,0.1) 60%, 
                  rgba(255,255,255,0) 100%)`,
                pointerEvents: 'none',
                zIndex: 1,
                maskImage: `linear-gradient(${flipDirection === 'next' ? '90deg' : '270deg'}, 
                  transparent 0%, 
                  rgba(0,0,0,0.3) 20%, 
                  rgba(0,0,0,0.8) 50%, 
                  rgba(0,0,0,0.3) 80%, 
                  transparent 100%)`,
                WebkitMaskImage: `linear-gradient(${flipDirection === 'next' ? '90deg' : '270deg'}, 
                  transparent 0%, 
                  rgba(0,0,0,0.3) 20%, 
                  rgba(0,0,0,0.8) 50%, 
                  rgba(0,0,0,0.3) 80%, 
                  transparent 100%)`,
              }}
              initial={{
                opacity: 0,
                scaleX: flipDirection === 'next' ? 0.1 : 0.1,
                x: flipDirection === 'next' ? -50 : 50,
              }}
              animate={{
                opacity: [0, 0.6, 0],
                scaleX: [0.1, 1.2, 0.1],
                x: [flipDirection === 'next' ? -50 : 50, 0, flipDirection === 'next' ? 50 : -50],
                transition: {
                  duration: 0.8,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  opacity: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
                  scaleX: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
                  x: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
                }
              }}
              exit={{
                opacity: 0,
                scaleX: 0.1,
                x: flipDirection === 'next' ? 50 : -50,
                transition: { duration: 0.3 }
              }}
            />
            
            {/* Efeito de "página sendo levantada" - simula a elevação 3D da página */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `linear-gradient(${flipDirection === 'next' ? '90deg' : '270deg'}, 
                  rgba(0,0,0,0.15) 0%, 
                  rgba(0,0,0,0.08) 30%, 
                  rgba(0,0,0,0.02) 70%, 
                  rgba(0,0,0,0) 100%)`,
                pointerEvents: 'none',
                zIndex: 2,
                transform: 'translateZ(20px)',
                filter: 'blur(0.5px)',
              }}
              initial={{
                opacity: 0,
                scale: 0.9,
                rotateY: flipDirection === 'next' ? 45 : -45,
                z: 0,
              }}
              animate={{
                opacity: [0, 0.4, 0],
                scale: [0.9, 1.05, 1],
                rotateY: [flipDirection === 'next' ? 45 : -45, 0, 0],
                z: [0, 20, 0],
                transition: {
                  duration: 0.8,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  opacity: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
                  scale: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
                  rotateY: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
                  z: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
                }
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                rotateY: 0,
                z: 0,
                transition: { duration: 0.3 }
              }}
            />
            
            {/* Efeito de "ondulação" - simula o movimento natural da página sendo virada */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `radial-gradient(ellipse at ${flipDirection === 'next' ? '30%' : '70%'} center, 
                  rgba(255,255,255,0.6) 0%, 
                  rgba(255,255,255,0.3) 40%, 
                  rgba(255,255,255,0.1) 70%, 
                  rgba(255,255,255,0) 100%)`,
                pointerEvents: 'none',
                zIndex: 3,
                filter: 'blur(1px)',
              }}
              initial={{
                opacity: 0,
                scale: 0.5,
                x: flipDirection === 'next' ? -100 : 100,
                y: -20,
              }}
              animate={{
                opacity: [0, 0.5, 0],
                scale: [0.5, 1.3, 0.8],
                x: [flipDirection === 'next' ? -100 : 100, 0, flipDirection === 'next' ? 50 : -50],
                y: [-20, 0, 10],
                transition: {
                  duration: 1,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  opacity: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
                  scale: { duration: 1, ease: [0.25, 0.46, 0.45, 0.94] },
                  x: { duration: 1, ease: [0.25, 0.46, 0.45, 0.94] },
                  y: { duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }
                }
              }}
              exit={{
                opacity: 0,
                scale: 0.5,
                x: flipDirection === 'next' ? 50 : -50,
                y: 10,
                transition: { duration: 0.3 }
              }}
            />
            
            {/* Efeito de "reflexo" - simula a luz refletindo na página durante a animação */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `linear-gradient(${flipDirection === 'next' ? '135deg' : '225deg'}, 
                  rgba(255,255,255,0.8) 0%, 
                  rgba(255,255,255,0.4) 25%, 
                  rgba(255,255,255,0.1) 50%, 
                  rgba(255,255,255,0) 75%)`,
                pointerEvents: 'none',
                zIndex: 4,
                mixBlendMode: 'overlay',
              }}
              initial={{
                opacity: 0,
                scale: 0.8,
                rotate: flipDirection === 'next' ? -15 : 15,
              }}
              animate={{
                opacity: [0, 0.3, 0],
                scale: [0.8, 1.1, 0.9],
                rotate: [flipDirection === 'next' ? -15 : 15, 0, 0],
                transition: {
                  duration: 0.9,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  opacity: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
                  scale: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] },
                  rotate: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
                }
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                rotate: 0,
                transition: { duration: 0.3 }
              }}
            />
            
            {/* Efeito de "partículas" - simula pequenos detalhes voando durante a animação */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `radial-gradient(circle at ${flipDirection === 'next' ? '25%' : '75%'} 50%, 
                  rgba(255,255,255,0.4) 0%, 
                  rgba(255,255,255,0.2) 30%, 
                  rgba(255,255,255,0.1) 60%, 
                  rgba(255,255,255,0) 100%)`,
                pointerEvents: 'none',
                zIndex: 5,
                filter: 'blur(0.5px)',
              }}
              initial={{
                opacity: 0,
                scale: 0.3,
                x: flipDirection === 'next' ? -150 : 150,
                y: -30,
              }}
              animate={{
                opacity: [0, 0.4, 0],
                scale: [0.3, 1.5, 0.6],
                x: [flipDirection === 'next' ? -150 : 150, 0, flipDirection === 'next' ? 100 : -100],
                y: [-30, 0, 20],
                transition: {
                  duration: 1.2,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  opacity: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
                  scale: { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] },
                  x: { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] },
                  y: { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }
                }
              }}
              exit={{
                opacity: 0,
                scale: 0.3,
                x: flipDirection === 'next' ? 100 : -100,
                y: 20,
                transition: { duration: 0.3 }
              }}
            />
            
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-0.5 w-full max-w-7xl mx-auto px-0.5 md:px-1">
              {pages[page]?.map((item, idx) => {
                return (
                  <div key={`${item.dish.name}-${item.category}-${page}-${idx}`} className="flex justify-center items-center">
                    <div className="w-full max-w-xs">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: idx * 0.1,
                          ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                        whileHover={{
                          scale: 1.02,
                          y: -5,
                          transition: { duration: 0.2 }
                        }}
                        style={{
                          transformStyle: 'preserve-3d',
                          backfaceVisibility: 'hidden'
                        }}
                      >
                        <CardJornal 
                          dish={item.dish} 
                          size="small" 
                          onClick={() => { setSelectedDish(item.dish); setModalOpen(true); }} 
                          fallbackImage={restaurant.image}
                          isPinned={pinnedDishes.has(item.dish.name)}
                          onPinToggle={() => togglePin(item.dish.name)}
                        />
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Modal de detalhes do prato - renderizado fora do JournalView */}
      {modalOpen && selectedDish && (
        <DishModal open={modalOpen} dish={selectedDish} restaurantId={restaurant.id} restaurant={restaurant} onClose={() => setModalOpen(false)} />
      )}
      
      {/* Tutorial de Swipe */}
      <AnimatePresence>
        {showSwipeTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center"
            onClick={skipToNextTutorial}
            style={{ cursor: 'pointer' }}
          >
            {/* Overlay semi-transparente */}
            <div className="absolute inset-0 bg-black/20" />
            
            {/* Container do tutorial */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm mx-4 text-center">
              {/* Ícone de mão animado */}
              <div className="flex justify-center mb-4">
                <motion.div
                  animate={{
                    x: [-30, 30, -30],
                    rotate: [-5, 5, -5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-5xl"
                >
                  👆
                </motion.div>
              </div>
              
              {/* Texto do tutorial */}
              <p className="text-gray-700 dark:text-gray-200 text-lg font-medium mb-2">
                Deslize para navegar
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Use o gesto de swipe para mudar de página
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial de Categorias */}
      <AnimatePresence>
        {showCategoriesTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300]"
            onClick={skipToNextTutorial}
            style={{ cursor: 'pointer' }}
          >
            {/* Overlay semi-transparente */}
            <div className="absolute inset-0 bg-black/20" />
            
            {/* Destaque das categorias */}
            <div 
              className="absolute top-1 left-1/2 transform -translate-x-1/2"
              style={{
                width: 'calc(100vw - 64px)',
                maxWidth: '600px',
                height: '40px',
                border: '3px solid #06b6d4',
                borderRadius: '20px',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                pointerEvents: 'none'
              }}
            />
            
            {/* Caixa de texto */}
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 text-center max-w-xs">
              <p className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                Aqui você pode navegar entre as categorias
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial de Fixar Prato */}
      <AnimatePresence>
        {showPinTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300]"
            onClick={skipToNextTutorial}
            style={{ cursor: 'pointer' }}
          >
            {/* Overlay semi-transparente */}
            <div className="absolute inset-0 bg-black/20" />
            
            {/* Destaque do botão de fixar - posicionado dinamicamente */}
            <div 
              className="absolute"
              style={{
                top: `${pinButtonPosition.top - 2}px`,
                left: `${pinButtonPosition.left - 2}px`,
                width: '28px',
                height: '28px',
                border: '3px solid #06b6d4',
                borderRadius: '50%',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                pointerEvents: 'none'
              }}
            />
            
            {/* Caixa de texto - posicionada próximo ao card destacado */}
            <div 
              className="absolute bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 text-center max-w-xs"
              style={{
                top: `${pinButtonPosition.top + 40}px`,
                left: `${Math.max(20, Math.min(pinButtonPosition.left - 80, window.innerWidth - 280))}px`
              }}
            >
              <p className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                Aqui você pode fixar um prato para sempre visualizar ele enquanto navega entre o jornal
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 