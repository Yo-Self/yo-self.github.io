# Funcionalidade: Pedir pelo WhatsApp

Esta funcionalidade permite que clientes enviem pedidos diretamente pelo WhatsApp, incluindo detalhes completos do prato e complementos selecionados.

## ✨ Funcionalidades

- 📱 **Integração com WhatsApp**: Abre o WhatsApp com mensagem pré-formatada
- 🍽️ **Descrição Completa**: Inclui nome, descrição, ingredientes e porção do prato
- 🧩 **Complementos**: Lista todos os complementos selecionados com preços
- 💰 **Cálculo de Preço**: Soma o preço base + complementos selecionados
- ⚠️ **Alérgenos**: Destaca informações importantes sobre alérgenos
- 🕐 **Timestamp**: Inclui data e hora do pedido
- 🎨 **Formatação**: Usa emojis e formatação Markdown para melhor legibilidade

## 🚀 Como Funciona

### 1. **Interface do Usuário**
- Botão verde "Pedir pelo WhatsApp" aparece no canto inferior direito do modal de detalhes do prato
- **Só aparece quando `whatsapp_enabled` é `true` no banco de dados**
- Posicionado estrategicamente para fácil acesso
- **Visibilidade controlada pela configuração do restaurante**

### 2. **Geração da Mensagem**
A mensagem é automaticamente formatada com:

```
🍽️ *Nome do Prato*

*Descrição:* Descrição detalhada do prato
*Ingredientes:* Lista de ingredientes
*Porção:* Informação sobre porção
*Preço:* R$ XX,XX

*Complementos Selecionados:*

*Nome do Grupo:*
• Complemento 1 - R$ X,XX
• Complemento 2 - R$ X,XX

*Total:* R$ XX,XX

⚠️ *Alérgenos:* Informações sobre alérgenos

📱 *Pedido via Cardápio Digital*
🕐 Data e hora do pedido

Olá! Gostaria de fazer este pedido.
```

### 3. **Integração com WhatsApp**
- Usa a API `wa.me` do WhatsApp
- Abre em nova aba do navegador
- Funciona em dispositivos móveis e desktop
- Suporte a WhatsApp Web e app móvel

### 4. **Lógica de Visibilidade** ✅
O botão "Pedir pelo WhatsApp" **só é exibido** quando:

```typescript
// No DishModal
{restaurant?.whatsapp_enabled !== false && (
  <WhatsAppButton ... />
)}

// No WhatsAppButton
if (!config.enabled) {
  return null; // Não renderiza o botão
}
```

**Regras de Visibilidade:**
- ✅ **EXIBIR**: `whatsapp_enabled = true` ou `undefined/null` (padrão)
- ❌ **NÃO EXIBIR**: `whatsapp_enabled = false`
- 🔧 **Fallback**: Configuração padrão quando não há configuração personalizada

## ⚙️ Configuração

### Configuração no Banco de Dados ✅
A funcionalidade agora busca a configuração real do banco de dados:

```typescript
const config: WhatsAppConfig = {
  phoneNumber: restaurant.whatsapp_phone || "5511999999999", // Do banco ou padrão
  enabled: restaurant.whatsapp_enabled !== false, // Padrão true
  customMessage: restaurant.whatsapp_custom_message || "Olá! Gostaria de fazer este pedido."
};
```

### Como Configurar Restaurantes

#### 1. **Via SQL Direto**
```sql
-- Configurar WhatsApp para um restaurante específico
UPDATE restaurants 
SET 
  whatsapp_phone = '5511999999999',
  whatsapp_enabled = true,
  whatsapp_custom_message = 'Olá! Gostaria de fazer este pedido. Aguardo sua confirmação!'
WHERE id = 'uuid-do-restaurante';

-- Desabilitar WhatsApp para um restaurante
UPDATE restaurants 
SET whatsapp_enabled = false
WHERE id = 'uuid-do-restaurante';
```

#### 2. **Via Interface Administrativa (Futuro)**
- Painel de administração para configurar WhatsApp
- Validação de números de telefone
- Preview de mensagens personalizadas

#### 3. **Scripts de Configuração**
Veja o arquivo `setup-whatsapp-config.sql` para exemplos completos de configuração.

#### 4. **Testando a Funcionalidade**
```bash
# Testar lógica de visibilidade
node test-whatsapp-visibility.js

# Testar geração de mensagens
node test-whatsapp-feature.js
```

**Exemplos de Configuração:**
```sql
-- Habilitar WhatsApp para um restaurante
UPDATE restaurants 
SET whatsapp_enabled = true, whatsapp_phone = '5511999999999'
WHERE id = 'uuid-do-restaurante';

-- Desabilitar WhatsApp para um restaurante
UPDATE restaurants 
SET whatsapp_enabled = false
WHERE id = 'uuid-do-restaurante';

-- Ver restaurantes com WhatsApp habilitado
SELECT name, whatsapp_enabled, whatsapp_phone 
FROM restaurants 
WHERE whatsapp_enabled = true;
```

