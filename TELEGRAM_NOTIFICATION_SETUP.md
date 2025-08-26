# Configuração de Notificações no Telegram para GitHub Actions

Este documento explica como configurar notificações automáticas no Telegram para os workflows do GitHub Actions.

## 📋 Pré-requisitos

1. **Bot do Telegram**: Você precisa criar um bot no Telegram
2. **Chat ID**: ID do grupo ou canal onde as notificações serão enviadas
3. **Secrets do GitHub**: Configurar as variáveis secretas no repositório

## 🤖 Passo 1: Criar um Bot no Telegram

1. Abra o Telegram e procure por `@BotFather`
2. Envie o comando `/newbot`
3. Escolha um nome para o bot
4. Escolha um username único (deve terminar com "bot")
5. Guarde o **token** fornecido pelo BotFather

## 👥 Passo 2: Obter o Chat ID

### Para um Grupo:
1. Adicione o bot ao grupo
2. Envie uma mensagem no grupo
3. Acesse: `https://api.telegram.org/bot<SEU_TOKEN>/getUpdates`
4. Procure pelo `chat.id` do grupo (será um número negativo)

### Para um Canal:
1. Adicione o bot como administrador do canal
2. Envie uma mensagem no canal
3. Acesse: `https://api.telegram.org/bot<SEU_TOKEN>/getUpdates`
4. Procure pelo `chat.id` do canal (será um número negativo)

## 🔐 Passo 3: Configurar Secrets no GitHub

1. Vá para o seu repositório no GitHub
2. Clique em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione os seguintes secrets:

```
TELEGRAM_BOT_TOKEN = <token_do_seu_bot>
TELEGRAM_CHAT_ID = <chat_id_do_grupo_ou_canal>
```

## 📱 Passo 4: Testar a Configuração

1. Faça um push para a branch `main` ou `develop`
2. Verifique se as notificações chegam no Telegram
3. As notificações incluirão:
   - Status do workflow (✅ Sucesso, ❌ Falha, ⚠️ Cancelado)
   - Nome do workflow
   - Branch executada
   - Link para ver a execução
   - Data e hora da execução

## 🔧 Workflows Configurados

### 1. Deploy Next.js (nextjs.yml)
- **Trigger**: Push para `main`
- **Notificações**: Sucesso/falha do build e deploy
- **Mensagem**: Status da publicação no GitHub Pages

### 2. Testes Playwright (playwright.yml)
- **Trigger**: Push para `main` ou `develop`, Pull Requests
- **Notificações**: Sucesso/falha dos testes
- **Mensagem**: Status da execução dos testes

## 📝 Estrutura das Mensagens

As notificações seguem este formato:

```
🤖 GitHub Actions - [Nome do Workflow]

📋 Status: ✅ Sucesso / ❌ Falha / ⚠️ Cancelado

🌿 Branch: [Nome da branch]

📝 Detalhes: [Descrição detalhada]

🔗 Ver execução: [Link para o GitHub]

⏰ Executado em: [Data e hora]
```

## 🚨 Troubleshooting

### Bot não envia mensagens:
1. Verifique se o token está correto
2. Confirme se o bot foi adicionado ao grupo/canal
3. Verifique se o bot tem permissões para enviar mensagens

### Chat ID incorreto:
1. Use o comando `/getUpdates` para verificar o ID correto
2. Certifique-se de que o bot está no grupo/canal

### Secrets não funcionam:
1. Verifique se os nomes dos secrets estão exatamente como especificado
2. Confirme se os secrets foram criados no repositório correto

## 🔄 Personalização

Para personalizar as mensagens, edite os arquivos:
- `.github/workflows/telegram-notification.yml` - Formato geral das mensagens
- `.github/workflows/nextjs.yml` - Mensagens específicas do deploy
- `.github/workflows/playwright.yml` - Mensagens específicas dos testes

## 📚 Recursos Adicionais

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [appleboy/telegram-action](https://github.com/appleboy/telegram-action)
