"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useImageCache } from '../hooks/useImageCache';
import { normalizeMenuImageUrl } from '@/constants/menuImages';
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

function resolveDisplaySrc(src: string, fallbackSrc?: string): string {
  const normalized = src && normalizeMenuImageUrl(src) ? src : '';
  return normalized || fallbackSrc || '';
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
  const { isImageLoaded } = useImageCache();

  const initialSrc = resolveDisplaySrc(src, fallbackSrc);
  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  // The native <img> element is the source of truth for load state. We only
  // start optimistically "loaded" when a preload cache already has the asset,
  // which avoids a skeleton flash on already-cached images.
  const [isLoaded, setIsLoaded] = useState(() => (initialSrc ? isImageLoaded(initialSrc) : false));
  const [hasError, setHasError] = useState(() => !initialSrc);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Keep the displayed src in sync with the incoming props, but only update
  // state when the resolved value actually changes. This prevents unrelated
  // parent re-renders (e.g. a lazily-loaded fallback/restaurant object) from
  // resetting the load state and causing the image to flicker back to loading.
  useEffect(() => {
    const nextSrc = resolveDisplaySrc(src, fallbackSrc);
    setCurrentSrc((prev) => (prev === nextSrc ? prev : nextSrc));
  }, [src, fallbackSrc]);

  // Reset load/error state only when the src we actually display changes.
  useEffect(() => {
    if (!currentSrc) {
      setIsLoaded(false);
      setHasError(true);
      return;
    }
    setHasError(false);
    setIsLoaded(isImageLoaded(currentSrc));
  }, [currentSrc, isImageLoaded]);

  // Reconciles the case where the <img> is already complete (e.g. served straight
  // from the browser/HTTP cache before React attaches onLoad). Guarded by
  // `!isLoaded` so it can never loop.
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !currentSrc || isLoaded) return;
    if (img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
      setHasError(false);
    }
  }, [currentSrc, isLoaded]);

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      // Fall back to the alternate source; state resets via the currentSrc effect.
      setCurrentSrc(fallbackSrc);
      return;
    }
    setIsLoaded(false);
    setHasError(true);
    onError?.();
  }, [fallbackSrc, currentSrc, onError]);

  const handleImageClick = () => {
    if (clickable && currentSrc && !hasError) {
      setIsImageModalOpen(true);
    }
  };

  const showSkeleton = !!currentSrc && !isLoaded && !hasError;

  return (
    <>
      <div className={`relative overflow-hidden ${className}`}>
        <div
          className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-lg z-10 transition-opacity duration-200 ${
            showSkeleton
              ? 'animate-pulse opacity-100'
              : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={!showSkeleton}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>

        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover ${clickable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
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
