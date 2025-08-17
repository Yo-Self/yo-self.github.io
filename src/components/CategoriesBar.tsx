import React, { useEffect, useRef, useMemo } from "react";
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

  useEffect(() => {
    const idx = allCategories.indexOf(activeCategory);
    const container = containerRef.current;
    const btn = btnRefs.current[idx];
    if (container && btn) {
      // Calcula a posição do botão em relação ao container
      const btnLeft = btn.offsetLeft;
      const btnRight = btnLeft + btn.offsetWidth;
      const containerLeft = container.scrollLeft;
      const containerRight = containerLeft + container.offsetWidth;
      // Se o botão está fora da tela à esquerda
      if (btnLeft < containerLeft) {
        container.scrollLeft = btnLeft - 16; // 16px de margem
      } else if (btnRight > containerRight) {
        container.scrollLeft = btnRight - container.offsetWidth + 16; // 16px de margem
      }
    }
  }, [activeCategory, allCategories]);

  // Monta lista de categorias com 'Todos' no início ou fim dependendo da página
  const categoriesWithAll = useMemo(() => 
    isHome ? [...allCategories, "all"] : ["all", ...allCategories], 
    [isHome, allCategories]
  );

  useEffect(() => {
    const idx = categoriesWithAll.indexOf(activeCategory);
    const btn = btnRefs.current[idx];
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeCategory, categoriesWithAll]);

  return (
    <div className="categories-bar flex flex-row items-center gap-1 pt-3 pb-0 bg-white dark:bg-black px-1 relative z-30" style={{ display: 'flex', visibility: 'visible', opacity: 1, position: 'relative' }}>
      {/* Botão grid fixo */}
      <button
        className={`relative flex items-center justify-center min-w-[56px] w-14 h-16 rounded-xl overflow-hidden shadow transition ring-offset-2 focus:outline-none border-2 ${activeCategory === 'grid' ? 'ring-2 ring-cyan-500 border-cyan-500 bg-cyan-100 dark:bg-cyan-900' : 'border-transparent bg-gray-100 dark:bg-gray-800'}`}
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
        className="categories-bar-container flex flex-nowrap overflow-x-auto whitespace-nowrap gap-3 no-scrollbar max-w-full py-1"
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
        className={`category-bar-card relative flex items-center justify-center min-w-[120px] w-40 h-16 rounded-xl overflow-hidden shadow transition ring-offset-0 focus:outline-none ${active ? "ring-4 ring-cyan-500 border-cyan-500" : "border-transparent"}`}
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
            pointerEvents: 'none'
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = fallbackImage;
          }}
        />
        
        <span className="absolute inset-0 flex items-center justify-center z-10">
          <span 
            className="text-white text-base font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] text-center px-2 truncate"
            style={{ 
              textRendering: 'optimizeSpeed',
              willChange: 'auto'
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