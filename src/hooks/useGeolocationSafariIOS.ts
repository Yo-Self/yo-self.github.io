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
  isSafariIOS?: boolean;
}

export function useGeolocationSafariIOS() {
  const [state, setState] = useState<GeolocationState>(() => ({
    position: null,
    isLoading: false,
    error: null,
    isSupported: false, // Sempre false no servidor
    isSafariIOS: false, // Sempre false no servidor
    isBlocked: false
  }));

  // Detectar navegador apenas no cliente
  React.useEffect(() => {
    const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    const isSafariIOS = typeof navigator !== 'undefined' && 
      /iPad|iPhone|iPod/.test(navigator.userAgent) && 
      /Safari/.test(navigator.userAgent) && 
      !/CriOS|FxiOS|OPiOS|mercury/.test(navigator.userAgent);

    setState(prev => ({
      ...prev,
      isSupported,
      isSafariIOS
    }));
  }, []);

  const getCurrentPosition = useCallback(async () => {
    const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    const isSafariIOS = typeof navigator !== 'undefined' && 
      /iPad|iPhone|iPod/.test(navigator.userAgent) && 
      /Safari/.test(navigator.userAgent) && 
      !/CriOS|FxiOS|OPiOS|mercury/.test(navigator.userAgent);

    if (!isSupported) {
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

    // Para Safari iOS, usar uma abordagem mais direta
    if (isSafariIOS) {
      try {
        // Primeira tentativa: configurações específicas para Safari iOS
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy
              });
            },
            (err) => {
              reject(err);
            },
            {
              enableHighAccuracy: true,
              timeout: 20000, // Timeout maior para iOS
              maximumAge: 0
            }
          );
        });

        setState(prev => ({
          ...prev,
          position,
          isLoading: false,
          error: null
        }));

      } catch (error: any) {
        // Segunda tentativa: configurações mais permissivas
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                resolve({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy
                });
              },
              (err) => {
                reject(err);
              },
              {
                enableHighAccuracy: false,
                timeout: 30000, // Timeout ainda maior
                maximumAge: 60000 // Permitir cache de 1 minuto
              }
            );
          });

          setState(prev => ({
            ...prev,
            position,
            isLoading: false,
            error: null
          }));

        } catch (error2: any) {
          // Terceira tentativa: usar watchPosition como fallback
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                  navigator.geolocation.clearWatch(watchId);
                  resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy
                  });
                },
                (err) => {
                  navigator.geolocation.clearWatch(watchId);
                  reject(err);
                },
                {
                  enableHighAccuracy: true,
                  timeout: 15000,
                  maximumAge: 0
                }
              );

              // Timeout manual
              setTimeout(() => {
                navigator.geolocation.clearWatch(watchId);
                reject(new Error('Timeout'));
              }, 15000);
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
                if (error3.message && error3.message.includes('User denied Geolocation')) {
                  isBlocked = true;
                  errorMessage = 'Permissão de localização foi bloqueada pelo navegador. Para resolver:\n\n1. Vá em Configurações > Safari > Localização\n2. Mude para "Perguntar" ou "Permitir"\n3. Recarregue a página\n\nOu acesse: Configurações > Privacidade e Segurança > Localização > Safari';
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
              isBlocked
            }));
          }
        }
      }
    } else {
      // Para outros navegadores, usar a lógica padrão
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy
              });
            },
            (err) => {
              reject(err);
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0
            }
          );
        });

        setState(prev => ({
          ...prev,
          position,
          isLoading: false,
          error: null
        }));

      } catch (error: any) {
        let errorMessage = 'Erro ao obter localização';
        let isBlocked = false;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            if (error.message && error.message.includes('User denied Geolocation')) {
              isBlocked = true;
              errorMessage = 'Permissão de localização foi bloqueada pelo navegador. Para resolver:\n\n1. Clique no ícone 🔒 ao lado da URL\n2. Vá em "Configurações do site"\n3. Encontre "Localização" e mude para "Perguntar"\n4. Recarregue a página';
            } else {
              errorMessage = 'Permissão de localização negada. Por favor, permita o acesso à localização nas configurações do navegador.';
            }
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
          error: errorMessage,
          isBlocked
        }));
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
