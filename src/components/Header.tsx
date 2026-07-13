"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useTranslation } from "./i18n";
import { Restaurant } from "./data";
import { useRouter, usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";
import OptionsButton from "./OptionsButton";
import { SortOption } from "./OptionsModal";
import ImageWithLoading from "./ImageWithLoading";
import { CartIconHeader } from "./CartIcon";
import { useActiveOrders } from "@/hooks/useActiveOrders";
import OrderStatusModal from "./OrderStatusModal";
import { useCart } from "@/hooks/useCart";

const TITLE_MAX_HEIGHT_PX = 48;

function getBalancedTwoLineSplit(name: string, font: string): [string, string] | null {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }

  ctx.font = font;

  let bestSplit = 1;
  let bestDiff = Infinity;

  for (let i = 1; i < words.length; i++) {
    const line1 = words.slice(0, i).join(' ');
    const line2 = words.slice(i).join(' ');
    const diff = Math.abs(ctx.measureText(line1).width - ctx.measureText(line2).width);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSplit = i;
    }
  }

  return [words.slice(0, bestSplit).join(' '), words.slice(bestSplit).join(' ')];
}

function getLineHeightPx(element: HTMLElement): number {
  const style = getComputedStyle(element);
  const parsed = parseFloat(style.lineHeight);
  if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  const fontSize = parseFloat(style.fontSize);
  return Number.isNaN(fontSize) ? 24 : fontSize * 1.2;
}

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
  const titleRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState<'text-xl' | 'text-lg' | 'text-base'>('text-xl');
  const [shouldTruncate, setShouldTruncate] = useState(false);
  const [balancedLines, setBalancedLines] = useState<[string, string] | null>(null);

  useLayoutEffect(() => {
    const element = titleRef.current;
    if (!element || !name) return;

    let cancelled = false;

    const measureLineBreak = () => {
      if (cancelled || !titleRef.current) return;
      const el = titleRef.current;
      const lineHeightPx = getLineHeightPx(el);
      const needsTwoLines = el.scrollHeight > lineHeightPx * 1.35;
      const words = name.trim().split(/\s+/).filter(Boolean);

      if (needsTwoLines && words.length >= 2) {
        const style = getComputedStyle(el);
        const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const split = getBalancedTwoLineSplit(name, font);
        setBalancedLines(split);
        return;
      }

      setBalancedLines(null);
    };

    setFontSize('text-xl');
    setShouldTruncate(false);
    setBalancedLines(null);

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(measureLineBreak);
    });

    const resizeObserver = new ResizeObserver(() => {
      setFontSize('text-xl');
      setShouldTruncate(false);
      setBalancedLines(null);
      requestAnimationFrame(() => {
        requestAnimationFrame(measureLineBreak);
      });
    });
    resizeObserver.observe(element);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, [name]);

  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el || !name) return;

    if (el.scrollHeight <= TITLE_MAX_HEIGHT_PX) return;

    if (fontSize === 'text-xl') {
      setFontSize('text-lg');
      return;
    }

    if (fontSize === 'text-lg') {
      const charLimit = Math.floor(name.length * (TITLE_MAX_HEIGHT_PX / el.scrollHeight));
      if (name.length - charLimit > 10) {
        setShouldTruncate(true);
      } else {
        setFontSize('text-base');
      }
    }
  }, [name, balancedLines, fontSize]);

  const titleClasses = `
    font-bold text-gray-900 dark:text-white text-center w-full
    max-w-[min(100%,calc(100vw-6.5rem))] sm:max-w-[min(100%,calc(100vw-30rem))]
    ${fontSize}
    ${shouldTruncate ? 'line-clamp-2' : 'leading-tight'}
  `.trim();

  const lineHeight = fontSize === 'text-base' ? '1.25' : '1.2';

  const titleContent = balancedLines && !shouldTruncate ? (
    <>
      <span className="block">{balancedLines[0]}</span>
      <span className="block">{balancedLines[1]}</span>
    </>
  ) : (
    name
  );

  const content = (
    <h1
      className="inline-flex items-center justify-center gap-1.5 w-full max-w-full flex-nowrap"
      data-tutorial="restaurant-switch"
    >
      <span
        ref={titleRef}
        className={titleClasses}
        style={{
          display: balancedLines && !shouldTruncate ? 'inline-block' : '-webkit-box',
          WebkitBoxOrient: balancedLines && !shouldTruncate ? undefined : 'vertical',
          WebkitLineClamp: shouldTruncate ? 2 : balancedLines ? undefined : 'unset',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight,
          textWrap: balancedLines ? undefined : 'balance',
        }}
      >
        {titleContent}
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



function TrackOrderButton({ orderId, restaurantId }: { orderId: string; restaurantId?: string }) {
  const [showModal, setShowModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const { getOrderAccessToken } = useActiveOrders();

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
          accessToken={getOrderAccessToken(orderId)}
          restaurantId={restaurantId}
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
  const { activeOrderIds } = useActiveOrders(restaurant?.id);
  const { isEmpty } = useCart();
  const hasActiveOrder = activeOrderIds.length > 0;
  
  return (
    <header className="header bg-white dark:bg-black p-0 m-0 h-[60px] flex items-center shadow-sm relative z-40">
      <div className="container mx-auto flex items-center px-4 m-0">
        <div className="flex items-center gap-2 w-[40px] sm:w-[220px] shrink-0">
          {restaurant && (
            <OptionsButton 
              currentSort={currentSort} 
              onSortChange={onSortChange} 
              restaurant={restaurant} 
            />
          )}
        </div>
        
        <div className="flex-grow px-2 flex items-center justify-center min-w-0 w-full">
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
          <div className={`flex items-center gap-2 ${isEmpty && !hasActiveOrder ? 'w-0' : 'w-[40px]'} sm:w-[220px] shrink-0 justify-end`}>
            {hasActiveOrder && isEmpty && <TrackOrderButton orderId={activeOrderIds[activeOrderIds.length - 1]} restaurantId={restaurant?.id} />}
            {!isEmpty && <CartIconHeader />}
          </div>
        )}
      </div>
    </header>
  );
} 