"use client";

import React, { useState } from 'react';
import GooglePlacesAutocompleteRobust from './GooglePlacesAutocompleteRobust';
import NearbyAddresses from './NearbyAddresses';
import { useCustomerData } from '../hooks/useCustomerData';
import { useReverseGeocodingRobust } from '../hooks/useReverseGeocodingRobust';
import { AddressResult } from '../hooks/useReverseGeocoding';

interface CustomerDataFormProps {
  className?: string;
  permissionStatus?: string;
  getCurrentPosition: () => Promise<any>;
  isGeolocationLoading: boolean;
  geolocationError: string | null;
  isSupported: boolean;
  isBlocked?: boolean;
  isSafariIOS?: boolean;
  position: any;
}

export default function CustomerDataForm({ 
  className = "",
  permissionStatus,
  getCurrentPosition,
  isGeolocationLoading,
  geolocationError,
  isSupported,
  isBlocked,
  isSafariIOS,
  position
}: CustomerDataFormProps) {
  const { customerData, updateName, updateAddress, updateNumber, updateComplement } = useCustomerData();
  const { addresses, isLoading: isReverseGeocodingLoading, error: reverseGeocodingError, getAddressesFromCoordinates, clearAddresses } = useReverseGeocodingRobust();
  const [showNearbyAddresses, setShowNearbyAddresses] = useState(false);

  const handleUseLocation = async () => {
    try {
      const newPosition = await getCurrentPosition();
      if (newPosition) {
        getAddressesFromCoordinates(newPosition);
        setShowNearbyAddresses(true);
      }
    } catch (error) {
      console.error('❌ Erro ao obter localização:', error);
    }
  };

  const handleSelectNearbyAddress = (address: AddressResult) => {
    updateAddress(address.formatted_address);
    setShowNearbyAddresses(false);
    clearAddresses();
  };

  const handleCloseNearbyAddresses = () => {
    setShowNearbyAddresses(false);
    clearAddresses();
  };

  return (
    <div className={`space-y-4 ${className}`}>
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

      <div>
        <div className="flex items-center justify-between mb-2">
          <label 
            htmlFor="customer-address" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Endereço Completo
          </label>
        </div>
        
        <div className="relative">
          <GooglePlacesAutocompleteRobust
            value={customerData.address}
            onChange={(address) => {
              updateAddress(address);
            }}
            placeholder="Digite seu endereço completo"
          />
          {isSupported && permissionStatus === 'granted' && (
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={isGeolocationLoading}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Usar minha localização"
            >
              {isGeolocationLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              ) : (
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
              )}
            </button>
          )}
        </div>
        
        <div className="mt-1 space-y-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Digite o endereço ou click no icone de localização e selecione uma das sugestões que aparecerem.
          </p>
          {geolocationError && (
            <div className={`text-xs ${isBlocked ? 'text-red-600 dark:text-red-400' : 'text-red-600 dark:text-red-400'}`}>
              {isBlocked ? (
                <div>
                  <p className="font-medium mb-2">🚫 Permissão bloqueada pelo navegador</p>
                  <div className="text-xs space-y-1">
                    <p><strong>Para resolver:</strong></p>
                    {isSafariIOS ? (
                      <>
                        <p>1. Vá em Configurações → Safari → Localização</p>
                        <p>2. Mude para &quot;Perguntar&quot; ou &quot;Permitir&quot;</p>
                        <p>3. Recarregue a página</p>
                        <p className="text-blue-600 dark:text-blue-400 mt-2">
                          💡 Ou acesse: Configurações → Privacidade e Segurança → Localização → Safari
                        </p>
                      </>
                    ) : typeof navigator !== 'undefined' && navigator.userAgent.includes('Macintosh') && navigator.userAgent.includes('Safari') ? (
                      <>
                        <p>1. Vá em Safari → Configurações (ou Safari → Preferências)</p>
                        <p>2. Clique na aba &quot;Websites&quot;</p>
                        <p>3. Encontre &quot;Localização&quot; na lista lateral</p>
                        <p>4. Mude para &quot;Perguntar&quot; ou &quot;Permitir&quot;</p>
                        <p>5. Recarregue a página</p>
                        <p className="text-blue-600 dark:text-blue-400 mt-2">
                          💡 Ou acesse: Configurações → Privacidade e Segurança → Localização → Safari
                        </p>
                      </>
                    ) : (
                      <>
                        <p>1. Clique no ícone 🔒 ao lado da URL</p>
                        <p>2. Vá em &quot;Configurações do site&quot;</p>
                        <p>3. Encontre &quot;Localização&quot; e mude para &quot;Perguntar&quot;</p>
                        <p>4. Recarregue a página</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <p>⚠️ {geolocationError}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {showNearbyAddresses && (
        <NearbyAddresses
          addresses={addresses}
          isLoading={isReverseGeocodingLoading}
          error={reverseGeocodingError}
          onSelectAddress={handleSelectNearbyAddress}
          onClose={handleCloseNearbyAddresses}
        />
      )}
    </div>
  );
}
