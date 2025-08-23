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
  const shareData = {
    title: `Cardápio - ${restaurant.name}`,
    text: `Confira o cardápio do ${restaurant.name}!`,
    url: typeof window !== 'undefined' ? window.location.href : '',
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

// Extracted DropdownToggleButton for clarity and reusability
function DropdownToggleButton({
  open,
  hasMultiple,
  currentName,
  onClick
}: {
  open: boolean;
  hasMultiple: boolean;
  currentName?: string;
  onClick: () => void;
}) {
  // Extracted variables for clarity
  const buttonClass = "relative w-full h-8 rounded-none border-none shadow-none bg-transparent flex items-center justify-center overflow-hidden";
  const spanClass = "text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-2";
  const svgClass = `w-6 h-6 transition-transform ${open ? 'rotate-180' : ''}`;
  const svgStyle = { filter: 'drop-shadow(0 1.5px 4px rgba(0,0,0,0.7))' };
  const ariaLabel = hasMultiple ? 'Select restaurant' : currentName || 'Restaurant';

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-label={ariaLabel}
      style={{ padding: 0 }}
      tabIndex={0}
      type="button"
    >
      <span
        data-tutorial="restaurant-switch"
        className={spanClass}
      >
        {currentName}
        {hasMultiple && (
          <svg
            className={svgClass}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            viewBox="0 0 24 24"
            style={svgStyle}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </span>
    </button>
  );
}

function RestaurantDropdown({ restaurants, selectedRestaurantId, onSelect, current }: { restaurants: Restaurant[], selectedRestaurantId?: string, onSelect: (id: string) => void, current?: Restaurant }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasMultiple = searchParams.has("multiple");

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
    <div className="relative w-full" ref={dropdownRef}>
      <DropdownToggleButton
        open={open}
        hasMultiple={hasMultiple}
        currentName={current?.name}
        onClick={() => hasMultiple && setOpen(o => !o)}
      />
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 max-w-xs bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-3 flex flex-col gap-3 animate-fade-in">
          {restaurants.map(r => (
            <button
              key={r.id}
              className={`relative w-full h-20 rounded-2xl overflow-hidden transition ring-offset-2 focus:outline-none ${r.id === selectedRestaurantId ? 'ring-2 ring-cyan-500' : ''}`}
                              onClick={() => { onSelect(r.id); setOpen(false); router.push(`/restaurant/${r.slug || r.id}`); }}
            >
              <ImageWithLoading
                src={r.image}
                alt={r.name}
                clickable={false}
                className="object-cover w-full h-full rounded-2xl"
                fallbackSrc="/window.svg"
              />
              <span className="absolute inset-0 flex items-center justify-center text-white text-xl font-bold drop-shadow-lg text-center px-2 bg-black/30">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header({ restaurant, restaurants, selectedRestaurantId, onSelectRestaurant, currentSort, onSortChange }: HeaderProps) {
  const { t } = useTranslation();
  
  // Sempre mostra o título do restaurante atual, independente de ter múltiplos restaurantes
  return (
    <header className="header bg-white dark:bg-black p-0 m-0 h-[60px] flex items-center shadow-sm">
      <div className="container mx-auto flex items-center px-4 m-0">
        <div className="flex items-center gap-2 w-20">
          <AccessibilityButton />
          {currentSort && onSortChange && (
            <SortButton currentSort={currentSort} onSortChange={onSortChange} />
          )}
        </div>
        
        <h1 className="logo text-2xl font-bold text-gray-900 dark:text-white flex-1 text-center">
          {restaurant?.name}
        </h1>
        
        {restaurant && (
          <div className="flex items-center gap-2 w-24 justify-end">
            <ShareButton restaurant={restaurant} />
          </div>
        )}
      </div>
    </header>
  );
} 