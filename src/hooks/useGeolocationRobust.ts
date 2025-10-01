"use client";

import React, { useState, useCallback } from 'react';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeolocationState {
  position: GeolocationPosition | null;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
  isBlocked?: boolean;
}

export function useGeolocationRobust() {
  const [state, setState] = useState<GeolocationState>(() => ({
    position: null,
    isLoading: false,
    error: null,
    isSupported: false, // Sempre false no servidor
    isBlocked: false
  }));

  // Detectar navegador apenas no cliente
  React.useEffect(() => {
    const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    
    setState(prev => ({
      ...prev,
      isSupported
    }));
  }, []);

  const getCurrentPosition = useCallback(async () => {
    // Verificar suporte
    const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    
    if (!isSupported) {
      console.log('❌ Geolocalização não suportada');
      setState(prev => ({
        ...prev,
        error: 'Geolocalização não é suportada neste navegador'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    // Tentar diferentes abordagens para solicitar permissão
    const tryGetPosition = (options: PositionOptions = {}) => {
      return new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
            resolve(coords);
          },
          (error) => {
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
            ...options
          }
        );
      });
    };

    try {
      // Primeira tentativa: configurações padrão
      const position = await tryGetPosition();
      
      setState(prev => ({
        ...prev,
        position,
        isLoading: false,
        error: null
      }));

    } catch (error: any) {
      try {
        // Segunda tentativa: timeout menor
        const position = await tryGetPosition({ timeout: 5000 });
        
        setState(prev => ({
          ...prev,
          position,
          isLoading: false,
          error: null
        }));

      } catch (error2: any) {
        try {
          // Terceira tentativa: precisão baixa
          const position = await tryGetPosition({ 
            enableHighAccuracy: false, 
            timeout: 10000 
          });
          
          setState(prev => ({
            ...prev,
            position,
            isLoading: false,
            error: null
          }));

        } catch (error3: any) {
          // Todas as tentativas falharam
          
          let errorMessage = 'Erro ao obter localização';
          let isBlocked = false;
          
          switch (error3.code) {
            case error3.PERMISSION_DENIED:
              // Verificar se é bloqueio permanente do Chrome
              if (error3.message && error3.message.includes('User denied Geolocation')) {
                isBlocked = true;
                errorMessage = 'Permissão de localização foi bloqueada pelo navegador. Para resolver:\n\n1. Clique no ícone 🔒 ao lado da URL\n2. Vá em "Configurações do site"\n3. Encontre "Localização" e mude para "Perguntar"\n4. Recarregue a página\n\nOu acesse: Chrome → Configurações → Privacidade → Configurações do site → Localização';
              } else {
                errorMessage = 'Permissão de localização negada. Por favor, permita o acesso à localização nas configurações do navegador.';
              }
              break;
            case error3.POSITION_UNAVAILABLE:
              errorMessage = 'Localização não disponível. Verifique se o GPS está ativado.';
              break;
            case error3.TIMEOUT:
              errorMessage = 'Tempo limite para obter localização. Tente novamente.';
              break;
          }

          setState(prev => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
            isBlocked // Adicionar flag para identificar bloqueio
          }));
        }
      }
    }
  }, []);

  const clearPosition = useCallback(() => {
    setState(prev => ({
      ...prev,
      position: null,
      error: null
    }));
  }, []);

  return {
    ...state,
    getCurrentPosition,
    clearPosition
  };
}
