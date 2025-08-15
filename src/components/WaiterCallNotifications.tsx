"use client";

import React, { useState, useEffect } from 'react';
import { useWaiterCalls, WaiterCall } from '@/hooks/useWaiterCalls';

interface WaiterCallNotificationsProps {
  restaurantId: string;
  onCallAttended?: (call: WaiterCall) => void;
}

export default function WaiterCallNotifications({ 
  restaurantId, 
  onCallAttended 
}: WaiterCallNotificationsProps) {
  const { calls, fetchCalls, updateCall, isLoading, error } = useWaiterCalls();
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Buscar chamadas pendentes ao montar o componente
  useEffect(() => {
    fetchCalls(restaurantId, 'pending');
  }, [restaurantId, fetchCalls]);

  // Atualizar contador de chamadas pendentes
  useEffect(() => {
    const pending = calls.filter(call => call.status === 'pending');
    setPendingCount(pending.length);
  }, [calls]);

  // Polling para buscar novas chamadas a cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCalls(restaurantId, 'pending');
    }, 10000);

    return () => clearInterval(interval);
  }, [restaurantId, fetchCalls]);

  const handleAttendCall = async (call: WaiterCall) => {
    try {
      const updatedCall = await updateCall(call.id, 'attended');
      if (updatedCall && onCallAttended) {
        onCallAttended(updatedCall);
      }
    } catch (err) {
      console.error('Error attending call:', err);
    }
  };

  const handleCancelCall = async (call: WaiterCall) => {
    try {
      await updateCall(call.id, 'cancelled');
    } catch (err) {
      console.error('Error cancelling call:', err);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const pendingCalls = calls.filter(call => call.status === 'pending');

  return (
    <div className="relative">
      {/* Botão de notificações */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors duration-200 shadow-lg"
        aria-label="Notificações de chamadas de garçom"
        title="Notificações de chamadas de garçom"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        
        {/* Badge com contador */}
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </button>

      {/* Painel de notificações */}
      {showNotifications && (
        <div className="absolute top-12 right-0 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Chamadas de Garçom
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {pendingCount} chamada{pendingCount !== 1 ? 's' : ''} pendente{pendingCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Carregando...</p>
              </div>
            ) : error ? (
              <div className="p-4">
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            ) : pendingCalls.length === 0 ? (
              <div className="p-4 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-600 dark:text-gray-400">Nenhuma chamada pendente</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {pendingCalls.map((call) => (
                  <div key={call.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            Mesa {call.table_number}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(call.created_at)}
                          </span>
                        </div>
                        
                                                 {call.notes && (
                           <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                             &ldquo;{call.notes}&rdquo;
                           </p>
                         )}
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAttendCall(call)}
                            className="flex-1 px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors duration-200"
                          >
                            Atender
                          </button>
                          <button
                            onClick={() => handleCancelCall(call)}
                            className="flex-1 px-3 py-1.5 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 transition-colors duration-200"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
