import { useRef } from "react";
import type React from "react";

export default function useSwipeCategory(
  activeCategory: string,
  setActiveCategory: (cat: string) => void,
  availableCategories: string[]
) {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

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
    touchStartY.current = e.touches[0].clientY;
    touchEndY.current = null;
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = () => {
    if (
      touchStartX.current === null ||
      touchEndX.current === null ||
      touchStartY.current === null ||
      touchEndY.current === null
    ) return;
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = touchStartY.current - touchEndY.current;
    if (
      Math.abs(deltaX) > 40 &&
      Math.abs(deltaX) > 2 * Math.abs(deltaY)
    ) {
      if (deltaX > 0) {
        handleSwipeCategory('left');
      } else {
        handleSwipeCategory('right');
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;
  };

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
} 