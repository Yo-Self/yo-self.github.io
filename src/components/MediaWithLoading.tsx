"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useImageCache } from '../hooks/useImageCache';
import { normalizeMenuImageUrl } from '@/constants/menuImages';
import { getOptimizedImageUrl } from '@/utils/imageUrl';
import { isVideoMedia } from '@/utils/mediaUrl';
import ImageModal from './ImageModal';

interface MediaWithLoadingProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onError?: () => void;
  onLoad?: () => void;
  children?: React.ReactNode;
  clickable?: boolean;
  loading?: 'lazy' | 'eager';
  mediaType?: 'image' | 'video';
  videoSrc?: string | null;
  videoControls?: boolean;
}

function resolveInitialLoadState(
  src: string,
  isImageLoaded: (url: string) => boolean,
  isImageError: (url: string) => boolean,
): boolean {
  if (!src) return false;
  return !isImageLoaded(src) && !isImageError(src);
}

export default function MediaWithLoading({
  src,
  alt,
  className = "",
  fallbackSrc,
  onError,
  onLoad,
  children,
  clickable = true,
  loading = 'lazy',
  mediaType = 'image',
  videoSrc,
  videoControls = false,
}: MediaWithLoadingProps) {
  const showVideo = isVideoMedia(mediaType, videoSrc);
  const posterSrc = src ? getOptimizedImageUrl(src, 600) : (fallbackSrc ? getOptimizedImageUrl(fallbackSrc, 600) : '');
  const resolvedVideoSrc = showVideo ? (videoSrc ?? '') : '';

  const { isImageLoaded, isImageError } = useImageCache();
  const resolvedSrc = src && normalizeMenuImageUrl(src) ? src : '';
  const [isLoading, setIsLoading] = useState(() =>
    showVideo ? false : resolveInitialLoadState(resolvedSrc || fallbackSrc || '', isImageLoaded, isImageError),
  );
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(() => resolvedSrc || fallbackSrc || '');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const syncCompleteImageState = useCallback(() => {
    if (showVideo) return;
    const img = containerRef.current?.querySelector('img');
    if (!img || !currentSrc) return;

    if (img.complete && img.naturalWidth > 0) {
      setIsLoading(false);
      setHasError(false);
    }
  }, [currentSrc, showVideo]);

  const checkCache = useCallback(() => {
    if (showVideo) {
      setIsLoading(false);
      setHasError(false);
      return;
    }

    const normalizedSrc = src && normalizeMenuImageUrl(src) ? src : '';

    if (!normalizedSrc) {
      if (fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasError(false);
        setIsLoading(!isImageLoaded(fallbackSrc));
      } else {
        setIsLoading(false);
        setHasError(true);
      }
      return;
    }

    if (isImageLoaded(normalizedSrc)) {
      setIsLoading(false);
      setHasError(false);
      setCurrentSrc(normalizedSrc);
      return;
    }

    if (isImageError(normalizedSrc)) {
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
    setCurrentSrc(normalizedSrc);
  }, [src, fallbackSrc, isImageLoaded, isImageError, onError, showVideo]);

  useEffect(() => {
    checkCache();
  }, [checkCache]);

  useEffect(() => {
    if (!showVideo && isImageLoaded(currentSrc)) {
      setIsLoading(false);
      setHasError(false);
    }
  }, [currentSrc, isImageLoaded, showVideo]);

  useEffect(() => {
    syncCompleteImageState();
  }, [syncCompleteImageState, currentSrc]);

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
    if (clickable && currentSrc && !hasError && !showVideo) {
      setIsImageModalOpen(true);
    }
  };

  const showSkeleton = !showVideo && isLoading && !isImageLoaded(currentSrc) && !hasError;

  return (
    <>
      <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
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

        {showVideo && resolvedVideoSrc ? (
          <video
            src={resolvedVideoSrc}
            poster={posterSrc || undefined}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            controls={videoControls}
            preload="metadata"
            aria-label={alt}
            onLoadedData={() => {
              setIsLoading(false);
              onLoad?.();
            }}
            onError={() => {
              setHasError(true);
              onError?.();
            }}
          />
        ) : (
          <img
            src={currentSrc ? getOptimizedImageUrl(currentSrc, 600) : currentSrc}
            alt={alt}
            className={`absolute inset-0 w-full h-full object-cover ${clickable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading={loading}
            decoding="async"
            onClick={handleImageClick}
          />
        )}

        {hasError && !showVideo && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg z-20">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Mídia não disponível</span>
            </div>
          </div>
        )}

        {children}
      </div>

      {clickable && !showVideo && (
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
