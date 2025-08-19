import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { MenuItem } from "./data";
import ImageWithLoading from "./ImageWithLoading";

type CategoriesBarProps = {
  allCategories: string[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  t: (key: string) => string;
  menuItems: MenuItem[];
  fallbackImage: string;
  onGridClick?: () => void;
  isHome?: boolean;
};

export default function CategoriesBar({ allCategories, activeCategory, setActiveCategory, t, menuItems, fallbackImage, onGridClick, isHome = false }: CategoriesBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Pré-carrega todas as traduções das categorias para evitar delay
  const categoryLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    allCategories.forEach(category => {
      labels[category] = t(category);
    });
    labels["all"] = t("Todos");
    return labels;
  }, [allCategories, t]);

  // Pré-carrega as imagens das categorias para evitar delay
  const categoryImages = useMemo(() => {
    const images: Record<string, string[]> = {};
    allCategories.forEach(category => {
      const categoryItems = menuItems.filter(item => 
        item.categories && item.categories.includes(category)
      );
      images[category] = categoryItems.length > 0 
        ? categoryItems.map(item => item.image || fallbackImage)
        : [fallbackImage];
    });
    images["all"] = [fallbackImage];
    return images;
  }, [allCategories, menuItems, fallbackImage]);

  // Pré-carrega as imagens das categorias para melhorar performance
  useEffect(() => {
    const preloadImages = () => {
      Object.values(categoryImages).flat().forEach(imageUrl => {
        if (imageUrl && imageUrl !== fallbackImage) {
          const img = new window.Image();
          img.src = imageUrl;
        }
      });
    };
    
    // Pré-carrega as imagens após um pequeno delay para não bloquear a renderização inicial
    const timer = setTimeout(preloadImages, 100);
    return () => clearTimeout(timer);
  }, [categoryImages, fallbackImage]);

  // --- Correção: permitir scroll vertical na página mesmo ao tocar na barra de categorias ---
  // Se o movimento for mais vertical que horizontal, não impedir scroll da página
  const touchStart = React.useRef<{x:number,y:number}|null>(null);
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let isScrolling = false;
    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        isScrolling = false;
      }
    }
    function onTouchMove(e: TouchEvent) {
      if (!touchStart.current) return;
      const dx = Math.abs(e.touches[0].clientX - touchStart.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStart.current.y);
      if (!isScrolling && dy > dx) {
        // Scroll mais vertical: deixa o evento passar
        touchStart.current = null;
        return;
      }
      // Scroll mais horizontal: permite scroll lateral da barra
      // Não faz preventDefault, deixa o browser decidir
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  // Swipe horizontal para trocar de categoria
  const swipeStart = React.useRef<{x:number,y:number}|null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) {
        swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }
    function onTouchEnd(e: TouchEvent) {
      if (!swipeStart.current) return;
      const dx = e.changedTouches[0].clientX - swipeStart.current.x;
      const dy = e.changedTouches[0].clientY - swipeStart.current.y;
      if (Math.abs(dx) > 40 && Math.abs(dx) > 2 * Math.abs(dy)) {
        const idx = allCategories.indexOf(activeCategory);
        if (dx < 0 && idx < allCategories.length - 1) {
          setActiveCategory(allCategories[idx + 1]);
        } else if (dx > 0 && idx > 0) {
          setActiveCategory(allCategories[idx - 1]);
        }
      }
      swipeStart.current = null;
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [activeCategory, allCategories, setActiveCategory]);

  // Monta lista de categorias com 'Todos' no início ou fim dependendo da página
  const categoriesWithAll = useMemo(() => 
    isHome ? [...allCategories, "all"] : ["all", ...allCategories], 
    [isHome, allCategories]
  );

  // Função melhorada para scroll automático da categoria ativa
  const scrollToActiveCategory = useCallback(() => {
    const idx = categoriesWithAll.indexOf(activeCategory);
    const container = containerRef.current;
    const btn = btnRefs.current[idx];
    
    if (container && btn) {
      // Calcula a posição do botão em relação ao container
      const btnLeft = btn.offsetLeft;
      const btnRight = btnLeft + btn.offsetWidth;
      const containerLeft = container.scrollLeft;
      const containerRight = containerLeft + container.offsetWidth;
      const containerWidth = container.offsetWidth;
      
      // Calcula a posição ideal para centralizar o botão
      const targetScrollLeft = btnLeft - (containerWidth / 2) + (btn.offsetWidth / 2);
      
      // Aplica scroll suave para a posição calculada
      // Em dispositivos móveis, usa scroll instantâneo para melhor performance
      if ('ontouchstart' in window) {
        container.scrollLeft = Math.max(0, targetScrollLeft);
      } else {
        container.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth'
        });
      }
    }
  }, [activeCategory, categoriesWithAll]);

  // Scroll automático sempre que a categoria ativa mudar
  useEffect(() => {
    // Pequeno delay para garantir que o DOM foi atualizado
    const timer = setTimeout(() => {
      scrollToActiveCategory();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [activeCategory, scrollToActiveCategory]);

  // Scroll automático também quando as categorias mudarem
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToActiveCategory();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [categoriesWithAll, scrollToActiveCategory]);

  // Scroll automático quando a janela for redimensionada
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        scrollToActiveCategory();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [scrollToActiveCategory]);

  return (
    <div className="categories-bar flex flex-row items-center gap-1 pt-3 pb-4 bg-white dark:bg-black px-1 relative z-30" style={{ display: 'flex', visibility: 'visible', opacity: 1, position: 'relative' }}>
      {/* Botão grid fixo */}
      <button
        className={`relative flex items-center justify-center min-w-[56px] w-14 h-20 rounded-xl overflow-hidden shadow transition-all duration-300 ease-in-out focus:outline-none border-4 ${
          activeCategory === 'grid' 
            ? 'border-cyan-500 bg-cyan-100 dark:bg-cyan-900 scale-105 shadow-lg' 
            : 'border-transparent bg-gray-100 dark:bg-gray-800 hover:border-gray-300 hover:scale-105'
        }`}
        onClick={() => {
          if (onGridClick) onGridClick();
          setActiveCategory('grid');
        }}
        aria-label="Ver categorias em grid"
      >
        <svg className="w-7 h-7 text-cyan-600 dark:text-cyan-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="2"/>
          <rect x="14" y="3" width="7" height="7" rx="2"/>
          <rect x="14" y="14" width="7" height="7" rx="2"/>
          <rect x="3" y="14" width="7" height="7" rx="2"/>
        </svg>
      </button>
      {/* Container de categorias com scroll horizontal */}
      <div
        ref={containerRef}
        className="categories-bar-container flex flex-nowrap overflow-x-auto whitespace-nowrap gap-3 no-scrollbar max-w-full py-4"
        style={{ WebkitOverflowScrolling: 'touch', overflowY: 'hidden', maxWidth: '100vw', minWidth: 0, display: 'flex', visibility: 'visible' }}
      >
        {categoriesWithAll.map((category, idx) => {
          const isAll = category === "all";
          const label = categoryLabels[category] || category; // Usa o cache de traduções
          const imagesToUse = categoryImages[category] || [fallbackImage]; // Usa o cache de imagens
          return (
            <CategoryBarCard
              key={category}
              ref={el => { btnRefs.current[idx] = el; }}
              label={label}
              images={imagesToUse}
              active={activeCategory === category}
              onClick={() => setActiveCategory(category)}
              fallbackImage={fallbackImage}
            />
          );
        })}
      </div>
    </div>
  );
}

