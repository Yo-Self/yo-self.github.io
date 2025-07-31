import React from "react";
import { ComplementGroup, Complement } from "./data";

interface ComplementGridProps {
  complementGroup: ComplementGroup;
  selectedComplements: Set<string>;
  onComplementToggle: (complementName: string) => void;
}

export default function ComplementGrid({ 
  complementGroup, 
  selectedComplements, 
  onComplementToggle 
}: ComplementGridProps) {
  return (
    <div className="mb-6">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
          {complementGroup.title}
        </h3>
        {complementGroup.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {complementGroup.description}
          </p>
        )}
        {complementGroup.required && (
          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mb-2">
            Obrigatório
          </span>
        )}
        {complementGroup.max_selections && (
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-2 mb-2">
            Máximo {complementGroup.max_selections} opç{complementGroup.max_selections > 1 ? 'ões' : 'ão'}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {complementGroup.complements.map((complement) => {
          const isSelected = selectedComplements.has(complement.name);
          const isDisabled = complementGroup.max_selections && 
            selectedComplements.size >= complementGroup.max_selections && 
            !isSelected;
          
          return (
            <div
              key={complement.name}
              className={`complement-card bg-gray-50 dark:bg-gray-900 rounded-lg shadow cursor-pointer flex flex-col transition-all duration-200 ${
                isSelected 
                  ? 'ring-2 ring-primary dark:ring-cyan-400 bg-primary/5' 
                  : 'hover:shadow-md'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!isDisabled) {
                  onComplementToggle(complement.name);
                }
              }}
              style={{ height: '90px', paddingBottom: 0 }}
            >
              <div className="relative w-full" style={{ height: '60%' }}>
                <img
                  src={complement.image}
                  alt={complement.name}
                  className="w-full h-full object-cover rounded-t-lg"
                />
                
                {/* Checkbox de seleção */}
                <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center z-10 transition-all duration-200 ${
                  isSelected 
                    ? 'bg-primary dark:bg-cyan-400 text-white' 
                    : 'bg-white/80 text-gray-600'
                }`}>
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </div>
                
                {/* Preço no canto inferior direito */}
                <span className="absolute bottom-2 right-2 text-white text-sm font-bold px-0 py-0 z-10 drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)]">
                  R${complement.price}
                </span>
                
                {/* Nome do complemento no canto inferior esquerdo */}
                <div className="absolute bottom-2 left-2 right-16">
                  <h4 className="text-sm font-semibold text-white drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)] leading-tight" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'normal',
                    lineHeight: '1.1',
                  }}>
                    {complement.name}
                  </h4>
                </div>
              </div>
              
              {/* Detalhes abaixo da foto (40% do card) */}
              <div className="w-full px-3 pb-3 pt-2 flex flex-col justify-center items-start text-left" style={{ height: '40%', minHeight: '36px' }}>
                <p className="text-xs text-gray-600 dark:text-gray-300 flex-shrink-0" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'normal',
                  lineHeight: '1.2',
                  maxHeight: '3.6em', // Max 3 lines
                }}>
                  {complement.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 