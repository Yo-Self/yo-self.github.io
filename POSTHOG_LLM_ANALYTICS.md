# PostHog LLM Analytics - Integração com Google Gemini

Este documento descreve a implementação do **PostHog LLM Analytics** no chatbot do projeto, permitindo rastrear e analisar todas as gerações de IA feitas com o Google Gemini.

## 📊 O que é LLM Analytics?

O PostHog LLM Analytics é uma funcionalidade que captura automaticamente eventos `$ai_generation` sempre que seu modelo de IA gera uma resposta. Ele registra:

- **Latência**: Tempo de resposta do modelo
- **Tokens**: Quantidade de tokens de entrada e saída
- **Custo**: Custo estimado em USD
- **Modelo**: Qual modelo foi usado (gemini-2.0-flash-exp, gemini-1.5-pro, etc.)
- **Contexto**: Mensagem do usuário, resposta da IA, metadados da conversa
- **Trace ID**: Agrupa conversas completas

## 🏗️ Arquitetura da Implementação

### 1. Server-Side (Next.js API Route)

**Arquivo**: `src/lib/posthog-gemini-server.ts`

Wrapper server-side que intercepta chamadas ao Gemini e captura eventos usando o PostHog Node SDK:

```typescript
import { sendMessageWithTracking, generateTraceId, type PostHogLLMOptions } from '@/lib/posthog-gemini-server';

// Exemplo de uso
const { text } = await sendMessageWithTracking(
  chat,
  message,
  modelName,
  generationConfig,
  {
    distinct_id: 'user-123',
    trace_id: traceId,
    properties: {
      restaurant_name: 'Pizza Palace',
      source: 'api_route',
    },
  }
);
```

**Recursos**:
- ✅ Estimativa automática de tokens baseada no tamanho do texto
- ✅ Cálculo de custo para cada modelo Gemini
- ✅ Captura de erros automaticamente
- ✅ Suporte a trace_id para agrupar conversas

### 2. Edge Function (Supabase)

**Arquivo**: `supabase-functions/ai-chat/index.ts`

A Edge Function roda no Deno e captura eventos via HTTP API do PostHog:

```typescript
await capturePostHogEvent(
  distinctId,
  fullMessage,
  text,
  modelName,
  latency,
  traceId,
  {
    restaurant_name: restaurantData?.name,
    source: 'edge_function',
  }
);
```

**Recursos**:
- ✅ Integração via HTTP API (compatível com Deno)
- ✅ Suporte a múltiplos modelos com fallback
- ✅ Tracking de latência real
- ✅ Metadados customizados do restaurante

### 3. Client-Side (React Hook)

**Arquivo**: `src/hooks/useWebLLM.ts`

O hook React passa `distinct_id` e `trace_id` para o servidor:

```typescript
const posthog = usePostHog();
const traceId = useMemo(() => generateTraceId(), []);

// Passa tracking options para o servidor
body: JSON.stringify({
  message,
  restaurantData,
  chatHistory,
  distinct_id: posthog?.get_distinct_id?.() || 'anonymous',
  trace_id: traceId,
})
```

**Recursos**:
- ✅ Trace ID persistente por sessão de chat
- ✅ Usa distinct_id do PostHog automaticamente
- ✅ Sincronização com eventos do PostHog

## 📈 Métricas Capturadas

Cada evento `$ai_generation` inclui as seguintes propriedades:

### Propriedades Padrão do PostHog LLM Analytics

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `$ai_model` | Nome do modelo usado | `gemini-2.0-flash-exp` |
| `$ai_latency` | Tempo de resposta em segundos | `1.25` |
| `$ai_input` | Mensagem enviada para a IA | `"Qual o melhor prato?"` |
| `$ai_input_tokens` | Tokens da entrada | `150` |
| `$ai_output_choices` | Resposta da IA | `[{message: {...}}]` |
| `$ai_output_tokens` | Tokens da saída | `300` |
| `$ai_total_tokens` | Total de tokens | `450` |
| `$ai_input_cost_usd` | Custo da entrada | `0.000075` |
| `$ai_output_cost_usd` | Custo da saída | `0.00030` |
| `$ai_total_cost_usd` | Custo total | `0.000375` |
| `$ai_trace_id` | ID da conversa | `trace_1234567890_abc123` |
| `$ai_provider` | Provedor de IA | `google` |
| `$ai_timestamp` | Timestamp ISO | `2024-01-15T10:30:00.000Z` |

### Propriedades Customizadas

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `restaurant_name` | Nome do restaurante | `"Pizza Palace"` |
| `restaurant_slug` | Slug do restaurante | `"pizza-palace"` |
| `message_length` | Tamanho da mensagem | `50` |
| `history_length` | Número de mensagens anteriores | `5` |
| `source` | Origem da requisição | `"api_route"` ou `"edge_function"` |

### Configurações do Modelo

| Propriedade | Descrição | Exemplo |
|------------|-----------|---------|
| `$ai_temperature` | Temperatura do modelo | `0.7` |
| `$ai_top_k` | Top-K sampling | `40` |
| `$ai_top_p` | Top-P sampling | `0.95` |
| `$ai_max_output_tokens` | Limite de tokens de saída | `1024` |

## 🔧 Configuração

### 1. Variáveis de Ambiente

#### Next.js (`.env.local`)

