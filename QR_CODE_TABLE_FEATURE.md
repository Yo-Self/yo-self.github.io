# QR Code Table Feature

## Visão Geral

Esta funcionalidade permite que clientes escaneiem um QR Code na mesa para acessar o cardápio instantaneamente, sem precisar baixar um aplicativo. O identificador da mesa é capturado via query parameter e persistido no localStorage.

## Implementação

### Componente Principal: `TableParamHandler`

Localização: `src/components/TableParamHandler.tsx`

O componente é responsável por:
1. Capturar o query parameter `table` da URL
2. Salvar o identificador no localStorage com a chave `table_id`
3. Salvar o timestamp de quando o QR Code foi escaneado com a chave `table_scanned_at`
4. Remover o parâmetro da URL para manter uma URL limpa

### Integração

O componente foi integrado no layout raiz (`src/app/layout.tsx`) para funcionar em todas as rotas do aplicativo:

```tsx
<TableParamHandler />
```

## Como Usar

### Gerando QR Codes

Para criar um QR Code que identifica uma mesa, adicione o parâmetro `table` à URL:

```
https://yo-self.github.io/web-version/restaurant/bahamas-burguer?table=15
```

Onde:
- `restaurant/bahamas-burguer`: rota do restaurante específico
- `table=15`: identificador da mesa

### Exemplos de URLs

```
# Mesa 1 do Bahamas Burger
https://yo-self.github.io/web-version/restaurant/bahamas-burguer?table=1

# Mesa A-10 (com caracteres especiais)
https://yo-self.github.io/web-version/restaurant/bahamas-burguer?table=A-10

# Mesa 5 com múltiplos restaurantes habilitados
https://yo-self.github.io/web-version/restaurant/bahamas-burguer?table=5&multiple=true
```

## API de Utilidades

O componente exporta funções utilitárias para trabalhar com o identificador da mesa e timestamp:

### `getTableId()`

Retorna o identificador da mesa atual salvo no localStorage.

```typescript
import { getTableId } from '@/components/TableParamHandler';

const tableId = getTableId();
console.log(`Cliente está na mesa: ${tableId}`);
```

**Retorno:** `string | null`

### `getTableScannedAt()`

Retorna o timestamp (ISO string) de quando o QR Code da mesa foi escaneado.

```typescript
import { getTableScannedAt } from '@/components/TableParamHandler';

const scannedAt = getTableScannedAt();
if (scannedAt) {
  const scanTime = new Date(scannedAt);
  console.log(`QR Code escaneado em: ${scanTime.toLocaleString('pt-BR')}`);
}
```

**Retorno:** `string | null` (ISO 8601 timestamp)

### `clearTableId()`

Remove o identificador da mesa e o timestamp do localStorage.

```typescript
import { clearTableId } from '@/components/TableParamHandler';

// Limpar ao finalizar pedido ou sair
clearTableId();
```

## Casos de Uso

### 1. Identificação da Mesa no Pedido

```typescript
import { getTableId, getTableScannedAt } from '@/components/TableParamHandler';

function sendOrder(items: CartItem[]) {
  const tableId = getTableId();
  const scannedAt = getTableScannedAt();
  
  const order = {
    items,
    tableId,
    scannedAt,
    timestamp: new Date().toISOString()
  };
  
  // Enviar pedido para o backend
  await api.post('/orders', order);
}
```

### 2. Exibir Número da Mesa na Interface

```tsx
import { getTableId } from '@/components/TableParamHandler';

function TableDisplay() {
  const [tableId, setTableId] = useState<string | null>(null);

  useEffect(() => {
    setTableId(getTableId());
  }, []);

  if (!tableId) return null;

  return (
    <div className="table-badge">
      Mesa: {tableId}
    </div>
  );
}
```

### 3. Chamada de Garçom com Identificação da Mesa

```typescript
import { getTableId } from '@/components/TableParamHandler';

async function callWaiter() {
  const tableId = getTableId();
  
  await fetch('/functions/v1/waiter-calls', {
    method: 'POST',
    body: JSON.stringify({
      restaurantId,
      tableId, // Identificador da mesa incluído automaticamente
      reason: 'assistance'
    })
  });
}
```

