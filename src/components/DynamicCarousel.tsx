"use client";

import React, { useState, useRef, useEffect } from "react";
import { Restaurant } from "./data";
import ImageWithLoading from "./ImageWithLoading";

function CarouselCard({ dish, onClick, size, noMargin = false, showMostOrderedTitle = false, position = 'center' }: { 
  dish: any; 
  onClick: () => void; 
  size: 'main' | 'side'; 
  noMargin?: boolean; 
  showMostOrderedTitle?: boolean;
  position?: 'left' | 'center' | 'right';
}) {
  if (!dish) return null;
  
  // Definir as bordas arredondadas baseado na posição e tamanho da tela
  const getBorderRadius = () => {
    if (size === 'main') return 'rounded-2xl'; // Card central sempre com bordas completas
    
    if (size === 'side') {
      if (position === 'left') {
        // No mobile (portrait): borda só na direita, no desktop (landscape): bordas completas
        return 'rounded-r-2xl md:rounded-2xl';
      }
      if (position === 'right') {
        // No mobile (portrait): borda só na esquerda, no desktop (landscape): bordas completas
        return 'rounded-l-2xl md:rounded-2xl';
      }
    }
    
    return 'rounded-2xl'; // Fallback
  };
  
  return (
    <div
      className={`carousel-card flex flex-col items-center cursor-pointer bg-transparent shadow-none p-0 transition-all duration-300
        ${size === 'main'
          ? 'w-[85vw] md:w-[450px] lg:w-[500px] xl:w-[550px] h-[50vw] md:h-[250px] lg:h-[280px] xl:h-[310px] scale-100 z-20'
          : 'w-[72vw] md:w-[380px] lg:w-[425px] xl:w-[468px] h-[42vw] md:h-[214px] lg:h-[238px] xl:h-[262px] scale-90 md:scale-95 lg:scale-100 opacity-60 md:opacity-80 lg:opacity-100 z-10'}
      `}
      onClick={onClick}
      style={{ pointerEvents: size === 'main' ? 'auto' : 'none' }}
    >
      <div className={`aspect-[4/3] overflow-hidden ${getBorderRadius()} relative w-full h-full`}>
        <ImageWithLoading
          src={dish.image || '/window.svg'}
          alt={dish.name || 'Item do cardápio'}
          clickable={false}
          className="w-full h-full object-cover animate-kenburns"
          fallbackSrc="/window.svg"
        >
          {/* Badge "mais pedido" no canto superior direito de cada card */}
          {showMostOrderedTitle && (
            <div className="absolute top-2 right-2 z-30 pointer-events-none">
              <span className="bg-cyan-600 dark:bg-cyan-700 text-white text-xs font-bold rounded-full px-2 py-1 select-none">
                mais pedido
              </span>
            </div>
          )}
          {/* Título do prato - só exibir no card central */}
          {size === 'main' && (
            <div className="absolute bottom-0 left-0 w-full text-white text-center font-semibold text-lg py-2 px-2 drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)]">
              {dish.name || 'Item' }
            </div>
          )}
        </ImageWithLoading>
      </div>
    </div>
  );
}

