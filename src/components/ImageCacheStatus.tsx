import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useImageCache } from '../hooks/useImageCache';

interface ImageCacheStatusProps {
  dishes: Array<{ name: string; image: string }>;
  className?: string;
}

export default function ImageCacheStatus({ dishes, className = "" }: ImageCacheStatusProps) {
  const { isImageLoaded, isImageError } = useImageCache();
  const [isExpanded, setIsExpanded] = useState(false);

  const loadedCount = dishes.filter(dish => isImageLoaded(dish.image)).length;
  const errorCount = dishes.filter(dish => isImageError(dish.image)).length;
  const totalCount = dishes.length;
  const loadingCount = totalCount - loadedCount - errorCount;

  const progress = totalCount > 0 ? (loadedCount / totalCount) * 100 : 0;

  if (totalCount === 0) return null;

  return (
    <motion.div
      className={`fixed bottom-4 right-4 z-50 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Botão compacto */}
      <motion.button
        className="bg-black/80 hover:bg-black/90 text-white rounded-full p-3 shadow-lg backdrop-blur-sm"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Status do cache de imagens"
      >
        <div className="w-6 h-6 relative">
          {/* Ícone de cache */}
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          
          {/* Indicador de progresso */}
          <svg className="absolute inset-0 w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 10}`}
              strokeDashoffset={`${2 * Math.PI * 10 * (1 - progress / 100)}`}
              className="text-cyan-400"
            />
          </svg>
        </div>
      </motion.button>

      {/* Painel expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="absolute bottom-full right-0 mb-2 bg-black/90 text-white rounded-lg p-4 shadow-xl backdrop-blur-sm min-w-64"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Cache de Imagens</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Barra de progresso */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-cyan-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Estatísticas */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-green-400">✓ Carregadas</span>
                <span>{loadedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-400">⏳ Carregando</span>
                <span>{loadingCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400">✗ Erro</span>
                <span>{errorCount}</span>
              </div>
              <div className="flex justify-between border-t border-gray-600 pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">{totalCount}</span>
              </div>
            </div>

            {/* Lista de imagens com status */}
            <div className="mt-3 max-h-32 overflow-y-auto">
              {dishes.slice(0, 10).map((dish, index) => (
                <div key={dish.name} className="flex items-center justify-between py-1 text-xs">
                  <span className="truncate max-w-32" title={dish.name}>
                    {dish.name}
                  </span>
                  <span className={`ml-2 ${
                    isImageLoaded(dish.image) ? 'text-green-400' :
                    isImageError(dish.image) ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {isImageLoaded(dish.image) ? '✓' :
                     isImageError(dish.image) ? '✗' : '⏳'}
                  </span>
                </div>
              ))}
              {dishes.length > 10 && (
                <div className="text-xs text-gray-400 text-center py-1">
                  +{dishes.length - 10} mais...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
