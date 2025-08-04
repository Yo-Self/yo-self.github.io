import React from "react";
import { Dish } from "./data";

interface CardJornalProps {
  dish: Dish;
  onClick?: () => void;
  size?: "large" | "small";
  fallbackImage?: string;
  isPinned?: boolean;
  onPinToggle?: () => void;
}

export default function CardJornal({ dish, onClick, size = "small", fallbackImage, isPinned = false, onPinToggle }: CardJornalProps) {
  const [imgSrc, setImgSrc] = React.useState(dish.image);
  return (
    <div
      className={`menu-card bg-gray-50 dark:bg-gray-900 rounded-lg shadow cursor-pointer flex flex-col items-center ${size === "small" ? "max-w-2xl" : ""}`}
      onClick={onClick}
      style={{ paddingBottom: 0, minHeight: 160 }}
    >
      <div className="relative w-full">
        <img
          src={imgSrc}
          alt={dish.name}
          className={`w-full h-28 object-cover rounded-t-lg`}
          onError={() => fallbackImage && setImgSrc(fallbackImage)}
        />
        {/* Tag no canto superior direito */}
        {dish.tags && dish.tags.length > 0 && (
          <span className="absolute top-2 right-2 bg-primary dark:bg-cyan-700 text-white text-xs px-2 py-0.5 rounded-full z-10">
            {dish.tags[0]}
          </span>
        )}

        {/* Ícone de pin no canto superior esquerdo */}
        <button
          data-tutorial="pin-button"
          className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center z-40 transition-all duration-200 ${
            isPinned 
              ? 'bg-yellow-500 text-white shadow-lg' 
              : 'bg-white/80 text-gray-600 hover:bg-white hover:text-gray-800'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onPinToggle?.();
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z"/>
          </svg>
        </button>
        {/* Preço no canto inferior direito */}
        <span className="absolute bottom-2 right-2 text-white text-sm font-bold px-0 py-0 z-10 drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)]">
          R${dish.price}
        </span>
        {/* Nome do prato no canto inferior esquerdo */}
        <div className="absolute bottom-2 left-2 right-16">
          <h3 className="text-base font-semibold text-white drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)] leading-tight" style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'normal',
            lineHeight: '1.1',
          }}>
            {dish.name}
          </h3>
        </div>
      </div>
      {/* Descrição fora da foto */}
      <div className="w-full px-3 py-2">
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-0" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'normal',
          lineHeight: '1.2',
        }}>{dish.description}</p>
      </div>
    </div>
  );
} 