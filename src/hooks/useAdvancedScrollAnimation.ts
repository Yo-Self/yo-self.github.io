import { useEffect, useRef, useState } from 'react';

type AnimationType = 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'rotateIn';

interface UseAdvancedScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  animationType?: AnimationType;
  delay?: number;
  duration?: number;
}

export function useAdvancedScrollAnimation(options: UseAdvancedScrollAnimationOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true,
    animationType = 'fadeIn',
    delay = 0,
    duration = 700
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Pequeno delay para criar efeito cascata
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
          
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, delay]);

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-700 ease-out';
    
    switch (animationType) {
      case 'fadeIn':
        return `${baseClasses} ${
          isVisible 
            ? 'opacity-100' 
            : 'opacity-0'
        }`;
      
      case 'slideUp':
        return `${baseClasses} ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`;
      
      case 'slideLeft':
        return `${baseClasses} ${
          isVisible 
            ? 'opacity-100 translate-x-0' 
            : 'opacity-0 -translate-x-8'
        }`;
      
      case 'slideRight':
        return `${baseClasses} ${
          isVisible 
            ? 'opacity-100 translate-x-0' 
            : 'opacity-0 translate-x-8'
        }`;
      
      case 'scaleIn':
        return `${baseClasses} ${
          isVisible 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95'
        }`;
      
      case 'rotateIn':
        return `${baseClasses} ${
          isVisible 
            ? 'opacity-100 rotate-0' 
            : 'opacity-0 rotate-12'
        }`;
      
      default:
        return baseClasses;
    }
  };

  return { 
    elementRef, 
    isVisible, 
    getAnimationClasses,
    animationType 
  };
}
