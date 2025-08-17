import React from "react";
import { Dish } from "./data";
import ImageWithLoading from "./ImageWithLoading";

interface CardJornalProps {
  dish: Dish;
  onClick?: () => void;
  size?: "large" | "small";
  fallbackImage?: string;
  isPinned?: boolean;
  onPinToggle?: () => void;
}

export default function CardJornal({ dish, onClick, size = "small", fallbackImage, isPinned = false, onPinToggle }: CardJornalProps) {
  return (
    <div
      className={`menu-card bg-gray-50 dark:bg-gray-900 rounded-lg shadow cursor-pointer flex flex-col items-center ${size === "small" ? "max-w-2xl" : ""}`}
      onClick={onClick}
      style={{ paddingBottom: 0, minHeight: 160 }}
    >
      <div className="relative w-full">
        <ImageWithLoading
          src={dish.image}
          alt={dish.name}
          fallbackSrc={fallbackImage}
          className={`w-full h-28 object-cover rounded-t-lg`}
        >
          {/* Tag no canto superior direito */}
          {dish.tags && dish.tags.length > 0 && (
            <span className="absolute top-2 right-2 bg-primary dark:bg-cyan-700 text-white text-xs px-2 py-0.5 rounded-full z-10">
              {dish.tags[0]}
            </span>
          )}

          {/* Ícone de pin no canto superior esquerdo */}
          <div
            data-tutorial="pin-button"
            className={`pin-button ${isPinned ? 'pinned' : 'unpinned'}`}
            onClick={(e) => {
              e.stopPropagation();
              console.log('Pin clicked, current isPinned:', isPinned);
              onPinToggle?.();
            }}
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              backgroundColor: isPinned ? '#f59e0b' : 'rgba(255, 255, 255, 0.9)',
              color: isPinned ? 'white' : '#4b5563',
              borderRadius: '50%',
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              boxShadow: isPinned ? '0 4px 8px rgba(245, 158, 11, 0.4)' : '0 2px 4px rgba(0,0,0,0.2)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              style={{ 
                display: 'block',
                width: '14px',
                height: '14px',
                pointerEvents: 'none',
                transform: isPinned ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z"/>
            </svg>
          </div>
          {/* Preço no canto inferior direito */}
          <span className="absolute bottom-2 right-2 text-white text-sm font-bold px-0 py-0 z-10 drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)]">
            R${dish.price}
          </span>
          {/* Nome do prato no canto inferior esquerdo */}
          <div className="absolute bottom-2 left-2 right-16">
            <h3 className="text-sm font-semibold text-white drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)] leading-tight">
              {dish.name}
            </h3>
          </div>
        </ImageWithLoading>
      </div>
      <div className="w-full p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">{dish.description}</p>
      </div>
    </div>
  );
} 