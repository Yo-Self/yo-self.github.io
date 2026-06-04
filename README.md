# 🍽️ Cardápio Digital - Web Version

Uma aplicação moderna, interativa e premium de cardápio digital para restaurantes, com chatbot inteligente alimentado pela API oficial do **Google Gemini 2.5 Flash**.

## ✨ Funcionalidades de Destaque

### 🛵 Canais de Atendimento Separados (Mesa vs. Delivery)
- **Consumo Local / Mesa (`/restaurant/[slug]`)**:
  - Identificação de mesa física por URL (`?table=XX`) com salvamento e limpeza inteligente de rota.
  - Omissão completa de formulários de entrega para agilizar o fluxo local.
  - **🔔 Chamadas de Garçom**: Chamador de garçom em tempo real integrado à Edge Function `waiter-calls` para suporte direto à mesa.
- **Pedidos Delivery (`/delivery/[slug]`)**:
  - Ocultação do cabeçalho da home para manter o foco total do cliente no cardápio de entrega.
  - Formulário completo de dados de entrega (Nome, Endereço, Número, Complemento).
  - Campo de endereço robusto com busca integrada ao **Google Places Autocomplete** (restringido para o Brasil).
  - **Cálculo Dinâmico de Frete & Cobertura**: Integração do utilitário `deliveryCalculator.ts` que determina a distância exata do cliente ao restaurante via algoritmo de Haversine e calcula a taxa padrão (`Taxa Base + Distância * Valor/Km`).
  - **Círculos e Polígonos de Exclusão**: Valida o endereço do cliente contra as regras geográficas do restaurante. Se o cliente estiver acima da distância limite ou dentro de uma zona de exclusão desenhada pelo gestor:
    - Exibe um banner visual premium em vermelho alertando sobre a falta de cobertura.
    - **Bloqueia e desabilita completamente as opções de checkout** por WhatsApp e Stripe.
    - Se o cliente estiver dentro de uma zona com taxa especial cadastrada, o sistema aplica a taxa fixa correspondente no subtotal.
  - **Integração Completa de Checkout & Feature Flags**:
    - Os meios de pagamento online (Stripe e InfinitePay PIX) são controlados de forma centralizada pelo switch **Permitir Fazer Pedidos Online** (`online_ordering_enabled`). Se desligado no gestor, ambos os meios de pagamento online são ocultados do carrinho.
    - **WhatsApp Checkout**: Disponível caso ativado pelo switch independente **Pedir pelo WhatsApp** (`whatsapp_enabled`) e configurado número de telefone. Envia os dados completos de pedido e delivery formatados no WhatsApp.
    - **Stripe Checkout**: Mapeia o frete como uma linha separada na transação online, atualizando o banco de dados ao concluir o pagamento.
    - **PIX (InfinitePay)**: Exibido sob a flag `pix_payment_enabled` (e se o master de Pedidos Online estiver ativo), integrando com as Edge Functions para checkout dinâmico.

### 💰 Configuração e Bloqueio de Pedido Mínimo
- **Validação de Subtotal**: Exibição de um banner visual e amigável no carrinho de compras quando o valor mínimo estipulado pelo restaurante não for atingido.
- **Bloqueio de Checkout**: Ocultação automática dos botões de finalização por WhatsApp e Stripe se o subtotal for menor que o pedido mínimo do estabelecimento para economizar espaço em tela e evitar poluição visual na comanda.

### 🕒 Controle de Abertura & Fechamento
- **Validação de Status**: O cardápio digital verifica se o estabelecimento está aberto (`open === true` no painel do gestor).
- **Banner de Alerta**: Se o restaurante estiver fechado, exibe um banner vermelho premium no cabeçalho indicando o status e disponibilizando um menu expansível com os horários de funcionamento de cada dia da semana.
- **Bloqueio de Pedidos**: Oculta automaticamente todos os botões de adicionar itens à comanda (no DishModal) e os botões de checkout no carrinho de compras (CartModal), prevenindo novos pedidos enquanto estiver fechado.

### 🍳 Roteamento Inteligente de Pedidos e Controle de Cozinha
- **Detecção de Preparação**: Os itens do cardápio possuem o campo `needs_preparation` vindo do banco de dados (Supabase) via mapeamento na API.
- **Roteamento Inteligente de Checkout**: Ao realizar pedidos via WhatsApp ou Stripe, a flag `sent_to_kitchen` é automaticamente calculada para cada item (verdadeiro se o prato precisa de preparo na cozinha, falso caso contrário), permitindo que o gestor receba pedidos mistos organizados na cozinha sem misturar itens prontos e mantendo a experiência do cliente idêntica e sem atritos visuais.

