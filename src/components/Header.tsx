"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "./i18n";
import { Restaurant } from "./data";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import SortButton from "./SortButton";
import { SortOption } from "./SortModal";
import AccessibilityButton from "./AccessibilityButton";
import ImageWithLoading from "./ImageWithLoading";
import { CartIconHeader } from "./CartIcon";
import { useActiveOrders } from "@/hooks/useActiveOrders";
import OrderStatusModal from "./OrderStatusModal";
import { useCart } from "@/hooks/useCart";

// Smart Restaurant Title Component
function SmartRestaurantTitle({ 
  name, 
  onClick, 
  hasMultiple, 
  open 
}: { 
  name: string; 
  onClick?: () => void; 
  hasMultiple?: boolean; 
  open?: boolean; 
}) {
  const [titleRef, setTitleRef] = useState<HTMLElement | null>(null);
  const [fontSize, setFontSize] = useState('text-xl');
  const [shouldTruncate, setShouldTruncate] = useState(false);

  useEffect(() => {
    if (!titleRef || !name) return;

    const measureText = () => {
      // Reset to default state
      setFontSize('text-xl');
      setShouldTruncate(false);
      
      // Force layout recalculation
      setTimeout(() => {
        const element = titleRef;
        if (!element) return;

        const maxHeight = 48; // Max height for 2 lines
        
        // Check if text overflows
        if (element.scrollHeight > maxHeight) {
          // Try smaller font first
          setFontSize('text-lg');
          
          setTimeout(() => {
            if (element.scrollHeight > maxHeight) {
              // If still overflows, check if we should truncate
              const charLimit = Math.floor(name.length * (maxHeight / element.scrollHeight));
              const overflow = name.length - charLimit;
              
              if (overflow > 10) {
                setShouldTruncate(true);
              } else {
                // Try even smaller font
                setFontSize('text-base');
              }
            }
          }, 10);
        }
      }, 10);
    };

    measureText();
  }, [name, titleRef]);

  const titleClasses = `
    font-bold text-gray-900 dark:text-white text-center max-w-full
    ${fontSize}
    ${shouldTruncate 
      ? 'line-clamp-2' 
      : 'leading-tight'
    }
  `.trim();

  const content = (
    <h1 className="inline-flex items-center justify-center gap-1.5 max-w-full flex-nowrap" data-tutorial="restaurant-switch">
      <span 
        ref={setTitleRef}
        className={titleClasses}
        style={{
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: shouldTruncate ? 2 : 'unset',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: fontSize === 'text-base' ? '1.25' : '1.2'
        }}
      >
        {name}
      </span>
      {hasMultiple && (
        <svg
          className={`w-4 h-4 transition-transform shrink-0 text-gray-500 dark:text-gray-400 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </h1>
  );

  if (onClick) {
    return (
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        className="flex items-center justify-center max-w-full focus:outline-none select-none cursor-pointer bg-transparent border-none p-0"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={hasMultiple ? 'Selecionar restaurante' : name}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}

interface HeaderProps {
  restaurant?: Restaurant;
  restaurants?: Restaurant[];
  selectedRestaurantId?: string;
  onSelectRestaurant?: (id: string) => void;
  currentSort?: SortOption;
  onSortChange?: (sort: SortOption) => void;
}

// Função para detectar iOS
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  
  // Verifica se é iOS
  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Verifica se é Safari no iOS
  const isSafariIOS = /Safari/.test(navigator.userAgent) && 
                     !/Chrome/.test(navigator.userAgent) && 
                     /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Verifica se é iPad com macOS
  const isIPadMacOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  
  return isIOSDevice || isSafariIOS || isIPadMacOS;
};

// Função para detectar Safari
const isSafari = () => {
  if (typeof window === 'undefined') return false;
  return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
};

// Função para compartilhar o cardápio
const shareMenu = async (restaurant: Restaurant) => {
  // Remover hash da URL antes de compartilhar (o hash #rest= é usado apenas internamente pelo webapp)
  const cleanUrl = typeof window !== 'undefined' 
    ? window.location.href.split('#')[0] 
    : '';
    
  const shareData = {
    title: `Cardápio - ${restaurant.name}`,
    text: `Confira o cardápio do ${restaurant.name}!`,
    url: cleanUrl,
  };



  // No iOS, força o uso da Web Share API
  if (isIOS()) {
    // Verifica se está em HTTPS (necessário para Web Share API)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      alert('Para compartilhar, acesse o site via HTTPS');
      return;
    }
    
    try {
      // Tenta com dados completos
      await navigator.share(shareData);
      return;
    } catch (shareError) {
      // Se for cancelamento, não faz nada
      if (shareError instanceof Error && shareError.name === 'AbortError') {
        return;
      }
      
      // Se falhar com dados completos, tenta apenas com URL
      try {
        await navigator.share({
          url: shareData.url
        });
        return;
      } catch (urlError) {
        if (urlError instanceof Error && urlError.name === 'AbortError') {
          return;
        }
      }
    }
  }

  // Para outros dispositivos, tenta Web Share API normal
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

  // Fallback: Clipboard API
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareData.url);
      alert('Link copiado para a área de transferência!');
      return;
    }
  } catch (clipboardError) {
    // Continua para o próximo fallback
  }

  // Fallback: execCommand
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
    document.body.removeChild(textArea);
    
    if (successful) {
      alert('Link copiado para a área de transferência!');
      return;
    }
  } catch (execError) {
    // Continua para o próximo fallback
  }

  // Última tentativa
  alert(`Não foi possível compartilhar automaticamente. Copie este link: ${shareData.url}`);
};

// Botão de compartilhar
function ShareButton({ restaurant }: { restaurant: Restaurant }) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!restaurant) return;
    
    setIsSharing(true);
    try {
      await shareMenu(restaurant);
    } finally {
      setIsSharing(false);
    }
  };

  if (!restaurant) return null;

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-400 transition-colors duration-200 shadow-lg"
      aria-label="Compartilhar cardápio"
      title="Compartilhar cardápio"
    >
      {isSharing ? (
        <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      )}
    </button>
  );
}

function TrackOrderButton({ orderId }: { orderId: string }) {
  const [showModal, setShowModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const handleOpenTracking = () => setShowModal(true);
    
    const handleShowTutorial = () => {
      setShowTutorial(true);
      // Ocultar automaticamente após 8 segundos
      setTimeout(() => setShowTutorial(false), 8000);
    };

    window.addEventListener('open-order-tracking', handleOpenTracking);
    window.addEventListener('show-tracking-tutorial', handleShowTutorial);

    return () => {
      window.removeEventListener('open-order-tracking', handleOpenTracking);
      window.removeEventListener('show-tracking-tutorial', handleShowTutorial);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      <button
        onClick={() => {
          setShowModal(true);
          setShowTutorial(false);
        }}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 hover:bg-indigo-600 transition-colors duration-200 shadow-lg relative"
        aria-label="Acompanhar Pedido"
        title="Acompanhar Pedido"
      >
        <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-50"></div>
        <svg className="w-4 h-4 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </button>

      {/* Tooltip Tutorial */}
      {showTutorial && (
        <div 
          className="absolute top-full right-0 mt-3 w-48 bg-indigo-600 text-white text-sm font-medium p-3 rounded-xl shadow-xl z-[100] animate-fade-in"
          style={{ animation: 'bounce 2s infinite' }}
        >
          <div className="absolute -top-2 right-3 w-4 h-4 bg-indigo-600 transform rotate-45"></div>
          <div className="relative z-10 flex items-start gap-2">
            <span className="text-xl">🛵</span>
            <span className="leading-tight">Acompanhe seu pedido por aqui!</span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowTutorial(false);
            }}
            className="absolute top-1 right-1 p-1 text-white/70 hover:text-white"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      )}

      {showModal && (
        <OrderStatusModal 
          orderId={orderId} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
}

function RestaurantDropdown({ restaurants, selectedRestaurantId, onSelect, current }: { restaurants: Restaurant[], selectedRestaurantId?: string, onSelect: (id: string) => void, current?: Restaurant }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const hasMultiple = restaurants && restaurants.length > 1;

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative w-full flex items-center justify-center" ref={dropdownRef}>
      <SmartRestaurantTitle
        name={current?.name || ''}
        onClick={hasMultiple ? () => setOpen(o => !o) : undefined}
        hasMultiple={hasMultiple}
        open={open}
      />
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-80 sm:w-[360px] max-w-[90vw] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-150 dark:border-gray-800 z-50 p-3 flex flex-col gap-2.5 animate-fade-in animate-scale-up" style={{ top: '100%' }}>
          {restaurants.map(r => (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              className={`w-full p-3.5 rounded-xl flex items-center gap-4 border transition-all text-left focus:outline-none cursor-pointer select-none ${
                r.id === selectedRestaurantId 
                  ? 'bg-cyan-50/60 dark:bg-cyan-950/20 border-cyan-500/80 ring-1 ring-cyan-500/40' 
                  : 'bg-gray-50/50 dark:bg-gray-850/40 border-gray-100/60 dark:border-gray-800/60 hover:bg-gray-100/80 dark:hover:bg-gray-800/90 active:scale-[0.98]'
              }`}
              onClick={() => { onSelect(r.id); setOpen(false); router.push(`/restaurant/${r.slug || r.id}`); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(r.id);
                  setOpen(false);
                  router.push(`/restaurant/${r.slug || r.id}`);
                }
              }}
            >
              {/* Rectangular photo thumbnail */}
              <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border border-gray-200/50 dark:border-gray-750">
                <ImageWithLoading
                  src={r.image}
                  alt={r.name}
                  clickable={false}
                  className="object-cover w-full h-full"
                  fallbackSrc="/window.svg"
                />
              </div>
              
              {/* Name & Slogan */}
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-gray-800 dark:text-gray-200 truncate leading-tight">
                  {r.name}
                </h4>
                {r.welcome_message && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 font-normal leading-normal">
                    {r.welcome_message.replace(/Bem-vindo ao\s+/gi, '')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export default function Header({ restaurant, restaurants, selectedRestaurantId, onSelectRestaurant, currentSort, onSortChange }: HeaderProps) {
  const { t } = useTranslation();
  const { activeOrderIds } = useActiveOrders();
  const { isEmpty } = useCart();
  const hasActiveOrder = activeOrderIds.length > 0;
  
  return (
    <header className="header bg-white dark:bg-black p-0 m-0 h-[60px] flex items-center shadow-sm relative z-40">
      <div className="container mx-auto flex items-center px-4 m-0">
        <div className="flex items-center gap-2 w-20">
          <AccessibilityButton />
          {currentSort && onSortChange && (
            <SortButton currentSort={currentSort} onSortChange={onSortChange} />
          )}
        </div>
        
        <div className="flex-1 px-2 flex items-center justify-center">
          {restaurants && restaurants.length > 1 ? (
            <RestaurantDropdown
              restaurants={restaurants}
              selectedRestaurantId={selectedRestaurantId}
              onSelect={onSelectRestaurant || (() => {})}
              current={restaurant}
            />
          ) : (
            <SmartRestaurantTitle name={restaurant?.name || ''} />
          )}
        </div>
        
        {restaurant && (
          <div className="flex items-center gap-2 w-20 justify-end">
            {hasActiveOrder && isEmpty ? (
              <TrackOrderButton orderId={activeOrderIds[activeOrderIds.length - 1]} />
            ) : (
              <ShareButton restaurant={restaurant} />
            )}
            {!isEmpty && <CartIconHeader />}
          </div>
        )}
      </div>
    </header>
  );
} 