"use client";

import React, { useState } from 'react';
import { useWaiterCalls } from '@/hooks/useWaiterCalls';

interface WaiterCallButtonProps {
  restaurantId: string;
  waiterCallEnabled?: boolean;
  className?: string;
}

export default function WaiterCallButton({ restaurantId, waiterCallEnabled = false, className = "" }: WaiterCallButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCall, error, clearError } = useWaiterCalls();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tableNumber.trim()) {
      alert('Por favor, informe o número da mesa');
      return;
    }

    const tableNum = parseInt(tableNumber);
    if (isNaN(tableNum) || tableNum <= 0) {
      alert('Por favor, informe um número de mesa válido');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const result = await createCall(restaurantId, tableNum, notes.trim() || undefined);
      
      if (result) {
        alert('Chamada de garçom enviada com sucesso!');
        setShowModal(false);
        setTableNumber('');
        setNotes('');
      } else {
        alert('Erro ao enviar chamada de garçom. Tente novamente.');
      }
    } catch (err) {
      console.error('Error creating waiter call:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setTableNumber('');
    setNotes('');
    clearError();
  };

  // Se a funcionalidade não estiver habilitada, não renderizar o botão
  if (!waiterCallEnabled) {
    return null;
  }

  return (
    <>
      {/* Botão de chamar garçom */}
      <button
        onClick={() => setShowModal(true)}
        className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors duration-200 shadow-lg flex items-center justify-center ${className}"
        aria-label="Chamar garçom"
        title="Chamar garçom"
        data-waiter-button
      >
        <img 
          src="https://yo-self.github.io/call-waiter.svg" 
          alt="Chamar garçom" 
          className="w-9 h-9 filter brightness-0 invert"
        />
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Chamar Garçom
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Fechar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número da Mesa *
                </label>
                <input
                  type="number"
                  id="tableNumber"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Ex: 5"
                  min="1"
                  required
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Ex: Preciso de mais água, tem alguma dúvida sobre o cardápio..."
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 disabled:bg-orange-400 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </div>
                  ) : (
                    'Chamar Garçom'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
