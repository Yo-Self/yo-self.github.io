"use client";

import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "./i18n";

interface SearchBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export default function SearchBar({ searchTerm, onSearchTermChange }: SearchBarProps) {
  const { t } = useTranslation();
  const [ searchOpen, setSearchOpen ] = useState(false);
  const [ inputFocused, setInputFocused ] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fecha o campo ao clicar fora
  useEffect(() => {
    if (!searchOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        (inputRef.current && inputRef.current.contains(e.target as Node)) ||
        (buttonRef.current && buttonRef.current.contains(e.target as Node))
      ) {
        return;
      }
      setSearchOpen(false);
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [ searchOpen ]);

  // Limpa busca ao fechar
  useEffect(() => {
    if (!searchOpen && searchTerm) {
      onSearchTermChange("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ searchOpen ]);

  // Scroll input into view on focus (fallback)
  useEffect(() => {
    if (inputFocused && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [ inputFocused ]);

  // Função para alternar o campo de busca corretamente
  const handleSearchButtonClick = () => {
    if (searchOpen) {
      setSearchOpen(false);
      inputRef.current?.blur();
    } else {
      setSearchOpen(true);
    }
  };

  return (
    <div
      className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom)+1.5rem)] right-[max(1.5rem,env(safe-area-inset-right)+1.5rem)] z-50 flex items-end gap-2"
      style={{ transition: 'bottom 0.2s' }}
    >
      {/* Campo de busca expansível */}
      <div
        className={`transition-all duration-200 flex items-center ${searchOpen ? "w-64 opacity-100 mr-2" : "w-0 opacity-0 mr-0"}`}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={t("search")}
          className="w-full h-16 px-6 rounded-full bg-white/90 dark:bg-gray-900/90 border-2 border-white dark:border-gray-800 shadow-lg backdrop-blur-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none text-lg"
          style={{ WebkitBackdropFilter: 'blur(12px)' }}
          tabIndex={searchOpen ? 0 : -1}
          value={searchTerm}
          onChange={e => onSearchTermChange(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
        />
      </div>
      {/* Botão de busca */}
      <button
        ref={buttonRef}
        className="w-16 h-16 rounded-full bg-white/80 dark:bg-gray-900/80 border-2 border-white dark:border-gray-800 shadow-2xl backdrop-blur-md flex items-center justify-center transition-transform duration-150 hover:scale-110 active:scale-95 hover:shadow-3xl focus:outline-none"
        style={{ WebkitBackdropFilter: 'blur(12px)' }}
        aria-label={t("search")}
        onClick={handleSearchButtonClick}
      >
        <svg width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-gray-900 dark:text-white">
          <circle cx="10.5" cy="10.5" r="7" />
          <line x1="21" y1="21" x2="15.5" y2="15.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
} 