"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useModalScroll } from '../hooks/useModalScroll';
import { useCurrentRestaurant } from '../hooks/useCurrentRestaurant';
import { CartItem, CartUtils } from '../types/cart';
import ImageWithLoading from './ImageWithLoading';
import CartWhatsAppButton from './CartWhatsAppButton';
import CartIcon from './CartIcon';

interface CartModalProps {
  restaurantId?: string;
}

export default function CartModal({ restaurantId: propRestaurantId }: CartModalProps) {
  const { 
    items, 
    totalItems, 
    totalPrice, 
    formattedTotalPrice,
    isCartOpen, 
    closeCart, 
    updateQuantity, 
    removeItem, 
    clearCart,
    isEmpty 
  } = useCart();

  // Usar o restaurantId passado como prop ou detectar automaticamente
  const detectedRestaurantId = useCurrentRestaurant();
  const restaurantId = propRestaurantId || detectedRestaurantId;

  const [isClosing, setIsClosing] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Controlar scroll do body quando modal estiver aberto
  useModalScroll(isCartOpen);

  const handleClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      closeCart();
      setIsClosing(false);
    }, 300);
  }, [closeCart]);

  // Fechar modal com Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isCartOpen, handleClose]);

  // Controles de quantidade
  const incrementQuantity = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      updateQuantity(itemId, item.quantity + 1);
    }
  };

  const decrementQuantity = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      if (item.quantity <= 1) {
        removeItem(itemId);
      } else {
        updateQuantity(itemId, item.quantity - 1);
      }
    }
  };

  // Confirmação para limpar carrinho
  const handleClearCart = () => {
    setShowClearConfirmation(true);
  };

  const confirmClearCart = () => {
    clearCart();
    setShowClearConfirmation(false);
  };

  if (!isCartOpen) return null;

  return (
    <div 
      ref={modalRef}
      className={`
        fixed inset-0 z-[999999] flex items-center justify-center p-4
        ${isClosing ? 'modal-backdrop-exit' : 'modal-backdrop'}
      `}
      onClick={handleClose}
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div 
        className={`
          bg-white dark:bg-gray-900 rounded-2xl shadow-2xl 
          max-w-2xl w-full max-h-[90vh] overflow-hidden relative z-[999999]
          ${isClosing ? 'modal-exit' : 'modal-container'}
        `} 
        onClick={e => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <CartIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Comanda
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {totalItems} {totalItems === 1 ? 'item' : 'itens'} selecionado{totalItems !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Fechar comanda"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex flex-col h-full max-h-[calc(90vh-120px)]">
          {isEmpty ? (
            // Carrinho vazio
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <CartIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Sua comanda está vazia
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Adicione alguns pratos deliciosos à sua comanda para continuar
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                Continuar Escolhendo
              </button>
            </div>
          ) : (
            <>
              {/* Lista de itens */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {items.map((item) => (
                  <CartItemComponent
                    key={item.id}
                    item={item}
                    onIncrement={() => incrementQuantity(item.id)}
                    onDecrement={() => decrementQuantity(item.id)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>

              {/* Footer com totais e ações */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800">
                {/* Resumo do pedido */}
                <div className="mb-4">
                  <div className="flex justify-between items-center text-lg font-semibold text-gray-800 dark:text-gray-200">
                    <span>Total do Pedido:</span>
                    <span>R$ {formattedTotalPrice}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {totalItems} {totalItems === 1 ? 'item' : 'itens'} • Taxa de entrega não incluída
                  </p>
                </div>

                {/* Botões de ação */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleClearCart}
                    className="flex-1 px-4 py-3 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors font-medium"
                  >
                    Limpar Comanda
                  </button>
                  
                  <div className="flex-2">
                    <CartWhatsAppButton restaurantId={restaurantId} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de confirmação para limpar carrinho */}
      {showClearConfirmation && (
        <div className="absolute inset-0 flex items-center justify-center z-[9999999]">
          <div 
            className="bg-black bg-opacity-50 absolute inset-0"
            onClick={() => setShowClearConfirmation(false)}
          />
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm mx-4 relative z-10 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Limpar Comanda
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja remover todos os itens da comanda? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirmation(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmClearCart}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para cada item do carrinho
function CartItemComponent({ 
  item, 
  onIncrement, 
  onDecrement, 
  onRemove 
}: {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Imagem do produto */}
      <div className="flex-shrink-0">
        <ImageWithLoading
          src={item.dish.image}
          alt={item.dish.name}
          className="w-20 h-20 object-cover rounded-lg"
          fallbackSrc="/window.svg"
        />
      </div>

      {/* Informações do produto */}
      <div className="flex-1 min-w-0 pr-2">
        {/* Título em largura total */}
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 leading-snug break-words">
          {item.dish.name}
        </h4>
        
        {/* Complementos selecionados */}
        {item.selectedComplements.size > 0 && (
          <div className="mt-2 space-y-1">
            {Array.from(item.selectedComplements.entries()).map(([groupTitle, selections]) => {
              if (selections.size === 0) return null;
              
              return (
                <div key={groupTitle} className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{groupTitle}:</span>
                  <div className="ml-2 text-gray-500 dark:text-gray-500">
                    {Array.from(selections).map((complement, index) => {
                      const group = item.dish.complement_groups?.find(g => g.title === groupTitle);
                      const complementData = group?.complements.find(c => c.name === complement);
                      const price = complementData?.price !== '0,00' ? ` (+R$ ${complementData?.price})` : '';
                      
                      return (
                        <span key={complement}>
                          {index > 0 && ', '}
                          {complement}{price}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quantidade + preço unitário e, à direita, preço total */}
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            x {item.quantity}
            {item.quantity > 1 && (
              <span className="ml-2 text-gray-500">• R$ {CartUtils.formatPrice(item.unitPrice)}</span>
            )}
          </div>
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            R$ {CartUtils.formatPrice(item.totalPrice)}
          </div>
        </div>
        
        {/* Barra inferior: excluir esquerda, controles direita */}
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={onRemove}
            className="px-2 py-1 text-red-600 hover:text-red-700 transition-colors"
            aria-label="Remover item"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onDecrement}
              className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
              aria-label="Diminuir quantidade"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="w-7 text-center font-medium text-gray-800 dark:text-gray-200">
              {item.quantity}
            </span>
            <button
              onClick={onIncrement}
              className="w-7 h-7 flex items-center justify-center bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-full transition-colors"
              aria-label="Aumentar quantidade"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Espaço reservado ao lado direito removido para não esmagar o título */}
    </div>
  );
}
