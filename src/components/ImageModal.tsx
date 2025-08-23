"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ImageModalProps {
  isOpen: boolean;
  imageSrc: string;
  imageAlt: string;
  onClose: () => void;
}

export default function ImageModal({ isOpen, imageSrc, imageAlt, onClose }: ImageModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Usar createPortal para renderizar fora da hierarquia do DOM
  const modalContent = (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-[99999999] flex items-center justify-center bg-black/90 backdrop-blur-xl"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999999
      }}
    >
      <div 
        className="relative max-w-[95vw] max-h-[95vh] w-auto h-auto bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-2 border-white/30 dark:border-gray-600/30 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          zIndex: 99999999
        }}
      >
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-sm border border-white/30 shadow-lg"
          aria-label="Fechar visualização da imagem"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Imagem */}
        <div className="p-2">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="max-w-full max-h-full object-contain w-auto h-auto rounded-2xl"
            draggable={false}
          />
        </div>


      </div>
    </div>
  );

  // Renderizar no body para ficar acima de tudo
  return createPortal(modalContent, document.body);
}
