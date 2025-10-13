# Rastreamento de Erros do Carrinho - PostHog

## 📊 Eventos Implementados

### 1. Erros de Validação

#### `app_error` - Restaurant Not Found
**Quando**: Restaurante não foi carregado após loading
**Contexto**:
```json
{
  "component": "CartWhatsAppButton",
  "action": "validation_failed",
  "validationStep": "restaurant_not_found",
  "restaurantId": "slug-do-restaurante",
  "isLoadingRestaurant": false,
  "itemCount": 3,
  "totalPrice": 45.50,
  "error_message": "Restaurant not found",
  "timestamp": "2025-10-13T..."
}
```

#### `app_error` - Restaurant Without ID
**Quando**: Restaurante carregado mas sem campo `id`
**Contexto**:
```json
{
  "component": "CartWhatsAppButton",
  "action": "validation_failed",
  "validationStep": "restaurant_without_id",
  "restaurantId": "slug-do-restaurante",
  "restaurantSlug": "slug-do-restaurante",
  "itemCount": 3,
  "totalPrice": 45.50,
  "error_message": "Restaurant loaded without ID",
  "timestamp": "2025-10-13T..."
}
```

#### `app_error` - WhatsApp Not Enabled
**Quando**: WhatsApp não está habilitado no restaurante
**Contexto**:
```json
{
  "component": "CartWhatsAppButton",
  "action": "validation_failed",
  "validationStep": "whatsapp_not_enabled",
  "restaurantId": "uuid-do-restaurante",
  "restaurantSlug": "slug-do-restaurante",
  "itemCount": 3,
  "totalPrice": 45.50,
  "error_message": "WhatsApp not enabled",
  "timestamp": "2025-10-13T..."
}
```

#### `app_error` - Phone Number Missing
**Quando**: Número de telefone não configurado
**Contexto**:
```json
{
  "component": "CartWhatsAppButton",
  "action": "validation_failed",
  "validationStep": "phone_number_missing",
  "restaurantId": "uuid-do-restaurante",
  "restaurantSlug": "slug-do-restaurante",
  "configEnabled": true,
  "itemCount": 3,
  "totalPrice": 45.50,
  "error_message": "WhatsApp phone number not configured",
  "timestamp": "2025-10-13T..."
}
```

### 2. Erros de Criação de Pedido

#### `app_error` - Order Creation Failed
**Quando**: Falha ao criar pedido no banco de dados ou abrir WhatsApp
**Contexto**:
```json
{
  "component": "CartWhatsAppButton",
  "action": "create_order_and_send_whatsapp",
  "restaurantId": "uuid-do-restaurante",
  "restaurantSlug": "slug-do-restaurante",
  "itemCount": 3,
  "totalPrice": 45.50,
  "hasRestaurant": true,
  "hasRestaurantId": true,
  "configEnabled": true,
  "hasPhoneNumber": true,
  "errorType": "TypeError",
  "error_message": "Cannot read property...",
  "error_stack": "Error: ...\n  at ...",
  "timestamp": "2025-10-13T..."
}
```

### 3. Eventos de Popup Bloqueado

#### `cart_whatsapp_popup_blocked`
**Quando**: Navegador bloqueia abertura automática do WhatsApp
**Contexto**:
```json
{
  "restaurant_id": "uuid-do-restaurante",
  "restaurant_slug": "slug-do-restaurante",
  "item_count": 3,
  "total_price": 45.50,
  "browser": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "timestamp": "2025-10-13T...",
  "user_agent": "...",
  "page_url": "https://...",
  "page_path": "/restaurant/..."
}
```

#### `cart_whatsapp_popup_fallback_confirmed`
**Quando**: Usuário confirma abrir WhatsApp após bloqueio
**Contexto**:
```json
{
  "restaurant_id": "uuid-do-restaurante",
  "restaurant_slug": "slug-do-restaurante",
  "item_count": 3,
  "total_price": 45.50,
  "timestamp": "2025-10-13T...",
  "user_agent": "...",
  "page_url": "https://...",
  "page_path": "/restaurant/..."
}
```

#### `cart_whatsapp_popup_fallback_cancelled`
**Quando**: Usuário cancela abertura do WhatsApp após bloqueio
**Contexto**:
```json
{
  "restaurant_id": "uuid-do-restaurante",
  "restaurant_slug": "slug-do-restaurante",
  "item_count": 3,
  "total_price": 45.50,
  "timestamp": "2025-10-13T...",
  "user_agent": "...",
  "page_url": "https://...",
  "page_path": "/restaurant/..."
}
```

### 4. Eventos de Sucesso

#### `cart_whatsapp_opened_successfully`
**Quando**: WhatsApp abre com sucesso sem bloqueio
**Contexto**:
```json
{
  "restaurant_id": "uuid-do-restaurante",
  "restaurant_slug": "slug-do-restaurante",
  "item_count": 3,
  "total_price": 45.50,
  "timestamp": "2025-10-13T...",
  "user_agent": "...",
  "page_url": "https://...",
  "page_path": "/restaurant/..."
}
```

## 📈 Análises Possíveis no PostHog

### 1. Taxa de Erro por Restaurante
```sql
SELECT restaurant_id, restaurant_slug, COUNT(*) as error_count
FROM events
WHERE event = 'app_error' 
  AND properties.component = 'CartWhatsAppButton'
GROUP BY restaurant_id, restaurant_slug
ORDER BY error_count DESC
```

