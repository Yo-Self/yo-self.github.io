# ⚠️ Atualização Importante: Modelos de IA

## O que mudou?

Atualizamos os modelos de IA usados no chatbot devido a incompatibilidades com a API do Google.

### Antes
- ❌ `gemma-3-superto` (não disponível na API v1)
- ❌ `gemma-3-flash` (não disponível na API v1)
- ❌ `gemini-1.5-flash` (não disponível na API v1)

### Agora
- ✅ `gemini-2.0-flash-exp` (principal) - Mais novo e rápido
- ✅ `gemini-1.5-pro` (fallback 1) - Mais completo
- ✅ `gemini-pro` (fallback 2) - Estável

## Por que a mudança?

O erro que você recebeu:

```
[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent: 
[404 Not Found] models/gemini-1.5-flash is not found for API version v1
```

Indica que os modelos que estávamos usando não estão disponíveis na versão atual da API do Google Generative AI.

## Benefícios da nova configuração

### 1. **Gemini 2.0 Flash Exp**
- Modelo experimental mais recente da Google
- Otimizado para velocidade e qualidade
- Ideal para chatbots e assistentes virtuais

### 2. **Gemini 1.5 Pro**
- Modelo mais robusto e completo
- Melhor compreensão de contexto
- Mais preciso em tarefas complexas

### 3. **Gemini Pro**
- Modelo estável e confiável
- Amplamente testado e documentado
- Garantia de disponibilidade

## Sistema de Fallback Inteligente

O sistema agora tenta os modelos em sequência:

```
1. Tenta Gemini 2.0 Flash Exp
   ↓ (se falhar)
2. Tenta Gemini 1.5 Pro
   ↓ (se falhar)
3. Tenta Gemini Pro
   ↓ (se falhar)
4. Retorna erro detalhado
```

Isso garante máxima disponibilidade do serviço!

## O que você precisa fazer?

### Nada! 🎉

As mudanças são automáticas e transparentes. O código já foi atualizado nos seguintes arquivos:

1. ✅ `src/app/api/ai/chat/route.ts` - API local
2. ✅ `supabase-functions/ai-chat/index.ts` - Edge Function
3. ✅ `README.md` - Documentação
4. ✅ `GOOGLE_AI_SETUP.md` - Guia de setup

### Próximos passos

Se você estiver usando a Edge Function do Supabase, faça o deploy:

```bash
supabase functions deploy ai-chat
```

Se estiver usando apenas local, apenas reinicie o servidor:

```bash
npm run dev
```

## Compatibilidade

### API Google Generative AI
- ✅ Compatível com `@google/generative-ai` v0.2.1+
- ✅ Suporta API v1 e v1beta
- ✅ Funciona em Deno (Edge Functions) e Node.js

### Limitações

Todos os modelos têm o tier gratuito da API:
- **Requisições por minuto:** 15
- **Requisições por dia:** 1.500
- **Tokens por minuto:** 1.000.000

## Referências

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Models Available](https://ai.google.dev/gemini-api/docs/models)

## Histórico de Mudanças

### v2.0.0 (9 de outubro de 2025)
- ✅ Migração para Gemini 2.0 Flash Exp
- ✅ Sistema de fallback com 3 modelos
- ✅ Melhor tratamento de erros
- ✅ Documentação atualizada

### v1.0.0 (anterior)
- ❌ Usava modelos Gemma 3 (incompatíveis)
- ❌ Fallback limitado
- ❌ Erros 404 frequentes
