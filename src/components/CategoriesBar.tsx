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

  useEffect(() => {
    const idx = allCategories.indexOf(activeCategory);
    if (idx !== -1 && btnRefs.current[idx] && containerRef.current) {
      btnRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
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
            ref={el => btnRefs.current[idx] = el}
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