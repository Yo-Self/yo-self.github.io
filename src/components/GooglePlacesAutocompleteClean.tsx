'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function GooglePlacesAutocompleteClean({
  value,
  onChange,
  placeholder = "Digite seu endereço completo",
  className = "",
  disabled = false
}: GooglePlacesAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string>('');

  // Função para atualizar o endereço
  const handleAddressChange = useCallback((address: string) => {
    console.log('🎯 handleAddressChange chamada com:', address);
    onChange(address);
  }, [onChange]);

  // Adicionar estilos do Google Places
  const addGooglePlacesStyles = useCallback(() => {
    if (document.getElementById('google-places-custom-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'google-places-custom-styles';
    style.textContent = `
      .pac-container {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
        margin-top: 4px;
        z-index: 10000;
      }
      .pac-item {
        padding: 12px 16px;
        border-bottom: 1px solid #f3f4f6;
        cursor: pointer;
        font-size: 14px;
      }
      .pac-item:hover {
        background-color: #f9fafb;
      }
      .pac-item:last-child {
        border-bottom: none;
      }
      .pac-matched {
        font-weight: 600;
        color: #3b82f6;
      }
    `;
    document.head.appendChild(style);
    console.log('✅ Estilos customizados do Google Places adicionados');
  }, []);

  // Criar input simples de fallback
  const createFallbackInput = useCallback(() => {
    if (!containerRef.current) return;
    
    console.log('🔧 Criando input simples de fallback');
    containerRef.current.innerHTML = '';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.value = value || '';
    input.disabled = disabled;
    input.className = `
      w-full px-4 py-3 
      border border-gray-300 dark:border-gray-600 
      rounded-lg 
      bg-white dark:bg-gray-800 
      text-gray-900 dark:text-gray-100 
      placeholder-gray-500 dark:placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      transition-colors duration-200
    `.replace(/\s+/g, ' ').trim();

    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      handleAddressChange(target.value);
    });

    containerRef.current.appendChild(input);
    inputRef.current = input;
    console.log('✅ Input simples criado');
  }, [placeholder, value, disabled, handleAddressChange]);

  // Inicializar Google Places Autocomplete
  const initializeAutocomplete = useCallback(() => {
    console.log('🔧 Inicializando Google Places Autocomplete');
    
    if (!containerRef.current) {
      console.log('❌ Container não disponível');
      return;
    }

    if (!window.google?.maps?.places?.Autocomplete) {
      console.log('❌ Google Maps API não disponível');
      createFallbackInput();
      return;
    }

    try {
      // Limpar container
      containerRef.current.innerHTML = '';
      addGooglePlacesStyles();

      // Criar input
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = placeholder;
      input.value = value || '';
      input.disabled = disabled;
      input.className = `
        w-full px-4 py-3 
        border border-gray-300 dark:border-gray-600 
        rounded-lg 
        bg-white dark:bg-gray-800 
        text-gray-900 dark:text-gray-100 
        placeholder-gray-500 dark:placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        transition-colors duration-200
      `.replace(/\s+/g, ' ').trim();

      containerRef.current.appendChild(input);
      inputRef.current = input;

      // Criar autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: 'br' },
        types: ['address'],
        fields: ['formatted_address', 'name', 'place_id']
      });

      // Event listener para seleção
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        console.log('🎯 Place selecionado:', place);

        let address = '';
        if (place?.formatted_address) {
          address = place.formatted_address;
          console.log('✅ Usando formatted_address:', address);
        } else if (place?.name) {
          address = place.name;
          console.log('⚠️ Usando name:', address);
        }

        if (address) {
          input.value = address;
          handleAddressChange(address);
          setApiStatus('Endereço selecionado ✓');
        }
      });

      // Event listener para digitação manual
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const inputValue = target.value;
        console.log('⌨️ Digitação:', inputValue);
        handleAddressChange(inputValue);
        
        if (inputValue.length >= 3) {
          setApiStatus('Buscando sugestões...');
        }
      });

      autocompleteRef.current = autocomplete;
      setIsLoaded(true);
      setApiStatus('Pronto - Digite para ver sugestões');
      console.log('✅ Google Places inicializado com sucesso');

    } catch (err) {
      console.error('❌ Erro ao inicializar:', err);
      setError('Erro ao carregar autocompletar');
      createFallbackInput();
    }
  }, [placeholder, value, disabled, handleAddressChange, addGooglePlacesStyles, createFallbackInput]);

  // Carregar Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google?.maps?.places) {
        console.log('📡 Google Maps já carregado');
        initializeAutocomplete();
        return;
      }

      setIsLoading(true);
      setApiStatus('Carregando...');

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGooglePlaces`;
      script.async = true;
      script.defer = true;

      (window as any).initGooglePlaces = () => {
        console.log('✅ Google Maps carregado via callback');
        setIsLoading(false);
        initializeAutocomplete();
      };

      script.onerror = () => {
        console.error('❌ Erro ao carregar Google Maps');
        setIsLoading(false);
        setError('Erro ao carregar Google Maps');
        createFallbackInput();
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [initializeAutocomplete, createFallbackInput]);

  return (
    <div className={`google-places-autocomplete ${className}`}>
      <div ref={containerRef} className="w-full">
        {isLoading && (
          <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
            Carregando...
          </div>
        )}
      </div>
      
      {/* Status de debug */}
      <div className="text-xs text-blue-600 mt-1">
        Status: {apiStatus}
      </div>
      
      {error && (
        <div className="text-xs text-red-600 mt-1">
          {error}
        </div>
      )}
    </div>
  );
}
