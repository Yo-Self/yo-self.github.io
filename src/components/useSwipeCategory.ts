import { useRef } from "react";
import type React from "react";

export default function useSwipeCategory(
  activeCategory: string,
  setActiveCategory: (cat: string) => void,
  availableCategories: string[]
) {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleSwipeCategory = (direction: 'left' | 'right') => {
    const allCategories = ["all", ...availableCategories];
    const currentIdx = allCategories.indexOf(activeCategory);
    if (direction === 'left' && currentIdx < allCategories.length - 1) {
      setActiveCategory(allCategories[currentIdx + 1]);
    } else if (direction === 'right' && currentIdx > 0) {
      setActiveCategory(allCategories[currentIdx - 1]);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > 40) {
      if (distance > 0) {
        handleSwipeCategory('left');
      } else {
        handleSwipeCategory('right');
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
} 