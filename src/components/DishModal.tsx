"use client";

import React, { useEffect, useState, useRef } from "react";
import { Dish, MenuItem } from "./data";
import ComplementGrid from "./ComplementGrid";
import ImageWithLoading from "./ImageWithLoading";
import WhatsAppButton from "./WhatsAppButton";
import "./dishModal.css";

type DishModalProps = {
  open: boolean;
  dish: Dish | MenuItem | null;
  restaurantId?: string;
  restaurant?: any; // Para acessar configurações do restaurante
  onClose: () => void;
};

export default function DishModal({ open, dish, restaurantId = "default", restaurant, onClose }: DishModalProps) {
  const [selectedComplements, setSelectedComplements] = useState<Map<string, Set<string>>>(new Map());
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Interceptar o botão voltar do navegador quando o modal estiver aberto
  useEffect(() => {
    if (!open) return;

    const handlePopState = (event: PopStateEvent) => {
      // Prevenir a navegação padrão e fechar o modal
      event.preventDefault();
      handleClose();
      
      // Adicionar uma entrada no histórico para compensar a que foi removida
      window.history.pushState(null, '', window.location.href);
    };

    // Adicionar entrada no histórico
    window.history.pushState(null, '', window.location.href);

    // Adicionar o listener para o evento popstate
    window.addEventListener('popstate', handlePopState);

    // Cleanup: remover o listener quando o modal fechar
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [open]);

  // Resetar seleções quando o prato mudar
  useEffect(() => {
    if (dish) {
      setSelectedComplements(new Map());
      setIsClosing(false);
    }
  }, [dish]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // Tempo da animação de saída
  };

  const handleComplementToggle = (groupTitle: string, complementName: string) => {
    setSelectedComplements(prev => {
      const newMap = new Map(prev);
      const groupSelections = new Set(newMap.get(groupTitle) || []);
      
      if (groupSelections.has(complementName)) {
        groupSelections.delete(complementName);
      } else {
        // Verificar se há limite de seleções
        const group = dish?.complement_groups?.find(g => g.title === groupTitle);
        if (group?.max_selections && groupSelections.size >= group.max_selections) {
          return prev; // Não permitir mais seleções
        }
        groupSelections.add(complementName);
      }
      
      newMap.set(groupTitle, groupSelections);
      return newMap;
    });
  };

  // Calcular preço total incluindo complementos selecionados
  const calculateTotalPrice = () => {
    if (!dish) return 0;
    
    let total = parseFloat(dish.price.replace(',', '.'));
    
    selectedComplements.forEach((selections, groupTitle) => {
      const group = dish.complement_groups?.find(g => g.title === groupTitle);
      if (group) {
        selections.forEach(complementName => {
          const complement = group.complements.find(c => c.name === complementName);
          if (complement) {
            total += parseFloat(complement.price.replace(',', '.'));
          }
        });
      }
    });
    
    return total.toFixed(2).replace('.', ',');
  };

  // Verificar se há grupos obrigatórios não preenchidos
  const hasUnfilledRequiredGroups = () => {
    if (!dish?.complement_groups) return false;
    
    return dish.complement_groups.some(group => {
      if (!group.required) return false;
      const selections = selectedComplements.get(group.title) || new Set();
      return selections.size === 0;
    });
  };

  if (!open || !dish) return null;
  
  return (
    <div 
      ref={modalRef}
      className={`fixed inset-0 z-[999999] flex items-center justify-center p-4 ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop'
      }`} 
      onClick={handleClose}
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div 
        className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative z-[999999] ${
          isClosing ? 'modal-exit' : 'modal-container'
        }`} 
        onClick={e => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="relative modal-image-container">
          <ImageWithLoading
            src={dish.image}
            alt={dish.name}
            className="w-full h-48 object-cover"
            fallbackSrc="/window.svg"
          >
            <button
              className="modal-close-button absolute top-3 right-3 w-12 h-12 flex items-center justify-center p-0 m-0 focus:outline-none z-10 transition-all duration-200 hover:scale-110"
              onClick={handleClose}
              aria-label="Close"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="absolute bottom-0 left-0 w-full px-6 py-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <h2 className="modal-title text-3xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{dish.name}</h2>
            </div>
          </ImageWithLoading>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] modal-content">
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">{dish.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 modal-info-item">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Ingredientes:</span>
                  <span className="text-gray-700 dark:text-gray-300">{dish.ingredients}</span>
                </div>
                <div className="flex items-center space-x-2 modal-info-item">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Alérgenos:</span>
                  <span className="text-gray-700 dark:text-gray-300">{dish.allergens}</span>
                </div>
                <div className="flex items-center space-x-2 modal-info-item">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Porção:</span>
                  <span className="text-gray-700 dark:text-gray-300">{dish.portion}</span>
                </div>
              </div>
            </div>
            
            {/* Complementos */}
            {dish.complement_groups && dish.complement_groups.length > 0 && (
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                  <span className="mr-3">🍽️</span>
                  Complementos e Adicionais
                </h3>
                
                <div className="space-y-6">
                  {dish.complement_groups.map((group, index) => (
                    <div 
                      key={group.title}
                      className="complement-group"
                    >
                      <ComplementGrid
                        complementGroup={group}
                        selectedComplements={selectedComplements.get(group.title) || new Set()}
                        onComplementToggle={(complementName) => handleComplementToggle(group.title, complementName)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Resumo das seleções */}
            {selectedComplements.size > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-blue-200 dark:border-gray-600 selection-summary">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <span className="mr-2">📋</span>
                  Suas Seleções:
                </h4>
                <div className="space-y-3">
                  {Array.from(selectedComplements.entries()).map(([groupTitle, selections]) => {
                    if (selections.size === 0) return null;
                    
                    const group = dish.complement_groups?.find(g => g.title === groupTitle);
                    return (
                      <div key={groupTitle} className="bg-white dark:bg-gray-600 rounded-lg p-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{groupTitle}:</span>
                        <div className="ml-2 mt-1">
                          {Array.from(selections).map(complementName => {
                            const complement = group?.complements.find(c => c.name === complementName);
                            return (
                              <div key={complementName} className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between">
                                <span>• {complementName}</span>
                                <span className="font-medium text-primary">R$ {complement?.price}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-between items-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Total: R$ {calculateTotalPrice()}
              </div>
              
              <div className="flex items-center gap-3">
                {dish.tags && (
                  <div className="flex gap-2">
                    {dish.tags.map((tag, index) => (
                      <span 
                        key={tag} 
                        className="modal-tag bg-primary dark:bg-cyan-700 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {hasUnfilledRequiredGroups() && (
              <div className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center">
                <span className="mr-2">⚠️</span>
                * Selecione os complementos obrigatórios
              </div>
            )}
            
            {/* Botão WhatsApp - Canto inferior direito */}
            {/* Só exibir se o restaurante tiver WhatsApp habilitado */}
            {restaurant?.whatsapp_enabled !== false && (
              <div className="mt-6 flex justify-end whatsapp-section">
                <WhatsAppButton 
                  dish={dish}
                  selectedComplements={selectedComplements}
                  restaurantId={restaurantId}
                  className="w-full sm:w-auto modal-button"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 