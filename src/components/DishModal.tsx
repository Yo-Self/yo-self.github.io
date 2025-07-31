"use client";

import React, { useEffect, useState } from "react";
import { Dish } from "./data";
import ComplementGrid from "./ComplementGrid";

type DishModalProps = {
  open: boolean;
  dish: Dish | null;
  onClose: () => void;
};

export default function DishModal({ open, dish, onClose }: DishModalProps) {
  const [selectedComplements, setSelectedComplements] = useState<Map<string, Set<string>>>(new Map());

  // Interceptar o botão voltar do navegador quando o modal estiver aberto
  useEffect(() => {
    if (!open) return;

    const handlePopState = (event: PopStateEvent) => {
      // Prevenir a navegação padrão e fechar o modal
      event.preventDefault();
      onClose();
      
      // Adicionar uma entrada no histórico para compensar a que foi removida
      window.history.pushState(null, '', window.location.href);
    };

    // Adicionar uma entrada no histórico quando o modal abrir
    window.history.pushState(null, '', window.location.href);

    // Adicionar o listener para o evento popstate
    window.addEventListener('popstate', handlePopState);

    // Cleanup: remover o listener quando o modal fechar
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [open, onClose]);

  // Resetar seleções quando o prato mudar
  useEffect(() => {
    if (dish) {
      setSelectedComplements(new Map());
    }
  }, [dish]);

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden relative mx-4 my-8" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <img src={dish.image} alt={dish.name} className="w-full h-48 object-cover" />
          <button
            className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center bg-transparent p-0 m-0 focus:outline-none z-10"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)]">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="absolute bottom-0 left-0 w-full px-4 py-2">
            <h2 className="text-2xl font-bold text-white drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.7)]">{dish.name}</h2>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <p className="mb-2 text-gray-700 dark:text-gray-300">{dish.description}</p>
          <div className="mb-2">
            <span className="font-semibold text-gray-800 dark:text-gray-200">Ingredientes:</span>
            <span className="ml-1 text-gray-700 dark:text-gray-300">{dish.ingredients}</span>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-gray-800 dark:text-gray-200">Alérgenos:</span>
            <span className="ml-1 text-gray-700 dark:text-gray-300">{dish.allergens}</span>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-gray-800 dark:text-gray-200">Porção:</span>
            <span className="ml-1 text-gray-700 dark:text-gray-300">{dish.portion}</span>
          </div>
          
          {/* Complementos */}
          {dish.complement_groups && dish.complement_groups.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                Complementos e Adicionais
              </h3>
              
              {dish.complement_groups.map((group) => (
                <ComplementGrid
                  key={group.title}
                  complementGroup={group}
                  selectedComplements={selectedComplements.get(group.title) || new Set()}
                  onComplementToggle={(complementName) => handleComplementToggle(group.title, complementName)}
                />
              ))}
            </div>
          )}
          
          {/* Resumo das seleções */}
          {selectedComplements.size > 0 && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Seleções:</h4>
              {Array.from(selectedComplements.entries()).map(([groupTitle, selections]) => {
                if (selections.size === 0) return null;
                
                const group = dish.complement_groups?.find(g => g.title === groupTitle);
                return (
                  <div key={groupTitle} className="mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{groupTitle}:</span>
                    <div className="ml-2">
                      {Array.from(selections).map(complementName => {
                        const complement = group?.complements.find(c => c.name === complementName);
                        return (
                          <div key={complementName} className="text-sm text-gray-600 dark:text-gray-400">
                            • {complementName} - R${complement?.price}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-xl font-bold text-primary dark:text-cyan-300">
              Total: R${calculateTotalPrice()}
            </div>
            
            {hasUnfilledRequiredGroups() && (
              <div className="text-sm text-red-600 dark:text-red-400">
                * Selecione os complementos obrigatórios
              </div>
            )}
          </div>
          
          {dish.tags && (
            <div className="flex gap-2 mt-2">
              {dish.tags.map(tag => (
                <span key={tag} className="bg-primary dark:bg-cyan-700 text-white text-xs px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 