```bash
# PostHog (Client-Side)
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# PostHog (Server-Side)
POSTHOG_API_KEY=phx_your_api_key_here

# Google AI
GOOGLE_AI_API_KEY=your_google_ai_key
```

#### Supabase Edge Function

Configure no painel do Supabase em **Settings → Edge Functions → Environment Variables**:

```bash
GOOGLE_AI_API_KEY=your_google_ai_key
POSTHOG_API_KEY=phx_your_api_key_here
POSTHOG_HOST=https://us.i.posthog.com
```

### 2. Deploy da Edge Function

```bash
# Deploy da função com secrets
supabase functions deploy ai-chat \
  --project-ref your-project-ref \
  --no-verify-jwt
```

## 📊 Visualização no PostHog

### 1. Dashboard LLM Analytics

Acesse: **PostHog → LLM Analytics → Generations**

URL: `https://app.posthog.com/llm-analytics/generations`

Você verá:
- 📈 **Total de gerações** ao longo do tempo
- 💰 **Custo total** por modelo
- ⏱️ **Latência média** por modelo
- 🔢 **Tokens utilizados** (input/output)

### 2. Filtros Úteis

#### Por Restaurante
```sql
restaurant_name = "Pizza Palace"
```

#### Por Modelo
```sql
$ai_model = "gemini-2.0-flash-exp"
```

#### Por Latência
```sql
$ai_latency > 2.0
```

#### Por Custo
```sql
$ai_total_cost_usd > 0.001
```

### 3. Análise de Conversas

Use o `$ai_trace_id` para agrupar mensagens de uma mesma conversa:

```sql
$ai_trace_id = "trace_1234567890_abc123"
```

## 🧪 Testando

### 1. Teste Local (API Route)

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Qual o melhor prato?",
    "restaurantData": {
      "name": "Pizza Palace",
      "slug": "pizza-palace",
      "menu_items": []
    },
    "chatHistory": [],
    "distinct_id": "test-user-123",
    "trace_id": "trace_test_123"
  }'
```

### 2. Teste da Edge Function

```bash
curl -X POST https://your-project.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Qual o melhor prato?",
    "restaurantData": {
      "name": "Pizza Palace",
      "menu_items": []
    },
    "chatHistory": [],
    "distinct_id": "test-user-123",
    "trace_id": "trace_test_123"
  }'
```

### 3. Verificar no PostHog

Após executar os testes, verifique em:

1. **Events**: Procure por `$ai_generation`
2. **LLM Analytics → Generations**: Veja as métricas agregadas
3. **Person**: Encontre o `distinct_id` usado no teste

## 💡 Boas Práticas

### 1. Trace ID

- ✅ Gere um `trace_id` único por sessão de chat
- ✅ Mantenha o mesmo `trace_id` para toda a conversa
- ✅ Use o formato: `trace_{timestamp}_{random}`

### 2. Distinct ID

- ✅ Use o `distinct_id` do PostHog quando disponível
- ✅ Use `'anonymous'` como fallback
- ✅ Associe com o ID do usuário quando ele fizer login

### 3. Propriedades Customizadas

- ✅ Adicione contexto relevante (nome do restaurante, categoria)
- ✅ Mantenha propriedades consistentes entre chamadas
- ✅ Use snake_case para nomes de propriedades

### 4. Custos

- ⚠️ Monitore o custo total regularmente
- ⚠️ Configure alertas para custos acima do esperado
- ⚠️ Use modelos menores quando possível (gemini-2.0-flash-exp é grátis!)

## 🐛 Debug

### Logs de Desenvolvimento

Em modo de desenvolvimento, você verá logs no console:

```
📊 PostHog LLM Analytics captured (server): {
  model: 'gemini-2.0-flash-exp',
  latency: '1.25s',
  tokens: 450,
  cost: '$0.000375',
  trace_id: 'trace_1234567890_abc123',
  distinct_id: 'user-123'
}
```

### Eventos Não Aparecem no PostHog?

**1. Verifique as variáveis de ambiente**:
```bash
# Client-side
echo $NEXT_PUBLIC_POSTHOG_KEY
echo $NEXT_PUBLIC_POSTHOG_HOST

# Server-side
echo $POSTHOG_API_KEY

# Edge Function (no painel do Supabase)
```

**2. Verifique os logs**:
- **Next.js**: Terminal onde o `npm run dev` está rodando
- **Edge Function**: Supabase → Functions → ai-chat → Logs

**3. Verifique se o PostHog está inicializado**:
```typescript
import { usePostHog } from 'posthog-js/react';
const posthog = usePostHog();
console.log('PostHog:', posthog);
```

**4. Verifique se a API Key está correta**:
- Client-side key começa com `phc_`
- API key (server-side) começa com `phx_`

## 📚 Referências

- [PostHog LLM Analytics - Google Gemini](https://posthog.com/docs/llm-analytics/installation/google)
- [PostHog LLM Analytics - Visão Geral](https://posthog.com/docs/llm-analytics)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [PostHog HTTP API](https://posthog.com/docs/api/post-only-endpoints)

## 🎯 Próximos Passos

- [ ] Configurar alertas de custo no PostHog
- [ ] Criar dashboard customizado com métricas do chatbot
- [ ] Implementar A/B testing de diferentes prompts
- [ ] Adicionar feedback do usuário (thumbs up/down)
- [ ] Configurar monitoring de latência
