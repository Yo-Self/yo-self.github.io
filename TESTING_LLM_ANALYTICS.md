# 🧪 Testando o PostHog LLM Analytics

Este guia mostra como testar a integração do PostHog LLM Analytics com o chatbot.

## 📋 Pré-requisitos

1. **Variáveis de ambiente configuradas** (`.env.local`):
   ```bash
   # PostHog
   NEXT_PUBLIC_POSTHOG_KEY=phc_your_key
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   POSTHOG_API_KEY=phx_your_api_key
   
   # Google AI
   GOOGLE_AI_API_KEY=your_google_ai_key
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **Supabase Edge Function configurada** com as variáveis:
   - `GOOGLE_AI_API_KEY`
   - `POSTHOG_API_KEY`
   - `POSTHOG_HOST`

## 🎯 Teste 1: Chatbot no Navegador (Mais Fácil)

### Passo 1: Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

### Passo 2: Abrir um restaurante

Acesse: http://localhost:3000/restaurant/auri-monteiro

### Passo 3: Abrir o chatbot

1. Clique no ícone do chatbot (💬) no canto inferior direito
2. Digite uma mensagem: **"Qual o melhor prato do restaurante?"**
3. Aguarde a resposta da IA

### Passo 4: Verificar os logs no console

Abra o console do navegador (`F12` → Console) e procure por:

```
📊 PostHog event captured (edge function): {
  model: 'gemini-2.0-flash-exp',
  latency: '1.25s',
  tokens: 450,
  cost: '$0.000000',
  trace_id: 'trace_1234567890_abc123'
}
```

### Passo 5: Verificar no PostHog

1. Acesse: https://app.posthog.com/llm-analytics/generations
2. Você deve ver um novo evento `$ai_generation`
3. Clique nele para ver todos os detalhes

## 🧪 Teste 2: API Route Local

### Testar diretamente a API Route

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Qual o melhor prato?",
    "restaurantData": {
      "name": "Test Restaurant",
      "slug": "test-restaurant",
      "description": "A test restaurant",
      "menu_items": [
        {
          "name": "Pizza Margherita",
          "description": "Pizza com mussarela e manjericão",
          "price": "35.00"
        }
      ]
    },
    "chatHistory": [],
    "distinct_id": "test-user-123",
    "trace_id": "trace_test_api_route"
  }'
```

**Resposta esperada**:
```json
{
  "message": "A Pizza Margherita é...",
  "model": "gemini-2.0-flash-exp",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "trace_id": "trace_test_api_route"
}
```

**No terminal do `npm run dev`**, você deve ver:
```
📊 PostHog LLM Analytics captured (server): {
  model: 'gemini-2.0-flash-exp',
  latency: '1.25s',
  tokens: 450,
  cost: '$0.000000',
  trace_id: 'trace_test_api_route',
  distinct_id: 'test-user-123'
}
```

## 🌐 Teste 3: Edge Function do Supabase

### Testar a Edge Function diretamente

```bash
curl -X POST https://your-project.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Qual o melhor prato?",
    "restaurantData": {
      "name": "Test Restaurant",
      "menu_items": [
        {
          "name": "Pizza Margherita",
          "description": "Pizza com mussarela e manjericão",
          "price": "35.00"
        }
      ]
    },
    "chatHistory": [],
    "distinct_id": "test-user-edge",
    "trace_id": "trace_test_edge_function"
  }'
```

**Verificar logs da Edge Function**:
1. Acesse: https://supabase.com/dashboard/project/your-project/functions/ai-chat/logs
2. Procure por:
   ```
   📊 PostHog event captured (edge function): {
     model: 'gemini-2.0-flash-exp',
     latency: '1.25s',
     tokens: 450,
     cost: '$0.000000'
   }
   ```

## 🔍 Teste 4: Verificar Trace ID (Conversas Completas)

### Enviar múltiplas mensagens com o mesmo trace_id

**Mensagem 1**:
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá!",
    "restaurantData": { "name": "Test", "menu_items": [] },
    "chatHistory": [],
    "distinct_id": "test-user-conversation",
    "trace_id": "trace_conversation_test_001"
  }'
```

**Mensagem 2** (mesmo trace_id):
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Qual o melhor prato?",
    "restaurantData": { "name": "Test", "menu_items": [] },
    "chatHistory": [
      { "role": "user", "content": "Olá!" },
      { "role": "model", "content": "Olá! Como posso ajudar?" }
    ],
    "distinct_id": "test-user-conversation",
    "trace_id": "trace_conversation_test_001"
  }'
```

