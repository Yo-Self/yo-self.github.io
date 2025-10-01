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

export function useGeolocationSafariIOSFinal() {
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

  const checkPermissionStatus = useCallback(async (onPermissionChange?: (status: string) => void) => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setState(prev => ({
          ...prev,
          permissionStatus: permission.state
        }));
        onPermissionChange?.(permission.state);
        return permission.state;
      } catch (error) {
        console.log('Não foi possível verificar status da permissão:', error);
        return 'unknown';
      }
    }
    return 'unknown';
  }, []);

  const getCurrentPosition = useCallback(async (onLog?: (message: string) => void, onPermissionChange?: (status: string) => void): Promise<GeolocationPosition | null> => {
    const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    const isSafariIOS = typeof navigator !== 'undefined' && 
      /iPad|iPhone|iPod/.test(navigator.userAgent) && 
      /Safari/.test(navigator.userAgent) && 
      !/CriOS|FxiOS|OPiOS|mercury/.test(navigator.userAgent);
    
    const isSafariMacOS = typeof navigator !== 'undefined' && 
      /Macintosh/.test(navigator.userAgent) && 
      /Safari/.test(navigator.userAgent) && 
      !/Chrome/.test(navigator.userAgent);

    const log = (message: string) => {
      console.log(message);
      onLog?.(message);
    };

    log('🔍 === INÍCIO DO DEBUG ===');
    log(`📱 Navegador: ${navigator.userAgent}`);
    log(`📱 Safari iOS detectado: ${isSafariIOS}`);
    log(`📱 Safari macOS detectado: ${isSafariMacOS}`);
    log(`🔧 Geolocalização suportada: ${isSupported}`);
    log(`🔧 Navigator existe: ${typeof navigator !== 'undefined'}`);
    log(`🔧 Geolocation existe: ${typeof navigator !== 'undefined' && 'geolocation' in navigator}`);

    if (!isSupported) {
      log('❌ Geolocalização não suportada');
      setState(prev => ({
        ...prev,
        error: 'Geolocalização não é suportada neste navegador'
      }));
      return null;
    }

    // Verificar status da permissão primeiro
    const permissionStatus = await checkPermissionStatus(onPermissionChange);
    log(`🔐 Status da permissão: ${permissionStatus}`);
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      permissionStatus
    }));

    log('📍 === INICIANDO SOLICITAÇÃO DE GEOLOCALIZAÇÃO ===');

    try {
      let position: GeolocationPosition | null = null;

      // Estratégia 0: Double Request (para "acordar" o Safari)
      if (isSafariIOS) {
        log('📍 === ESTRATÉGIA 0: Double Request (Safari iOS) ===');
        try {
          position = await new Promise<GeolocationPosition>(async (resolve, reject) => {
            const initialOptions: PositionOptions = {
              enableHighAccuracy: false,
              timeout: 1000, // Timeout curto para "acordar"
              maximumAge: Infinity
            };

            log(`📍 Opções Iniciais: ${JSON.stringify(initialOptions)}`);

            navigator.geolocation.getCurrentPosition(
              () => {
                // Sucesso inesperado, mas ótimo. Tentar obter a real.
                log('✅ Estratégia 0: Sucesso inesperado na primeira chamada.');
                // A partir daqui, a ESTRATÉGIA 1 deve funcionar
                reject(new Error('Primeira chamada bem-sucedida, continue para a próxima estratégia.'));
              },
              async (err) => {
                log(`⚠️ Estratégia 0: Falha esperada na primeira chamada - ${err.message}. Tentando a segunda...`);
                
                // Agora a segunda chamada com mais chances
                const secondOptions: PositionOptions = {
                  enableHighAccuracy: true,
                  timeout: 15000,
                  maximumAge: 0
                };

                log(`📍 Opções da Segunda Chamada: ${JSON.stringify(secondOptions)}`);

                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    log('✅ Estratégia 0: Sucesso na segunda chamada!');
                    resolve({
                      latitude: pos.coords.latitude,
                      longitude: pos.coords.longitude,
                      accuracy: pos.coords.accuracy
                    });
                  },
                  (err) => {
                    log(`❌ Estratégia 0: Falhou na segunda chamada - ${err.message}`);
                    reject(err);
                  },
                  secondOptions
                );
              },
              initialOptions
            );
          });
        } catch (err) {
          log('❌ Estratégia 0 falhou, tentando estratégia 1...');
        }
      }

      // Estratégia 1: Configuração padrão
      if (!position) {
        log('📍 === ESTRATÉGIA 1: Configuração padrão ===');
        try {
          position = await new Promise<GeolocationPosition>((resolve, reject) => {
            const options: PositionOptions = {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0
            };

            log(`📍 Opções: ${JSON.stringify(options)}`);
            
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                log('✅ Estratégia 1: Sucesso!');
                resolve({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy
                });
              },
              (err) => {
                log(`❌ Estratégia 1: Falhou - ${err.message}`);
                reject(err);
              },
              options
            );
          });
        } catch (err) {
          log('❌ Estratégia 1 falhou, tentando estratégia 2...');
        }
      }

      // Estratégia 2: Configuração mínima (se estratégia 1 falhou)
      if (!position) {
        log('📍 === ESTRATÉGIA 2: Configuração mínima ===');
        try {
          position = await new Promise<GeolocationPosition>((resolve, reject) => {
            const options: PositionOptions = {
              enableHighAccuracy: false,
              timeout: 30000,
              maximumAge: 60000
            };

            log(`📍 Opções: ${JSON.stringify(options)}`);
            
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                log('✅ Estratégia 2: Sucesso!');
                resolve({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy
                });
              },
              (err) => {
                log(`❌ Estratégia 2: Falhou - ${err.message}`);
                reject(err);
              },
              options
            );
          });
        } catch (err) {
          log('❌ Estratégia 2 falhou, tentando estratégia 3...');
        }
      }

      // Estratégia 3: watchPosition como fallback (se outras falharam)
      if (!position) {
        log('📍 === ESTRATÉGIA 3: watchPosition fallback ===');
        try {
          position = await new Promise<GeolocationPosition>((resolve, reject) => {
            const options: PositionOptions = {
              enableHighAccuracy: false,
              timeout: 20000,
              maximumAge: 0
            };

            log(`📍 Opções: ${JSON.stringify(options)}`);
            log('📍 Usando watchPosition como fallback...');
            
            const watchId = navigator.geolocation.watchPosition(
              (pos) => {
                log('✅ Estratégia 3: Sucesso com watchPosition!');
                navigator.geolocation.clearWatch(watchId);
                resolve({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy
                });
              },
              (err) => {
                log(`❌ Estratégia 3: Falhou - ${err.message}`);
                navigator.geolocation.clearWatch(watchId);
                reject(err);
              },
              options
            );

            // Timeout para watchPosition
            setTimeout(() => {
              navigator.geolocation.clearWatch(watchId);
              reject(new Error('watchPosition timeout'));
            }, 20000);
          });
        } catch (err) {
          log('❌ Todas as estratégias falharam');
          throw err;
        }
      }

      log('✅ === POSIÇÃO OBTIDA ===');
      log(`✅ Posição retornada: ${JSON.stringify(position)}`);
      
      setState(prev => ({
        ...prev,
        position,
        isLoading: false,
        error: null
      }));

      return position;

    } catch (error: any) {
      log('❌ === CAPTURA DE ERRO ===');
      log(`❌ Erro capturado: ${JSON.stringify(error)}`);
      log(`❌ Tipo do erro: ${typeof error}`);
      log(`❌ Erro completo: ${JSON.stringify(error, null, 2)}`);
      
      let errorMessage = 'Erro ao obter localização';
      let isBlocked = false;
      
      if (error && error.code !== undefined) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            log('🚫 Tratando PERMISSION_DENIED');
            if (error.message && error.message.includes('User denied Geolocation')) {
              isBlocked = true;
              errorMessage = 'Permissão de localização foi bloqueada pelo navegador. Para resolver:\n\n1. Vá em Configurações → Safari → Localização\n2. Mude para \"Perguntar\" ou \"Permitir\"\n3. Recarregue a página\n\nOu acesse: Configurações → Privacidade e Segurança → Localização → Safari';
            } else if (error.message && error.message.includes('Origin does not have permission')) {
              isBlocked = true;
              errorMessage = '🚫 BLOQUEIO PROFUNDO DO SAFARI macOS DETECTADO\n\nEste é um bloqueio a nível do sistema operacional. Para resolver:\n\n🔧 SOLUÇÃO 1 - Configurações do Sistema:\n1. Configurações do Sistema → Privacidade e Segurança → Localização\n2. Certifique-se de que \"Safari\" está ATIVADO\n3. Se não estiver, clique em \"+\" e adicione o Safari\n\n🔧 SOLUÇÃO 2 - Reset das Permissões:\n1. Feche o Safari completamente (Cmd + Q)\n2. Abra o Terminal e execute: defaults delete com.apple.Safari\n3. Reabra o Safari\n\n🔧 SOLUÇÃO 3 - Teste em Modo Privado:\n1. Abra uma aba privada (Cmd + Shift + N)\n2. Teste a geolocalização\n\n🔧 SOLUÇÃO 4 - Verificar HTTPS:\nCertifique-se de que o site está em HTTPS ou localhost';
            } else {
              errorMessage = 'Permissão de localização negada. Se a caixa de diálogo de permissão não aparecer, tente atualizar a página e tentar novamente.';
            }
            break;
          case error.POSITION_UNAVAILABLE:
            log('📍 Tratando POSITION_UNAVAILABLE');
            errorMessage = 'Localização não disponível. Verifique se o GPS está ativado.';
            break;
          case error.TIMEOUT:
            log('⏰ Tratando TIMEOUT');
            errorMessage = 'Tempo limite para obter localização. Tente novamente.';
            break;
          default:
            log(`❓ Tratando erro desconhecido: ${error.code}`);
            errorMessage = `Erro desconhecido (código: ${error.code}): ${error.message || 'Erro ao obter localização'}`;
        }
      } else {
        log(`❓ Erro sem código definido: ${error}`);
        errorMessage = `Erro: ${error.message || 'Erro ao obter localização'}`;
      }

      log(`❌ Mensagem de erro final: ${errorMessage}`);
      log(`❌ Bloqueado: ${isBlocked}`);

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isBlocked
      }));
      
      return null;
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
