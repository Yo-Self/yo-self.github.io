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
  const autocompleteElementRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para adicionar estilos personalizados
  const addCustomStyles = useCallback(() => {
    const existingStyle = document.getElementById('google-places-modern-styles');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'google-places-modern-styles';
      style.textContent = `
        /* Estilos para o PlaceAutocompleteElement */
        gmp-place-autocomplete {
          display: block !important;
          width: 100% !important;
          --gmpx-color-surface: white !important;
          --gmpx-color-outline: #e5e7eb !important;
          --gmpx-color-outline-variant: #d1d5db !important;
          --gmpx-color-primary: #3b82f6 !important;
          --gmpx-color-on-surface: #111827 !important;
          --gmpx-color-on-surface-variant: #6b7280 !important;
          --gmpx-font-family-headings: inherit !important;
          --gmpx-font-family-body: inherit !important;
          --gmpx-font-size-base: 14px !important;
          --gmpx-font-weight-normal: 400 !important;
          --gmpx-font-weight-medium: 500 !important;
          --gmpx-font-weight-bold: 600 !important;
          --gmpx-radius-s: 6px !important;
          --gmpx-radius-m: 8px !important;
          --gmpx-radius-l: 12px !important;
          --gmpx-spacing-xs: 4px !important;
          --gmpx-spacing-s: 8px !important;
          --gmpx-spacing-m: 12px !important;
          --gmpx-spacing-l: 16px !important;
          --gmpx-spacing-xl: 20px !important;
          --gmpx-spacing-2xl: 24px !important;
          --gmpx-spacing-3xl: 32px !important;
          --gmpx-spacing-4xl: 40px !important;
          --gmpx-spacing-5xl: 48px !important;
          --gmpx-spacing-6xl: 64px !important;
          --gmpx-spacing-7xl: 80px !important;
          --gmpx-spacing-8xl: 96px !important;
          --gmpx-spacing-9xl: 128px !important;
          --gmpx-spacing-10xl: 160px !important;
          --gmpx-spacing-11xl: 192px !important;
          --gmpx-spacing-12xl: 224px !important;
          --gmpx-spacing-13xl: 256px !important;
          --gmpx-spacing-14xl: 288px !important;
          --gmpx-spacing-15xl: 320px !important;
          --gmpx-spacing-16xl: 352px !important;
          --gmpx-spacing-17xl: 384px !important;
          --gmpx-spacing-18xl: 416px !important;
          --gmpx-spacing-19xl: 448px !important;
          --gmpx-spacing-20xl: 480px !important;
          --gmpx-spacing-21xl: 512px !important;
          --gmpx-spacing-22xl: 544px !important;
          --gmpx-spacing-23xl: 576px !important;
          --gmpx-spacing-24xl: 608px !important;
          --gmpx-spacing-25xl: 640px !important;
          --gmpx-spacing-26xl: 672px !important;
          --gmpx-spacing-27xl: 704px !important;
          --gmpx-spacing-28xl: 736px !important;
          --gmpx-spacing-29xl: 768px !important;
          --gmpx-spacing-30xl: 800px !important;
          --gmpx-spacing-31xl: 832px !important;
          --gmpx-spacing-32xl: 864px !important;
          --gmpx-spacing-33xl: 896px !important;
          --gmpx-spacing-34xl: 928px !important;
          --gmpx-spacing-35xl: 960px !important;
          --gmpx-spacing-36xl: 992px !important;
          --gmpx-spacing-37xl: 1024px !important;
          --gmpx-spacing-38xl: 1056px !important;
          --gmpx-spacing-39xl: 1088px !important;
          --gmpx-spacing-40xl: 1120px !important;
          --gmpx-spacing-41xl: 1152px !important;
          --gmpx-spacing-42xl: 1184px !important;
          --gmpx-spacing-43xl: 1216px !important;
          --gmpx-spacing-44xl: 1248px !important;
          --gmpx-spacing-45xl: 1280px !important;
          --gmpx-spacing-46xl: 1312px !important;
          --gmpx-spacing-47xl: 1344px !important;
          --gmpx-spacing-48xl: 1376px !important;
          --gmpx-spacing-49xl: 1408px !important;
          --gmpx-spacing-50xl: 1440px !important;
        }
        
        /* Garantir que o elemento fique dentro do container */
        .google-places-container {
          position: relative !important;
          width: 100% !important;
        }
        
        /* Estilos para elementos de atribuição dentro do componente */
        gmp-place-autocomplete gmp-place-attribution {
          display: block !important;
          position: relative !important;
          margin-top: 4px !important;
          padding: 4px 8px !important;
          background: #f9fafb !important;
          border-top: 1px solid #e5e7eb !important;
          font-size: 10px !important;
          color: #6b7280 !important;
          text-align: center !important;
        }
        
        /* Esconder elementos de atribuição que aparecem fora do componente */
        div:not(.google-places-container) gmp-place-attribution,
        div:not(.google-places-container) *[class*="attribution"],
        div:not(.google-places-container) *[class*="powered"] {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    // Prevenir execução dupla em StrictMode
    if (isInitializedRef.current) {
      return;
    }

    let mounted = true;

    const initAutocomplete = () => {
      if (!containerRef.current || !window.google?.maps?.places?.PlaceAutocompleteElement) {
        return;
      }

      try {
        // Adicionar estilos
        addCustomStyles();

        // Limpar elemento anterior se existir
        if (autocompleteElementRef.current) {
          containerRef.current.innerHTML = '';
          autocompleteElementRef.current = null;
        }

        // Criar o elemento PlaceAutocompleteElement
        const autocompleteElement = document.createElement('gmp-place-autocomplete');
        
        // Configurar o elemento
        autocompleteElement.setAttribute('placeholder', placeholder);
        if (disabled) {
          autocompleteElement.setAttribute('disabled', 'true');
        } else {
          autocompleteElement.removeAttribute('disabled');
        }
        
        // Adicionar ao container
        containerRef.current.appendChild(autocompleteElement);
        autocompleteElementRef.current = autocompleteElement;

        // Event listener para mudanças
        autocompleteElement.addEventListener('gmp-placeselect', (event: any) => {
          console.log('gmp-placeselect event:', event);
          const place = event.detail?.place;
          if (place?.formattedAddress) {
            console.log('Endereço selecionado:', place.formattedAddress);
            onChange(place.formattedAddress);
          } else if (place?.displayName) {
            console.log('Endereço selecionado (displayName):', place.displayName);
            onChange(place.displayName);
          }
        });

        // Event listener para mudanças no input
        autocompleteElement.addEventListener('input', (event: any) => {
          console.log('Input event:', event);
          const value = event.target?.value || event.detail?.value;
          if (value !== undefined) {
            console.log('Input mudou:', value);
            onChange(value);
          }
        });

        // Event listener adicional para detectar seleção de sugestões
        autocompleteElement.addEventListener('change', (event: any) => {
          console.log('Change event:', event);
          const value = event.target?.value || event.detail?.value;
          if (value && value.trim() !== '') {
            console.log('Change event value:', value);
            onChange(value);
          }
        });

        // Event listener para quando uma sugestão é clicada/selecionada
        autocompleteElement.addEventListener('gmp-placechange', (event: any) => {
          console.log('gmp-placechange event:', event);
          const place = event.detail?.place;
          if (place?.formattedAddress) {
            console.log('Place change formattedAddress:', place.formattedAddress);
            onChange(place.formattedAddress);
          } else if (place?.displayName) {
            console.log('Place change displayName:', place.displayName);
            onChange(place.displayName);
          }
        });

        // Event listener para detectar quando uma sugestão é clicada
        autocompleteElement.addEventListener('click', (event: any) => {
          console.log('Click event:', event);
        });

        // Event listener para detectar quando uma sugestão é selecionada via teclado
        autocompleteElement.addEventListener('keydown', (event: any) => {
          if (event.key === 'Enter' || event.key === 'Tab') {
            console.log('Keydown event:', event.key, event.target.value);
            setTimeout(() => {
              const currentValue = autocompleteElement.getAttribute('value') || (autocompleteElement as HTMLInputElement).value;
              if (currentValue) {
                console.log('Valor após Enter/Tab:', currentValue);
                onChange(currentValue);
              }
            }, 100);
          }
        });

        // Definir valor inicial
        if (value) {
          autocompleteElement.setAttribute('value', value);
        }

        // MutationObserver para detectar mudanças no valor do input interno
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
              const newValue = autocompleteElement.getAttribute('value');
              if (newValue && newValue !== value) {
                console.log('Valor detectado via MutationObserver:', newValue);
                onChange(newValue);
              }
            }
            
            // Detectar mudanças em elementos filhos (input interno)
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as Element;
                  if (element.tagName === 'INPUT' || element.querySelector('input')) {
                    const input = element.tagName === 'INPUT' ? element : element.querySelector('input');
                    if (input) {
                      input.addEventListener('input', (e: any) => {
                        console.log('Input interno detectado:', e.target.value);
                        onChange(e.target.value);
                      });
                      input.addEventListener('change', (e: any) => {
                        console.log('Change interno detectado:', e.target.value);
                        onChange(e.target.value);
                      });
                    }
                  }
                }
              });
            }
          });
        });

        observer.observe(autocompleteElement, {
          attributes: true,
          childList: true,
          subtree: true,
          attributeFilter: ['value']
        });

        // Salvar observer para cleanup
        (autocompleteElement as any).observer = observer;

        setIsLoaded(true);
        setIsLoading(false);
        setError(null);

      } catch (err) {
        console.error('Erro ao inicializar PlaceAutocompleteElement:', err);
        setError('Erro ao inicializar autocompletar');
      }
    };

    const loadGooglePlaces = () => {
      // Verificar se a API já está carregada
      if (window.google?.maps?.places?.PlaceAutocompleteElement) {
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
          if (window.google?.maps?.places?.PlaceAutocompleteElement) {
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
      const callbackName = `initGooglePlacesModern_${Date.now()}`;
      
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
      if (!containerRef.current && mounted) {
        setError('Timeout ao inicializar');
      }
    }, 10000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      if (autocompleteElementRef.current) {
        try {
          // Limpar event listeners se necessário
          autocompleteElementRef.current.removeEventListener('gmp-placeselect', () => {});
          autocompleteElementRef.current.removeEventListener('input', () => {});
          autocompleteElementRef.current.removeEventListener('change', () => {});
          autocompleteElementRef.current.removeEventListener('gmp-placechange', () => {});
          autocompleteElementRef.current.removeEventListener('click', () => {});
          autocompleteElementRef.current.removeEventListener('keydown', () => {});
          
          // Limpar observer se existir
          if ((autocompleteElementRef.current as any).observer) {
            (autocompleteElementRef.current as any).observer.disconnect();
          }
        } catch (e) {
          // Ignorar erro ao limpar listeners
        }
      }
    };
  }, []);

  // Sincronizar valor
  useEffect(() => {
    if (autocompleteElementRef.current && value !== undefined) {
      autocompleteElementRef.current.setAttribute('value', value);
    }
  }, [value]);

  // Verificar mudanças no valor periodicamente
  useEffect(() => {
    if (!autocompleteElementRef.current) return;

    const checkValue = () => {
      if (autocompleteElementRef.current) {
        // Tentar diferentes formas de obter o valor
        const currentValue = autocompleteElementRef.current.getAttribute('value') || 
                           autocompleteElementRef.current.value || 
                           (autocompleteElementRef.current as any).input?.value || '';
        
        if (currentValue && currentValue.trim() !== '' && currentValue !== value) {
          console.log('Valor detectado via polling:', currentValue);
          onChange(currentValue);
        }
      }
    };

    const interval = setInterval(checkValue, 500);
    
    return () => clearInterval(interval);
  }, [value, onChange]);

  return (
    <div className={`google-places-container ${className}`}>
      <div 
        ref={containerRef}
        className={`
          w-full
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