**No PostHog**:
1. Acesse: https://app.posthog.com/events
2. Filtre por: `$ai_trace_id = "trace_conversation_test_001"`
3. Você deve ver **2 eventos** agrupados

## 📊 Teste 5: Análise no PostHog

### Ver todas as gerações

https://app.posthog.com/llm-analytics/generations

### Filtrar por restaurante

```sql
restaurant_name = "Test Restaurant"
```

### Ver conversas completas

```sql
$ai_trace_id = "trace_conversation_test_001"
```

### Ver custos por modelo

No PostHog, crie um **Insight** com:
- **Event**: `$ai_generation`
- **Aggregate by**: Sum of `$ai_total_cost_usd`
- **Breakdown by**: `$ai_model`

### Ver latência média

No PostHog, crie um **Insight** com:
- **Event**: `$ai_generation`
- **Aggregate by**: Average of `$ai_latency`
- **Breakdown by**: `$ai_model`

## 🐛 Troubleshooting

### ❌ Eventos não aparecem no PostHog

**Problema**: Enviei mensagens mas não vejo eventos no PostHog.

**Solução**:
1. Verifique as variáveis de ambiente:
   ```bash
   # Server-side
   echo $POSTHOG_API_KEY  # Deve começar com phx_
   
   # Client-side
   echo $NEXT_PUBLIC_POSTHOG_KEY  # Deve começar com phc_
   ```

2. Verifique os logs do terminal:
   - Deve aparecer: `📊 PostHog LLM Analytics captured`
   - Se aparecer erro, leia a mensagem de erro

3. Aguarde alguns segundos - o PostHog pode demorar para processar eventos

### ❌ Erro: "API key não configurada"

**Problema**: Recebo erro sobre API key.

**Solução**:
```bash
# Verifique se está no .env.local
cat .env.local | grep GOOGLE_AI_API_KEY

# Se não estiver, adicione:
echo 'GOOGLE_AI_API_KEY=your_key_here' >> .env.local

# Reinicie o servidor
npm run dev
```

### ❌ Erro: "Configuração do Supabase não encontrada"

**Problema**: Edge Function não está sendo chamada.

**Solução**:
```bash
# Verifique as variáveis do Supabase
cat .env.local | grep SUPABASE

# Devem existir:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### ❌ Custo está zerado

**Problema**: `$ai_total_cost_usd` aparece como `0.000000`.

**Explicação**: O modelo `gemini-2.0-flash-exp` é **gratuito**! Isso está correto.

Para testar com modelos pagos, force o uso do `gemini-1.5-pro`:
1. Edite `src/app/api/ai/chat/route.ts`
2. Mude a ordem dos modelos no array `MODELS`

### ❌ Latência muito alta

**Problema**: `$ai_latency` está acima de 5 segundos.

**Possíveis causas**:
- Modelo está sobrecarregado (normal em horários de pico)
- Mensagem muito longa (muitos tokens)
- Conexão lenta

**Solução**: Use o modelo mais rápido (`gemini-2.0-flash-exp`)

## ✅ Checklist Final

Antes de considerar o teste completo, verifique:

- [ ] Servidor de desenvolvimento rodando (`npm run dev`)
- [ ] Abriu o chatbot no navegador
- [ ] Enviou pelo menos uma mensagem
- [ ] Viu logs no console do navegador
- [ ] Viu logs no terminal do servidor
- [ ] Eventos aparecem no PostHog (https://app.posthog.com/events)
- [ ] Métricas aparecem no LLM Analytics (https://app.posthog.com/llm-analytics/generations)
- [ ] Testou com múltiplas mensagens (mesmo trace_id)
- [ ] Verificou que o custo está sendo calculado

## 🎓 Próximos Passos

Após confirmar que está funcionando:

1. **Configure alertas** no PostHog para custos acima de $X
2. **Crie um dashboard** com métricas principais (latência, custo, tokens)
3. **Monitore conversas** para identificar padrões e melhorar prompts
4. **Teste A/B** com diferentes configurações de temperatura/top-p
5. **Adicione feedback** do usuário (thumbs up/down) e correlacione com as gerações

## 📚 Documentação Relacionada

- [POSTHOG_LLM_ANALYTICS.md](./POSTHOG_LLM_ANALYTICS.md) - Documentação completa
- [POSTHOG_ERROR_TRACKING.md](./POSTHOG_ERROR_TRACKING.md) - Error tracking
- [SETUP_ENVIRONMENT.md](./SETUP_ENVIRONMENT.md) - Configuração inicial
