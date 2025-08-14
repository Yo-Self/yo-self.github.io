# 🔧 Configuração das Variáveis de Ambiente

## Problema Identificado

O chatbot está retornando erro 404 porque as variáveis de ambiente do Supabase não estão configuradas:
```
POST /restaurant/e1f70b34-20f5-4e08-9b68-d801ca33ee54/undefined/functions/v1/ai-chat/ 404
```

**✅ CORRIGIDO**: O código agora usa `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (com prefixo NEXT_PUBLIC_ para disponibilidade no cliente).

## Solução

### 1. Criar arquivo `.env.local`

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```bash
# PostHog Configuration
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# OpenReplay Configuration
NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY=your_openreplay_project_key_here

# Site URL (optional)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Configuration (REQUERIDO para o chatbot)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

### 2. Obter as Credenciais do Supabase

1. **Acesse o Dashboard do Supabase**:
   - Vá para [supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecione seu projeto

2. **Copie as credenciais**:
   - Vá em **Settings > API**
   - Copie a **Project URL** (ex: `https://wulazaggdihidadkhilg.supabase.co`)
   - Copie a **anon public** key

3. **Configure no `.env.local`**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://wulazaggdihidadkhilg.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 3. Reiniciar o Servidor

Após criar o arquivo `.env.local`:

```bash
# Parar o servidor (Ctrl+C)
# Reiniciar
npm run dev
```

### 4. Verificar se Funcionou

1. **Abra o console do navegador** (F12)
2. **Faça uma pergunta** no chatbot
3. **Verifique a URL** da requisição:
   - ✅ Deve ser: `https://seu-projeto.supabase.co/functions/v1/ai-chat`
   - ❌ Não deve ser: `/undefined/functions/v1/ai-chat`

## Para Produção (GitHub Pages)

Configure as variáveis no GitHub:

1. **Vá para o repositório** no GitHub
2. **Settings > Secrets and variables > Actions**
3. **Adicione as variáveis**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Teste

Após configurar:

1. **Pergunte ao chatbot**: "Quais são os pratos principais?"
2. **Verifique se funciona** sem erros 404
3. **Confirme se os cards** dos pratos aparecem

## Troubleshooting

### Erro 404 persistente:
- ✅ Verifique se o `.env.local` foi criado corretamente
- ✅ Confirme se as credenciais do Supabase estão corretas
- ✅ Reinicie o servidor após criar o arquivo

### Edge Function não responde:
- ✅ Verifique se a Edge Function está deployada
- ✅ Confirme se a variável `GOOGLE_AI_API_KEY` está configurada no Supabase

### Variáveis não carregam:
- ✅ Verifique se o arquivo está na raiz do projeto
- ✅ Confirme se não há espaços extras nas variáveis
- ✅ Reinicie o servidor de desenvolvimento

A configuração das variáveis de ambiente é essencial para o funcionamento do chatbot! 🔧
