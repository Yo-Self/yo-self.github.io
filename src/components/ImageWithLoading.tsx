"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useImageCache } from '../hooks/useImageCache';
import ImageModal from './ImageModal';

interface ImageWithLoadingProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onError?: () => void;
  onLoad?: () => void;
  children?: React.ReactNode;
  clickable?: boolean; // Nova prop para controlar se a imagem é clicável
}

export default function ImageWithLoading({
  src,
  alt,
  className = "",
  fallbackSrc,
  onError,
  onLoad,
  children,
  clickable = true // Por padrão, as imagens são clicáveis
}: ImageWithLoadingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const { isImageLoaded, isImageError, preloadImage } = useImageCache();

  // Memoize the checkCache function to prevent infinite re-renders
  const checkCache = useCallback(async () => {
    if (!src) return;

    // Se a imagem já está carregada no cache, não mostrar loading
    if (isImageLoaded(src)) {
      setIsLoading(false);
      setHasError(false);
      setCurrentSrc(src);
      onLoad?.();
      return;
    }

    // Se a imagem deu erro no cache, usar fallback
    if (isImageError(src)) {
      if (fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasError(false);
        setIsLoading(true);
      } else {
        setIsLoading(false);
        setHasError(true);
        onError?.();
      }
      return;
    }

    // Se não está no cache, tentar pré-carregar
    try {
      setIsLoading(true);
      setHasError(false);
      setCurrentSrc(src);
      
      const success = await preloadImage(src);
      if (success) {
        setIsLoading(false);
        onLoad?.();
      } else {
        // Se falhou, tentar fallback
        if (fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          setHasError(false);
          setIsLoading(true);
          const fallbackSuccess = await preloadImage(fallbackSrc);
          setIsLoading(false);
          if (!fallbackSuccess) {
            setHasError(true);
            onError?.();
          }
        } else {
          setIsLoading(false);
          setHasError(true);
          onError?.();
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar imagem:', error);
      if (fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasError(false);
        setIsLoading(true);
      } else {
        setIsLoading(false);
        setHasError(true);
        onError?.();
      }
    }
  }, [src, fallbackSrc, isImageLoaded, isImageError, preloadImage, onLoad, onError]);

  // Verificar se a imagem já está no cache
  useEffect(() => {
    checkCache();
  }, [checkCache]);

  // Forçar remoção do loading após 2 segundos para imagens que não disparam onLoad
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Memoize the handleError function
  const handleError = useCallback(() => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    } else {
      setIsLoading(false);
      setHasError(true);
      onError?.();
    }
  }, [fallbackSrc, currentSrc, onError]);

  // Memoize the onLoad handler
  const handleImageLoad = useCallback(() => {
    // Só dispara onLoad se não estiver usando cache
    if (!isImageLoaded(currentSrc)) {
      setIsLoading(false);
      onLoad?.();
    }
  }, [currentSrc, isImageLoaded, onLoad]);

  // Memoize the onError handler
  const handleImageError = useCallback(() => {
    // Só dispara onError se não estiver usando cache
    if (!isImageError(currentSrc)) {
      handleError();
    }
  }, [currentSrc, isImageError, handleError]);

  const handleImageClick = () => {
    if (clickable && currentSrc && !hasError) {
      setIsImageModalOpen(true);
    }
  };

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Loading skeleton - só mostra se realmente estiver carregando */}
        {isLoading && !isImageLoaded(currentSrc) && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg z-10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        )}
        
        {/* Image */}
        <img
          src={currentSrc}
          alt={alt}
          className={`${className} opacity-100 ${clickable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          onClick={handleImageClick}
        />
        
        {/* Error fallback */}
        {hasError && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg z-20">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Imagem não disponível</p>
            </div>
          </div>
        )}
        
        {/* Overlay content */}
        {children}
      </div>

      {/* Modal de imagem em tela cheia */}
      <ImageModal
        isOpen={isImageModalOpen}
        imageSrc={currentSrc}
        imageAlt={alt}
        onClose={() => setIsImageModalOpen(false)}
      />
    </>
  );
}