### 🤖 Assistente Virtual IA com Gemini 2.0 Flash
- **Inteligência Conversacional**: Assistente integrado ao cardápio com suporte a comandos de voz e fallbacks resilientes de modelos (`gemini-2.0-flash-exp` -> `gemini-1.5-pro` -> `gemini-pro`).
- **Navegação Assistida**: Destaques de pratos sugeridos na conversa são formatados como cartões interativos e clicáveis para abrir detalhes de complements instantaneamente.
- **Leitura de Respostas por Voz**: Síntese de voz com o recurso Text-To-Speech calibrado para a voz pt-BR.

### 🎨 Outros Diferenciais Premium
- 📱 **Interface Responsiva**: Design moderno, adaptável e extremamente polido (com suporte completo a tema escuro).
- 📦 **PWA Instalável**: Service worker (`sw.js`) e manifesto atualizado em tempo real para permitir instalação como aplicativo no celular.
- 📊 **Analytics Avançado**: Integração com PostHog (eventos, LLM analytics, taxas de cliques) e OpenReplay.

### 📈 Funil de pagamento no PostHog

Todos os meios de checkout disparam eventos normalizados (`src/lib/paymentAnalytics.ts`) com propriedades compartilhadas para funis e dashboards:

| Evento | Quando |
|--------|--------|
| `payment_checkout_options_viewed` | Comanda aberta com botões de pagamento visíveis |
| `payment_method_clicked` | Clique em WhatsApp, PIX, cartão ou wallet |
| `payment_validation_failed` | Formulário incompleto antes do checkout |
| `payment_order_created` | Pedido criado no Supabase (`pending_payment` ou equivalente) |
| `payment_checkout_session_created` | Sessão Stripe / checkout InfinitePay criada |
| `payment_redirect_started` | Redirecionamento para gateway ou WhatsApp |
| `payment_return_received` | Retorno com `?payment_success` ou cancelamento |
| `payment_verification_*` | Confirmação pós-retorno (Stripe polling / PIX NSU) |
| `payment_completed` | Pagamento confirmado (também dispara `purchase_completed`) |
| `payment_cancelled` / `payment_failed` | Abandono ou erro |
| `payment_wallet_available` / `payment_wallet_unavailable` | Apple Pay / Google Pay no carrinho |

Propriedades úteis em breakdowns: `payment_method`, `payment_provider`, `funnel_step`, `order_id`, `restaurant_id`, `order_type`, `delivery_mode`, `total_value_cents`, `delivery_fee_cents`, `duration_ms`, `wallet_apple_pay`, `wallet_google_pay`.

Métodos: `whatsapp`, `infinitepay_pix`, `stripe_card`, `stripe_express`, `send_order_direct`.

## 🚀 Chatbot com Google Gemini AI

O chatbot agora usa os **modelos Gemini mais recentes** da Google, oferecendo:

- ⚡ **Velocidade**: Respostas em segundos
- 🧠 **Qualidade**: Melhor compreensão e respostas mais naturais
- 💪 **Confiabilidade**: Sistema de fallback automático com múltiplos modelos
- 🎯 **Precisão**: Informações precisas sobre pratos e preços

### Modelos Disponíveis

1. **🚀 Gemini 2.5 Flash** (Padrão) - Modelo mais recente e inteligente
2. **⚡ Gemini 2.0 Flash** (Fallback 1) - Intermediário rápido
3. **💎 Gemini 1.5 Pro** (Fallback 2) - Completo e robusto
4. **⚡ Gemini 1.5 Flash** (Fallback 3) - Econômico

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS 4
- **IA**: Google Generative AI (Gemma 3 SuperTo)
- **Backend**: Supabase Edge Functions
- **Analytics**: PostHog, OpenReplay
- **Deploy**: GitHub Pages

## 🚀 Getting Started

### Pré-requisitos

- Node.js 18+
- Conta no Supabase
- Chave da API do Google AI

### Instalação

1. **Clone o repositório**:
   ```bash
   git clone <repository-url>
   cd web-version
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   ```bash
   cp env.example .env.local
   ```
   
   Edite `.env.local` com suas configurações:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
   NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY=your_openreplay_key
   ```
   
   **📚 [Veja o guia completo de configuração da Google AI API](GOOGLE_AI_SETUP.md)**

