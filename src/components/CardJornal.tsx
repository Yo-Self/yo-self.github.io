import React from "react";
import { Dish } from "./data";

interface CardJornalProps {
  dish: Dish;
  onClick?: () => void;
  size?: "large" | "small";
  fallbackImage?: string;
}

export default function CardJornal({ dish, onClick, size = "small", fallbackImage }: CardJornalProps) {
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
        {/* Preço no canto inferior direito */}
        <span className="absolute bottom-2 right-2 text-white text-sm font-bold px-0 py-0 z-10 drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)]">
          R${dish.price}
        </span>
        {/* Nome do prato no canto inferior esquerdo */}
        <div className="absolute bottom-2 left-2 right-12">
          <h3 className="text-sm font-semibold text-white drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)] leading-tight truncate">
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