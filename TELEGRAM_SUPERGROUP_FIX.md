# Solução para Notificações do Telegram em Supergrupos

## 🚨 Problema Identificado

O erro "group chat was upgraded to a supergroup chat" indica que o grupo foi convertido para um supergrupo com abas (forum). Neste caso, as notificações precisam especificar o `message_thread_id` para aparecerem na aba correta.

## 🔍 Análise da Mensagem Recebida

Baseado na mensagem que você recebeu:

```json
{
  "chat": {
    "id": -1002990879666,
    "title": "Yo-Self",
    "is_forum": true,
    "type": "supergroup"
  },
  "message_thread_id": 2,
  "forum_topic_created": {
    "name": "CI/CD",
    "icon_color": 16478047,
    "icon_custom_emoji_id": "5348436127038579546"
  }
}
```

**Configurações identificadas:**
- **Chat ID:** `-1002990879666`
- **Message Thread ID:** `2` (aba CI/CD)
- **Tipo:** `supergroup` com `is_forum: true`

## ✅ Solução Implementada

### 1. Workflows Atualizados

Criamos novos workflows que usam a API direta do Telegram com `message_thread_id`:

- **`nextjs-supergroup.yml`** - Deploy Next.js com notificações para a aba CI/CD
- **`playwright-supergroup.yml`** - Testes Playwright com notificações para a aba CI/CD
- **`notify-playwright-supergroup.yml`** - Notificações de workflow_run para a aba CI/CD

### 2. Diferença Principal

**Antes (action appleboy/telegram-action):**
```yaml
- name: Send notification
  uses: appleboy/telegram-action@v0.0.9
  with:
    to: ${{ secrets.TELEGRAM_CHAT_ID }}
    token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    message: "Mensagem..."
```

**Depois (API direta do Telegram):**
```yaml
- name: Send notification to CI/CD tab
  run: |
    curl -X POST \
      "https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage" \
      -H "Content-Type: application/json" \
      -d '{
        "chat_id": "${{ secrets.TELEGRAM_CHAT_ID }}",
        "message_thread_id": 2,
        "text": "Mensagem...",
        "parse_mode": "Markdown"
      }'
```

## 🔧 Como Usar

### Opção 1: Substituir Workflows Existentes

1. Renomeie os arquivos antigos:
   ```bash
   mv .github/workflows/nextjs.yml .github/workflows/nextjs-old.yml
   mv .github/workflows/playwright.yml .github/workflows/playwright-old.yml
   mv .github/workflows/notify-playwright-telegram.yml .github/workflows/notify-playwright-telegram-old.yml
   ```

2. Renomeie os novos workflows:
   ```bash
   mv .github/workflows/nextjs-supergroup.yml .github/workflows/nextjs.yml
   mv .github/workflows/playwright-supergroup.yml .github/workflows/playwright.yml
   mv .github/workflows/notify-playwright-supergroup.yml .github/workflows/notify-playwright-telegram.yml
   ```

### Opção 2: Manter Ambos e Testar

1. Mantenha os workflows antigos
2. Execute o workflow de teste: `test-telegram-supergroup.yml`
3. Verifique se as notificações aparecem na aba CI/CD
4. Se funcionar, substitua os workflows antigos

## 🧪 Teste das Notificações

### Workflow de Teste Automático

O workflow `test-telegram-supergroup.yml` executa automaticamente:
- **Agendado:** Toda segunda-feira às 12:00
- **Manual:** Via `workflow_dispatch`
- **Testes:** Envia mensagens de teste para a aba CI/CD

### Teste Manual via API

Você pode testar diretamente via curl:

```bash
curl -X POST \
  "https://api.telegram.org/bot<SEU_TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "-1002990879666",
    "message_thread_id": 2,
    "text": "🧪 Teste de notificação para a aba CI/CD",
    "parse_mode": "Markdown"
  }'
```

## 📱 Verificação

### O que verificar:

1. **Mensagens aparecem na aba CI/CD** (não na aba geral)
2. **Formatação Markdown** está funcionando
3. **Links clicáveis** para o GitHub
4. **Emojis** são exibidos corretamente

### Se ainda não funcionar:

1. Verifique se o `message_thread_id` está correto
2. Confirme se o bot tem permissões no supergrupo
3. Teste com diferentes formatos de mensagem
4. Verifique os logs do GitHub Actions

## 🔄 Próximos Passos

1. **Execute o workflow de teste** para verificar a funcionalidade
2. **Substitua os workflows antigos** pelos novos
3. **Teste com um push** para a branch main
4. **Monitore as notificações** na aba CI/CD do supergrupo

## 📚 Recursos Adicionais

- [Telegram Bot API - sendMessage](https://core.telegram.org/bots/api#sendmessage)
- [GitHub Actions - Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Supergrupos e Fóruns do Telegram](https://core.telegram.org/api/forum)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do GitHub Actions
2. Teste a API do Telegram diretamente
3. Confirme as configurações do bot
4. Verifique as permissões no supergrupo