4. **Configure o Supabase**:
   - Crie um projeto no [Supabase](https://supabase.com)
   - Configure a Edge Function `ai-chat`
   - Adicione a variável `GOOGLE_AI_API_KEY` nas configurações

5. **Execute o projeto**:
   ```bash
   npm run dev
   ```

6. **Acesse**: [http://localhost:3000](http://localhost:3000)

## 🧪 Testando

### Chatbot AI
Execute o script de teste para verificar se o chatbot está funcionando:

```bash
node test-gemma3.js
```

**Nota:** Este script ainda funciona mesmo após a migração para Gemini 2.0.

### Funcionalidade de Voz
Para testar a funcionalidade de text-to-speech:

```bash
node test-voice.js
```

## 📱 Notificações no Telegram

O projeto inclui notificações automáticas no Telegram para todos os workflows do GitHub Actions:

- ✅ **Deploy**: Notificações de sucesso/falha do build e deploy
- 🧪 **Testes**: Notificações de sucesso/falha dos testes Playwright
- 🔔 **Teste Manual**: Workflow para testar as notificações

### Configuração
Veja o arquivo [TELEGRAM_NOTIFICATION_SETUP.md](./TELEGRAM_NOTIFICATION_SETUP.md) para instruções detalhadas de configuração.

### Teste das Notificações
Para testar se as notificações estão funcionando:
1. Vá para a aba **Actions** no GitHub
2. Execute o workflow **"Test Telegram Notification"**
3. Verifique se a mensagem chega no seu grupo/canal do Telegram

Ou abra o console do navegador e execute o código fornecido pelo script.

## 📚 Documentação

- [📖 Setup do Ambiente](SETUP_ENVIRONMENT.md)
- [🚀 Deploy da Edge Function](DEPLOY_EDGE_FUNCTION.md)
- [🤖 Migração para Gemma 3](GEMMA_3_MIGRATION.md)
- [🔊 Funcionalidade de Voz](VOICE_FEATURE.md)
- [📊 Configuração de Analytics](ANALYTICS_SETUP.md)

## 🏗️ Estrutura do Projeto

```
web-version/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # Componentes React
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Bibliotecas e configurações
│   ├── services/           # Serviços de API
│   └── types/              # Definições TypeScript
├── supabase-functions/     # Edge Functions do Supabase
├── public/                 # Arquivos estáticos
└── docs/                   # Documentação
```

## 🚀 Deploy

### GitHub Pages

```bash
npm run build
npm run deploy
```

### Vercel

```bash
npm run build
# Deploy via Vercel CLI ou GitHub integration
```

## 🔧 Configuração Avançada

### Edge Function

A Edge Function `ai-chat` está configurada para usar o Gemini 2.0 Flash com fallback automático. Para atualizar:

```bash
supabase functions deploy ai-chat
```

### Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase | ✅ |
| `NEXT_PUBLIC_POSTHOG_KEY` | Chave do PostHog | ❌ |
| `NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY` | Chave do OpenReplay | ❌ |
| `GOOGLE_AI_API_KEY` | Chave da API do Google AI (Supabase) | ✅ |
| `NEXT_PUBLIC_INFINITEPAY_DEV_ENABLED` | `true` em dev local para exibir botão PIX sem alterar o banco | ❌ |
| `NEXT_PUBLIC_INFINITEPAY_DEV_HANDLE` | InfiniteTag de testes (ex.: `jessemonteiro`) | ❌ |
| `INFINITEPAY_DEV_HANDLE` | Secret na Edge Function `infinitepay-checkout` (mesmo handle, só staging) | ❌ |
| `INFINITEPAY_WEBHOOK_SECRET` | Secret do webhook InfinitePay (`X-Callback-Signature`, HMAC-SHA256 do body). Se definido, requisições sem assinatura válida são rejeitadas | ❌ |

### PIX InfinitePay (opt-in)

```bash
supabase functions deploy infinitepay-checkout
supabase functions deploy infinitepay-webhook --no-verify-jwt
```

Habilitar por restaurante no Supabase:

```sql
UPDATE restaurants
SET infinitepay_handle = 'jessemonteiro', pix_payment_enabled = true
WHERE slug = 'meu-teste';
```

Cadastre a URL do site em **InfinitePay → Configurações → Link integrado**.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- 📖 [Documentação](SETUP_ENVIRONMENT.md)
- 🐛 [Issues](https://github.com/seu-usuario/web-version/issues)
- 💬 [Discussions](https://github.com/seu-usuario/web-version/discussions)

---

Desenvolvido com ❤️ usando Next.js e Google Gemini 2.5 Flash
