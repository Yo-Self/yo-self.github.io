import { useState, useEffect, useRef } from 'react';

interface CachedImage {
  src: string;
  element: HTMLImageElement;
  loaded: boolean;
  error: boolean;
}

class ImageCache {
  private cache = new Map<string, CachedImage>();
  private loadingPromises = new Map<string, Promise<boolean>>();

  async preloadImage(src: string): Promise<boolean> {
    // Se já está carregando, retorna a promise existente
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    // Se já está no cache e carregada, retorna true
    if (this.cache.has(src) && this.cache.get(src)!.loaded) {
      return true;
    }

    // Cria uma nova promise para carregar a imagem
    const loadPromise = new Promise<boolean>((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(src, {
          src,
          element: img,
          loaded: true,
          error: false
        });
        this.loadingPromises.delete(src);
        resolve(true);
      };

      img.onerror = () => {
        this.cache.set(src, {
          src,
          element: img,
          loaded: false,
          error: true
        });
        this.loadingPromises.delete(src);
        resolve(false);
      };

      img.src = src;
    });

    this.loadingPromises.set(src, loadPromise);
    return loadPromise;
  }

  isImageLoaded(src: string): boolean {
    return this.cache.has(src) && this.cache.get(src)!.loaded;
  }

  isImageError(src: string): boolean {
    return this.cache.has(src) && this.cache.get(src)!.error;
  }

  getCachedImage(src: string): CachedImage | undefined {
    return this.cache.get(src);
  }

  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  // Pré-carrega múltiplas imagens
  async preloadImages(sources: string[]): Promise<void> {
    const promises = sources.map(src => this.preloadImage(src));
    await Promise.allSettled(promises);
  }
}

// Instância global do cache
const globalImageCache = new ImageCache();

export function useImageCache() {
  const [cacheReady, setCacheReady] = useState(false);
  const cacheRef = useRef(globalImageCache);

  const preloadImage = async (src: string): Promise<boolean> => {
    return await cacheRef.current.preloadImage(src);
  };

  const preloadImages = async (sources: string[]): Promise<void> => {
    await cacheRef.current.preloadImages(sources);
  };

  const isImageLoaded = (src: string): boolean => {
    return cacheRef.current.isImageLoaded(src);
  };

  const isImageError = (src: string): boolean => {
    return cacheRef.current.isImageError(src);
  };

  const getCachedImage = (src: string) => {
    return cacheRef.current.getCachedImage(src);
  };

  const clearCache = () => {
    cacheRef.current.clearCache();
  };

  return {
    preloadImage,
    preloadImages,
    isImageLoaded,
    isImageError,
    getCachedImage,
    clearCache,
    cacheReady
  };
}

// Hook específico para pré-carregar imagens de um array de pratos
export function usePreloadDishImages(dishes: Array<{ image: string }>) {
  const { preloadImages, isImageLoaded } = useImageCache();
  const [preloadedCount, setPreloadedCount] = useState(0);

  useEffect(() => {
    if (dishes.length === 0) return;

    const imageSources = dishes.map(dish => dish.image).filter(Boolean);
    
    if (imageSources.length === 0) return;

    const preloadAll = async () => {
      try {
        await preloadImages(imageSources);
        setPreloadedCount(imageSources.length);
      } catch (error) {
        console.warn('Erro ao pré-carregar imagens:', error);
      }
    };

    preloadAll();
  }, [dishes, preloadImages]);

  const getPreloadProgress = () => {
    if (dishes.length === 0) return 0;
    return (preloadedCount / dishes.length) * 100;
  };

  return {
    preloadedCount,
    totalImages: dishes.length,
    preloadProgress: getPreloadProgress(),
    isImageLoaded
  };
}
