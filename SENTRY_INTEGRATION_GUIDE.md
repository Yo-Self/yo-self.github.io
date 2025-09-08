# Guia de Integração Sentry - Yoself

Este documento explica como a integração do Sentry foi implementada no projeto Yoself e como usar as funcionalidades disponíveis.

## 🚀 Funcionalidades Implementadas

### 1. **Error Monitoring**
- Captura automática de erros JavaScript
- Error boundaries globais e específicos
- Filtros inteligentes para reduzir ruído
- Contexto detalhado para debugging

### 2. **Performance Monitoring**
- Tracing de operações críticas
- Monitoramento de componentes React
- Medição de interações do usuário
- Tracking de API calls

### 3. **Session Replay**
- Gravação de sessões para debugging
- Mascaramento de dados sensíveis
- Captura de 100% das sessões com erro
- 10% de amostragem em produção

### 4. **Logging Estruturado**
- Logs centralizados no Sentry
- Contexto rico para cada log
- Integração com console.log automática
- Logs específicos para restaurantes e usuários

### 5. **User Feedback**
- Sistema de feedback integrado
- Coleta de informações do usuário
- Interface amigável para reportar problemas

## 📁 Arquivos de Configuração

### Configuração Client-Side
- **Arquivo**: `src/instrumentation-client.ts`
- **Funcionalidades**: Session Replay, User Feedback, Console Logging, Performance Monitoring

### Configuração Server-Side
- **Arquivo**: `sentry.server.config.ts`
- **Funcionalidades**: Error Monitoring, Performance Monitoring, Logging

### Configuração Edge Runtime
- **Arquivo**: `sentry.edge.config.ts`
- **Funcionalidades**: Error Monitoring para middleware e edge routes

### Instrumentação
- **Arquivo**: `src/instrumentation.ts`
- **Funcionalidades**: Hooks de instrumentação do Next.js

## 🛠️ Componentes e Hooks Disponíveis

### SentryErrorBoundary
```tsx
import { SentryErrorBoundary } from '@/components/SentryErrorBoundary';

<SentryErrorBoundary fallback={<CustomErrorComponent />}>
  <YourComponent />
</SentryErrorBoundary>
```

### useSentryLogger
```tsx
import { useSentryLogger } from '@/hooks/useSentryLogger';

const { logInfo, logError, logUserAction, logRestaurantAction } = useSentryLogger();

// Logging básico
logInfo('User logged in', { userId: '123' });
logError('Failed to load data', { component: 'UserProfile' });

// Logging específico para restaurantes
logRestaurantAction('menu_viewed', 'restaurant-123', { page: 'main' });

// Logging de ações do usuário
logUserAction('button_clicked', 'user-456', { button: 'checkout' });
```

### useSentryPerformance
```tsx
import { useSentryPerformance } from '@/hooks/useSentryPerformance';

const { measureOperation, measureUserInteraction, measureApiCall } = useSentryPerformance();

// Medir operações assíncronas
await measureOperation('Load User Data', async () => {
  const data = await fetchUserData();
  return data;
}, { userId: '123' });

// Medir interações do usuário
const interaction = measureUserInteraction('Button Click');
// ... fazer algo ...
interaction.end();

// Medir chamadas de API
await measureApiCall('/api/users', 'GET', async () => {
  return fetch('/api/users');
}, { userId: '123' });
```

## 🎯 Instrumentação Automática

### CartProvider
O `CartProvider` foi instrumentado com:
- Tracking de operações de carrinho (adicionar, remover, limpar)
- Captura de erros em operações críticas
- Métricas de performance para operações de carrinho

### Error Boundaries
- **Global Error Boundary**: Captura erros não tratados globalmente
- **Component Error Boundaries**: Captura erros em componentes específicos
- **Fallback UI**: Interface amigável para usuários quando erros ocorrem

## 📊 Monitoramento de Performance

### Operações Rastreadas
1. **Carregamento do Carrinho**: Tempo para carregar dados do localStorage
2. **Operações de Carrinho**: Adicionar, remover, atualizar itens
3. **Interações do Usuário**: Cliques, navegação, formulários
4. **API Calls**: Todas as chamadas de API são rastreadas
5. **Renderização de Componentes**: Performance de componentes críticos

### Métricas Coletadas
- Duração das operações
- Taxa de sucesso/erro
- Contexto da operação (usuário, restaurante, componente)
- Stack traces completos
- Informações do navegador e dispositivo

## 🔍 Logging Estruturado

### Níveis de Log
- **TRACE**: Informações muito detalhadas
- **DEBUG**: Informações de debugging
- **INFO**: Informações gerais
- **WARN**: Avisos
- **ERROR**: Erros
- **FATAL**: Erros críticos

### Contexto Automático
- ID do usuário
- ID do restaurante
- Componente que gerou o log
- Timestamp
- Informações do navegador
- URL da página

## 🚨 Alertas e Notificações

### Configuração de Alertas
1. Acesse o dashboard do Sentry
2. Vá para **Alerts** → **Create Alert Rule**
3. Configure alertas para:
   - Novos erros
   - Aumento na taxa de erro
   - Performance degradada
   - Erros críticos

### Integrações Disponíveis
- **Slack**: Notificações em tempo real
- **Email**: Relatórios diários/semanais
- **Discord**: Notificações para equipe
- **Webhooks**: Integração com sistemas internos

## 📈 Dashboard e Relatórios

### Métricas Disponíveis
- **Error Rate**: Taxa de erro por período
- **Performance**: Tempo de resposta médio
- **User Impact**: Quantos usuários afetados
- **Release Health**: Saúde das releases
- **Session Replay**: Reprodução de sessões com erro

### Filtros e Busca
- Por ambiente (development, production)
- Por usuário específico
- Por restaurante
- Por componente
- Por tipo de erro
- Por período de tempo

## 🛡️ Privacidade e Segurança

### Dados Mascarados
- Texto de inputs sensíveis
- Elementos de mídia
- Informações pessoais
- Tokens e senhas

### Configurações de Privacidade
- `maskAllText: true` - Mascara todo texto
- `blockAllMedia: true` - Bloqueia elementos de mídia
- `sendDefaultPii: false` - Não envia PII por padrão

## 🔧 Manutenção e Troubleshooting

### Verificar Status
1. Acesse `/sentry-example-page` para testar
2. Verifique o dashboard do Sentry
3. Monitore logs no console (modo development)

### Problemas Comuns
1. **Erros não aparecem**: Verifique DSN e configuração
2. **Performance degradada**: Ajuste `tracesSampleRate`
3. **Muitos logs**: Configure filtros no `beforeSend`

### Limpeza de Dados
- Logs antigos são automaticamente removidos
- Configurar retenção de dados no Sentry
- Limpar dados de desenvolvimento regularmente

## 📚 Recursos Adicionais

- [Documentação Oficial Sentry](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Dashboard do Projeto](https://yo-self.sentry.io/projects/javascript-nextjs/)
- [Configuração de Alertas](https://docs.sentry.io/product/alerts/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

## 🎉 Próximos Passos

1. **Configurar Alertas**: Configure alertas para erros críticos
2. **Monitorar Performance**: Acompanhe métricas de performance
3. **Analisar Sessões**: Use Session Replay para debugging
4. **Otimizar**: Use dados do Sentry para otimizar a aplicação
5. **Treinar Equipe**: Ensine a equipe a usar o Sentry efetivamente

---

**Nota**: Esta integração está configurada para capturar dados em desenvolvimento e produção. Em produção, a taxa de amostragem é reduzida para 10% para otimizar performance.
