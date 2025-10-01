"use client";

import React, { useState } from 'react';
import { useGeolocationSafariIOSFinal } from '../hooks/useGeolocationSafariIOSFinal';

export default function GeolocationTest() {
  const { position, isLoading, error, getCurrentPosition, isSupported, isBlocked, isSafariIOS, permissionStatus, checkPermissionStatus } = useGeolocationSafariIOSFinal();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleTestGeolocation = async () => {
    addLog('🔄 Iniciando teste de geolocalização...');
    
    // Verificar suporte
    if (!isSupported) {
      addLog('❌ Geolocalização não suportada');
      return;
    }

    // Verificar status da permissão primeiro
    const currentStatus = await checkPermissionStatus();
    addLog(`🔍 Status atual da permissão: ${currentStatus}`);
    
    if (currentStatus === 'denied') {
      addLog('⚠️ Permissão negada - tentando mesmo assim...');
    } else if (currentStatus === 'granted') {
      addLog('✅ Permissão concedida - tentando obter localização...');
    } else {
      addLog('❓ Status desconhecido - tentando obter localização...');
    }
    
    addLog('📍 Solicitando localização...');
    
    // Adicionar logs detalhados na interface
    addLog('🔍 === INÍCIO DO DEBUG ===');
    addLog(`📱 Navegador: ${navigator.userAgent}`);
    addLog(`📱 Safari iOS detectado: ${isSafariIOS}`);
    addLog(`🔧 Geolocalização suportada: ${isSupported}`);
    addLog(`🔧 Navigator existe: ${typeof navigator !== 'undefined'}`);
    addLog(`🔧 Geolocation existe: ${typeof navigator !== 'undefined' && 'geolocation' in navigator}`);
    
    try {
      const result = await getCurrentPosition(addLog);
      
      // Verificar se a posição foi realmente obtida
      if (result) {
        addLog(`✅ Localização obtida com sucesso!`);
        addLog(`📍 Latitude: ${result.latitude}`);
        addLog(`📍 Longitude: ${result.longitude}`);
        addLog(`📍 Precisão: ${result.accuracy}m`);
      } else {
        addLog('⚠️ Hook retornou null - não foi possível obter localização');
        addLog('❌ Verifique os logs do console do navegador para mais detalhes');
      }
    } catch (error) {
      addLog(`❌ Erro ao obter localização: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teste de Geolocalização</h1>
      
      {/* Status */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Status Atual</h2>
        <div className="space-y-2">
          <p><strong>Suportado:</strong> {isSupported ? '✅ Sim' : '❌ Não'}</p>
          <p><strong>Carregando:</strong> {isLoading ? '🔄 Sim' : '⏹️ Não'}</p>
          <p><strong>Bloqueado:</strong> {isBlocked ? '🚫 Sim' : '✅ Não'}</p>
          <p><strong>Safari iOS:</strong> {isSafariIOS ? '🍎 Sim' : '❌ Não'}</p>
          <p><strong>Status Permissão:</strong> {permissionStatus || 'Desconhecido'}</p>
          <p><strong>Erro:</strong> {error ? `❌ ${error}` : '✅ Nenhum'}</p>
          {position && (
            <div>
              <p><strong>Localização:</strong></p>
              <p className="ml-4">Latitude: {position.latitude}</p>
              <p className="ml-4">Longitude: {position.longitude}</p>
              <p className="ml-4">Precisão: {position.accuracy}m</p>
            </div>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleTestGeolocation}
          disabled={isLoading || !isSupported}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '🔄 Testando...' : '📍 Testar Geolocalização'}
        </button>
        
        <button
          onClick={async () => {
            addLog('🔄 Tentando forçar prompt com interação do usuário...');
            // Primeiro, tentar uma chamada simples
            try {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  addLog('✅ Prompt funcionou! Localização obtida.');
                  addLog(`📍 Lat: ${pos.coords.latitude}, Lng: ${pos.coords.longitude}`);
                },
                (err) => {
                  addLog(`❌ Prompt falhou: ${err.message}`);
                },
                { enableHighAccuracy: false, timeout: 5000 }
              );
            } catch (error) {
              addLog(`❌ Erro ao tentar prompt: ${error}`);
            }
          }}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          🚀 Forçar Prompt
        </button>
        
        <button
          onClick={() => {
            addLog('🔧 === COMANDO PARA RESET DO SAFARI ===');
            addLog('Execute este comando no Terminal:');
            addLog('');
            addLog('defaults delete com.apple.Safari');
            addLog('');
            addLog('Depois:');
            addLog('1. Feche o Safari (Cmd + Q)');
            addLog('2. Reabra o Safari');
            addLog('3. Teste novamente');
            addLog('');
            addLog('💡 Ou copie e cole o comando abaixo:');
            addLog('defaults delete com.apple.Safari && open -a Safari');
          }}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          🔧 Reset Safari
        </button>
        
        <button
          onClick={async () => {
            addLog('Verificando status da permissão...');
            const status = await checkPermissionStatus();
            addLog(`Status da permissão: ${status}`);
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          🔍 Verificar Permissão
        </button>
        
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          🗑️ Limpar Logs
        </button>
      </div>

      {/* Logs */}
      <div className="bg-black text-green-400 rounded-lg p-4 font-mono text-sm">
        <h3 className="text-white font-semibold mb-2">Logs de Debug:</h3>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">Nenhum log ainda...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          )}
        </div>
      </div>

      {/* Instruções para Desbloqueio */}
      {isBlocked && (
        <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 dark:text-red-200 mb-3">
            🚫 Permissão Bloqueada - Como Resolver:
          </h3>
          <div className="text-sm text-red-700 dark:text-red-300 space-y-3">
            {isSafariIOS ? (
              <div>
                <p className="font-medium mb-2">🍎 Para Safari iOS:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Vá em Configurações → Safari → Localização</li>
                  <li>Mude para &quot;Perguntar&quot; ou &quot;Permitir&quot;</li>
                  <li>Recarregue a página</li>
                </ol>
                <div className="bg-blue-100 dark:bg-blue-800/30 p-3 rounded mt-3">
                  <p className="font-medium">💡 Alternativa:</p>
                  <p>Configurações → Privacidade e Segurança → Localização → Safari</p>
                </div>
              </div>
            ) : navigator.userAgent.includes('Macintosh') && navigator.userAgent.includes('Safari') ? (
              <div>
                <p className="font-medium mb-2">🖥️ Para Safari macOS:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Vá em Safari → Configurações (ou Safari → Preferências)</li>
                  <li>Clique na aba &quot;Websites&quot;</li>
                  <li>Encontre &quot;Localização&quot; na lista lateral</li>
                  <li>Mude para &quot;Perguntar&quot; ou &quot;Permitir&quot;</li>
                  <li>Recarregue a página</li>
                </ol>
                <div className="bg-blue-100 dark:bg-blue-800/30 p-3 rounded mt-3">
                  <p className="font-medium">💡 Alternativa:</p>
                  <p>Configurações → Privacidade e Segurança → Localização → Safari</p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-medium mb-2">Método 1 - Configurações do Site:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Clique no ícone 🔒 ao lado da URL</li>
                    <li>Vá em &quot;Configurações do site&quot;</li>
                    <li>Encontre &quot;Localização&quot; e mude para &quot;Perguntar&quot;</li>
                    <li>Recarregue a página</li>
                  </ol>
                </div>
                <div>
                  <p className="font-medium mb-2">Método 2 - Configurações do Chrome:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Chrome → Configurações</li>
                    <li>Privacidade e segurança → Configurações do site</li>
                    <li>Localização → Encontre seu site</li>
                    <li>Mude para &quot;Perguntar&quot;</li>
                  </ol>
                </div>
                <div className="bg-red-100 dark:bg-red-800/30 p-3 rounded">
                  <p className="font-medium">💡 Dica:</p>
                  <p>Em abas anônimas, o Chrome pode bloquear geolocalização por padrão. Tente em uma aba normal após desbloquear.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Instruções Gerais */}
      <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          📋 Instruções para Teste:
        </h3>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>1. Clique em &quot;Testar Geolocalização&quot;</li>
          <li>2. Observe se aparece o popup de permissão do navegador</li>
          <li>3. Se não aparecer, verifique as configurações do navegador</li>
          <li>4. Verifique os logs para entender o que está acontecendo</li>
        </ul>
      </div>
    </div>
  );
}
