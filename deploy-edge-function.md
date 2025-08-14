# Deploy da Edge Function do Supabase

Para fazer o chatbot funcionar no GitHub Pages, você precisa fazer o deploy da Edge Function do Supabase.

## Passos:

### 1. Instalar Supabase CLI
```bash
# Usando npm (pode dar erro de permissão)
npm install -g supabase

# Ou usando Homebrew (recomendado)
brew install supabase/tap/supabase
```

### 2. Fazer login no Supabase
```bash
supabase login
```

### 3. Inicializar o projeto (se não estiver inicializado)
```bash
supabase init
```

### 4. Fazer o deploy da Edge Function
```bash
supabase functions deploy ai-chat
```

### 5. Configurar variáveis de ambiente
No dashboard do Supabase, vá em Settings > Edge Functions e adicione:
- `GOOGLE_AI_API_KEY`: Sua chave da API do Google AI

### 6. Verificar se funcionou
A Edge Function estará disponível em:
`https://seu-projeto.supabase.co/functions/v1/ai-chat`

## Alternativa: Deploy Manual

Se o CLI não funcionar, você pode:

1. Ir ao dashboard do Supabase
2. Navegar para Edge Functions
3. Criar uma nova função chamada `ai-chat`
4. Copiar o código do arquivo `supabase/functions/ai-chat/index.ts`
5. Fazer o deploy

## Configuração das Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no GitHub Pages:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `GOOGLE_AI_API_KEY`: Chave da API do Google AI (configurada na Edge Function)

## Teste

Após o deploy, o chatbot deve funcionar corretamente no GitHub Pages!
