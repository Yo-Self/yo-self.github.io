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
  calls: WaiterCall[];
  isLoading: boolean;
  error: string | null;
  createCall: (restaurantId: string, tableNumber: number, notes?: string) => Promise<WaiterCall | null>;
  fetchCalls: (restaurantId: string, status?: string) => Promise<WaiterCall[]>;
  updateCall: (callId: string, status: string, attendedBy?: string, notes?: string) => Promise<WaiterCall | null>;
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

export function useWaiterCalls(): UseWaiterCallsReturn {
  const [calls, setCalls] = useState<WaiterCall[]>([]);
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
      if (call?.id) {
        setCalls(prev => [call, ...prev]);
        return call;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCalls = useCallback(async (
    restaurantId: string,
    status: string = 'pending'
  ): Promise<WaiterCall[]> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!supabase) {
        console.warn('Configuração do Supabase não encontrada - funcionalidade de chamada de garçom desabilitada');
        return [];
      }

      const { data, error: queryError } = await supabase
        .from('waiter_calls')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      const result = (data || []) as WaiterCall[];
      setCalls(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCall = useCallback(async (
    callId: string,
    status: string,
    attendedBy?: string,
    notes?: string
  ): Promise<WaiterCall | null> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!supabase) {
        console.warn('Configuração do Supabase não encontrada - funcionalidade de chamada de garçom desabilitada');
        return null;
      }

      const updateData: Record<string, unknown> = { status };
      if (status === 'attended') {
        updateData.attended_at = new Date().toISOString();
        if (attendedBy) {
          updateData.attended_by = attendedBy;
        }
      }
      if (notes) {
        updateData.notes = notes;
      }

      const { data, error: updateError } = await supabase
        .from('waiter_calls')
        .update(updateData)
        .eq('id', callId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      const call = data as WaiterCall;
      setCalls(prev => prev.map(item => (item.id === callId ? call : item)));
      return call;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    calls,
    isLoading,
    error,
    createCall,
    fetchCalls,
    updateCall,
    clearError,
  };
}
