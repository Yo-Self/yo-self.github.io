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

  // Função para conter elementos "powered by Google" dentro da caixa de entrada
  const containGoogleAttribution = useCallback(() => {
    // Função para mover elementos "powered by Google" para dentro do pac-container
    const containAttributionElements = () => {
      try {
        // Encontrar o pac-container
        const pacContainer = document.querySelector('.pac-container');
        
        if (pacContainer) {
          // Encontrar elementos "powered by Google" que estão fora do pac-container
          const allElements = document.querySelectorAll('*');
          allElements.forEach(element => {
            if (element instanceof HTMLElement) {
              const text = element.textContent || element.innerText || '';
              
              // Se contém "powered by Google" e não está dentro do pac-container
              if (text.includes('powered by Google') && 
                  text.length < 100 && 
                  !pacContainer.contains(element)) {
                
                // Mover o elemento para dentro do pac-container
                try {
                  pacContainer.appendChild(element);
                  
                  // Aplicar estilo discreto
                  element.style.display = 'block';
                  element.style.visibility = 'visible';
                  element.style.opacity = '0.6';
                  element.style.fontSize = '10px';
                  element.style.color = '#6b7280';
                  element.style.textAlign = 'center';
                  element.style.padding = '4px 8px';
                  element.style.borderTop = '1px solid #e5e7eb';
                  element.style.background = '#f9fafb';
                  element.style.margin = '0';
                  element.style.position = 'relative';
                  element.style.left = 'auto';
                  element.style.top = 'auto';
                  element.style.height = 'auto';
                  element.style.width = 'auto';
                  element.style.overflow = 'visible';
                  element.style.pointerEvents = 'auto';
                  element.style.userSelect = 'auto';
                  element.style.zIndex = 'auto';
                } catch (e) {
                  // Se não conseguir mover, pelo menos esconder
                  element.style.display = 'none';
                  element.style.visibility = 'hidden';
                  element.style.opacity = '0';
                }
              }
            }
          });
        } else {
          // Se não há pac-container, esconder elementos soltos
          const allElements = document.querySelectorAll('*');
          allElements.forEach(element => {
            if (element instanceof HTMLElement) {
              const text = element.textContent || element.innerText || '';
              if (text.includes('powered by Google') && text.length < 100) {
                element.style.display = 'none';
                element.style.visibility = 'hidden';
                element.style.opacity = '0';
              }
            }
          });
        }
      } catch (e) {
        // Ignorar erros
      }
    };

    // Executar imediatamente
    containAttributionElements();

    // MutationObserver para detectar novos elementos
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const text = node.textContent || node.innerText || '';
            
            // Se contém "powered by Google" e não está dentro do pac-container
            if (text.includes('powered by Google') && text.length < 100) {
              const pacContainer = document.querySelector('.pac-container');
              
              if (pacContainer && !pacContainer.contains(node)) {
                // Mover para dentro do pac-container
                try {
                  pacContainer.appendChild(node);
                  
                  // Aplicar estilo discreto
                  node.style.display = 'block';
                  node.style.visibility = 'visible';
                  node.style.opacity = '0.6';
                  node.style.fontSize = '10px';
                  node.style.color = '#6b7280';
                  node.style.textAlign = 'center';
                  node.style.padding = '4px 8px';
                  node.style.borderTop = '1px solid #e5e7eb';
                  node.style.background = '#f9fafb';
                  node.style.margin = '0';
                  node.style.position = 'relative';
                  node.style.left = 'auto';
                  node.style.top = 'auto';
                  node.style.height = 'auto';
                  node.style.width = 'auto';
                  node.style.overflow = 'visible';
                  node.style.pointerEvents = 'auto';
                  node.style.userSelect = 'auto';
                  node.style.zIndex = 'auto';
                } catch (e) {
                  // Se não conseguir mover, esconder
                  node.style.display = 'none';
                  node.style.visibility = 'hidden';
                  node.style.opacity = '0';
                }
              }
            }
          }
        });
      });
    });

    // Observar mudanças no documento
    try {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } catch (e) {
      // Ignorar erro de observação
    }

    // Executar periodicamente
    const interval = setInterval(containAttributionElements, 500);

    // Limpar após 20 segundos
    setTimeout(() => {
      clearInterval(interval);
      observer.disconnect();
    }, 20000);

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
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
          /* Garantir que o container fique dentro da área do input */
          max-width: 100% !important;
          left: 0 !important;
          right: 0 !important;
        }
        
        /* CONTER o elemento "powered by Google" dentro da caixa de entrada */
        .pac-container * {
          /* Permitir que elementos dentro do pac-container sejam visíveis */
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative !important;
          left: auto !important;
          top: auto !important;
          height: auto !important;
          width: auto !important;
          overflow: visible !important;
          pointer-events: auto !important;
          user-select: auto !important;
          z-index: auto !important;
        }
        
        /* Especificamente para elementos "powered by Google" dentro do pac-container */
        .pac-container div:contains("powered by Google"),
        .pac-container span:contains("powered by Google"),
        .pac-container a:contains("powered by Google") {
          /* Manter dentro do container, mas com estilo discreto */
          display: block !important;
          visibility: visible !important;
          opacity: 0.6 !important;
          font-size: 10px !important;
          color: #6b7280 !important;
          text-align: center !important;
          padding: 4px 8px !important;
          border-top: 1px solid #e5e7eb !important;
          background: #f9fafb !important;
          margin: 0 !important;
          position: relative !important;
          left: auto !important;
          top: auto !important;
          height: auto !important;
          width: auto !important;
          overflow: visible !important;
          pointer-events: auto !important;
          user-select: auto !important;
          z-index: auto !important;
        }
        
        /* Esconder TODOS os elementos "powered by Google" que estão FORA do pac-container */
        div:not(.pac-container) *:contains("powered by Google"),
        span:not(.pac-container) *:contains("powered by Google"),
        a:not(.pac-container) *:contains("powered by Google"),
        /* Elementos com z-index alto que estão fora do pac-container */
        div[style*="position: fixed"][style*="z-index: 2147483647"]:not(.pac-container),
        div[style*="position: fixed"][style*="z-index: 1000000"]:not(.pac-container),
        div[style*="position: fixed"][style*="z-index: 1000001"]:not(.pac-container),
        /* Links específicos do Google Maps fora do pac-container */
        a[href*="google.com/maps"]:not(.pac-container),
        a[href*="maps.google.com"]:not(.pac-container),
        /* Classes específicas do Google Maps fora do pac-container */
        .gm-style-cc:not(.pac-container),
        .gmnoprint:not(.pac-container) {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
          overflow: hidden !important;
          position: absolute !important;
          left: -9999px !important;
          top: -9999px !important;
          pointer-events: none !important;
          user-select: none !important;
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
              containGoogleAttribution();
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
              containGoogleAttribution();
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
        containGoogleAttribution();

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