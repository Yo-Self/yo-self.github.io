# 🔧 Solução para Chatbot no GitHub Pages

## Problema
O chatbot não funciona no GitHub Pages porque o GitHub Pages é um serviço de hospedagem estática e não suporta APIs server-side (como as rotas `/api/ai/chat` do Next.js).

## Soluções

### Solução 1: Edge Function do Supabase (Recomendada)

1. **Fazer deploy da Edge Function**:
   - Siga as instruções em `deploy-edge-function.md`
   - Ou use o dashboard do Supabase para criar a Edge Function manualmente

2. **Configurar variáveis de ambiente no GitHub**:
   - Vá em Settings > Secrets and variables > Actions
   - Adicione as seguintes variáveis:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `GOOGLE_AI_API_KEY`

3. **Fazer novo deploy**:
   ```bash
   git add .
   git commit -m "Fix chatbot for GitHub Pages"
   git push
   ```

### Solução 2: Versão Fallback (Temporária)

Se você não conseguir configurar a Edge Function imediatamente, pode usar a versão fallback:

1. **Renomear os arquivos**:
   ```bash
   mv src/hooks/useWebLLM.ts src/hooks/useWebLLM-original.ts
   mv src/hooks/useWebLLM-fallback.ts src/hooks/useWebLLM.ts
   ```

2. **Fazer deploy**:
   ```bash
   git add .
   git commit -m "Use fallback chatbot for GitHub Pages"
   git push
   ```

### Solução 3: Migrar para Vercel

Se você quiser manter a funcionalidade completa, considere migrar para o Vercel:

1. **Conectar repositório ao Vercel**:
   - Vá para [vercel.com](https://vercel.com)
   - Importe seu repositório do GitHub
   - Configure as variáveis de ambiente

2. **Vantagens do Vercel**:
   - Suporte completo a APIs do Next.js
   - Deploy automático
   - Melhor performance

## Verificação

Após implementar qualquer solução:

1. **Teste localmente**:
   ```bash
   npm run build
   npm start
   ```

2. **Teste no GitHub Pages**:
   - Acesse sua URL do GitHub Pages
   - Clique no botão do chatbot
   - Verifique se funciona

## Status Atual

- ✅ **Ícone alterado** para balão de chat
- ✅ **Build corrigido** - Edge Function movida para fora do diretório de compilação
- ❌ **API server-side** não funciona no GitHub Pages
- 🔄 **Edge Function** pronta para deploy
- 🔄 **Fallback** disponível

## Próximos Passos

1. Escolha uma das soluções acima
2. Implemente a solução
3. Teste o funcionamento
4. Atualize a documentação se necessário

## Suporte

Se você precisar de ajuda:
1. Verifique os logs do GitHub Actions
2. Teste localmente primeiro
3. Consulte a documentação do Supabase
4. Abra uma issue no repositório
