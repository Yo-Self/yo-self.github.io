# Checklist: Sentry + PostHog (Yo Self)

## Legenda
- [x] Concluído (código)
- [ ] Ação manual (UI / secrets)

---

## Fase 0 — Secrets (manual)

- [ ] GitHub Secrets nos dois repositórios → ver [OBSERVABILITY_RUNBOOK.md](./OBSERVABILITY_RUNBOOK.md)
- [ ] Supabase secrets: `POSTHOG_API_KEY`, `SENTRY_DSN`, `GOOGLE_AI_API_KEY`
- [ ] Criar projetos no Sentry (cardápio, gestor, opcional edge)

---

## Fase 1 — web-version ✅

- [x] Sentry client + observability layer
- [x] Error boundaries migrados
- [x] PostHog `capture_exceptions` off
- [x] Edge Functions pagamento + ai-chat com Sentry
- [x] `menu_load_completed` / `menu_load_failed`
- [x] OpenReplay desligado quando Sentry está configurado
- [x] `_shared/posthog-llm.ts`

---

## Fase 2 — gestor ✅

- [x] Sentry web + Electron
- [x] PostHog enrichment + analytics wired
- [x] Edge Functions com Sentry
- [x] PostHog LLM no `ai-chat`
- [x] CI com PostHog + Sentry

---

## Fase 3 — Operação (manual na UI)

- [ ] Alertas Sentry (pagamento, apps) → [RUNBOOK §4](./OBSERVABILITY_RUNBOOK.md#4-alertas-sentry-configurar-na-ui)
- [ ] Dashboard PostHog funil pagamento → [RUNBOOK §5](./OBSERVABILITY_RUNBOOK.md#5-dashboards-posthog)
- [ ] Dashboard adoção gestor
- [ ] Integração Slack no Sentry

---

## Validação

Ver [OBSERVABILITY_RUNBOOK.md §7](./OBSERVABILITY_RUNBOOK.md#7-validação-pós-deploy)
