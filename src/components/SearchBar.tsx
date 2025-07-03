"use client";

import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "./i18n";
import { Restaurant, Dish, MenuItem } from "./data";
import DishModal from "./DishModal";
import DishCard from "./DishCard";

interface SearchBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  restaurant: Restaurant;
  restaurants: Restaurant[];
}

export default function SearchBar({ searchTerm, onSearchTermChange, restaurant, restaurants }: SearchBarProps) {
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

  // Estado para categoria selecionada na busca
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Sempre que abrir o bottom sheet ou limpar a busca, resetar categoria para 'all'
  useEffect(() => {
    if (!showSheet || !searchTerm) setSelectedCategory('all');
  }, [showSheet, searchTerm]);

  // Busca dinâmica
  const term = searchTerm.trim().toLowerCase();
  const filterFn = (item: MenuItem) =>
    item.name.toLowerCase().includes(term) ||
    item.description.toLowerCase().includes(term) ||
    (item.tags && item.tags.some(tag => tag.toLowerCase().includes(term)));

  // Categorias dinâmicas
  const dynamicCategories = term
    ? Array.from(new Set(restaurant.menu_items.filter(filterFn).map(item => item.category)))
    : [];

  // Resultados filtrados pela categoria selecionada
  const currentResults = term
    ? restaurant.menu_items.filter(item => {
        if (!filterFn(item)) return false;
        if (selectedCategory === 'all') return true;
        return item.category === selectedCategory;
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
        className="fixed bottom-0 left-0 w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl p-0 pt-0 pb-0 relative flex flex-col items-center"
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium ring-0 ${selectedCategory === 'all' ? 'bg-primary text-white dark:bg-cyan-700 ring-cyan-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 ring-transparent'}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  Todos
                </button>
                {dynamicCategories.map(cat => (
                  <button
                    key={cat}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ring-0 ${selectedCategory === cat ? 'bg-primary text-white dark:bg-cyan-700 ring-cyan-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 ring-transparent'}`}
                    onClick={() => setSelectedCategory(cat)}
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
                          <DishCard dish={item} size="large" />
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
                          <DishCard dish={item} size="large" />
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
        <DishModal open={modalOpen} dish={selectedDish} onClose={() => setModalOpen(false)} />
      </div>
    </div>
  );

  // Ao fechar o bottom sheet, dispara evento para selecionar categoria 'search' na MenuSection
  const handleCloseSheet = () => {
    setShowSheet(false);
    const event = new CustomEvent('select-search-category');
    window.dispatchEvent(event);
  };

  // O botão de busca continua igual, mas ao focar/clicar no input abre o bottom sheet
  return (
    <div
      className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom)+1.5rem)] right-[max(1.5rem,env(safe-area-inset-right)+1.5rem)] z-50 flex items-end gap-2"
      style={{ transition: 'bottom 0.2s' }}
    >
      {/* Botão de busca */}
      <button
        ref={buttonRef}
        className="w-16 h-16 rounded-full bg-white/80 dark:bg-gray-900/80 border-2 border-white dark:border-gray-800 shadow-2xl backdrop-blur-md flex items-center justify-center transition-transform duration-150 hover:scale-110 active:scale-95 hover:shadow-3xl focus:outline-none"
        style={{ WebkitBackdropFilter: 'blur(12px)' }}
        aria-label={t("search")}
        onClick={() => setShowSheet(true)}
      >
        <svg width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-gray-900 dark:text-white">
          <circle cx="10.5" cy="10.5" r="7" />
          <line x1="21" y1="21" x2="15.5" y2="15.5" strokeLinecap="round" />
        </svg>
      </button>
      {showSheet && renderSheet()}
    </div>
  );
} 