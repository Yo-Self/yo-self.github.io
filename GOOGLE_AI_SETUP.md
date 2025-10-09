# Configuração da Google AI API Key

Este documento explica como configurar a Google AI API Key para o chatbot funcionar corretamente.

## Problema

Se você está vendo a mensagem **"Desculpe, ocorreu um erro: Erro na comunicação com a IA"**, provavelmente a API Key do Google AI não está configurada.

## Solução

### 1. Obter a Google AI API Key

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. Copie a chave gerada

### 2. Configurar para Desenvolvimento Local

Crie ou edite o arquivo `.env.local` na raiz do projeto e adicione:

```env
GOOGLE_AI_API_KEY=sua_chave_aqui
```

**Importante:** Nunca commite este arquivo no Git. Ele já está no `.gitignore`.

### 3. Configurar no Supabase (Produção)

#### Método 1: Via Dashboard

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Settings** → **Edge Functions**
3. Na seção **Secrets**, clique em **Add new secret**
4. Nome: `GOOGLE_AI_API_KEY`
5. Valor: Cole sua chave do Google AI
6. Clique em **Save**

#### Método 2: Via CLI

```bash
supabase secrets set GOOGLE_AI_API_KEY=sua_chave_aqui
```

### 4. Reiniciar o Servidor de Desenvolvimento

Após configurar, reinicie o servidor:

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

## Como Funciona

O sistema tem dois métodos de comunicação com a IA:

1. **Supabase Edge Function** (`ai-chat`): Método principal
2. **API Route Local** (`/api/ai/chat`): Fallback automático

Se a Edge Function falhar (por exemplo, API key não configurada no Supabase), o sistema automaticamente tenta usar a API local.

## Modelos Disponíveis

### Edge Function (Supabase)
- **Gemini 2.0 Flash Exp** (principal) - Mais novo e rápido
- **Gemini 1.5 Pro** (fallback 1) - Mais completo
- **Gemini Pro** (fallback 2) - Estável

### API Local
- **Gemini 2.0 Flash Exp** (principal) - Mais novo e rápido
- **Gemini 1.5 Pro** (fallback 1) - Mais completo
- **Gemini Pro** (fallback 2) - Estável

## Verificar Configuração

### Desenvolvimento Local

Abra o console do navegador e procure por:
- ✅ **Sucesso:** Nenhum erro relacionado à API
- ❌ **Erro:** "API key não configurada" ou "Erro na comunicação com a IA"

### Produção (Supabase)

```bash
# Verificar logs da Edge Function
supabase functions logs ai-chat

# Testar Edge Function
curl -X POST https://seu-projeto.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer sua_anon_key" \
  -H "Content-Type: application/json" \
  -d '{"message":"Olá","restaurantData":{},"chatHistory":[]}'
```

## Troubleshooting

### Erro: "API key não configurada"

**Causa:** `GOOGLE_AI_API_KEY` não está definida ou está vazia

**Solução:**
1. Verifique se o arquivo `.env.local` existe e contém a chave
2. Reinicie o servidor de desenvolvimento
3. Limpe o cache do navegador

### Erro: "Erro 500" da Edge Function

**Causa:** API key não configurada no Supabase ou modelo não disponível

**Solução:**
1. Configure a API key no Supabase Dashboard
2. Aguarde alguns segundos para propagar a configuração
3. Se o problema persistir, o sistema usará o fallback local automaticamente

### Fallback Local Sempre Ativado

**Sintoma:** Console mostra "Edge Function falhou, tentando fallback local"

**Causa:** Problemas na Edge Function do Supabase

**Possíveis causas:**
- API key não configurada no Supabase
- Edge Function não foi deployada
- URL do Supabase incorreta em `.env.local`

**Solução:**
1. Verifique as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Deploy a Edge Function:
   ```bash
   supabase functions deploy ai-chat
   ```
3. Configure a API key no Supabase

## Limitações

### Google AI API (Gratuito)

- **Requisições por minuto:** 15
- **Requisições por dia:** 1.500
- **Tokens por minuto:** 1 milhão

Se você exceder esses limites, verá erros de quota. Considere:
- Adicionar rate limiting no frontend
- Fazer upgrade para plano pago
- Implementar cache de respostas

## Referências

- [Google AI Studio](https://aistudio.google.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentação do Gemini](https://ai.google.dev/gemini-api/docs)