### 2. Principais Tipos de Erro
```sql
SELECT properties.validationStep as error_type, COUNT(*) as count
FROM events
WHERE event = 'app_error' 
  AND properties.component = 'CartWhatsAppButton'
  AND properties.action = 'validation_failed'
GROUP BY error_type
ORDER BY count DESC
```

### 3. Taxa de Bloqueio de Popup
```sql
SELECT 
  COUNT(CASE WHEN event = 'cart_whatsapp_popup_blocked' THEN 1 END) as blocked,
  COUNT(CASE WHEN event = 'cart_whatsapp_opened_successfully' THEN 1 END) as success,
  ROUND(100.0 * COUNT(CASE WHEN event = 'cart_whatsapp_popup_blocked' THEN 1 END) / 
    (COUNT(CASE WHEN event = 'cart_whatsapp_popup_blocked' THEN 1 END) + 
     COUNT(CASE WHEN event = 'cart_whatsapp_opened_successfully' THEN 1 END)), 2) as block_rate_percent
FROM events
WHERE event IN ('cart_whatsapp_popup_blocked', 'cart_whatsapp_opened_successfully')
```

### 4. Taxa de Conversão do Fallback
```sql
SELECT 
  COUNT(CASE WHEN event = 'cart_whatsapp_popup_fallback_confirmed' THEN 1 END) as confirmed,
  COUNT(CASE WHEN event = 'cart_whatsapp_popup_fallback_cancelled' THEN 1 END) as cancelled,
  ROUND(100.0 * COUNT(CASE WHEN event = 'cart_whatsapp_popup_fallback_confirmed' THEN 1 END) / 
    (COUNT(CASE WHEN event = 'cart_whatsapp_popup_fallback_confirmed' THEN 1 END) + 
     COUNT(CASE WHEN event = 'cart_whatsapp_popup_fallback_cancelled' THEN 1 END)), 2) as conversion_rate_percent
FROM events
WHERE event IN ('cart_whatsapp_popup_fallback_confirmed', 'cart_whatsapp_popup_fallback_cancelled')
```

### 5. Navegadores com Mais Bloqueios
```sql
SELECT properties.browser, COUNT(*) as block_count
FROM events
WHERE event = 'cart_whatsapp_popup_blocked'
GROUP BY properties.browser
ORDER BY block_count DESC
LIMIT 10
```

## 🎯 Métricas Chave

### Saúde do Carrinho
- **Total de Erros**: `COUNT(event = 'app_error' AND component = 'CartWhatsAppButton')`
- **Erros por Restaurante**: Agrupar por `restaurant_id`
- **Tipos de Erro**: Agrupar por `validationStep`

### Experiência do Usuário
- **Taxa de Bloqueio**: `blocked / (blocked + success)`
- **Taxa de Conversão Fallback**: `confirmed / (confirmed + cancelled)`
- **Valor Médio de Carrinho com Erro**: `AVG(total_price WHERE event = 'app_error')`

### Navegadores Problemáticos
- **Bloqueios por Navegador**: Agrupar `cart_whatsapp_popup_blocked` por `browser`
- **User Agents Problemáticos**: Identificar padrões em `user_agent`

## 🔔 Alertas Sugeridos

### Alerta 1: Taxa de Erro Alta
```
SE (erros_ultimas_24h / total_tentativas) > 0.05
ENTÃO notificar equipe
```

### Alerta 2: Restaurante com Problemas
```
SE (erros_por_restaurante_ultimas_6h) > 10
ENTÃO verificar configuração do restaurante
```

### Alerta 3: Bloqueio de Popup Excessivo
```
SE (taxa_bloqueio_ultimas_24h) > 0.30
ENTÃO investigar mudanças no navegador/código
```

## 📱 Dashboard Sugerido

### Painel 1: Visão Geral
- Total de pedidos iniciados (24h)
- Taxa de erro (%)
- Taxa de bloqueio de popup (%)
- Taxa de conversão do fallback (%)

### Painel 2: Erros por Tipo
- Gráfico de pizza: Distribuição de erros por `validationStep`
- Série temporal: Erros ao longo do tempo

### Painel 3: Por Restaurante
- Tabela: Top 10 restaurantes com mais erros
- Detalhes: Tipos de erro por restaurante

### Painel 4: Navegadores
- Gráfico de barras: Bloqueios por navegador
- Série temporal: Taxa de bloqueio por navegador

## 🛠️ Como Usar

### No PostHog

1. **Criar Insights**:
   - Events → Criar novo Insight
   - Selecionar evento relevante
   - Adicionar filtros e breakdowns

2. **Criar Dashboard**:
   - Dashboards → Novo Dashboard
   - Adicionar Insights criados
   - Configurar refresh automático

3. **Configurar Alertas**:
   - Insights → Selecionar Insight
   - Actions → Create Alert
   - Definir threshold e destinatários

### No Código

Todos os eventos já estão implementados e serão enviados automaticamente quando ocorrerem os erros correspondentes. Não é necessário configuração adicional.

## ✅ Benefícios

1. **Visibilidade**: Saber exatamente onde e quando os erros acontecem
2. **Priorização**: Identificar problemas mais críticos por volume/impacto
3. **Debugging**: Contexto completo para reproduzir erros
4. **Otimização**: Identificar padrões (navegadores, restaurantes)
5. **Proatividade**: Alertas permitem resolver antes do usuário reclamar