export default function DynamicCarousel({ 
  restaurant, 
  showMostOrderedTitle = false, 
  ...props 
}: { 
  restaurant: Restaurant, 
  showMostOrderedTitle?: boolean 
} & React.HTMLAttributes<HTMLElement>) {
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const featured: any[] = Array.isArray(restaurant.featured_dishes)
    ? (restaurant.featured_dishes.filter(Boolean) as any[])
    : [];

  // Swipe state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-rotate
  useEffect(() => {
    if (featured.length > 1) {
      timeoutRef.current = setTimeout(() => {
        setCurrent((prev) => (prev + 1) % featured.length);
      }, 5000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [current, featured.length]);

  const handleCardClick = (dish: any) => {
    // Na home institucional, não abrimos modal, apenas navegamos para o cardápio
    // Rota /restaurant/ removida por segurança - acesso apenas por slug
  };

  // Swipe handlers
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
      if (distance > 0) {
        // Swipe left -> next
        setCurrent((prev) => (prev + 1) % featured.length);
      } else {
        // Swipe right -> prev
        setCurrent((prev) => (prev - 1 + featured.length) % featured.length);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Carousel logic for showing side/main/side
  const getDisplayDishes = () => {
    if (featured.length === 1) {
      return [{ dish: featured[0], size: 'main' as const, idx: 0, position: 'center' as const }];
    }
    const prev = (current - 1 + featured.length) % featured.length;
    const next = (current + 1) % featured.length;
    return [
      { dish: featured[prev], size: 'side' as const, idx: prev, position: 'left' as const },
      { dish: featured[current], size: 'main' as const, idx: current, position: 'center' as const },
      { dish: featured[next], size: 'side' as const, idx: next, position: 'right' as const },
    ].filter((entry) => Boolean(entry.dish));
  };

  if (featured.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-300">Nenhum destaque disponível no momento.</p>
      </div>
    );
  }

  return (
    <section className="carousel-section py-0 bg-transparent w-full" {...props}>
      <div className="w-full overflow-hidden">
        <div className="relative flex items-center justify-center min-h-[260px] md:min-h-[280px] lg:min-h-[320px] xl:min-h-[360px] w-full max-w-6xl mx-auto"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {featured.length === 1 ? (
            <div className="flex justify-center w-full px-4 max-w-6xl mx-auto">
              <div className="max-w-[480px] md:max-w-[450px] lg:max-w-[500px] xl:max-w-[550px] w-full">
                {featured[0] && (
                  <CarouselCard
                    key={restaurant.id + '-0'}
                    dish={featured[0]}
                    onClick={() => handleCardClick(featured[0])}
                    size="main"
                    noMargin={true}
                    showMostOrderedTitle={showMostOrderedTitle}
                  />
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Área clicável esquerda */}
              <button
                className="absolute left-0 top-0 h-full w-[12vw] md:w-[80px] z-20 bg-transparent p-0 cursor-pointer"
                style={{ outline: 'none', border: 'none' }}
                aria-label="Retroceder"
                onClick={() => setCurrent((current - 1 + featured.length) % featured.length)}
                tabIndex={-1}
              />
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-0 transition"
                onClick={() => setCurrent((current - 1 + featured.length) % featured.length)}
                aria-label="Anterior"
                style={{ display: current === 0 && featured.length <= 2 ? 'none' : undefined }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] pointer-events-none">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              </button>
              <div className="flex items-center justify-center w-full gap-1 md:gap-4 select-none">
                <div className="flex items-center justify-center w-full max-w-[480px] md:max-w-[450px] lg:max-w-[500px] xl:max-w-[550px] mx-auto">
                  {getDisplayDishes().map(({ dish, size, position }, idx) => (
                    <CarouselCard
                      key={restaurant.id + '-' + (dish?.name ?? 'dish') + '-' + (dish?.image ?? 'img') + '-' + idx}
                      dish={dish}
                      onClick={() => size === 'main' && handleCardClick(dish)}
                      size={size}
                      showMostOrderedTitle={showMostOrderedTitle}
                      position={position}
                    />
                  ))}
                </div>
              </div>
              {/* Área clicável direita */}
              <button
                className="absolute right-0 top-0 h-full w-[12vw] md:w-[80px] z-20 bg-transparent p-0 cursor-pointer"
                style={{ outline: 'none', border: 'none' }}
                aria-label="Avançar"
                onClick={() => setCurrent((current + 1) % featured.length)}
                tabIndex={-1}
              />
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-0 transition"
                onClick={() => setCurrent((current + 1) % featured.length)}
                aria-label="Próximo"
                style={{ display: current === featured.length - 1 && featured.length <= 2 ? 'none' : undefined }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] pointer-events-none">
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              </button>
            </>
          )}
        </div>
        

      </div>
    </section>
  );
}