### 4. Calcular Tempo na Mesa

```typescript
import { getTableScannedAt } from '@/components/TableParamHandler';

function getTimeAtTable(): number | null {
  const scannedAt = getTableScannedAt();
  
  if (!scannedAt) return null;
  
  const scanTime = new Date(scannedAt).getTime();
  const now = Date.now();
  const minutesAtTable = Math.floor((now - scanTime) / 1000 / 60);
  
  return minutesAtTable;
}

// Usar para analytics ou reminders
function TableTimeDisplay() {
  const [minutes, setMinutes] = useState<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      setMinutes(getTimeAtTable());
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Atualizar a cada minuto
    
    return () => clearInterval(interval);
  }, []);

  if (minutes === null) return null;

  return (
    <div className="time-at-table">
      Você está aqui há {minutes} minuto{minutes !== 1 ? 's' : ''}
    </div>
  );
}
```

## Comportamento

### Fluxo do Usuário

1. Cliente escaneia QR Code na mesa
2. Navegador abre URL com parâmetro `?table=XX`
3. `TableParamHandler` detecta o parâmetro
4. Identificador é salvo no localStorage
5. Parâmetro é removido da URL (fica limpa)
6. Cliente navega normalmente pelo cardápio
7. Identificador permanece disponível durante toda a sessão

### Persistência

- **Chaves no localStorage:** 
  - `table_id`: Identificador da mesa
  - `table_scanned_at`: Timestamp ISO 8601 de quando o QR Code foi escaneado
- **Duração:** Persiste até ser limpo manualmente ou até o usuário limpar dados do navegador
- **Escopo:** Específico por origem (domain)

### Navegação

- O identificador **persiste** ao navegar entre páginas
- O identificador é **atualizado** se o cliente escanear outro QR Code
- Outros query parameters (como `multiple=true`) são **preservados**

## Testes

Os testes automatizados estão em `tests/table-qrcode.spec.ts` e cobrem:

- ✅ Salvar parâmetro e timestamp no localStorage
- ✅ Validar formato ISO do timestamp
- ✅ Verificar timestamp recente e preciso
- ✅ Limpar URL após captura
- ✅ Persistir entre navegações
- ✅ Atualizar ID e timestamp ao escanear novo QR Code
- ✅ Preservar outros query parameters
- ✅ Funcionar em diferentes rotas
- ✅ Lidar com caracteres especiais
- ✅ Funções utilitárias (`getTableId`, `getTableScannedAt`, `clearTableId`)

### Executar os Testes

```bash
# Todos os testes
npm test

# Apenas testes do QR Code
npx playwright test tests/table-qrcode.spec.ts

# Com interface visual
npx playwright test tests/table-qrcode.spec.ts --ui
```

## Próximos Passos

### Possíveis Melhorias

1. **Componente Visual de Mesa**
   - Badge mostrando número da mesa no header
   - Opção de trocar de mesa manualmente

2. **Integração com Backend**
   - Incluir `tableId` automaticamente em todos os pedidos
   - Validar se a mesa existe no restaurante
   - Associar pedidos à mesa no sistema do restaurante

3. **Analytics**
   - Rastrear quais mesas mais utilizam o QR Code
   - Tempo médio de permanência por mesa
   - Taxa de conversão por mesa

4. **Experiência do Usuário**
   - Confirmar mesa ao entrar ("Você está na mesa 15?")
   - Permitir mudar de mesa se necessário
   - Mostrar histórico de mesas visitadas

## Notas Técnicas

- Compatível com static export do Next.js
- Funciona em PWA e navegadores
- Não requer JavaScript habilitado para captura inicial (SSR)
- Utiliza Next.js App Router e hooks de navegação
- Tratamento de erros silencioso para evitar quebrar a experiência

## Compatibilidade

- ✅ Next.js 14 App Router
- ✅ Static Export (GitHub Pages)
- ✅ Progressive Web App (PWA)
- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Desktop browsers

## Referências

- Código: `src/components/TableParamHandler.tsx`
- Integração: `src/app/layout.tsx`
- Testes: `tests/table-qrcode.spec.ts`
- Documentação: Este arquivo
