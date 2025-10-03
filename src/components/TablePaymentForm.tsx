"use client";

import React from 'react';
import { useCustomerData } from '../hooks/useCustomerData';

interface TablePaymentFormProps {
  className?: string;
}

export default function TablePaymentForm({ 
  className = ""
}: TablePaymentFormProps) {
  const { customerData, updateName, updateWhatsApp } = useCustomerData();

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
          <svg
            className="w-5 h-5 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Pagamento na Mesa
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Preencha para receber o status do seu pedido.
          </p>
        </div>
      </div>

      <div>
        <label 
          htmlFor="table-customer-name" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Nome Completo
        </label>
        <input
          id="table-customer-name"
          type="text"
          value={customerData.name || ''}
          onChange={(e) => updateName(e.target.value)}
          placeholder="Digite seu nome completo"
          className="
            w-full px-4 py-3 
            border border-gray-300 dark:border-gray-600 
            rounded-lg 
            bg-white dark:bg-gray-800 
            text-gray-900 dark:text-gray-100 
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
            transition-colors duration-200
          "
        />
      </div>

      <div>
        <label 
          htmlFor="table-customer-whatsapp" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          WhatsApp
        </label>
        <input
          id="table-customer-whatsapp"
          type="tel"
          value={customerData.whatsapp || ''}
          onChange={(e) => updateWhatsApp(e.target.value)}
          placeholder="(11) 99999-9999"
          className="
            w-full px-4 py-3 
            border border-gray-300 dark:border-gray-600 
            rounded-lg 
            bg-white dark:bg-gray-800 
            text-gray-900 dark:text-gray-100 
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
            transition-colors duration-200
          "
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          💡 Seu número será usado para contato sobre o pedido
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm flex-wrap">
        <div className={`w-2 h-2 rounded-full transition-colors ${customerData.name?.trim() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <span className={`transition-colors ${customerData.name?.trim() ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>Nome</span>
        
        <div className={`w-2 h-2 rounded-full transition-colors ${customerData.whatsapp?.trim() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <span className={`transition-colors ${customerData.whatsapp?.trim() ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>WhatsApp</span>
      </div>
    </div>
  );
}
