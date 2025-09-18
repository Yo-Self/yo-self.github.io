"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    google: any;
    initGooglePlaces?: () => void;
  }
}

export default function GooglePlacesAutocompleteModern({
  value,
  onChange,
  placeholder = "Digite seu endereço completo",
  className = "",
  disabled = false
}: GooglePlacesAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string>('');

  // Função para adicionar estilos do Google Places
  const addGooglePlacesStyles = useCallback(() => {
    const existingStyle = document.getElementById('google-places-custom-styles');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'google-places-custom-styles';
      style.textContent = `
        .pac-container {
          z-index: 99999 !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          border: 1px solid #e5e7eb !important;
          background: white !important;
          margin-top: 4px !important;
          font-family: inherit !important;
          max-height: 300px !important;
          overflow-y: auto !important;
        }
        .pac-item {
          padding: 12px 16px !important;
          border-bottom: 1px solid #f3f4f6 !important;
          cursor: pointer !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          transition: background-color 0.15s ease !important;
        }
        .pac-item:hover {
          background-color: #f8fafc !important;
        }
        .pac-item:last-child {
          border-bottom: none !important;
        }
        .pac-item-selected {
          background-color: #eff6ff !important;
        }
        .pac-matched {
          font-weight: 600 !important;
          color: #1f2937 !important;
        }
        .pac-item-query {
          color: #6b7280 !important;
          font-size: 13px !important;
        }
      `;
      document.head.appendChild(style);
      console.log('✅ Estilos do Google Places adicionados');
    }
  }, []);

  // Função para criar input simples (fallback)
  const createFallbackInput = useCallback(() => {
    console.log('🔄 Criando input fallback...');
    
    if (!containerRef.current) {
      console.log('❌ Container não disponível');
      return;
    }

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
      console.log('⌨️ Input fallback:', target.value);
      onChange(target.value);
    });

    containerRef.current.appendChild(input);
    inputRef.current = input;
    
    setIsLoaded(false);
    setIsLoading(false);
    setError('Usando input simples');
    setApiStatus('Digite manualmente');
    console.log('✅ Input fallback criado');
  }, [placeholder, value, disabled, onChange]);

  // Função principal de inicialização do Google Places
  const initializeGooglePlaces = useCallback(() => {
    console.log('🔄 Inicializando Google Places...');
    
    if (!containerRef.current) {
      console.log('❌ Container não disponível');
      createFallbackInput();
      return;
    }

    if (!window.google?.maps?.places?.Autocomplete) {
      console.log('❌ Google Places API não disponível');
      createFallbackInput();
      return;
    }

    try {
      // Limpar container
      containerRef.current.innerHTML = '';
      
      // Adicionar estilos
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

      console.log('✅ Input criado e adicionado ao DOM');

      // Inicializar Google Places Autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: 'br' },
        types: ['address'],
        fields: ['formatted_address', 'name', 'place_id']
      });

      autocompleteRef.current = autocomplete;
      console.log('✅ Google Places Autocomplete inicializado');

      // Event listener para seleção de lugar
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        console.log('🎯 Place selecionado:', place);

        if (place?.formatted_address) {
          const address = place.formatted_address;
          console.log('✅ Endereço válido:', address);
          
          input.value = address;
          onChange(address);
          setApiStatus('Endereço selecionado ✓');
          
        } else if (place?.name) {
          console.log('⚠️ Usando name como fallback:', place.name);
          const address = place.name;
          input.value = address;
          onChange(address);
          setApiStatus('Endereço selecionado ✓');
          
        } else {
          console.log('❌ Place inválido');
          setApiStatus('Seleção inválida');
        }
      });

      // Event listener para digitação manual
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const inputValue = target.value;
        console.log('⌨️ Digitando:', inputValue);
        
        onChange(inputValue);
        
        if (inputValue.trim() === '') {
          setApiStatus('Digite para ver sugestões');
        } else if (inputValue.length >= 3) {
          setApiStatus('Buscando sugestões...');
        }
      });

      // Eventos visuais
      input.addEventListener('focus', () => {
        console.log('👁️ Input focado');
        setApiStatus('Digite para ver sugestões');
      });

      input.addEventListener('blur', () => {
        console.log('👋 Input desfocado, valor:', input.value);
      });

      // Configurar geolocalização para melhorar sugestões
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const geolocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            const circle = new window.google.maps.Circle({
              center: geolocation,
              radius: position.coords.accuracy
            });
            autocomplete.setBounds(circle.getBounds());
            console.log('📍 Localização configurada para melhorar sugestões');
          },
          (error) => {
            console.log('📍 Geolocalização não disponível:', error.message);
          }
        );
      }

      setIsLoaded(true);
      setIsLoading(false);
      setError(null);
      setApiStatus('Pronto - Digite para ver sugestões');
      console.log('✅ Google Places totalmente inicializado');

    } catch (err) {
      console.error('❌ Erro ao inicializar Google Places:', err);
      setError('Erro ao carregar autocompletar');
      setApiStatus('Usando input simples');
      createFallbackInput();
    }
  }, [placeholder, value, disabled, onChange, addGooglePlacesStyles, createFallbackInput]);

  useEffect(() => {
    // Prevenir execução dupla
    if (isInitializedRef.current) {
      console.log('🚫 Já inicializado');
      return;
    }

    let mounted = true;
    console.log('🔄 Iniciando carregamento do Google Places...');

    const loadGooglePlaces = () => {
      // Verificar se a API já está carregada
      if (window.google?.maps?.places?.Autocomplete) {
        console.log('📡 Google Places API já disponível');
        isInitializedRef.current = true;
        setTimeout(() => {
          if (mounted) initializeGooglePlaces();
        }, 100);
        return;
      }

      // Verificar se script já existe
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('📡 Script do Google Maps existe - aguardando...');
        setIsLoading(true);
        setApiStatus('Carregando API...');
        
        const checkAPI = setInterval(() => {
          if (window.google?.maps?.places?.Autocomplete) {
            clearInterval(checkAPI);
            console.log('📡 API carregada com sucesso');
            if (mounted) {
              isInitializedRef.current = true;
              setIsLoading(false);
              setTimeout(() => {
                if (mounted) initializeGooglePlaces();
              }, 100);
            }
          }
        }, 500);
        return;
      }

      // Verificar API key
      if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        console.error('❌ API key não configurada');
        setError('API key não configurada');
        setApiStatus('API key não encontrada');
        isInitializedRef.current = true;
        createFallbackInput();
        return;
      }

      console.log('📡 Carregando script do Google Maps...');
      setIsLoading(true);
      setApiStatus('Carregando API...');
      
      const callbackName = `initGooglePlaces_${Date.now()}`;
      
      (window as any)[callbackName] = () => {
        console.log('✅ Google Maps API carregada via callback');
        if (mounted) {
          isInitializedRef.current = true;
          setIsLoading(false);
          setTimeout(() => {
            if (mounted) initializeGooglePlaces();
          }, 100);
        }
        delete (window as any)[callbackName];
      };
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=${callbackName}&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onerror = () => {
        console.error('❌ Erro ao carregar script');
        if (mounted) {
          setError('Erro ao carregar API');
          setIsLoading(false);
          isInitializedRef.current = true;
          createFallbackInput();
        }
        delete (window as any)[callbackName];
      };
      
      document.head.appendChild(script);
    };

    loadGooglePlaces();

    // Timeout de segurança
    const safetyTimeout = setTimeout(() => {
      if (!inputRef.current && containerRef.current && mounted) {
        console.log('⏰ Timeout de segurança - criando fallback');
        createFallbackInput();
      }
    }, 10000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      if (autocompleteRef.current && window.google?.maps?.event) {
        try {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch (e) {
          console.log('Erro ao limpar listeners:', e);
        }
      }
    };
  }, [initializeGooglePlaces, createFallbackInput]);

  // Sincronizar valor
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      console.log('🔄 Sincronizando valor:', value);
      inputRef.current.value = value || '';
    }
  }, [value]);

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className={`${className} ${disabled || isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {isLoaded && !isLoading && !error && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg 
            className="w-5 h-5 text-green-500" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
      )}

      {error && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg 
            className="w-5 h-5 text-yellow-500" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
      )}

      {apiStatus && (
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Status: {apiStatus}
        </p>
      )}

      {error && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}