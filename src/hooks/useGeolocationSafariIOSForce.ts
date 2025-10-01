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
  permissionStatus?: string;
}

export function useGeolocationSafariIOSForce() {
  const [state, setState] = useState<GeolocationState>(() => ({
    position: null,
    isLoading: false,
    error: null,
    isSupported: false, // Sempre false no servidor
    isSafariIOS: false, // Sempre false no servidor
    permissionStatus: 'unknown'
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

  const checkPermissionStatus = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setState(prev => ({
          ...prev,
          permissionStatus: permission.state
        }));
        return permission.state;
      } catch (error) {
        console.log('Não foi possível verificar status da permissão:', error);
        return 'unknown';
      }
    }
    return 'unknown';
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

    // Verificar status da permissão primeiro
    const permissionStatus = await checkPermissionStatus();
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      permissionStatus
    }));

    // Para Safari iOS, usar abordagem mais agressiva
    if (isSafariIOS) {
      try {
        // Primeira tentativa: Forçar prompt com configurações específicas
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          // Usar uma abordagem mais direta para forçar o prompt
          const options: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 30000, // Timeout muito longo para dar tempo
            maximumAge: 0 // Sempre buscar nova localização
          };

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
            options
          );
        });

        setState(prev => ({
          ...prev,
          position,
          isLoading: false,
          error: null
        }));

      } catch (error: any) {
        // Segunda tentativa: Usar watchPosition para forçar prompt
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            let watchId: number;
            let timeoutId: NodeJS.Timeout;

            const cleanup = () => {
              if (watchId) navigator.geolocation.clearWatch(watchId);
              if (timeoutId) clearTimeout(timeoutId);
            };

            watchId = navigator.geolocation.watchPosition(
              (pos) => {
                cleanup();
                resolve({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy
                });
              },
              (err) => {
                cleanup();
                reject(err);
              },
              {
                enableHighAccuracy: true,
                timeout: 25000,
                maximumAge: 0
              }
            );

            // Timeout manual
            timeoutId = setTimeout(() => {
              cleanup();
              reject(new Error('Timeout'));
            }, 25000);
          });

          setState(prev => ({
            ...prev,
            position,
            isLoading: false,
            error: null
          }));

        } catch (error2: any) {
          // Terceira tentativa: Configurações mais permissivas
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
                  timeout: 40000, // Timeout ainda maior
                  maximumAge: 300000 // Permitir cache de 5 minutos
                }
              );
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
                  errorMessage = 'Permissão de localização foi bloqueada pelo navegador. Para resolver:\n\n1. Vá em Configurações → Safari → Localização\n2. Mude para "Perguntar" ou "Permitir"\n3. Recarregue a página\n\nOu acesse: Configurações → Privacidade e Segurança → Localização → Safari';
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
  }, [checkPermissionStatus]);

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
    clearPosition,
    checkPermissionStatus
  };
}
