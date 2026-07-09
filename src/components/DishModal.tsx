"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Dish, MenuItem } from "./data";
import { MenuItem as MenuItemType } from "../types/restaurant";
import ComplementGrid from "./ComplementGrid";
import MediaWithLoading from "./MediaWithLoading";
import { useModalScroll } from '../hooks/useModalScroll';
import { useCart } from '../hooks/useCart';
import { CartUtils } from '../types/cart';
import { groupHasPreface } from '@/types/complementPreface';
import CartIcon from './CartIcon';
import Analytics, { getCurrentRestaurantId } from '../lib/analytics';
import { getOptimizedImageUrl } from '@/utils/imageUrl';
import { usePathname } from 'next/navigation';
import { canRestaurantAcceptOrders } from '../utils/restaurantOrders';
import { formatOperatingHours } from '../utils/hoursFormatter';
import "./dishModal.css";

type DishModalProps = {
  open: boolean;
  dish: Dish | MenuItem | null;
  restaurantId?: string;
  restaurant?: any; // Para acessar configurações do restaurante
  fallbackImage?: string; // Logo do restaurante para usar como fallback
  onClose: () => void;
};

export default function DishModal({ open, dish, restaurantId = "default", restaurant, fallbackImage, onClose }: DishModalProps) {
  const [selectedComplements, setSelectedComplements] = useState<Map<string, Set<string>>>(new Map());
  const [prefaceAnswers, setPrefaceAnswers] = useState<Map<string, string>>(new Map());
  const [isClosing, setIsClosing] = useState(false);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const wasAddedToCart = useRef(false);
  const pathname = usePathname();
  const isDeliveryRoute = pathname?.startsWith('/delivery');
  
  // Hook da comanda
  const { addItem, isItemInCart, getItemQuantity, openCart, removeItem, incrementQuantity, decrementQuantity } = useCart();

  // Função helper para converter Dish para MenuItem
  const convertToMenuItem = useCallback((dishItem: Dish | MenuItem): MenuItemType => {
    return {
      ...dishItem,
      category: dishItem.category || (dishItem.categories ? dishItem.categories[0] : 'Outros'),
      categories: dishItem.categories || [dishItem.category || 'Outros'],
      tags: dishItem.tags || [],
      complement_groups: dishItem.complement_groups?.map(group => ({
        ...group,
        description: group.description || '',
        required: group.required || false,
        max_selections: group.max_selections || 1,
        complements: group.complements.map(complement => ({
          ...complement,
          ingredients: complement.ingredients || ''
        }))
      }))
    };
  }, []);

  // Função para obter o ID do item no carrinho
  const getCartItemId = useCallback(() => {
    if (!dish) return null;
    const menuItem = convertToMenuItem(dish);
    // Gerar o mesmo ID que é usado no carrinho
    return CartUtils.generateItemId(menuItem, selectedComplements, prefaceAnswers);
  }, [dish, selectedComplements, prefaceAnswers, convertToMenuItem]);

  // Funções para incrementar e decrementar quantidade
  const handleIncrementQuantity = useCallback(() => {
    const itemId = getCartItemId();
    if (itemId) {
      incrementQuantity(itemId);
    }
  }, [getCartItemId, incrementQuantity]);

  const handleDecrementQuantity = useCallback(() => {
    const itemId = getCartItemId();
    if (itemId) {
      decrementQuantity(itemId);
    }
  }, [getCartItemId, decrementQuantity]);

  // Função para remover item da comanda
  const handleRemoveItem = useCallback(() => {
    const itemId = getCartItemId();
    if (itemId) {
      removeItem(itemId);
    }
  }, [getCartItemId, removeItem]);

  const handleClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 400); // Aumentado para dar tempo das animações completarem
  }, [onClose]);

  // Função para ir para o carrinho
  const handleGoToCart = useCallback(() => {
    openCart();
    handleClose();
  }, [openCart, handleClose]);

  // Resetar seleções quando o prato mudar
  useEffect(() => {
    if (dish) {
      setSelectedComplements(new Map());
      setPrefaceAnswers(new Map());
      setIsClosing(false);
      wasAddedToCart.current = false;
    }
  }, [dish]);

  // Track modal analytics
  useEffect(() => {
    if (open && dish) {
      const restaurantId = getCurrentRestaurantId();
      if (restaurantId) {
        Analytics.trackDishModalOpened(dish, restaurantId, 'menu');
        Analytics.trackDishViewed(dish, restaurantId, 'modal');
        
        // Track modal close when it actually closes
        const modalOpenTime = Date.now();
        return () => {
          const timeSpent = Math.round((Date.now() - modalOpenTime) / 1000);
          Analytics.trackDishModalClosed(dish, restaurantId, timeSpent, wasAddedToCart.current);
        };
      }
    }
  }, [open, dish]);



  // Adicionar listener para o botão voltar do navegador
  useEffect(() => {
    const handlePopState = () => {
      if (open) {
        handleClose();
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Cleanup: remover o listener quando o modal fechar
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [open, handleClose]);

  // Controlar o scroll do body quando o modal abrir/fechar
  useModalScroll(open);

  const handleComplementToggle = (groupTitle: string, complementName: string) => {
    const group = dish?.complement_groups?.find(g => g.title === groupTitle);
    if (group && groupHasPreface(group) && !prefaceAnswers.get(groupTitle)) {
      return;
    }

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
      const selections = selectedComplements.get(group.title) || new Set();
      if (groupHasPreface(group)) {
        if (group.required && (!prefaceAnswers.get(group.title) || selections.size === 0)) {
          return true;
        }
        if (selections.size > 0 && !prefaceAnswers.get(group.title)) {
          return true;
        }
      }
      if (!group.required) return false;
      return selections.size === 0;
    });
  };

  // Adicionar item à comanda
  const handleAddToCart = () => {
    if (!dish || hasUnfilledRequiredGroups()) return;
    
    try {
      const menuItem = convertToMenuItem(dish);
      addItem(menuItem, selectedComplements, prefaceAnswers);
      
      wasAddedToCart.current = true;
      
      // Feedback visual
      setShowAddedFeedback(true);
      setTimeout(() => setShowAddedFeedback(false), 2000);
      
      // Opcional: fechar modal após adicionar
      // handleClose();
    } catch (error) {
      console.error('Erro ao adicionar item à comanda:', error);
    }
  };

  // Verificar se o item atual já está na comanda
  const currentItemInCart = dish ? (() => {
    const menuItem = convertToMenuItem(dish);
    return isItemInCart(menuItem, selectedComplements, prefaceAnswers);
  })() : false;
  
  const currentItemQuantity = dish ? (() => {
    const menuItem = convertToMenuItem(dish);
    return getItemQuantity(menuItem, selectedComplements, prefaceAnswers);
  })() : 0;

  const isAcceptingOrders = restaurant ? canRestaurantAcceptOrders(restaurant) : true;

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
        className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative z-[999999] flex flex-col ${
          isClosing ? 'modal-exit' : 'modal-container'
        }`} 
        onClick={e => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="relative modal-image-container flex-shrink-0">
          <MediaWithLoading
            src={dish.image}
            alt={dish.name}
            className="w-full h-48 object-cover"
            fallbackSrc={fallbackImage || restaurant?.image || "/window.svg"}
            mediaType={dish.mediaType}
            videoSrc={dish.videoMp4Url}
            videoControls
            clickable={false}
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
          </MediaWithLoading>
        </div>
        
        <div className="flex-1 min-h-0 overflow-y-auto p-6 modal-content">
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">{dish.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-3">
                {dish.ingredients && dish.ingredients.trim() !== '' && (
                  <div className="modal-info-item flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <img 
                        src="/ingredients.svg" 
                        alt="Ingredientes" 
                        className="w-4 h-4 text-green-600 dark:text-green-400"
                        style={{ filter: 'brightness(0) saturate(100%) invert(34%) sepia(95%) saturate(2476%) hue-rotate(86deg) brightness(94%) contrast(101%)' }}
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Ingredientes: </span>
                      <span className="text-gray-700 dark:text-gray-300">{dish.ingredients}</span>
                    </div>
                  </div>
                )}
                {dish.allergens && dish.allergens.trim() !== '' && (
                  <div className="modal-info-item flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Alérgenos: </span>
                      <span className="text-gray-700 dark:text-gray-300">{dish.allergens}</span>
                    </div>
                  </div>
                )}
                {dish.portion && dish.portion.trim() !== '' && (
                  <div className="modal-info-item flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <img 
                        src="/portion.svg" 
                        alt="Porção" 
                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                        style={{ filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(190deg) brightness(118%) contrast(119%)' }}
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Porção: </span>
                      <span className="text-gray-700 dark:text-gray-300">{dish.portion}</span>
                    </div>
                  </div>
                )}
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
                        prefaceAnswerId={prefaceAnswers.get(group.title)}
                        onPrefaceAnswerChange={(answerId) =>
                          setPrefaceAnswers((prev) => {
                            const next = new Map(prev);
                            next.set(group.title, answerId);
                            return next;
                          })
                        }
                        onComplementToggle={(complementName) => handleComplementToggle(group.title, complementName)}
                        restaurantLogo={restaurant?.image}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Resumo das seleções */}
            {(selectedComplements.size > 0 || prefaceAnswers.size > 0) && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-blue-200 dark:border-gray-600 selection-summary">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <span className="mr-2">📋</span>
                  Suas Seleções:
                </h4>
                <div className="space-y-3">
                  {Array.from(prefaceAnswers.entries()).map(([groupTitle, answerId]) => {
                    const group = dish.complement_groups?.find(g => g.title === groupTitle);
                    const answerLabel = group?.preface_options?.find(o => o.id === answerId)?.label;
                    if (!answerLabel) return null;
                    return (
                      <div key={`preface-${groupTitle}`} className="bg-white dark:bg-gray-600 rounded-lg p-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{groupTitle}:</span>
                        <div className="ml-2 mt-1 text-sm text-gray-600 dark:text-gray-400">{answerLabel}</div>
                      </div>
                    );
                  })}
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
                                <span className="font-medium text-primary">+R$ {complement?.price}</span>
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
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-6 space-y-3 total-section">
          <div className="flex justify-between items-center gap-3">
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Total: R$ {calculateTotalPrice()}
            </div>

            {dish.tags && (
              <div className="flex flex-wrap justify-end gap-2">
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

          {hasUnfilledRequiredGroups() && (
            <div className="text-sm text-red-600 dark:text-red-400 flex items-center">
              <span className="mr-2">⚠️</span>
              * Selecione os complementos obrigatórios
            </div>
          )}

          {showAddedFeedback && (
            <div className="text-sm text-green-600 dark:text-green-400 flex items-center animate-fade-in">
              <span className="mr-2">✅</span>
              Item adicionado à comanda com sucesso!
            </div>
          )}

          {currentItemInCart && currentItemQuantity > 0 && (
            <div className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
              <span className="mr-2">🛒</span>
              Este item já está na comanda ({currentItemQuantity}x)
            </div>
          )}

          <div className="flex flex-col gap-3">
            {!isAcceptingOrders ? (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4 rounded-xl text-center shadow-sm">
                <p className="text-red-700 dark:text-red-400 font-bold mb-1 flex items-center justify-center gap-1.5">
                  <span>⚠️</span>
                  {restaurant?.open === false ? 'Estabelecimento Fechado' : 'Pedidos pausados'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                  Não estamos aceitando novos pedidos no momento.
                </p>
                {restaurant?.operating_hours && restaurant.operating_hours.length > 0 && (
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 pt-2.5 border-t border-red-200/50 dark:border-red-900/30 text-left max-w-sm mx-auto">
                    <p className="font-bold text-gray-700 dark:text-gray-300 mb-1.5 text-center">Horários de Funcionamento:</p>
                    <div className="grid grid-cols-1 gap-1">
                      {formatOperatingHours(restaurant.operating_hours).map((h, i) => (
                        <div key={i} className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-0.5 last:border-0">{h}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : currentItemInCart && currentItemQuantity > 0 ? (
              <div className="flex flex-row gap-3">
                <button
                  onClick={handleGoToCart}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 flex-1 modal-button"
                  aria-label="Ir para comanda"
                >
                  <CartIcon className="w-5 h-5" />
                  Ir para Comanda
                </button>

                <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg justify-center">
                  {currentItemQuantity === 1 ? (
                    <button
                      onClick={handleRemoveItem}
                      className="w-8 h-8 flex items-center justify-center bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400 rounded-full transition-colors"
                      aria-label="Remover item da comanda"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={handleDecrementQuantity}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full transition-colors"
                      aria-label="Diminuir quantidade"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                  )}

                  <span className="w-8 text-center font-medium text-gray-800 dark:text-gray-200">
                    {currentItemQuantity}
                  </span>

                  <button
                    onClick={handleIncrementQuantity}
                    className="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-full transition-colors"
                    aria-label="Aumentar quantidade"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={hasUnfilledRequiredGroups()}
                className={`
                  flex items-center justify-center gap-2 px-4 py-3 w-full
                  ${hasUnfilledRequiredGroups()
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                  }
                  text-white font-semibold rounded-lg transition-all duration-200
                  shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]
                  focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800
                  modal-button
                  ${showAddedFeedback ? 'animate-pulse bg-green-500 hover:bg-green-600' : ''}
                `}
                aria-label="Adicionar à comanda"
              >
                <CartIcon className="w-5 h-5" />
                {showAddedFeedback ? 'Adicionado!' : 'Adicionar à Comanda'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
