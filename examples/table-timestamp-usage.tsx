/**
 * Exemplos de Uso do Timestamp de Mesa
 * 
 * Este arquivo demonstra como usar a funcionalidade de timestamp
 * do QR Code de mesa em diferentes cenários.
 */

import { useState, useEffect } from 'react';
import { getTableId, getTableScannedAt, clearTableId } from '@/components/TableParamHandler';

// ==========================================
// Exemplo 1: Exibir tempo na mesa
// ==========================================

export function TableTimer() {
  const [tableId, setTableId] = useState<string | null>(null);
  const [minutesAtTable, setMinutesAtTable] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const id = getTableId();
      const scannedAt = getTableScannedAt();

      setTableId(id);

      if (scannedAt) {
        const scanTime = new Date(scannedAt).getTime();
        const now = Date.now();
        const minutes = Math.floor((now - scanTime) / 1000 / 60);
        setMinutesAtTable(minutes);
      }
    };

    // Atualizar imediatamente
    updateTimer();

    // Atualizar a cada 30 segundos
    const interval = setInterval(updateTimer, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!tableId) return null;

  return (
    <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-blue-900">Mesa {tableId}</h3>
          <p className="text-sm text-blue-700">
            Você está aqui há {minutesAtTable} minuto{minutesAtTable !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-2xl">🪑</div>
      </div>
    </div>
  );
}

// ==========================================
// Exemplo 2: Reminder automático
// ==========================================

export function AutoReminder() {
  const [showReminder, setShowReminder] = useState(false);
  const REMINDER_THRESHOLD_MINUTES = 5; // Mostrar após 5 minutos

  useEffect(() => {
    const checkReminder = () => {
      const scannedAt = getTableScannedAt();
      if (!scannedAt) return;

      const scanTime = new Date(scannedAt).getTime();
      const now = Date.now();
      const minutes = Math.floor((now - scanTime) / 1000 / 60);

      if (minutes >= REMINDER_THRESHOLD_MINUTES && !showReminder) {
        setShowReminder(true);
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 60000); // Checar a cada minuto

    return () => clearInterval(interval);
  }, [showReminder]);

  if (!showReminder) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-yellow-100 border border-yellow-400 rounded-lg p-4 shadow-lg animate-slide-up">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-yellow-900 mb-1">
            👋 Ainda não fez seu pedido?
          </h4>
          <p className="text-sm text-yellow-800">
            Que tal dar uma olhada nas nossas sugestões?
          </p>
        </div>
        <button
          onClick={() => setShowReminder(false)}
          className="ml-2 text-yellow-600 hover:text-yellow-800"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ==========================================
// Exemplo 3: Informações detalhadas da sessão
// ==========================================

export function SessionInfo() {
  const [tableId, setTableId] = useState<string | null>(null);
  const [scannedAt, setScannedAt] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState({
    startTime: '',
    duration: '',
    durationMinutes: 0
  });

  useEffect(() => {
    const updateSessionInfo = () => {
      const id = getTableId();
      const timestamp = getTableScannedAt();

      setTableId(id);
      setScannedAt(timestamp);

      if (timestamp) {
        const scanDate = new Date(timestamp);
        const now = Date.now();
        const durationMs = now - scanDate.getTime();
        const durationMinutes = Math.floor(durationMs / 1000 / 60);
        
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const durationText = hours > 0 
          ? `${hours}h ${minutes}min` 
          : `${minutes}min`;

        setSessionInfo({
          startTime: scanDate.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          duration: durationText,
          durationMinutes
        });
      }
    };

    updateSessionInfo();
    const interval = setInterval(updateSessionInfo, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!tableId) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="font-semibold mb-3">Informações da Sessão</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Mesa:</span>
          <span className="font-medium">{tableId}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Acesso:</span>
          <span className="font-medium">{sessionInfo.startTime}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Duração:</span>
          <span className="font-medium">{sessionInfo.duration}</span>
        </div>
      </div>

      <button
        onClick={() => {
          if (confirm('Deseja limpar os dados da mesa?')) {
            clearTableId();
            window.location.reload();
          }
        }}
        className="mt-4 w-full bg-red-50 text-red-600 hover:bg-red-100 py-2 px-4 rounded text-sm font-medium transition-colors"
      >
        Finalizar Sessão
      </button>
    </div>
  );
}

// ==========================================
// Exemplo 4: Analytics Hook
// ==========================================

export function useTableAnalytics() {
  const [analytics, setAnalytics] = useState({
    tableId: null as string | null,
    scannedAt: null as Date | null,
    durationMinutes: 0,
    hasOrdered: false
  });

  useEffect(() => {
    const updateAnalytics = () => {
      const tableId = getTableId();
      const scannedAt = getTableScannedAt();

      if (tableId && scannedAt) {
        const scanDate = new Date(scannedAt);
        const durationMs = Date.now() - scanDate.getTime();
        const durationMinutes = Math.floor(durationMs / 1000 / 60);

        setAnalytics(prev => ({
          ...prev,
          tableId,
          scannedAt: scanDate,
          durationMinutes
        }));
      }
    };

    updateAnalytics();
    const interval = setInterval(updateAnalytics, 60000);

    return () => clearInterval(interval);
  }, []);

  // Função para marcar que o usuário fez um pedido
  const markAsOrdered = () => {
    setAnalytics(prev => ({ ...prev, hasOrdered: true }));

    // Enviar evento de analytics
    console.log('Order Analytics:', {
      tableId: analytics.tableId,
      timeUntilOrder: analytics.durationMinutes,
      scannedAt: analytics.scannedAt?.toISOString()
    });
  };

  return {
    ...analytics,
    markAsOrdered
  };
}

// Exemplo de uso do hook:
export function OrderButton() {
  const { tableId, durationMinutes, markAsOrdered } = useTableAnalytics();

  const handleOrder = async () => {
    // Marcar que o pedido foi feito
    markAsOrdered();

    // Enviar pedido com dados da mesa
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId,
        timeUntilOrder: durationMinutes,
        items: [/* ... */]
      })
    });
  };

  return (
    <button onClick={handleOrder}>
      Fazer Pedido {tableId && `(Mesa ${tableId})`}
    </button>
  );
}

// ==========================================
// Exemplo 5: Validação de sessão expirada
// ==========================================

const MAX_SESSION_HOURS = 8; // 8 horas

export function SessionValidator() {
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const checkExpiration = () => {
      const scannedAt = getTableScannedAt();
      if (!scannedAt) return;

      const scanTime = new Date(scannedAt).getTime();
      const now = Date.now();
      const hoursSinceScanned = (now - scanTime) / 1000 / 60 / 60;

      if (hoursSinceScanned > MAX_SESSION_HOURS) {
        setIsExpired(true);
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 300000); // Checar a cada 5 min

    return () => clearInterval(interval);
  }, []);

  if (!isExpired) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md">
        <h2 className="text-xl font-bold mb-2">Sessão Expirada</h2>
        <p className="text-gray-600 mb-4">
          Sua sessão expirou. Por favor, escaneie o QR Code novamente para continuar.
        </p>
        <button
          onClick={() => {
            clearTableId();
            window.location.href = '/';
          }}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Voltar ao Início
        </button>
      </div>
    </div>
  );
}
