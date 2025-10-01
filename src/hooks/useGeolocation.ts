"use client";

import { useState, useCallback, useEffect } from 'react';

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
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>(() => ({
    position: null,
    isLoading: false,
    error: null,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator
  }));

  const getCurrentPosition = useCallback(async () => {
    // Verificar suporte novamente no momento da chamada
    const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    
    if (!isSupported) {
      console.log('❌ Geolocalização não suportada');
      setState(prev => ({
        ...prev,
        error: 'Geolocalização não é suportada neste navegador'
      }));
      return;
    }

    console.log('📍 Solicitando permissão de localização...');
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    // Tentar obter localização diretamente, sem verificar permissão prévia
    // A API de permissões pode não funcionar corretamente em todos os navegadores/modos
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Localização obtida com sucesso:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });

        setState(prev => ({
          ...prev,
          position: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          },
          isLoading: false,
          error: null
        }));
      },
      (error) => {
        console.error('❌ Erro ao obter localização:', error);
        
        let errorMessage = 'Erro ao obter localização';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada. Por favor, permita o acesso à localização nas configurações do navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Localização não disponível. Verifique se o GPS está ativado.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tempo limite para obter localização. Tente novamente.';
            break;
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, []); // Removida dependência problemática

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
