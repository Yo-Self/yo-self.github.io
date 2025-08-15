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
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Configuração do Supabase não encontrada');
      }
      
      const functionUrl = `${supabaseUrl}/functions/v1/waiter-calls`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          table_number: tableNumber,
          notes: notes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Já existe uma chamada pendente
          throw new Error(data.error || 'Já existe uma chamada pendente para esta mesa');
        }
        throw new Error(data.error || 'Erro ao criar chamada de garçom');
      }

      if (data.success && data.call) {
        setCalls(prev => [data.call, ...prev]);
        return data.call;
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
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Configuração do Supabase não encontrada');
      }
      
      const functionUrl = `${supabaseUrl}/functions/v1/waiter-calls?restaurant_id=${restaurantId}&status=${status}`;
      
      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar chamadas de garçom');
      }

      if (data.success && data.calls) {
        setCalls(data.calls);
        return data.calls;
      }

      return [];
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
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Configuração do Supabase não encontrada');
      }
      
      const functionUrl = `${supabaseUrl}/functions/v1/waiter-calls`;
      
      const response = await fetch(functionUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          call_id: callId,
          status,
          attended_by: attendedBy || null,
          notes: notes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar chamada de garçom');
      }

      if (data.success && data.call) {
        setCalls(prev => prev.map(call => 
          call.id === callId ? data.call : call
        ));
        return data.call;
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
