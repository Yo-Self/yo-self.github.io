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
  clickable?: boolean;
  loading?: 'lazy' | 'eager';
}

function resolveInitialLoadState(
  src: string,
  isImageLoaded: (url: string) => boolean,
  isImageError: (url: string) => boolean,
): boolean {
  if (!src) return false;
  return !isImageLoaded(src) && !isImageError(src);
}

export default function ImageWithLoading({
  src,
  alt,
  className = "",
  fallbackSrc,
  onError,
  onLoad,
  children,
  clickable = true,
  loading = 'lazy',
}: ImageWithLoadingProps) {
  const { isImageLoaded, isImageError } = useImageCache();
  const [isLoading, setIsLoading] = useState(() =>
    resolveInitialLoadState(src, isImageLoaded, isImageError),
  );
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const checkCache = useCallback(() => {
    if (!src) return;

    if (isImageLoaded(src)) {
      setIsLoading(false);
      setHasError(false);
      setCurrentSrc(src);
      return;
    }

    if (isImageError(src)) {
      if (fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasError(false);
        setIsLoading(!isImageLoaded(fallbackSrc));
      } else {
        setIsLoading(false);
        setHasError(true);
        onError?.();
      }
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setCurrentSrc(src);
  }, [src, fallbackSrc, isImageLoaded, isImageError, onError]);

  useEffect(() => {
    checkCache();
  }, [checkCache]);

  const handleError = useCallback(() => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(!isImageLoaded(fallbackSrc));
    } else {
      setIsLoading(false);
      setHasError(true);
      onError?.();
    }
  }, [fallbackSrc, currentSrc, isImageLoaded, onError]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    if (!isImageError(currentSrc)) {
      handleError();
    }
  }, [currentSrc, isImageError, handleError]);

  const handleImageClick = () => {
    if (clickable && currentSrc && !hasError) {
      setIsImageModalOpen(true);
    }
  };

  const showSkeleton = isLoading && !isImageLoaded(currentSrc) && !hasError;

  return (
    <>
      <div className="relative w-full h-full overflow-hidden">
        <div
          className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg z-10 transition-opacity duration-200 ${
            showSkeleton ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={!showSkeleton}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>

        <img
          src={currentSrc}
          alt={alt}
          className={`block w-full h-full ${className} ${clickable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={loading}
          decoding="async"
          onClick={handleImageClick}
        />

        {hasError && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg z-20">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Imagem não disponível</span>
            </div>
          </div>
        )}

        {children}
      </div>

      {clickable && (
        <ImageModal
          isOpen={isImageModalOpen}
          imageSrc={currentSrc}
          imageAlt={alt}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}
    </>
  );
}
