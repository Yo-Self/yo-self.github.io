"use client";

import React, { useState } from 'react';
import GooglePlacesAutocompleteRobust from './GooglePlacesAutocompleteRobust';
import NearbyAddresses from './NearbyAddresses';
import { useCustomerData } from '../hooks/useCustomerData';
import { useCustomerCoordinates } from '../hooks/useCustomerCoordinates';
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
  addressActive?: boolean;
}

export default function CustomerDataForm({ 
  className = "",
  permissionStatus,
  getCurrentPosition,
  isGeolocationLoading: isLoading,
  geolocationError,
  isSupported,
  isBlocked,
  isSafariIOS,
  position,
  addressActive = true
}: CustomerDataFormProps) {
  const { customerData, updateName, updateAddress, updateNumber, updateComplement, updateWhatsApp } = useCustomerData();
  const { updateCoordinates } = useCustomerCoordinates();
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
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <svg 
            className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M19 13.5v-1.25a2 2 0 0 0-2-2H13.62L12 8h-1a3 3 0 0 0-3 3v.1a4 4 0 0 0 1.94 3.4l.56.32V16H10A3 3 0 1 0 10 22a3 3 0 0 0 3-3h2a3 3 0 1 0 6 0 3 3 0 0 0-2-3v-2.5zm-9 6.5A1.5 1.5 0 1 1 11.5 18.5 1.5 1.5 0 0 1 10 20zm8 0A1.5 1.5 0 1 1 19.5 18.5 1.5 1.5 0 0 1 18 20zM6 10H3a1 1 0 0 0-1 1v5h4V10zm5.83-4a1.83 1.83 0 1 0-1.83-1.83A1.83 1.83 0 0 0 11.83 6z" />
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
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
            w-full px-3 py-2 
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

      {addressActive && (
      <div>
        <div className="flex items-center justify-between mb-1">
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
              // Limpar coordenadas ao alterar endereço manualmente
              updateCoordinates(null, address);
              if (!address.trim()) {
                updateCoordinates(null, '');
              }
            }}
            onCoordinatesChange={(coordinates, address) => {
              if (address) {
                updateAddress(address);
              }
              updateCoordinates(coordinates, address || '');
            }}
            placeholder="Digite seu endereço completo"
          />
          {isSupported && permissionStatus === 'granted' && (
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={isLoading}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Usar minha localização"
            >
              {isLoading ? (
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
        </div>
      </div>
      )}

      {addressActive && (
      <div className="grid grid-cols-12 gap-2 sm:gap-3">
        <div className="col-span-12 sm:col-span-4">
          <label 
            htmlFor="customer-number" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Número *
          </label>
          <input
            id="customer-number"
            type="text"
            value={customerData.number || ''}
            onChange={(e) => updateNumber(e.target.value)}
            placeholder="Ex: 123"
            className="
              w-full px-3 py-2 
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

        <div className="col-span-6 sm:col-span-4">
          <label 
            htmlFor="customer-complement" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Complemento
          </label>
          <input
            id="customer-complement"
            type="text"
            value={customerData.complement || ''}
            onChange={(e) => updateComplement(e.target.value)}
            placeholder="Ex: Apt 45"
            className="
              w-full px-3 py-2 
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

        <div className="col-span-6 sm:col-span-4">
          <label 
            htmlFor="customer-whatsapp" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Telefone *
          </label>
          <input
            id="customer-whatsapp"
            type="text"
            value={customerData.whatsapp || ''}
            onChange={(e) => updateWhatsApp(e.target.value)}
            placeholder="(11) 90000-0000"
            className="
              w-full px-3 py-2 
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
      )}

      <div className="flex items-center gap-2 text-sm flex-wrap">
        <div className={`w-2 h-2 rounded-full transition-colors ${customerData.name?.trim() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <span className={`transition-colors ${customerData.name?.trim() ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>Nome</span>
        
        {addressActive && (
          <>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <div className={`w-2 h-2 rounded-full transition-colors ${customerData.address?.trim() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className={`transition-colors ${customerData.address?.trim() ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>Endereço</span>
            
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <div className={`w-2 h-2 rounded-full transition-colors ${customerData.number?.trim() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className={`transition-colors ${customerData.number?.trim() ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>Número</span>
          </>
        )}

        <span className="text-gray-300 dark:text-gray-600">•</span>
        <div className={`w-2 h-2 rounded-full transition-colors ${customerData.whatsapp?.trim() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <span className={`transition-colors ${customerData.whatsapp?.trim() ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>Telefone</span>
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
