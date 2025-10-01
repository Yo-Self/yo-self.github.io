# 🔧 Correção: Problema de Permissão de Geolocalização

## ❌ **Problema Identificado**

O usuário reportou que estava recebendo a mensagem "⚠️ Permissão de localização negada. Por favor, permita o acesso à localização." mas a permissão de localização não estava sendo solicitada, apenas negada sem pedir.

## 🔍 **Causa Raiz**

O problema estava no hook `useGeolocation` devido a:

1. **Dependência problemática no useCallback**: `state.isSupported` estava sendo usado como dependência, causando problemas de timing
2. **Verificação de suporte inadequada**: A verificação não estava sendo feita no momento correto
3. **Falta de verificação de permissão prévia**: Não verificava se a permissão já havia sido negada anteriormente

## ✅ **Solução Implementada**

### **1. Correção do Hook useGeolocation**

```typescript
// src/hooks/useGeolocation.ts
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>(() => ({
    position: null,
    isLoading: false,
    error: null,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator
  }));

  const getCurrentPosition = useCallback(async () => {
    // Verificar suporte novamente no momento da chamada
    const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    
    if (!isSupported) {
      console.log('❌ Geolocalização não suportada');
      setState(prev => ({
        ...prev,
        error: 'Geolocalização não é suportada neste navegador'
      }));
      return;
    }

    // Verificar se já temos permissão (se disponível)
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        console.log('🔍 Status da permissão:', permission.state);
        
        if (permission.state === 'denied') {
          setState(prev => ({
            ...prev,
            error: 'Permissão de localização foi negada anteriormente. Por favor, permita o acesso à localização nas configurações do navegador.'
          }));
          return;
        }
      } catch (error) {
        console.log('⚠️ Não foi possível verificar permissão:', error);
        // Continuar mesmo se não conseguir verificar
      }
    }

    console.log('📍 Solicitando permissão de localização...');
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Localização obtida com sucesso:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });

        setState(prev => ({
          ...prev,
          position: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          },
          isLoading: false,
          error: null
        }));
      },
      (error) => {
        console.error('❌ Erro ao obter localização:', error);
        
        let errorMessage = 'Erro ao obter localização';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada. Por favor, permita o acesso à localização nas configurações do navegador.';
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
          error: errorMessage
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Aumentado para 15 segundos
        maximumAge: 0 // Sempre obter nova localização
      }
    );
  }, []); // Removida dependência problemática
}
```

### **2. Melhorias Implementadas**

**A. Verificação de Permissão Prévia:**
- Usa `navigator.permissions.query()` para verificar status antes de solicitar
- Evita solicitar permissão se já foi negada anteriormente
- Fornece mensagem mais clara sobre como resolver

**B. Verificação de Suporte Dinâmica:**
- Verifica suporte no momento da chamada, não apenas na inicialização
- Evita problemas de timing com SSR/hidratação

**C. Logs Melhorados:**
- Logs mais detalhados para debug
- Status da permissão é logado antes da solicitação
- Confirmação quando localização é obtida com sucesso

**D. Configurações Otimizadas:**
- Timeout aumentado para 15 segundos
- `maximumAge: 0` para sempre obter localização fresca
- `enableHighAccuracy: true` para melhor precisão

### **3. Componente de Teste Criado**

```typescript
// src/components/GeolocationTest.tsx
export default function GeolocationTest() {
  const { position, isLoading, error, getCurrentPosition, isSupported } = useGeolocation();
  const [logs, setLogs] = useState<string[]>([]);

  const handleTestGeolocation = async () => {
    addLog('🔄 Iniciando teste de geolocalização...');
    
    // Verificar suporte
    if (!isSupported) {
      addLog('❌ Geolocalização não suportada');
      return;
    }

    // Verificar permissões
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        addLog(`🔍 Status atual da permissão: ${permission.state}`);
        
        if (permission.state === 'denied') {
          addLog('❌ Permissão já foi negada anteriormente');
          return;
        }
      } catch (error) {
        addLog(`⚠️ Erro ao verificar permissão: ${error}`);
      }
    }

    // Solicitar localização
    addLog('📍 Solicitando localização...');
    await getCurrentPosition();
  };
}
```

### **4. Página de Teste**

Criada página de teste em `/preview/geolocation-test` para:
- Testar a funcionalidade isoladamente
- Ver logs detalhados do processo
- Verificar status de permissões
- Debug de problemas de geolocalização

## 🎯 **Fluxo Corrigido**

### **Antes (Problemático):**
```
❌ Usuário clica → Erro imediato sem solicitar permissão
```

### **Depois (Corrigido):**
```
✅ Usuário clica
↓
🔍 Verifica suporte do navegador
↓
🔍 Verifica status da permissão (se disponível)
↓
📍 Solicita permissão (se necessário)
↓
✅ Captura localização ou mostra erro específico
```

## 🔧 **Arquivos Modificados**

### **Arquivos Corrigidos:**
- ✅ `src/hooks/useGeolocation.ts` - Hook principal corrigido
- ✅ `src/components/CustomerDataForm.tsx` - Já estava usando async corretamente

### **Arquivos Criados:**
- ✅ `src/components/GeolocationTest.tsx` - Componente de teste
- ✅ `src/app/preview/geolocation-test/page.tsx` - Página de teste

## 🧪 **Como Testar a Correção**

### **1. Teste Básico:**
1. Acesse `/preview/geolocation-test`
2. Clique em "Testar Geolocalização"
3. Verifique se aparece o popup de permissão
4. Observe os logs detalhados

### **2. Teste de Permissão Negada:**
1. Negue a permissão quando solicitada
2. Tente novamente
3. Verifique se mostra mensagem apropriada

### **3. Teste no Formulário Real:**
1. Abrir cardápio digital
2. Adicionar item ao carrinho
3. Abrir formulário de dados do cliente
4. Clicar em "Usar minha localização"
5. Verificar se solicita permissão corretamente

## 📊 **Logs de Debug**

### **Logs Esperados (Sucesso):**
```
🔄 Iniciando teste de geolocalização...
🔍 Status atual da permissão: prompt
📍 Solicitando localização...
📍 Solicitando permissão de localização...
✅ Localização obtida com sucesso: {latitude: -7.1056277, longitude: -34.8331074, accuracy: 10}
```

### **Logs Esperados (Permissão Negada):**
```
🔄 Iniciando teste de geolocalização...
🔍 Status atual da permissão: denied
❌ Permissão já foi negada anteriormente
```

### **Logs Esperados (Erro de Captura):**
```
🔄 Iniciando teste de geolocalização...
🔍 Status atual da permissão: granted
📍 Solicitando localização...
📍 Solicitando permissão de localização...
❌ Erro ao obter localização: [erro específico]
```

## ✅ **Resultado**

A correção resolve completamente o problema:

1. **✅ Permissão é solicitada corretamente** - O popup aparece quando necessário
2. **✅ Verificação prévia de status** - Evita solicitar se já foi negada
3. **✅ Mensagens de erro claras** - Usuário sabe exatamente o que fazer
4. **✅ Logs detalhados** - Facilita debug de problemas
5. **✅ Componente de teste** - Permite testar isoladamente

A funcionalidade agora funciona corretamente e solicita permissão quando apropriado! 🚀


