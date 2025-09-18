"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface GooglePlacesAutocompleteSimpleProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function GooglePlacesAutocompleteSimple({
  value,
  onChange,
  placeholder = "Digite seu endereço completo",
  className = "",
  disabled = false
}: GooglePlacesAutocompleteSimpleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGoogleMapsScript = useCallback(() => {
    if (typeof document === 'undefined') return;

    // Check if the script is already loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Check if google is available
      if (typeof (window as any).google !== 'undefined' && (window as any).google.maps) {
        console.log('Google Maps já está carregado');
        setIsLoaded(true);
        return;
      }
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setError('API key não configurada');
      return;
    }

    setIsLoading(true);
    console.log('Carregando Google Maps API...');

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('Script do Google Maps carregado');
      
      // Função para verificar se a biblioteca places está disponível
      const checkPlacesLibrary = () => {
        if (typeof (window as any).google !== 'undefined' && 
            (window as any).google.maps && 
            (window as any).google.maps.places && 
            (window as any).google.maps.places.Autocomplete) {
          console.log('Google Maps Places API disponível');
          setIsLoaded(true);
          setIsLoading(false);
          setError(null);
          return true;
        }
        return false;
      };

      // Tentar verificar imediatamente
      if (checkPlacesLibrary()) {
        return;
      }

      // Se não estiver disponível, aguardar e tentar novamente
      let attempts = 0;
      const maxAttempts = 50; // 5 segundos máximo
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (checkPlacesLibrary()) {
          clearInterval(checkInterval);
        } else if (attempts >= maxAttempts) {
          console.error('Google Maps Places API não está disponível após carregamento');
          setError('Erro ao carregar biblioteca Places do Google Maps');
          setIsLoading(false);
          clearInterval(checkInterval);
        }
      }, 100);
    };

    script.onerror = () => {
      console.error('Erro ao carregar script do Google Maps');
      setError('Erro ao carregar API do Google Maps.');
      setIsLoading(false);
    };

    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    loadGoogleMapsScript();
  }, [loadGoogleMapsScript]);

  useEffect(() => {
    if (inputRef.current && isLoaded && !autocompleteRef.current) {
      // Verificar se google.maps.places está disponível
      if (typeof (window as any).google === 'undefined' || 
          !(window as any).google.maps || 
          !(window as any).google.maps.places || 
          !(window as any).google.maps.places.Autocomplete) {
        console.log('Google Maps Places ainda não está disponível, aguardando...');
        return;
      }

      try {
        console.log('Inicializando Google Places Autocomplete...');
        
        // Criar o autocomplete
        const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'br' },
          fields: ['formatted_address', 'address_components', 'place_id']
        });

        autocompleteRef.current = autocomplete;

        // Event listener para quando um lugar é selecionado
        const listener = autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          console.log('Place selecionado:', place);
          
          if (place.formatted_address) {
            console.log('Endereço selecionado:', place.formatted_address);
            onChange(place.formatted_address);
          }
        });

        // Salvar listener para cleanup
        (autocomplete as any).listener = listener;

        // Adicionar estilos para esconder o "powered by Google"
        const style = document.createElement('style');
        style.id = 'google-places-attribution-hide';
        style.textContent = `
          .pac-container {
            z-index: 999999 !important;
          }
          .pac-container:after {
            display: none !important;
          }
          .pac-container .pac-item {
            padding: 8px 12px !important;
            border-bottom: 1px solid #e5e7eb !important;
            cursor: pointer !important;
          }
          .pac-container .pac-item:hover {
            background-color: #f3f4f6 !important;
          }
          .pac-container .pac-item-selected {
            background-color: #3b82f6 !important;
            color: white !important;
          }
          .pac-container .pac-item-selected:hover {
            background-color: #2563eb !important;
          }
        `;
        document.head.appendChild(style);

        console.log('Google Places Autocomplete inicializado com sucesso');

      } catch (err) {
        console.error('Erro ao inicializar Autocomplete:', err);
        setError('Erro ao inicializar autocompletar');
      }
    }

    return () => {
      if (autocompleteRef.current) {
        try {
          // Limpar listener
          if ((autocompleteRef.current as any).listener) {
            (window as any).google.maps.event.removeListener((autocompleteRef.current as any).listener);
          }
        } catch (e) {
          // Ignorar erro ao limpar
        }
        autocompleteRef.current = null;
      }
    };
  }, [isLoaded, onChange]);

  // Sincronizar valor
  useEffect(() => {
    if (inputRef.current && value !== undefined) {
      inputRef.current.value = value;
    }
  }, [value]);

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        disabled={disabled || isLoading}
        value={value}
        onChange={(e) => {
          console.log('Input onChange:', e.target.value);
          onChange(e.target.value);
        }}
        className={`
          w-full px-4 py-3 
          border border-gray-300 dark:border-gray-600 
          rounded-lg 
          bg-white dark:bg-gray-800 
          text-gray-900 dark:text-gray-100 
          placeholder-gray-500 dark:placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-colors duration-200
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
