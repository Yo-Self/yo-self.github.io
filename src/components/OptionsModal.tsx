"use client";

import React, { useState, useEffect } from "react";
import { useModalScroll } from '../hooks/useModalScroll';
import { useAccessibility } from "./AccessibilityContext";
import Analytics, { getCurrentRestaurantId } from '../lib/analytics';
import { Restaurant } from "./data";

export type SortOption = {
  field: "name" | "price" | "default";
  direction: "asc" | "desc";
};

interface OptionsModalProps {
  open: boolean;
  onClose: () => void;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  restaurant?: Restaurant;
  showSort?: boolean;
}

// Helper functions for sharing
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafariIOS = /Safari/.test(navigator.userAgent) && 
                     !/Chrome/.test(navigator.userAgent) && 
                     /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isIPadMacOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isIOSDevice || isSafariIOS || isIPadMacOS;
};

const shareMenu = async (restaurant: Restaurant) => {
  const cleanUrl = typeof window !== 'undefined' 
    ? window.location.href.split('#')[0] 
    : '';
    
  const shareData = {
    title: `Cardápio - ${restaurant.name}`,
    text: `Confira o cardápio do ${restaurant.name}!`,
    url: cleanUrl,
  };

  if (isIOS()) {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      alert('Para compartilhar, acesse o site via HTTPS');
      return;
    }
    
    try {
      await navigator.share(shareData);
      return;
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === 'AbortError') {
        return;
      }
      try {
        await navigator.share({ url: shareData.url });
        return;
      } catch (urlError) {
        if (urlError instanceof Error && urlError.name === 'AbortError') {
          return;
        }
      }
    }
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === 'AbortError') {
        return;
      }
    }
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareData.url);
      alert('Link copiado para a área de transferência!');
      return;
    }
  } catch (clipboardError) {}

  try {
    const textArea = document.createElement('textarea');
    textArea.value = shareData.url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    // Guard against DOM races/unmounts (prevents NotFoundError removeChild)
    textArea.remove();
    
    if (successful) {
      alert('Link copiado para a área de transferência!');
      return;
    }
  } catch (execError) {}

  alert(`Não foi possível compartilhar automaticamente. Copie este link: ${shareData.url}`);
};

