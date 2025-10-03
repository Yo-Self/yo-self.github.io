# Atualização: Timestamp do QR Code da Mesa

## Resumo da Implementação

Adicionei a funcionalidade de salvar o timestamp de quando o cliente escaneou o QR Code da mesa.

## Mudanças Realizadas

### 1. Componente `TableParamHandler` (`src/components/TableParamHandler.tsx`)

**Adicionado:**
- Constante `TABLE_TIMESTAMP_KEY` para armazenar a chave do timestamp no localStorage
- Salvamento automático do timestamp em formato ISO 8601 quando o parâmetro `table` é capturado
- Nova função utilitária `getTableScannedAt()` para recuperar o timestamp
- Atualização da função `clearTableId()` para limpar também o timestamp

**Código:**
```typescript
const TABLE_STORAGE_KEY = "table_id";
const TABLE_TIMESTAMP_KEY = "table_scanned_at";

// No useEffect, ao detectar o parâmetro 'table':
const timestamp = new Date().toISOString();
localStorage.setItem(TABLE_STORAGE_KEY, tableParam);
localStorage.setItem(TABLE_TIMESTAMP_KEY, timestamp);

// Nova função
export function getTableScannedAt(): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    return localStorage.getItem(TABLE_TIMESTAMP_KEY);
  } catch {
    return null;
  }
}
```

### 2. Testes (`tests/table-qrcode.spec.ts`)

**Atualizados:**
- Teste principal agora valida que o timestamp é salvo e está no formato ISO correto
- Teste de atualização verifica que o timestamp muda ao escanear novo QR Code
- Teste de funções utilitárias valida `getTableScannedAt()`

**Novos testes:**
- `should save valid ISO timestamp`: Verifica formato ISO 8601
- `timestamp should reflect when QR code was scanned`: Verifica que o timestamp está correto temporalmente

### 3. Documentação (`QR_CODE_TABLE_FEATURE.md`)

**Atualizado:**
- Descrição do componente menciona o salvamento do timestamp
- Seção de API de Utilidades agora documenta `getTableScannedAt()`
- Novo exemplo de caso de uso: "Calcular Tempo na Mesa"
- Seção de Persistência atualizada para listar as duas chaves do localStorage

## Dados Salvos no localStorage

Quando um cliente escaneia um QR Code de mesa:

| Chave | Valor | Exemplo |
|-------|-------|---------|
| `table_id` | Identificador da mesa | `"15"` |
| `table_scanned_at` | Timestamp ISO 8601 | `"2025-10-02T14:30:25.123Z"` |

## API

### `getTableId()`
Retorna o identificador da mesa (inalterado).

### `getTableScannedAt()`
**Nova função** que retorna o timestamp ISO de quando o QR Code foi escaneado.

```typescript
import { getTableScannedAt } from '@/components/TableParamHandler';

const scannedAt = getTableScannedAt();
if (scannedAt) {
  const scanTime = new Date(scannedAt);
  console.log(`Mesa acessada em: ${scanTime.toLocaleString('pt-BR')}`);
}
```

### `clearTableId()`
Atualizado para limpar **ambas** as chaves: `table_id` e `table_scanned_at`.

## Casos de Uso

### 1. Analytics de Tempo na Mesa

```typescript
import { getTableScannedAt } from '@/components/TableParamHandler';

function trackSessionDuration() {
  const scannedAt = getTableScannedAt();
  if (!scannedAt) return;
  
  const sessionStart = new Date(scannedAt);
  const sessionDuration = Date.now() - sessionStart.getTime();
  
  analytics.track('session_duration', {
    duration_ms: sessionDuration,
    duration_minutes: Math.floor(sessionDuration / 1000 / 60)
  });
}
```

### 2. Reminder Automático

```typescript
import { getTableScannedAt } from '@/components/TableParamHandler';

// Mostrar reminder se cliente está na mesa há mais de 10 minutos
function checkForReminder() {
  const scannedAt = getTableScannedAt();
  if (!scannedAt) return;
  
  const minutesAtTable = Math.floor(
    (Date.now() - new Date(scannedAt).getTime()) / 1000 / 60
  );
  
  if (minutesAtTable >= 10) {
    showNotification('Gostaria de fazer um pedido?');
  }
}
```

### 3. Dashboard do Restaurante

```typescript
import { getTableId, getTableScannedAt } from '@/components/TableParamHandler';

function sendOrder(items: CartItem[]) {
  const tableId = getTableId();
  const scannedAt = getTableScannedAt();
  
  // Backend pode calcular métricas como:
  // - Tempo até primeiro pedido
  // - Tempo médio de permanência
  // - Horários de pico por mesa
  
  const order = {
    items,
    tableId,
    tableAccessTime: scannedAt,
    orderTime: new Date().toISOString()
  };
  
  await api.post('/orders', order);
}
```

## Benefícios

1. **Analytics**: Rastrear comportamento do cliente (tempo navegando, tempo até primeiro pedido)
2. **UX**: Mostrar reminders ou sugestões baseadas em tempo na mesa
3. **Operacional**: Dados para o restaurante otimizar atendimento
4. **Debugging**: Facilita identificar problemas relacionados a sessões antigas

## Compatibilidade

- ✅ Totalmente backwards compatible
- ✅ Não quebra código existente que usa apenas `getTableId()`
- ✅ Limpeza automática via `clearTableId()` agora remove ambas as chaves
- ✅ Formato ISO 8601 permite fácil parsing e comparação

## Validação

O timestamp é salvo como string ISO 8601:
- ✅ Formato padrão universal
- ✅ Compatível com `new Date(timestamp)`
- ✅ Inclui timezone (UTC)
- ✅ Fácil conversão para timezone local

## Próximos Passos Sugeridos

1. Integrar analytics para rastrear tempo médio na mesa
2. Adicionar UI para mostrar tempo decorrido (opcional)
3. Criar dashboard para restaurante ver métricas de tempo por mesa
4. Implementar reminders automáticos baseados em tempo
