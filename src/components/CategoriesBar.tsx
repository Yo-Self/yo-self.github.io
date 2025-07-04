import React, { useEffect, useRef } from "react";

type CategoriesBarProps = {
  allCategories: string[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  t: (key: string) => string;
};

export default function CategoriesBar({ allCategories, activeCategory, setActiveCategory, t }: CategoriesBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

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

  return (
    <div
      ref={containerRef}
      className="flex flex-nowrap overflow-x-auto whitespace-nowrap gap-1 pb-1 bg-white dark:bg-black no-scrollbar max-w-full overflow-x-auto"
      style={{ WebkitOverflowScrolling: 'touch', overflowY: 'hidden', maxWidth: '100vw', minWidth: 0 }}
    >
      {allCategories.map((category, idx) => {
        const label = t(category);
        return (
          <button
            key={category}
            ref={el => { btnRefs.current[idx] = el; }}
            className={`category-btn px-4 py-2 rounded-lg ${activeCategory === category ? "bg-primary text-white dark:bg-cyan-700" : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"}`}
            onClick={() => setActiveCategory(category)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
} 