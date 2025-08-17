"use client";

import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "./i18n";
import { Restaurant, Dish, MenuItem } from "./data";
import DishModal from "./DishModal";
import DishCard from "./DishCard";
import JournalView from "./JournalView";
import IntegratedChatBot from "./IntegratedChatBot";
import WaiterCallButton from "./WaiterCallButton";


interface SearchBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  restaurant: Restaurant;
  restaurants: Restaurant[];
  selectedCategory?: string;
}

export default function SearchBar({ searchTerm, onSearchTermChange, restaurant, restaurants, selectedCategory: propSelectedCategory }: SearchBarProps) {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fecha o campo ao clicar fora do bottom sheet (não só fora do input)
  const sheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showSheet) return;
    function handleClick(e: MouseEvent) {
      if (sheetRef.current && sheetRef.current.contains(e.target as Node)) {
        return;
      }
      setShowSheet(false);
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setShowSheet(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showSheet]);

  // Foca o input ao abrir o sheet e garante visibilidade usando scrollIntoView
  useEffect(() => {
    if (showSheet && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        // Garante que o input fique visível mesmo com o teclado aberto
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [showSheet]);

  // Ajuste dinâmico do bottom sheet para iOS/Android usando Visual Viewport API ou fallback
  useEffect(() => {
    if (!sheetRef.current) return;
    const vv: VisualViewport | undefined = window.visualViewport === null ? undefined : window.visualViewport;
    const fixSheet = () => {
      if (!sheetRef.current) return;
      if (vv) {
        // Ajusta altura e posição do sheet para não ser coberto pelo teclado
        sheetRef.current.style.maxHeight = vv.height + 'px';
        sheetRef.current.style.bottom = (window.innerHeight - vv.height - vv.offsetTop) + 'px';
      } else {
        // Fallback para browsers sem visualViewport
        sheetRef.current.style.maxHeight = window.innerHeight + 'px';
        sheetRef.current.style.bottom = '0px';
      }
    };
    if (vv) {
      vv.addEventListener('resize', fixSheet);
      vv.addEventListener('scroll', fixSheet);
    } else {
      window.addEventListener('resize', fixSheet);
    }
    fixSheet();
    return () => {
      if (vv) {
        vv.removeEventListener('resize', fixSheet);
        vv.removeEventListener('scroll', fixSheet);
      } else {
        window.removeEventListener('resize', fixSheet);
      }
    };
  }, [showSheet]);

  // Função para alternar o campo de busca corretamente
  const handleSearchButtonClick = () => {
    if (searchOpen) {
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
    }
  };

  // Busca dinâmica
  const term = searchTerm.trim().toLowerCase();
  const filterFn = (item: MenuItem) =>
    item.name.toLowerCase().includes(term) ||
    item.description.toLowerCase().includes(term) ||
    (item.tags && item.tags.some(tag => tag.toLowerCase().includes(term)));

  // Categorias dinâmicas
  const dynamicCategories = term
    ? Array.from(new Set(restaurant.menu_items.filter(filterFn).flatMap(item => item.categories || [])))
    : [];

  // Resultados filtrados pela categoria selecionada
  const currentResults = term
    ? restaurant.menu_items.filter(item => {
        if (!filterFn(item)) return false;
        if (propSelectedCategory === 'all' || !propSelectedCategory) return true;
        return item.categories && item.categories.includes(propSelectedCategory);
      })
    : [];

  // Resultados dos outros restaurantes
  const otherResults: { restaurant: Restaurant; items: MenuItem[] }[] = term
    ? restaurants
        .filter(r => r.id !== restaurant.id)
        .map(r => ({
          restaurant: r,
          items: r.menu_items.filter(filterFn),
        }))
        .filter(group => group.items.length > 0)
    : [];

  // Renderização do bottom sheet
  const renderSheet = () => (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 backdrop-blur-sm">
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl p-0 pt-0 pb-0 relative flex flex-col items-center z-70"
        style={{ right: 0, margin: '0 auto' }}
      >
        {/* Input fixo no topo do sheet */}
        <div className="absolute top-0 left-0 w-full z-20 bg-white dark:bg-gray-900 p-4 pt-6 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder={t("search")}
              className="block w-full h-14 px-5 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none text-lg"
              value={searchTerm}
              onChange={e => onSearchTermChange(e.target.value)}
            />
            <button
              aria-label={t("close")}
              onClick={() => { setShowSheet(false); onSearchTermChange(""); }}
              className="ml-2 flex items-center justify-center w-12 h-12 rounded-full bg-transparent text-gray-600 dark:text-gray-300 text-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
              type="button"
              style={{ background: 'none', boxShadow: 'none', border: 'none' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>
        {/* Conteúdo rolável abaixo do input e categorias */}
        <div className="w-full pt-[88px] px-4 pb-8 max-h-[80vh] overflow-y-auto">
          {/* Categorias dinâmicas do restaurante atual (apenas as presentes nos resultados filtrados) - estilo barra única com scroll lateral */}
          {term && dynamicCategories.length > 0 && (
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-0 pt-3 pb-2">
              <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap gap-2 max-w-full pl-1 pr-4 scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch', overflowY: 'hidden', minWidth: 0, paddingBottom: 8 }}>
                <button
                  key="all"
                  className={`px-4 py-2 rounded-lg text-sm font-medium ring-0 ${propSelectedCategory === 'all' ? 'bg-primary text-white dark:bg-cyan-700 ring-cyan-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 ring-transparent'}`}
                  onClick={() => onSearchTermChange('')}
                >
                  Todos
                </button>
                {dynamicCategories.map(cat => (
                  <button
                    key={cat}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ring-0 ${propSelectedCategory === cat ? 'bg-primary text-white dark:bg-cyan-700 ring-cyan-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 ring-transparent'}`}
                    onClick={() => onSearchTermChange(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Resultados da busca */}
          {term && (
            <div className="flex flex-col gap-2">
              {currentResults.length > 0 && (
                <div>
                  <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{restaurant.name}</span>
                  <div className="flex flex-col gap-3 items-center w-full">
                    {currentResults.map(item => (
                      <div key={item.name + item.category} className="w-full flex justify-center" onClick={() => { setSelectedDish(item); setModalOpen(true); }}>
                        <div className="w-full max-w-lg">
                          <DishCard dish={item} size="large" fallbackImage={restaurant.image} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {otherResults.length > 0 && otherResults.map(group => (
                <div key={group.restaurant.id}>
                  <div className="my-8 flex items-center w-full gap-4">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    <span className="px-4 text-lg font-bold text-gray-700 dark:text-gray-200 text-center whitespace-nowrap">{group.restaurant.name}</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="flex flex-col gap-3 items-center w-full">
                    {group.items.map(item => (
                      <div key={item.name + item.category} className="w-full flex justify-center" onClick={() => { setSelectedDish(item); setModalOpen(true); }}>
                        <div className="w-full max-w-lg">
                          <DishCard dish={item} size="large" fallbackImage={group.restaurant.image} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {currentResults.length === 0 && otherResults.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-6">{t("Nenhum resultado encontrado")}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Ao fechar o bottom sheet, dispara evento para selecionar categoria 'search' na MenuSection
  const handleCloseSheet = () => {
    setShowSheet(false);
    const event = new CustomEvent('select-search-category');
    window.dispatchEvent(event);
  };

  // Novo estado para o modo jornal
  const [journalOpen, setJournalOpen] = useState(false);
  
  // Estado para o chatbot
  const [chatOpen, setChatOpen] = useState(false);


  // Ícone SVG fornecido pelo usuário para o modo jornal, agora com gradiente animado no fill e maior dentro do círculo
  const NewspaperIcon = () => (
    <svg width="40" height="40" viewBox="-6 -6 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="newspaper-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4">
            <animate attributeName="stop-color" values="#06b6d4;#818cf8;#f472b6;#facc15;#06b6d4" dur="2.5s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#facc15">
            <animate attributeName="stop-color" values="#facc15;#06b6d4;#818cf8;#f472b6;#facc15" dur="2.5s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <path fill="url(#newspaper-gradient)" d="M55.211 83.321c-.129-.092-12.863-8.956-31.239-8.442a1.411 1.411 0 0 1-1.462-1.325v-.001a1.42 1.42 0 0 1 1.364-1.494c19.386-.57 32.415 8.565 32.976 8.965l-1.639 2.297zm0-9.985c-.129-.092-12.863-8.957-31.239-8.442a1.41 1.41 0 0 1-1.462-1.325 1.42 1.42 0 0 1 1.364-1.494c19.385-.561 32.414 8.565 32.975 8.964l-1.638 2.297zm0-9.984c-.129-.092-12.86-8.958-31.239-8.442a1.41 1.41 0 0 1-1.462-1.325 1.42 1.42 0 0 1 1.364-1.494c19.385-.564 32.415 8.564 32.975 8.964l-1.638 2.297zm0-9.986c-.129-.092-12.862-8.961-31.239-8.442a1.412 1.412 0 0 1-1.463-1.325 1.42 1.42 0 0 1 1.364-1.494c19.385-.566 32.415 8.565 32.975 8.964l-1.637 2.297zm0-9.985c-.129-.092-12.862-8.962-31.239-8.442a1.412 1.412 0 0 1-1.463-1.325 1.42 1.42 0 0 1 1.364-1.494c19.385-.568 32.415 8.565 32.976 8.964l-1.638 2.297zM71.825 83.32l-1.639-2.296c.561-.398 13.595-9.518 32.975-8.963a1.419 1.419 0 0 1 1.364 1.493v.001a1.411 1.411 0 0 1-1.462 1.325c-18.444-.519-31.11 8.348-31.238 8.44zm0-9.985-1.639-2.296c.561-.398 13.595-9.52 32.975-8.964a1.419 1.419 0 0 1 1.364 1.493 1.41 1.41 0 0 1-1.462 1.325c-18.412-.525-31.11 8.35-31.238 8.442zm-.001-9.983-1.638-2.297c.559-.399 13.586-9.533 32.976-8.964a1.418 1.418 0 0 1 1.363 1.493v.001a1.41 1.41 0 0 1-1.462 1.325c-18.392-.52-31.11 8.35-31.239 8.442zm.001-9.987-1.639-2.296c.561-.399 13.595-9.524 32.975-8.964a1.42 1.42 0 0 1 1.364 1.493 1.411 1.411 0 0 1-1.463 1.325c-18.443-.528-31.109 8.351-31.237 8.442zm0-9.985-1.639-2.296c.561-.399 13.595-9.513 32.975-8.963a1.417 1.417 0 0 1 1.364 1.493 1.41 1.41 0 0 1-1.462 1.325c-18.444-.524-31.11 8.35-31.238 8.441zm39.519-22.105v5.007h.014v-5.007h-.014zm4.245-.635v-3.484l-2.045-.07c-28.756-.945-45.807 10.027-49.939 13.06-4.132-3.018-21.169-13.99-49.939-13.06l-2.045.07v3.484H0v86.241h54.65c1.664 2.426 5.218 4.09 9.35 4.09s7.7-1.664 9.364-4.09H128V20.64h-12.411zM5.641 101.24V26.282h5.98v66.919l2.172-.07c.24 0 22.354-.465 40.377 8.109H5.641zm55.454-1.1C44.453 90.112 22.748 88.984 15.852 88.9V21.275c25.992-.367 41.703 9.745 45.243 12.284v66.581zm4.231.493V34.109l.028.028c.169-.141 16.303-13.172 45.99-12.862h.014V88.9c-7.009.098-29.292 1.241-46.032 11.733zm57.033.607H73.04c18.01-8.561 40.123-8.109 40.377-8.109l2.172.056V26.282h6.77v74.958z"/>
    </svg>
  );

  return (
    <div
              className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom)+1.5rem)] right-[max(1.5rem,env(safe-area-inset-right)+1.5rem)] z-60 flex flex-col items-end gap-2"
      style={{ transition: 'bottom 0.2s' }}
    >


      

      
      {/* Botão modo jornal */}
      <button
        className="w-16 h-16 rounded-full bg-white/80 dark:bg-gray-900/80 border-2 border-white dark:border-gray-800 shadow-2xl backdrop-blur-md flex items-center justify-center transition-transform duration-150 hover:scale-110 active:scale-95 hover:shadow-3xl focus:outline-none group mb-2"
        data-tutorial="journal-button"
        style={{ WebkitBackdropFilter: 'blur(12px)' }}
        aria-label={t("Modo jornal")}
        onClick={() => setJournalOpen(true)}
      >
        <NewspaperIcon />
      </button>
      {/* Botão chamar garçom */}
      <div className="mb-2">
        <WaiterCallButton 
          restaurantId={restaurant.id} 
          waiterCallEnabled={restaurant.waiter_call_enabled}
          className="w-16 h-16 rounded-full bg-white/80 dark:bg-gray-900/80 border-2 border-white dark:border-gray-800 shadow-2xl backdrop-blur-md flex items-center justify-center transition-transform duration-150 hover:scale-110 active:scale-95 hover:shadow-3xl focus:outline-none group"
        />
      </div>
      {/* Botão de busca integrada */}
      <button
        ref={buttonRef}
        className="w-16 h-16 rounded-full bg-white/80 dark:bg-gray-900/80 border-2 border-white dark:border-gray-800 shadow-2xl backdrop-blur-md flex items-center justify-center transition-transform duration-150 hover:scale-110 active:scale-95 hover:shadow-3xl focus:outline-none group"
        data-tutorial="search-button"
        style={{ WebkitBackdropFilter: 'blur(12px)' }}
        aria-label="Busca & IA"
        onClick={() => setChatOpen(true)}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="lupa-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4">
                <animate attributeName="stop-color" values="#06b6d4;#818cf8;#f472b6;#facc15;#06b6d4" dur="2.5s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#facc15">
                <animate attributeName="stop-color" values="#facc15;#06b6d4;#818cf8;#f472b6;#facc15" dur="2.5s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            <clipPath id="lupa-clip">
              <circle cx="10.5" cy="10.5" r="7" />
              <rect x="15.5" y="15.5" width="7" height="2.5" rx="1.25" transform="rotate(-45 15.5 15.5)" />
            </clipPath>
          </defs>
          {/* Fundo branco */}
          <rect width="24" height="24" fill="" />
          {/* Gradiente só dentro do círculo e haste da lupa */}
          <g clipPath="url(#lupa-clip)">
            <rect width="24" height="24" fill="" />
          </g>
          {/* Contorno da lupa (outline) */}
          <circle cx="10.5" cy="10.5" r="7" stroke="url(#lupa-gradient)" strokeWidth="2.5" fill="" />
          <line x1="21" y1="21" x2="15.5" y2="15.5" stroke="url(#lupa-gradient)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
      {showSheet && renderSheet()}
      {/* Modal modo jornal */}
      <JournalView open={journalOpen} onClose={() => setJournalOpen(false)} restaurant={restaurant} selectedCategory={propSelectedCategory} />

      {/* Modal de detalhes do prato */}
      <DishModal open={modalOpen} dish={selectedDish} onClose={() => setModalOpen(false)} />
      
      {/* Chatbot Integrado */}
      <IntegratedChatBot 
        restaurant={restaurant} 
        restaurants={restaurants}
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)} 
      />
    </div>
  );
} 