export default function OptionsModal({ open, onClose, currentSort, onSortChange, restaurant, showSort = true }: OptionsModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { fontSize, increaseFontSize, decreaseFontSize, resetFontSize, theme, setTheme } = useAccessibility();

  const handleShare = async () => {
    if (!restaurant) return;
    setIsSharing(true);
    try {
      await shareMenu(restaurant);
    } finally {
      setIsSharing(false);
    }
  };

  // Efeito para gerenciar o fechamento animado
  useEffect(() => {
    if (open) {
      setIsClosing(false);
    }
  }, [open]);

  // Controlar o scroll do body quando o modal abrir/fechar
  useModalScroll(open);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 250);
  };

  if (!open) return null;

  const handleSortChange = (field: "name" | "price" | "default", direction: "asc" | "desc") => {
    onSortChange({ field, direction });
    // Close modal on sort change as before
    handleClose();
  };

  const handleDecreaseFont = () => {
    decreaseFontSize();
    Analytics.trackAccessibilityToggle('font_size_decrease', true, getCurrentRestaurantId() || 'unknown');
  };

  const handleIncreaseFont = () => {
    increaseFontSize();
    Analytics.trackAccessibilityToggle('font_size_increase', true, getCurrentRestaurantId() || 'unknown');
  };

  const handleResetFont = () => {
    resetFontSize();
    Analytics.trackAccessibilityToggle('font_size_reset', true, getCurrentRestaurantId() || 'unknown');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    Analytics.trackAccessibilityToggle(`theme_${newTheme}`, true, getCurrentRestaurantId() || 'unknown');
  };

  const getCurrentFontSizeLabel = () => {
    switch (fontSize) {
      case 'normal': return 'Normal';
      case 'large': return 'Grande';
      case 'extra-large': return 'Extra Grande';
      default: return 'Normal';
    }
  };

  const getCurrentThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Claro';
      case 'dark': return 'Escuro';
      case 'system': return 'Sistema';
      default: return 'Sistema';
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isClosing 
          ? 'animate-menu-backdrop-close' 
          : 'animate-menu-backdrop-open'
      }`}
      style={{
        background: isClosing 
          ? 'rgba(0, 0, 0, 0.3)' 
          : 'rgba(0, 0, 0, 0.5)',
        backdropFilter: isClosing ? 'blur(1.5px)' : 'blur(3px)'
      }}
    >
      <div 
        className={`bg-white dark:bg-gray-900 rounded-3xl p-6 mx-4 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800/80 menu-transition ${
          isClosing 
            ? 'animate-sort-modal-close' 
            : 'animate-sort-modal-open'
        }`}
      >
        {/* Modal Header */}
        <div 
          className="flex items-center justify-between mb-5 transform transition-all duration-300 delay-25"
          style={{
            animation: isClosing ? 'none' : 'fadeInUp 0.4s ease-out forwards'
          }}
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Opções do Cardápio
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 hover:scale-110 active:scale-95 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto max-h-[70vh] pr-1">
          {/* ORDENAÇÃO BLOCK */}
          {showSort && (
            <div 
              className="space-y-3 transform transition-all duration-300 delay-75"
              style={{
                animation: isClosing ? 'none' : 'fadeInUp 0.4s ease-out forwards'
              }}
            >
              <div className="flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2">
                <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Ordenar por
                </h4>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSortChange("default", "asc")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                      currentSort.field === "default"
                        ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/10"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750"
                    }`}
                  >
                    Padrão
                  </button>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pl-1">Nome</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSortChange("name", "asc")}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                        currentSort.field === "name" && currentSort.direction === "asc"
                          ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/10"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750"
                      }`}
                    >
                      Ordem A → Z
                    </button>
                    <button
                      onClick={() => handleSortChange("name", "desc")}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                        currentSort.field === "name" && currentSort.direction === "desc"
                          ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/10"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750"
                      }`}
                    >
                      Ordem Z → A
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pl-1">Preço</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSortChange("price", "asc")}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                        currentSort.field === "price" && currentSort.direction === "asc"
                          ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/10"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750"
                      }`}
                    >
                      Menor → Maior
                    </button>
                    <button
                      onClick={() => handleSortChange("price", "desc")}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                        currentSort.field === "price" && currentSort.direction === "desc"
                          ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/10"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750"
                      }`}
                    >
                      Maior → Menor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACCESSIBILITY BLOCK */}
          <div 
            className="space-y-4 pt-1 transform transition-all duration-300 delay-150"
            style={{
              animation: isClosing ? 'none' : 'fadeInUp 0.4s ease-out forwards'
            }}
          >
            <div className="flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2">
              <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                Acessibilidade
              </h4>
            </div>

            {/* Font size control */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pl-1">
                Tamanho da Fonte
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDecreaseFont}
                  disabled={fontSize === 'normal'}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 focus:outline-none cursor-pointer ${
                    fontSize === 'normal'
                      ? 'bg-gray-50 dark:bg-gray-850 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-250 dark:hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  Diminuir
                </button>
                <button
                  type="button"
                  onClick={handleIncreaseFont}
                  disabled={fontSize === 'extra-large'}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 focus:outline-none cursor-pointer ${
                    fontSize === 'extra-large'
                      ? 'bg-gray-50 dark:bg-gray-850 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-250 dark:hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  Aumentar
                </button>
                <button
                  type="button"
                  onClick={handleResetFont}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-250 dark:hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98] focus:outline-none cursor-pointer"
                >
                  Padrão
                </button>
              </div>
              <div className="text-[10px] text-center font-size-status-badge py-1.5 px-3 rounded-lg font-medium">
                Tamanho atual: <span className="font-bold">{getCurrentFontSizeLabel()}</span>
              </div>
            </div>

            {/* Theme control */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pl-1">
                Tema Visual
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all duration-250 cursor-pointer ${
                    theme === 'light'
                      ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/10'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-250 dark:hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-500 shrink-0"></div>
                  <span>Claro</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all duration-250 cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/10'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-250 dark:hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-950 border border-gray-700 dark:bg-white dark:border-gray-300 shrink-0"></div>
                  <span>Escuro</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange('system')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all duration-250 cursor-pointer ${
                    theme === 'system'
                      ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/10'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-250 dark:hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-yellow-400 to-gray-700 border border-gray-400 shrink-0"></div>
                  <span>Auto</span>
                </button>
              </div>
              <div className="text-[10px] text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-850 py-1.5 px-3 rounded-lg font-medium">
                Tema atual: <span className="font-bold">{getCurrentThemeLabel()}</span>
              </div>
            </div>

            {/* Share control */}
            {restaurant && (
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pl-1">
                  Compartilhar
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={isSharing}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-400 text-white shadow-md shadow-cyan-500/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    {isSharing ? (
                      <>
                        <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Gerando Link...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        <span>Compartilhar Link do Cardápio</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
