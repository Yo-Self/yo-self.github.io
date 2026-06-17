# Runbook: Observabilidade Yo Self (Sentry + PostHog)

Guia operacional para configurar secrets, alertas e dashboards após o deploy do código.

---

## 1. GitHub Secrets

### web-version (`yo-self/web-version` ou equivalente)

| Secret | Valor |
|--------|-------|
| `NEXT_PUBLIC_SENTRY_DSN` | DSN do projeto **yo-self-cardapio** |
| `SENTRY_AUTH_TOKEN` | Token em Sentry → Settings → Auth Tokens (scope: `project:releases`) |
| `SENTRY_ORG` | Slug da org (ex: `yo-self`) |
| `SENTRY_PROJECT` | `yo-self-cardapio` |
| `NEXT_PUBLIC_POSTHOG_KEY` | Já existente |

### menu-mestre-facil (gestor)

| Secret | Valor |
|--------|-------|
| `VITE_POSTHOG_KEY` | API key do projeto PostHog do gestor |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` |
| `VITE_SENTRY_DSN` | DSN do projeto **yo-self-gestor-web** |
| `SENTRY_AUTH_TOKEN` | Mesmo token ou token dedicado |
| `SENTRY_ORG` | Slug da org |
| `SENTRY_PROJECT` | `yo-self-gestor-web` (build web) — desktop usa mesmo DSN |

---

## 2. Supabase Edge Functions Secrets

No [Supabase Dashboard](https://supabase.com/dashboard) → Project → Edge Functions → Secrets:

```
POSTHOG_API_KEY=phc_...
POSTHOG_HOST=https://us.i.posthog.com
SENTRY_DSN=https://...@o....ingest.sentry.io/...
SENTRY_ENVIRONMENT=production
GOOGLE_AI_API_KEY=...
```

Aplicam-se a **todos** os projetos que compartilham o mesmo Supabase (web-version + gestor).

Deploy das functions após configurar:

```bash
supabase functions deploy ai-chat stripe-checkout stripe-webhook infinitepay-checkout infinitepay-webhook scrape-ifood scrape-menudino
```

---

## 3. Projetos Sentry recomendados

| Projeto Sentry | App | DSN env var |
|----------------|-----|-------------|
| `yo-self-cardapio` | web-version (client) | `NEXT_PUBLIC_SENTRY_DSN` |
| `yo-self-gestor-web` | gestor SPA | `VITE_SENTRY_DSN` |
| `yo-self-gestor-electron` | opcional — mesmo DSN com tag `platform:electron` | `SENTRY_DSN` (main) |
| `yo-self-edge-functions` | opcional — ou usar tags `edge_function` num projeto só | `SENTRY_DSN` (Supabase) |

---

## 4. Alertas Sentry (configurar na UI)

### Crítico — Pagamento

**Alert rule:** Issues where `tags.edge_function` is one of:
- `stripe-checkout`
- `stripe-webhook`
- `infinitepay-checkout`
- `infinitepay-webhook`

**Ação:** Email + Slack (integração Sentry → Slack)

**Filtro adicional:** `level:error`, `environment:production`

### Alto — Cardápio client

**Alert rule:** Issues where `tags.app` = `web-version` AND `event.count` > 10 em 1h

### Alto — Gestor

**Alert rule:** Issues where `tags.app` = `menu-mestre-facil`

### Electron main

**Alert rule:** Issues where `environment` = `electron`

---

## 5. Dashboards PostHog

### Funil de pagamento (web-version)

Insight tipo **Funnel**, eventos em ordem:

1. `cart_checkout_started`
2. `payment_checkout_options_viewed`
3. `payment_method_clicked`
4. `payment_order_created`
5. `payment_completed` ou `purchase_completed`

Breakdown por `payment_method` e `restaurant_slug`.

### Adoção gestor

Funnel:

1. `user_registered` ou `user_logged_in`
2. `dish_created`
3. `menu_import_completed`
4. `pos_order_created`

Breakdown por `platform` (`web` vs `electron`).

### LLM costs

Insight **Trends** → evento `$ai_generation` → soma de `$ai_total_cost_usd` por dia, breakdown `$ai_model`.

---

## 6. Correlacionar Sentry ↔ PostHog

1. No Sentry issue, buscar tag `posthog_distinct_id`
2. No PostHog → Persons → colar o `distinct_id` → ver session replay e eventos
3. No PostHog evento `technical_error`, usar `sentry_event_id` para abrir o issue no Sentry

---

## 7. Validação pós-deploy

```bash
# Cardápio — erro de teste no console do browser
throw new Error('Sentry validation test')

# Gestor — após login, criar um prato e verificar evento dish_created no PostHog

# Edge function — forçar erro 400 e verificar issue no Sentry com tag edge_function
```

---

## 8. Incidentes comuns

| Sintoma | Verificar |
|---------|-----------|
| Zero eventos PostHog em prod gestor | GitHub Secrets `VITE_POSTHOG_*` no workflow |
| Source maps não resolvem stack | `SENTRY_AUTH_TOKEN` no CI + release = `github.sha` |
| Edge errors sem Sentry | Secret `SENTRY_DSN` no Supabase |
| LLM sem custo no PostHog | Secret `POSTHOG_API_KEY` no Supabase |
| OpenReplay ainda ativo | Remover `NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY` ou manter vazio com Sentry ativo |
