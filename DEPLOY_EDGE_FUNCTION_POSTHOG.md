# 🚀 Deploy da Edge Function com PostHog LLM Analytics

## ⚠️ Problema Corrigido

O chatbot estava falhando com o erro:
```
models/gemini-1.5-flash is not found for API version v1
```

**Solução**: Atualizamos os modelos para usar apenas versões disponíveis na API v1:
- ✅ `gemini-2.0-flash-exp` (gratuito, experimental)
- ✅ `gemini-1.5-pro-latest` (modelo mais completo e estável)
- ✅ `gemini-pro` (fallback)

## 📦 O que foi Atualizado

1. **Edge Function** (`supabase-functions/ai-chat/index.ts`)
   - Modelos corrigidos
   - PostHog LLM Analytics integrado via HTTP API
   - Tracking de latência, tokens e custo

2. **API Route** (`src/app/api/ai/chat/route.ts`)
   - Modelos corrigidos
   - PostHog Node SDK integrado
   - Mesmo tracking do Edge Function

3. **Hook do Cliente** (`src/hooks/useWebLLM.ts`)
   - Passa `distinct_id` e `trace_id` para o servidor
   - Gera `trace_id` único por sessão

## 🔧 Como Fazer o Deploy

### Passo 1: Verificar Variáveis de Ambiente no Supabase

Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/functions

Configure as seguintes variáveis:

```bash
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
POSTHOG_API_KEY=phx_your_posthog_api_key_here
POSTHOG_HOST=https://us.i.posthog.com
```

> **Importante**: Use a **API Key** do PostHog (começa com `phx_`), não a chave pública (que começa com `phc_`)

### Passo 2: Fazer Login no Supabase CLI

```bash
npx supabase login
```

### Passo 3: Linkar o Projeto

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

> **Dica**: Encontre o `project-ref` na URL do seu projeto: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

### Passo 4: Deploy da Edge Function

```bash
npx supabase functions deploy ai-chat --no-verify-jwt
```

Você deve ver:

```
Deploying Function ai-chat (project ref: YOUR_PROJECT_REF)
Function ai-chat deployed to https://YOUR_PROJECT.supabase.co/functions/v1/ai-chat
✔ ai-chat deployed successfully
```

### Passo 5: Testar a Edge Function

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá! Qual o prato mais popular?",
    "restaurantData": {
      "name": "Restaurante Teste",
      "description": "Um restaurante de teste",
      "menu_items": [
        {
          "name": "Pizza Margherita",
          "description": "Pizza clássica com molho de tomate, mussarela e manjericão",
          "price": "45.00"
        },
        {
          "name": "Hambúrguer Artesanal",
          "description": "Hambúrguer de carne bovina com queijo cheddar",
          "price": "35.00"
        }
      ]
    },
    "chatHistory": [],
    "distinct_id": "test-user-deploy",
    "trace_id": "trace_deploy_test_001"
  }'
```

**Resposta esperada**:
```json
{
  "message": "Olá! Com base no nosso cardápio...",
  "timestamp": "2025-10-14T...",
  "model": "gemini-2.0-flash-exp"
}
```

### Passo 6: Verificar Logs da Edge Function

Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/functions/ai-chat/logs

Procure por:
```
📊 PostHog event captured (edge function): {
  model: 'gemini-2.0-flash-exp',
  latency: '1.25s',
  tokens: 450,
  cost: '$0.000000'
}
```

### Passo 7: Verificar no PostHog

1. Acesse: https://app.posthog.com/events
2. Filtre por: `$ai_generation`
3. Procure pelo evento com `distinct_id = "test-user-deploy"`
4. Verifique as propriedades:
   - `$ai_model`: `gemini-2.0-flash-exp`
   - `$ai_latency`: tempo em segundos
   - `$ai_total_tokens`: total de tokens
   - `$ai_trace_id`: `trace_deploy_test_001`

## 🧪 Testando no Aplicativo

### Passo 1: Recarregar o Aplicativo

Abra o navegador e recarregue: http://localhost:3000/restaurant/auri-monteiro

### Passo 2: Abrir o Chatbot

Clique no ícone do chatbot (💬) no canto inferior direito

### Passo 3: Enviar uma Mensagem

Digite: **"Qual o melhor prato do restaurante?"**

### Passo 4: Verificar Logs no Console

Abra o console do navegador (`F12` → Console`) e procure por:

