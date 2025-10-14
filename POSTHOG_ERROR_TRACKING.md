# PostHog Error Tracking - Documentação de Implementação

## Visão Geral

Este documento descreve a implementação completa do error tracking do PostHog no projeto, seguindo as melhores práticas da [documentação oficial do PostHog para Next.js](https://posthog.com/docs/error-tracking/installation/nextjs).

## Arquitetura de Error Tracking

### Client-Side Error Tracking

#### 1. **Exception Autocapture** (Automático)
- **Arquivo**: `src/components/PostHogProvider.tsx`
- **Configuração**: `capture_exceptions: true`
- Captura automaticamente erros não tratados através de `window.onerror` e `window.onunhandledrejection`
- Envia eventos `$exception` para o PostHog

#### 2. **React Error Boundary**
- **Arquivo**: `src/components/ErrorBoundary.tsx`
- Captura erros durante a renderização de componentes React
- Usa `posthog.captureException()` com contexto adicional
- Inclui `componentStack` e tags personalizadas

#### 3. **Route Error Handler**
- **Arquivo**: `src/app/error.tsx`
- Captura erros específicos de rotas do App Router
- Exibe UI de fallback amigável ao usuário
- Captura automaticamente com `useEffect` quando o erro ocorre

#### 4. **Global Error Handler**
- **Arquivo**: `src/app/global-error.tsx`
- Captura erros no root layout
- Último recurso para erros críticos da aplicação
- Inclui HTML completo para renderização independente

### Server-Side Error Tracking

#### 1. **Instrumentation Hook**
- **Arquivo**: `instrumentation.ts` (raiz do projeto)
- Usa o hook `onRequestError` do Next.js
- Captura erros em:
  - Server Components
  - Server Actions
  - Route Handlers
  - Middleware

#### 2. **PostHog Node.js SDK**
- **Arquivo**: `src/lib/posthog.ts`
- Singleton pattern para reutilização
- Configurado com `flushAt: 1` e `flushInterval: 0` para envio imediato
- Extrai `distinct_id` do cookie do PostHog para conectar erros ao usuário

## Fluxo de Captura de Erros

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT-SIDE ERRORS                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Unhandled Errors → Exception Autocapture → PostHog        │
│                                                             │
│  React Errors → ErrorBoundary → posthog.captureException() │
│                                                             │
│  Route Errors → error.tsx → posthog.captureException()     │
│                                                             │
│  Global Errors → global-error.tsx → posthog.captureException()│
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     SERVER-SIDE ERRORS                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Request Errors → onRequestError() → PostHog Node SDK       │
│                                                             │
│  Manual Errors → getPostHogServer().captureException()     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Configuração

### Variáveis de Ambiente

Adicione ao seu arquivo `.env.local`:

```bash
# PostHog Configuration
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Recursos Habilitados

No `PostHogProvider.tsx`:
- ✅ `capture_exceptions: true` - Exception autocapture
- ✅ `capture_pageview: false` - Pageview manual (via PageViewTracker)
- ✅ `capture_pageleave: true` - Rastreamento de saída de página
- ✅ `capture_performance: true` - Métricas de performance
- ✅ `autocapture: true` - Captura automática de interações

## Contextualização de Erros

Todos os erros capturados incluem:

### Client-Side Context
```javascript
{
  extra: {
    componentStack: string,      // Stack trace do React
    errorInfo: ErrorInfo,         // Informações do React
    digest?: string               // Next.js error digest
  },
  tags: {
    error_boundary: string,       // 'root' | 'route' | 'global'
    source: string                // Origem do erro
  }
}
```

### Server-Side Context
```javascript
{
  distinct_id: string,            // ID do usuário extraído do cookie
  $set: {
    error_path: string,           // Path da requisição
    error_method: string,         // HTTP method
    router_kind: string,          // 'Pages Router' | 'App Router'
    route_path: string,           // Caminho da rota
    route_type: string,           // 'render' | 'route' | 'action' | 'middleware'
    render_source: string,        // Origem da renderização
    render_type: string           // 'dynamic' | 'dynamic-resume'
  }
}
```

## Uso Manual

### Client-Side

```typescript
import posthog from 'posthog-js'

try {
  // código que pode falhar
} catch (error) {
  posthog.captureException(error, {
    extra: {
      context: 'Informações adicionais'
    },
    tags: {
      feature: 'nome-da-feature'
    }
  })
}
```

### Server-Side

```typescript
import { getPostHogServer } from '@/lib/posthog'

export async function myServerFunction() {
  const posthog = getPostHogServer()
  
  try {
    // código que pode falhar
  } catch (error) {
    if (posthog) {
      await posthog.captureException(error, {
        distinct_id: 'user-id',
        $set: {
          feature: 'nome-da-feature'
        }
      })
      await posthog.flush()
    }
  }
}
```

## Verificação

### 1. Verificar Autocapture Client-Side

1. Abra o console do navegador
2. Execute: `throw new Error('Test error')`
3. Verifique no PostHog: https://app.posthog.com/activity/explore

### 2. Verificar Error Boundary

1. Crie um componente que lance um erro durante a renderização
2. A tela de erro deve aparecer
3. O erro deve estar no PostHog

### 3. Verificar Server-Side

1. Adicione um erro em uma Server Action ou Route Handler
2. Verifique os logs do servidor
3. Confirme no PostHog

## Monitoramento

Acesse o dashboard de error tracking:
- **PostHog Dashboard**: https://app.posthog.com/error_tracking
- **Activity Feed**: https://app.posthog.com/activity/explore

### Métricas Disponíveis

- Total de exceções capturadas
- Erros por página/rota
- Erros por usuário
- Stack traces completos
- Contexto do erro (browser, OS, etc.)
- Timeline de quando os erros ocorreram

## Considerações de Performance

- ✅ Exception autocapture tem overhead mínimo
- ✅ Erros são enviados de forma assíncrona
- ✅ Server-side usa flush imediato para garantir captura
- ✅ Singleton pattern evita múltiplas instâncias do SDK

## Privacidade

- Erros são enviados para servidores do PostHog (US ou EU)
- Stack traces podem conter informações sensíveis
- IDs de usuário são extraídos apenas de cookies do PostHog
- Considere sanitizar dados sensíveis antes de capturar

## Troubleshooting

### Erros não aparecem no PostHog

1. Verifique se `NEXT_PUBLIC_POSTHOG_KEY` está configurado
2. Confirme que o PostHog está inicializado (check browser console)
3. Verifique se exception autocapture está habilitado nas configurações do projeto
4. Em dev, erros podem não ser enviados - teste em build de produção

### Server-side errors não são capturados

1. Confirme que `instrumentation.ts` está na raiz do projeto
2. Verifique se `NEXT_RUNTIME === 'nodejs'` (Edge runtime não é suportado)
3. Verifique logs do servidor para erros de captura
4. Confirme que o PostHog Node SDK está instalado

## Próximos Passos

### Upload de Source Maps (Recomendado)

Para stack traces mais precisos em produção:
- Siga: https://posthog.com/docs/error-tracking/upload-source-maps/nextjs
- Configure o plugin do PostHog no `next.config.js`
- Source maps são enviados durante o build

### Configurações Avançadas

- Configurar alertas para erros críticos
- Criar dashboards personalizados
- Integrar com ferramentas de notificação (Slack, Discord, etc.)
- Configurar error grouping customizado

## Referências

- [PostHog Next.js Error Tracking Docs](https://posthog.com/docs/error-tracking/installation/nextjs)
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- [PostHog Exception Autocapture](https://posthog.com/docs/error-tracking/installation/web#setting-up-exception-autocapture)

---

**Implementado por**: AI Assistant  
**Data**: 14 de outubro de 2025  
**Versão do PostHog**: posthog-js ^1.266.0, posthog-node ^5.8.4