### Configuração Implementada ✅
A implementação completa foi realizada no banco de dados:

1. **Campos adicionados na tabela `restaurants`:**
```sql
ALTER TABLE restaurants ADD COLUMN whatsapp_phone VARCHAR(20);
ALTER TABLE restaurants ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT true;
ALTER TABLE restaurants ADD COLUMN whatsapp_custom_message TEXT;
```

2. **Tipos TypeScript atualizados:**
```typescript
export interface Restaurant {
  // ... campos existentes
  whatsapp_phone?: string;
  whatsapp_enabled?: boolean;
  whatsapp_custom_message?: string;
}
```

3. **Persistência implementada no hook `useWhatsAppConfig`** ✅
4. **Índice de performance criado** ✅
5. **Dados de exemplo configurados** ✅

## 🔧 Implementação Técnica

### Componentes Criados

#### `WhatsAppButton`
- Botão principal com ícone do WhatsApp
- Gera mensagem formatada
- Abre WhatsApp com dados do pedido

#### `useWhatsAppConfig`
- Hook para gerenciar configuração do WhatsApp
- Carrega configuração do restaurante
- Permite atualização de configurações

### Integração nos Modais

A funcionalidade foi integrada em todos os componentes que usam `DishModal`:

- ✅ **Carousel**: Pratos em destaque
- ✅ **SearchBar**: Busca e resultados
- ✅ **MenuSection**: Lista de pratos por categoria
- ✅ **JournalView**: Modo jornal
- ✅ **IntegratedChatBot**: Chatbot integrado
- ✅ **ChatBot**: Chatbot standalone

### Estrutura de Dados

```typescript
interface WhatsAppConfig {
  phoneNumber: string;        // Número do WhatsApp
  enabled: boolean;           // Se a funcionalidade está ativa
  customMessage?: string;     // Mensagem personalizada
}
```

## 📱 Formato da Mensagem

### Estrutura da Mensagem
1. **Cabeçalho**: Nome do prato com emoji
2. **Informações Básicas**: Descrição, ingredientes, porção, preço
3. **Complementos**: Lista organizada por grupos com preços
4. **Total**: Soma de todos os valores
5. **Alérgenos**: Informações importantes destacadas
6. **Metadados**: Origem do pedido e timestamp
7. **Mensagem Final**: Texto personalizável

### Formatação Markdown
- **Negrito**: Para títulos e informações importantes
- **Listas**: Para complementos e ingredientes
- **Emojis**: Para melhor visualização
- **Quebras de Linha**: Para organização clara

## 🎯 Casos de Uso

### Para Clientes
- **Pedidos Rápidos**: Enviar pedido sem sair do cardápio
- **Complementos**: Incluir todos os adicionais selecionados
- **Informações Completas**: Ter todos os detalhes do pedido
- **Histórico**: Manter registro dos pedidos no WhatsApp

### Para Restaurantes
- **Pedidos Organizados**: Mensagens estruturadas e claras
- **Informações Completas**: Todos os detalhes necessários
- **Integração Simples**: Usar WhatsApp existente
- **Personalização**: Configurar mensagens e números

## 🚀 Próximos Passos

### Implementações Futuras

1. **Configuração por Restaurante**
   - Interface administrativa para configurar WhatsApp
   - Números diferentes por restaurante
   - Mensagens personalizadas

2. **Analytics e Relatórios**
   - Rastreamento de pedidos enviados
   - Métricas de conversão
   - Histórico de pedidos

3. **Integração com Sistema de Pedidos**
   - Sincronização com sistema interno
   - Status de pedidos
   - Confirmações automáticas

4. **Funcionalidades Avançadas**
   - QR Code para WhatsApp
   - Horários de funcionamento
   - Promoções automáticas

## 🔍 Troubleshooting

### Problemas Comuns

1. **WhatsApp não abre**
   - Verificar se o número está no formato correto
   - Confirmar se o WhatsApp está instalado no dispositivo

2. **Mensagem não aparece**
   - Verificar se o prato tem dados completos
   - Confirmar se os complementos estão sendo selecionados

3. **Erro de configuração**
   - Verificar se o restaurantId está sendo passado
   - Confirmar se a configuração está carregada

### Logs e Debug
- Console do navegador mostra erros de configuração
- Hook `useWhatsAppConfig` registra carregamento
- Componente `WhatsAppButton` valida dados antes de enviar

## 📚 Referências

- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [WhatsApp Web](https://web.whatsapp.com/)
- [URL Scheme WhatsApp](https://wa.me/)
- [Markdown WhatsApp](https://faq.whatsapp.com/general/chats/how-to-format-your-messages/)
