"use client";

import React from 'react';
import GooglePlacesAutocompleteRobust from './GooglePlacesAutocompleteRobust';
import { useCustomerData } from '../hooks/useCustomerData';

interface CustomerDataFormProps {
  className?: string;
}

export default function CustomerDataForm({ className = "" }: CustomerDataFormProps) {
  const { customerData, updateName, updateAddress, updateNumber, updateComplement } = useCustomerData();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Título da seção */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <svg 
            className="w-5 h-5 text-blue-600 dark:text-blue-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Dados para Entrega
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Preencha seus dados para finalizar o pedido
          </p>
        </div>
      </div>

      {/* Campo de Nome */}
      <div>
        <label 
          htmlFor="customer-name" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Nome Completo
        </label>
        <input
          id="customer-name"
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
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-colors duration-200
          "
        />
      </div>

      {/* Campo de Endereço */}
      <div>
        <label 
          htmlFor="customer-address" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Endereço Completo
        </label>
        
        <GooglePlacesAutocompleteRobust
          value={customerData.address}
          onChange={updateAddress}
          placeholder="Digite seu endereço completo"
        />
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          💡 Digite o endereço e selecione uma das sugestões que aparecerem
        </p>
      </div>

      {/* Campos de Número e Complemento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Campo de Número */}
        <div>
          <label 
            htmlFor="customer-number" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Número
          </label>
          <input
            id="customer-number"
            type="text"
            value={customerData.number || ''}
            onChange={(e) => updateNumber(e.target.value)}
            placeholder="Ex: 123"
            className="
              w-full px-4 py-3 
              border border-gray-300 dark:border-gray-600 
              rounded-lg 
              bg-white dark:bg-gray-800 
              text-gray-900 dark:text-gray-100 
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-colors duration-200
            "
          />
        </div>

        {/* Campo de Complemento */}
        <div>
          <label 
            htmlFor="customer-complement" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Complemento
          </label>
          <input
            id="customer-complement"
            type="text"
            value={customerData.complement || ''}
            onChange={(e) => updateComplement(e.target.value)}
            placeholder="Ex: Apt 45, Bloco A"
            className="
              w-full px-4 py-3 
              border border-gray-300 dark:border-gray-600 
              rounded-lg 
              bg-white dark:bg-gray-800 
              text-gray-900 dark:text-gray-100 
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-colors duration-200
            "
          />
        </div>
      </div>

      {/* Indicador de preenchimento */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <div className={`w-2 h-2 rounded-full transition-colors ${customerData.name?.trim() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <span className={`transition-colors ${customerData.name?.trim() ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>Nome</span>
        
        <div className={`w-2 h-2 rounded-full transition-colors ${customerData.address?.trim() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <span className={`transition-colors ${customerData.address?.trim() ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>Endereço</span>
        
        <div className={`w-2 h-2 rounded-full transition-colors ${customerData.number?.trim() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <span className={`transition-colors ${customerData.number?.trim() ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>Número</span>
        
        <div className={`w-2 h-2 rounded-full transition-colors ${customerData.complement?.trim() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <span className={`transition-colors ${customerData.complement?.trim() ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>Complemento</span>
      </div>

    </div>
  );
}