// Novo componente para card animado
const CategoryBarCard = React.memo(React.forwardRef<HTMLButtonElement, {
  label: string;
  images: string[];
  active: boolean;
  onClick: () => void;
  fallbackImage: string;
}>(
  ({ label, images, active, onClick, fallbackImage }, ref) => {
    // Garante que sempre haja pelo menos o fallbackImage
    const imagesToUse = React.useMemo(() => images.length > 0 ? images : [fallbackImage], [images, fallbackImage]);
    const [current, setCurrent] = React.useState(0);
    const [loadedImages, setLoadedImages] = React.useState<Set<string>>(new Set());

    // Pré-carrega as imagens de forma mais robusta
    React.useEffect(() => {
      const preloadImages = async () => {
        const promises = imagesToUse.map((imgSrc) => {
          if (imgSrc && !loadedImages.has(imgSrc)) {
            return new Promise<void>((resolve) => {
              const img = new window.Image();
              img.onload = () => {
                setLoadedImages(prev => new Set(prev).add(imgSrc));
                resolve();
              };
              img.onerror = () => {
                resolve(); // Resolve mesmo com erro para não bloquear
              };
              img.src = imgSrc;
            });
          }
          return Promise.resolve();
        });
        await Promise.all(promises);
      };
      preloadImages();
    }, [imagesToUse, loadedImages]);

    // Troca de imagem simples sem transição complexa para evitar flickering
    React.useEffect(() => {
      if (imagesToUse.length <= 1) return;
      const interval = setInterval(() => {
        setCurrent((prev) => (prev + 1) % imagesToUse.length);
      }, 4000);
      return () => clearInterval(interval);
    }, [imagesToUse.length]);

    const currentImg = imagesToUse[current] || fallbackImage;

    return (
      <button
        ref={ref}
        className={`category-bar-card relative min-w-[120px] w-40 h-20 rounded-xl overflow-hidden shadow transition-all duration-300 ease-in-out focus:outline-none ${
          active 
            ? "border-4 border-cyan-500 scale-105 shadow-lg" 
            : "border-4 border-transparent hover:scale-105 hover:shadow-md hover:border-gray-300"
        }`}
        onClick={onClick}
        style={{ flex: '0 0 auto' }}
      >
        {/* Imagem única sem transição complexa */}
        <img
          src={currentImg}
          alt={label}
          className="absolute inset-0 object-cover w-full h-full rounded-xl"
          style={{
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            willChange: 'auto',
            pointerEvents: 'none',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            height: '100%'
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = fallbackImage;
          }}
        />
        
        {/* Overlay para melhorar legibilidade do texto */}
        {active && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl" />
        )}
        
        <span 
          className="absolute inset-0 flex items-center justify-center z-20"
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span 
            className="text-white text-base font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] text-center px-2 leading-tight transition-all duration-300"
            style={{ 
              textRendering: 'optimizeSpeed',
              willChange: 'auto',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: '1.2'
            }}
          >
            {label}
          </span>
        </span>
      </button>
    );
  }
));

CategoryBarCard.displayName = 'CategoryBarCard'; 