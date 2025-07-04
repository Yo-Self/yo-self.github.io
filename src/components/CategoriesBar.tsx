import React from "react";

type CategoriesBarProps = {
  allCategories: string[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  categoryRefs: React.MutableRefObject<{ [key: string]: HTMLButtonElement | null }>;
  t: (key: string) => string;
};

export default function CategoriesBar({ allCategories, activeCategory, setActiveCategory, categoryRefs, t }: CategoriesBarProps) {
  return (
    <div
      className="flex flex-nowrap overflow-x-auto whitespace-nowrap gap-1 pb-1 bg-white dark:bg-black no-scrollbar max-w-full overflow-x-auto"
      style={{ WebkitOverflowScrolling: 'touch', overflowY: 'hidden', maxWidth: '100vw', minWidth: 0 }}
    >
      {allCategories.map((category) => {
        const label = t(category);
        return (
          <button
            key={category}
            ref={el => { categoryRefs.current[category] = el; }}
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