```
[PostHog.js] send "$ai_generation"
```

### Passo 5: Verificar no PostHog

1. Acesse: https://app.posthog.com/llm-analytics/generations
2. Você deve ver o evento recém-criado
3. Clique nele para ver detalhes completos

## 📊 Dashboard do PostHog

### Criar um Dashboard Customizado

1. Acesse: https://app.posthog.com/dashboard
2. Clique em **"New Dashboard"**
3. Adicione os seguintes insights:

#### Insight 1: Total de Gerações por Dia
- **Event**: `$ai_generation`
- **Aggregate by**: Total count
- **Time range**: Last 7 days

#### Insight 2: Latência Média por Modelo
- **Event**: `$ai_generation`
- **Aggregate by**: Average of `$ai_latency`
- **Breakdown by**: `$ai_model`

#### Insight 3: Custo Total por Dia
- **Event**: `$ai_generation`
- **Aggregate by**: Sum of `$ai_total_cost_usd`
- **Time range**: Last 30 days

#### Insight 4: Tokens por Restaurante
- **Event**: `$ai_generation`
- **Aggregate by**: Sum of `$ai_total_tokens`
- **Breakdown by**: `restaurant_name`

## 🐛 Troubleshooting

### Erro: "Function not found"

**Causa**: Edge Function não foi deployed ou o nome está incorreto.

**Solução**:
```bash
npx supabase functions list
# Verifique se 'ai-chat' aparece na lista
```

### Erro: "API key do Google AI não configurada"

**Causa**: Variável `GOOGLE_AI_API_KEY` não está configurada no Supabase.

**Solução**:
1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/functions
2. Adicione a variável `GOOGLE_AI_API_KEY`
3. Redeploy: `npx supabase functions deploy ai-chat --no-verify-jwt`

### Erro: "PostHog API key não configurada"

**Causa**: Variável `POSTHOG_API_KEY` não está configurada.

**Solução**:
1. Obtenha a API Key em: https://app.posthog.com/settings/project#api-keys
2. Use a **Personal API Key** (começa com `phx_`)
3. Configure no Supabase
4. Redeploy

### Eventos não aparecem no PostHog

**Causa 1**: PostHog API Key incorreta

**Solução**: Verifique se está usando `phx_` (API Key) e não `phc_` (Public Key)

**Causa 2**: PostHog Host incorreto

**Solução**: Use `https://us.i.posthog.com` (com HTTPS) se estiver no data center US

**Causa 3**: Delay de processamento

**Solução**: Aguarde 10-30 segundos. O PostHog processa eventos em batch.

### Modelo ainda retorna erro 404

**Causa**: O modelo especificado não está disponível para sua API key.

**Solução**: Teste cada modelo individualmente:

```bash
# Testar gemini-2.0-flash-exp
curl https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: YOUR_GOOGLE_AI_API_KEY" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'

# Testar gemini-1.5-pro-latest
curl https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-latest:generateContent \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: YOUR_GOOGLE_AI_API_KEY" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

## ✅ Checklist de Deploy

- [ ] Variáveis de ambiente configuradas no Supabase
- [ ] Edge Function deployed (`npx supabase functions deploy ai-chat --no-verify-jwt`)
- [ ] Teste com cURL funcionou (retornou resposta da IA)
- [ ] Logs da Edge Function mostram tracking do PostHog
- [ ] Aplicativo recarregado
- [ ] Chatbot enviou mensagem com sucesso
- [ ] Evento `$ai_generation` aparece no PostHog
- [ ] Dashboard do PostHog criado (opcional)

## 📚 Documentação Relacionada

- [POSTHOG_LLM_ANALYTICS.md](./POSTHOG_LLM_ANALYTICS.md) - Documentação completa
- [TESTING_LLM_ANALYTICS.md](./TESTING_LLM_ANALYTICS.md) - Guia de testes
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [PostHog HTTP API](https://posthog.com/docs/api/post-only-endpoints)

## 🎉 Conclusão

Após seguir esses passos, sua Edge Function estará:

✅ Usando modelos do Gemini que funcionam  
✅ Capturando eventos LLM no PostHog  
✅ Rastreando latência, tokens e custos  
✅ Agrupando conversas com trace_id  

**Próximos passos sugeridos**:
- Configure alertas de custo no PostHog
- Crie dashboards personalizados
- Monitore a performance dos modelos
- Experimente diferentes configurações (temperature, top-p, etc.)
