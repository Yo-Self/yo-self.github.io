import { supabase } from '@/lib/supabase/client';
import { useState, useCallback } from 'react';

export interface WaiterCall {
  id: string;
  restaurant_id: string;
  table_number: number;
  status: 'pending' | 'attended' | 'cancelled';
  created_at: string;
  attended_at?: string;
  attended_by?: string;
  notes?: string;
}

export interface UseWaiterCallsReturn {
  isLoading: boolean;
  error: string | null;
  createCall: (restaurantId: string, tableNumber: number, notes?: string) => Promise<WaiterCall | null>;
  clearError: () => void;
}

function mapWaiterCallError(error: { message?: string; details?: string }): string {
  const msg = `${error.message || ''} ${error.details || ''}`.toLowerCase();

  if (msg.includes('waiter_call_rate_limited')) {
    return 'Já existe uma chamada pendente para esta mesa';
  }
  if (msg.includes('waiter_call_disabled')) {
    return 'Chamada de garçom não está habilitada neste restaurante';
  }
  if (msg.includes('invalid_payload')) {
    return 'Dados da chamada inválidos';
  }

  return 'Erro ao criar chamada de garçom';
}

/** Public cardápio: apenas criação via RPC. Gestão de chamadas fica no painel (menu-mestre-facil). */
export function useWaiterCalls(): UseWaiterCallsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createCall = useCallback(async (
    restaurantId: string,
    tableNumber: number,
    notes?: string
  ): Promise<WaiterCall | null> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!supabase) {
        console.warn('Configuração do Supabase não encontrada - funcionalidade de chamada de garçom desabilitada');
        return null;
      }

      const { data, error: rpcError } = await supabase.rpc('create_waiter_call', {
        p_restaurant_id: restaurantId,
        p_table_number: tableNumber,
        p_notes: notes?.trim() || null,
      });

      if (rpcError) {
        throw new Error(mapWaiterCallError(rpcError));
      }

      const call = data as WaiterCall;
      return call?.id ? call : null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    createCall,
    clearError,
  };
}
