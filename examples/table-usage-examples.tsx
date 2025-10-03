import { getTableId, clearTableId } from '@/components/TableParamHandler';

// Exemplo 1: Exibir número da mesa no carrinho
export function CartTableDisplay() {
  const tableId = getTableId();
  
  if (!tableId) return null;
  
  return (
    <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg mb-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🪑</span>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Mesa</p>
          <p className="font-bold text-lg">{tableId}</p>
        </div>
      </div>
    </div>
  );
}

// Exemplo 2: Incluir mesa no pedido
export async function createOrder(items: any[]) {
  const tableId = getTableId();
  
  const order = {
    items,
    tableId, // Incluído automaticamente se disponível
    timestamp: new Date().toISOString(),
    status: 'pending'
  };
  
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  
  return response.json();
}

// Exemplo 3: Chamar garçom com identificação da mesa
export async function callWaiterWithTable(restaurantId: string, reason: string = 'assistance') {
  const tableId = getTableId();
  
  const response = await fetch('/functions/v1/waiter-calls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId,
      tableId, // Mesa identificada automaticamente
      reason,
      timestamp: new Date().toISOString()
    })
  });
  
  return response.json();
}

// Exemplo 4: Component de badge da mesa no header
'use client';
import { useState, useEffect } from 'react';

export function TableBadge() {
  const [tableId, setTableId] = useState<string | null>(null);

  useEffect(() => {
    setTableId(getTableId());
  }, []);

  if (!tableId) return null;

  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
      <span className="text-sm">Mesa {tableId}</span>
      <button
        onClick={() => {
          clearTableId();
          setTableId(null);
        }}
        className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        aria-label="Limpar mesa"
      >
        ✕
      </button>
    </div>
  );
}

// Exemplo 5: Analytics de mesas
export function trackTableUsage() {
  const tableId = getTableId();
  
  if (tableId && typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('table_accessed', {
      table_id: tableId,
      timestamp: new Date().toISOString()
    });
  }
}
