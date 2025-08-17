import { useState, useEffect } from 'react';

export interface WhatsAppConfig {
  phoneNumber: string;
  enabled: boolean;
  customMessage?: string;
}

export function useWhatsAppConfig(restaurantId?: string) {
  const [config, setConfig] = useState<WhatsAppConfig>({
    phoneNumber: "5511999999999", // Número padrão como fallback
    enabled: true,
    customMessage: "Olá! Gostaria de fazer este pedido."
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWhatsAppConfig = async () => {
      if (!restaurantId || restaurantId === "default") return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Buscar configuração do WhatsApp do banco de dados
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          console.warn('Configuração do Supabase não encontrada - usando configuração padrão do WhatsApp');
          return;
        }
        
        const response = await fetch(`${supabaseUrl}/rest/v1/restaurants?id=eq.${restaurantId}&select=whatsapp_phone,whatsapp_enabled,whatsapp_custom_message`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar configuração do WhatsApp');
        }

        const data = await response.json();
        
        if (data && data.length > 0) {
          const restaurant = data[0];
          
          // Se o restaurante tem configuração personalizada, usar ela
          if (restaurant.whatsapp_phone || restaurant.whatsapp_enabled !== undefined) {
            setConfig({
              phoneNumber: restaurant.whatsapp_phone || "5511999999999",
              enabled: restaurant.whatsapp_enabled !== false, // Padrão true se não especificado
              customMessage: restaurant.whatsapp_custom_message || "Olá! Gostaria de fazer este pedido."
            });
          }
        }
      } catch (err) {
        console.error('Erro ao carregar configuração do WhatsApp:', err);
        setError('Erro ao carregar configuração');
        // Em caso de erro, manter configuração padrão
      } finally {
        setIsLoading(false);
      }
    };

    loadWhatsAppConfig();
  }, [restaurantId]);

  const updateConfig = async (newConfig: Partial<WhatsAppConfig>) => {
    if (!restaurantId || restaurantId === "default") {
      console.warn('Não é possível atualizar configuração para restaurantId padrão');
      return;
    }
    
    setConfig(prev => ({ ...prev, ...newConfig }));
    
    try {
      // Atualizar configuração no banco de dados
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.warn('Configuração do Supabase não encontrada - não é possível salvar configuração');
        return;
      }
      
      const updateData: any = {};
      if (newConfig.phoneNumber !== undefined) updateData.whatsapp_phone = newConfig.phoneNumber;
      if (newConfig.enabled !== undefined) updateData.whatsapp_enabled = newConfig.enabled;
      if (newConfig.customMessage !== undefined) updateData.whatsapp_custom_message = newConfig.customMessage;
      
      const response = await fetch(`${supabaseUrl}/rest/v1/restaurants?id=eq.${restaurantId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar configuração do WhatsApp');
      }

      console.log('Configuração do WhatsApp atualizada com sucesso:', newConfig);
    } catch (err) {
      console.error('Erro ao salvar configuração do WhatsApp:', err);
      setError('Erro ao salvar configuração');
    }
  };

  return {
    config,
    isLoading,
    error,
    updateConfig,
    clearError: () => setError(null)
  };
}
