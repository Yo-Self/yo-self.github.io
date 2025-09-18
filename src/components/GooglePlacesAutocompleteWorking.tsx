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

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = "Digite seu endereço completo",
  className = "",
  disabled = false
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const isGooglePlacesUpdateRef = useRef(false); // Flag para detectar updates do Google Places
  const lastInputValueRef = useRef<string>(''); // Para detectar mudanças drásticas no input
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para remover elementos problemáticos do Google Places
  const removeGoogleAttributionElements = useCallback(() => {
    // Função para remover elementos específicos
    const removeElements = () => {
      // Remover elementos de atribuição do Google
      const attributionSelectors = [
        'div[style*="position: fixed"][style*="z-index: 2147483647"]',
        'div[style*="position: fixed"][style*="z-index: 1000000"]',
        'div[style*="position: fixed"][style*="z-index: 1000001"]',
        'div[style*="position: fixed"][style*="z-index: 1000002"]',
        'div[style*="position: fixed"][style*="bottom: 0"]',
        'div[style*="position: fixed"][style*="right: 0"]',
        'a[href*="google.com/maps"]',
        'a[href*="maps.google.com"]',
        '.gm-style-cc',
        '.gmnoprint'
      ];

      attributionSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.style.display = 'none';
            element.style.visibility = 'hidden';
            element.style.opacity = '0';
            element.style.height = '0';
            element.style.width = '0';
            element.style.overflow = 'hidden';
          }
        });
      });

      // Remover elementos que podem aparecer após o pac-container
      const pacContainer = document.querySelector('.pac-container');
      if (pacContainer) {
        const siblings = pacContainer.parentElement?.children;
        if (siblings) {
          Array.from(siblings).forEach(sibling => {
            if (sibling !== pacContainer && sibling instanceof HTMLElement) {
              const style = sibling.style;
              if (style.position === 'fixed' || 
                  sibling.textContent?.includes('Google') ||
                  sibling.textContent?.includes('powered by')) {
                sibling.style.display = 'none';
                sibling.style.visibility = 'hidden';
                sibling.style.opacity = '0';
              }
            }
          });
        }
      }
    };

    // Executar imediatamente
    removeElements();

    // Executar periodicamente para capturar elementos que aparecem depois
    const interval = setInterval(removeElements, 100);

    // Limpar após 10 segundos
    setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Função para adicionar estilos do Google Places
  const addGooglePlacesStyles = useCallback(() => {
    const existingStyle = document.getElementById('google-places-custom-styles');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'google-places-custom-styles';
      style.textContent = `
        .pac-container {
          z-index: 999999 !important;
          position: absolute !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          border: 1px solid #e5e7eb !important;
          background: white !important;
          margin-top: 4px !important;
          font-family: inherit !important;
          max-height: 300px !important;
          overflow-y: auto !important;
          width: auto !important;
          min-width: 200px !important;
        }
        /* Esconder elementos de atribuição do Google que podem estar cobrindo a tela */
        .gm-style-cc,
        .gmnoprint,
        .gm-style-iw + div,
        div[style*="position: fixed"][style*="z-index: 1000"],
        div[style*="position: fixed"][style*="z-index: 1001"],
        /* Esconder elementos de atribuição específicos do Google Places */
        a[href*="google.com/maps"],
        a[href*="maps.google.com"],
        div[style*="position: fixed"][style*="bottom: 0"],
        div[style*="position: fixed"][style*="right: 0"],
        /* Esconder elementos que podem estar duplicando o "powered by Google" */
        .pac-container + div,
        .pac-container ~ div[style*="position: fixed"],
        /* Esconder TODOS os elementos de atribuição do Google que podem aparecer */
        div[style*="position: fixed"][style*="z-index: 2147483647"],
        div[style*="position: fixed"][style*="z-index: 1000000"],
        div[style*="position: fixed"][style*="z-index: 1000001"],
        div[style*="position: fixed"][style*="z-index: 1000002"],
        /* Esconder elementos específicos que podem conter "powered by Google" */
        div[style*="position: fixed"] a[href*="google.com"],
        div[style*="position: fixed"] a[href*="maps.google.com"],
        /* Esconder elementos que podem aparecer após seleção */
        .pac-container:after,
        .pac-container:before,
        /* Esconder elementos de copyright/atribuição */
        div[style*="font-size: 10px"],
        div[style*="font-size: 11px"],
        div[style*="font-size: 12px"][style*="position: fixed"],
        /* Esconder elementos que podem aparecer no final da lista */
        .pac-item:last-child + div,
        .pac-item:last-child ~ div {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
          overflow: hidden !important;
        }
        .pac-item {
          padding: 12px 16px !important;
          border-bottom: 1px solid #f3f4f6 !important;
          cursor: pointer !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          transition: background-color 0.15s ease !important;
          display: block !important;
          color: #333 !important;
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
    }
  }, []);

  // Função para detectar se houve uma seleção do Google Places (fallback quando place_changed não funciona)
  const detectGooglePlacesSelection = useCallback((currentValue: string) => {
    const lastValue = lastInputValueRef.current;
    
    // Se o valor mudou drasticamente, provavelmente foi seleção do Google Places
    if (lastValue && currentValue && currentValue.length > lastValue.length + 10) {
      // Verificar se parece com um endereço completo do Google Places
      const hasComma = currentValue.includes(',');
      const hasState = /\b[A-Z]{2}\b/.test(currentValue); // Estados como PB, SP, etc.
      const hasCity = currentValue.includes(' - ');
      const isMuchLonger = currentValue.length > lastValue.length * 1.5;
      
      if (hasComma && (hasState || hasCity) && isMuchLonger) {
        // Marcar que foi uma atualização do Google Places
        isGooglePlacesUpdateRef.current = true;
        
        // Resetar flag
        setTimeout(() => {
          isGooglePlacesUpdateRef.current = false;
        }, 1000);
        
        return true;
      }
    }
    
    return false;
  }, []);


  useEffect(() => {
    // Prevenir execução dupla em StrictMode
    if (isInitializedRef.current) {
      return;
    }

    let mounted = true;

    const initAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places?.Autocomplete) {
        return;
      }

      try {
        // Adicionar estilos
        addGooglePlacesStyles();

        // Limpar autocomplete anterior se existir
        if (autocompleteRef.current) {
          try {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          } catch (e) {
            // Ignorar erro ao limpar listeners
          }
          autocompleteRef.current = null;
        }

        // Criar novo autocomplete
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'br' },
          types: ['address'],
          fields: ['formatted_address', 'name', 'place_id']
        });

        autocompleteRef.current = autocomplete;

        // Event listener para seleção
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();

          if (place?.formatted_address) {
            const address = place.formatted_address;
            
            // Marcar que esta é uma atualização do Google Places
            isGooglePlacesUpdateRef.current = true;
            
            if (inputRef.current) {
              inputRef.current.value = address;
            }
            
            onChange(address);
            
            // Remover elementos problemáticos após seleção
            setTimeout(() => {
              removeGoogleAttributionElements();
            }, 500);
            
            // Resetar flag após um tempo
            setTimeout(() => {
              isGooglePlacesUpdateRef.current = false;
            }, 1000);
            
          } else if (place?.name) {
            // Marcar que esta é uma atualização do Google Places
            isGooglePlacesUpdateRef.current = true;
            
            const address = place.name;
            if (inputRef.current) {
              inputRef.current.value = address;
            }
            onChange(address);
            
            // Remover elementos problemáticos após seleção
            setTimeout(() => {
              removeGoogleAttributionElements();
            }, 500);
            
            // Resetar flag após um tempo
            setTimeout(() => {
              isGooglePlacesUpdateRef.current = false;
            }, 1000);
            
          } else {
          }
        });

        // MutationObserver para detectar mudanças programáticas no input
        const inputObserver = new MutationObserver((mutations) => {
          mutations.forEach(() => {
            if (inputRef.current) {
              const currentValue = inputRef.current.value;
              const lastValue = lastInputValueRef.current;
              
              if (currentValue !== lastValue && currentValue !== value) {
                // Verificar se é uma seleção do Google Places
                if (detectGooglePlacesSelection(currentValue)) {
                  onChange(currentValue);
                }
              }
            }
          });
        });
        
        if (inputRef.current) {
          inputObserver.observe(inputRef.current, {
            attributes: true,
            attributeFilter: ['value'],
            childList: false,
            subtree: false
          });
        }
        
        // Salvar observer para cleanup
        (autocompleteRef.current as any).inputObserver = inputObserver;

        // Múltiplos event listeners no input para detectar seleções
        const handleInputChange = () => {
          if (inputRef.current) {
            const currentValue = inputRef.current.value;
            
            // Atualizar referência do último valor
            setTimeout(() => {
              lastInputValueRef.current = currentValue;
            }, 100);
            
            // Verificar se é seleção do Google Places
            if (detectGooglePlacesSelection(currentValue)) {
              onChange(currentValue);
            }
          }
        };
        
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === 'Tab') {
            // Aguardar um pouco para o Google processar
            setTimeout(() => {
              if (inputRef.current) {
                const currentValue = inputRef.current.value;
                
                if (detectGooglePlacesSelection(currentValue)) {
                  onChange(currentValue);
                }
              }
            }, 150);
          }
        };
        
        // Adicionar event listeners
        inputRef.current.addEventListener('input', handleInputChange);
        inputRef.current.addEventListener('keydown', handleKeyDown);
        
        // Salvar funções para cleanup
        (autocompleteRef.current as any).cleanupInputListeners = () => {
          if (inputRef.current) {
            inputRef.current.removeEventListener('input', handleInputChange);
            inputRef.current.removeEventListener('keydown', handleKeyDown);
          }
          inputObserver.disconnect();
        };

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
            },
            (error) => {
              // Ignorar erro de geolocalização
            }
          );
        }

        setIsLoaded(true);
        setIsLoading(false);
        setError(null);

        // Remover elementos problemáticos do Google Places
        removeGoogleAttributionElements();

      } catch (err) {
        setError('Erro ao inicializar autocompletar');
      }
    };

    const loadGooglePlaces = () => {
      // Verificar se a API já está carregada
      if (window.google?.maps?.places?.Autocomplete) {
        isInitializedRef.current = true;
        setTimeout(() => {
          if (mounted) initAutocomplete();
        }, 100);
        return;
      }

      // Verificar se script já existe
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        setIsLoading(true);
        
        const checkAPI = setInterval(() => {
          if (window.google?.maps?.places?.Autocomplete) {
            clearInterval(checkAPI);
            if (mounted) {
              isInitializedRef.current = true;
              setIsLoading(false);
              setTimeout(() => {
                if (mounted) initAutocomplete();
              }, 100);
            }
          }
        }, 500);
        
        // Cleanup do interval se unmount
        return () => clearInterval(checkAPI);
      }

      // Verificar API key
      if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        setError('API key não configurada');
        isInitializedRef.current = true;
        return;
      }

      setIsLoading(true);
      
      // Criar callback único para esta instância
      const callbackName = `initGooglePlaces_${Date.now()}`;
      
      (window as any)[callbackName] = () => {
        if (mounted) {
          isInitializedRef.current = true;
          setIsLoading(false);
          setTimeout(() => {
            if (mounted) initAutocomplete();
          }, 100);
        }
        delete (window as any)[callbackName];
      };
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=${callbackName}&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onerror = () => {
        if (mounted) {
          setError('Erro ao carregar API');
          setIsLoading(false);
          isInitializedRef.current = true;
        }
        delete (window as any)[callbackName];
      };
      
      document.head.appendChild(script);
    };

    loadGooglePlaces();

    // Timeout de segurança
    const safetyTimeout = setTimeout(() => {
      if (!inputRef.current && mounted) {
        setError('Timeout ao inicializar');
      }
    }, 10000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      if (autocompleteRef.current && window.google?.maps?.event) {
        try {
          // Limpar listeners do Google Places
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          
          // Limpar event listener de clique se existir
          if ((autocompleteRef.current as any).cleanupClickListener) {
            (autocompleteRef.current as any).cleanupClickListener();
          }
          
          // Limpar input listeners se existir
          if ((autocompleteRef.current as any).cleanupInputListeners) {
            (autocompleteRef.current as any).cleanupInputListeners();
          }
        } catch (e) {
          // Ignorar erro ao limpar listeners
        }
      }
    };
  }, []); // Remover dependência para evitar cleanup prematuro

  // Sincronizar valor
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value || '';
    }
  }, [value]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        disabled={disabled || isLoading}
        onChange={(e) => {
          const inputValue = e.target.value;
          
          // Detectar se é atualização do Google Places ou digitação manual
          if (isGooglePlacesUpdateRef.current) {
            return; // Não processar onChange manual se é do Google Places
          }
          
          // Atualizar referência do último valor para comparação futura
          lastInputValueRef.current = inputValue;
          
          onChange(inputValue);
          
          if (inputValue.trim() === '') {
          } else if (inputValue.length >= 3) {
          }
        }}
        onFocus={() => {
        }}
        onBlur={() => {
          // Input perdeu foco
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
          ${className}
          ${disabled || isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
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

      {error && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}