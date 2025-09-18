# Funcionalidade: Campos de Nome e Endereço na Comanda

Esta funcionalidade adiciona campos para coleta de dados do cliente (nome e endereço) na tela da comanda, com autocompletar de endereços usando a API do Google Places, e integração completa com o envio via WhatsApp.

## ✨ Funcionalidades Implementadas

### 📝 **Campos de Dados do Cliente**
- **Campo de Nome**: Campo obrigatório para o nome completo do cliente
- **Campo de Endereço**: Campo com autocompletar usando Google Places API
- **Validação**: Botão de envio só fica ativo quando ambos os campos estão preenchidos
- **Indicadores Visuais**: Mostra status de preenchimento dos campos

### 🗺️ **Autocompletar de Endereços**
- **Google Places API**: Integração com a API do Google Places
- **Restrição Geográfica**: Limitado ao Brasil (`country: 'br'`)
- **Tipos de Endereço**: Focado em endereços completos (`types: ['address']`)
- **Feedback Visual**: Indicadores de carregamento e status da API

### 📱 **Integração WhatsApp**
- **Dados Incluídos**: Nome e endereço são incluídos na mensagem do WhatsApp
- **Formatação**: Mensagem estruturada com seção dedicada aos dados do cliente
- **Validação**: Só permite envio quando todos os dados estão preenchidos

## 🚀 Como Funciona

### 1. **Interface do Usuário**
```
┌─────────────────────────────────────┐
│ 👤 Dados para Entrega               │
│ Preencha seus dados para finalizar  │
│                                     │
│ Nome Completo *                     │
│ [________________________]          │
│                                     │
│ Endereço Completo *                 │
│ [________________________] ✓        │
│ 💡 Digite o endereço e selecione   │
│                                     │
│ ● Nome  ● Endereço                 │
└─────────────────────────────────────┘
```

### 2. **Fluxo de Uso**
1. Cliente adiciona itens à comanda
2. Abre a comanda e vê os campos de dados
3. Preenche nome completo
4. Digita endereço e seleciona sugestão do Google
5. Botão "Enviar Pedido" fica ativo
6. Clica para enviar via WhatsApp com todos os dados

### 3. **Mensagem WhatsApp Gerada**
```
🛒 *PEDIDO COMPLETO*

👤 *DADOS DO CLIENTE:*
• *Nome:* João Silva
• *Endereço:* Rua das Flores, 123 - Centro, São Paulo - SP

📋 *Itens do Pedido:*

1️⃣ *Pizza Margherita* (2x)
*Complementos:*
• Queijo Extra - +R$ 5,00
*Subtotal:* R$ 45,00

💰 *TOTAL GERAL: R$ 45,00*

📱 *Pedido via Cardápio Digital*
🕐 15/12/2024 14:30

Olá! Gostaria de fazer este pedido completo...
```

## 🔧 Configuração Técnica

### **Variáveis de Ambiente**
```bash
# Adicionar ao .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_api_google_maps
```

### **Google Cloud Console Setup**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie/selecione um projeto
3. Ative a **Google Places API**
4. Crie uma chave de API
5. Configure restrições (recomendado):
   - **Restrição de aplicativo**: URLs do seu domínio
   - **Restrição de API**: Google Places API

### **Arquivos Criados/Modificados**

#### **Novos Arquivos:**
- `src/hooks/useCustomerData.ts` - Hook para gerenciar dados do cliente
- `src/components/GooglePlacesAutocomplete.tsx` - Componente de autocompletar
- `src/components/CustomerDataForm.tsx` - Formulário de dados do cliente

#### **Arquivos Modificados:**
- `src/components/CartModal.tsx` - Adicionado formulário de dados
- `src/components/CartWhatsAppButton.tsx` - Integração com dados do cliente
- `env.example` - Adicionada variável do Google Maps

## 🎨 Componentes Técnicos

### **useCustomerData Hook**
```typescript
interface CustomerData {
  name: string;
  address: string;
}

// Funcionalidades:
- updateName(name: string)
- updateAddress(address: string)
- clearCustomerData()
- isCustomerDataComplete: boolean
```

### **GooglePlacesAutocomplete Component**
```typescript
// Props:
- value: string
- onChange: (address: string) => void
- placeholder?: string
- className?: string
- disabled?: boolean

// Funcionalidades:
- Carregamento dinâmico da API do Google
- Autocompletar com restrições geográficas
- Feedback visual de carregamento/status
```

### **CustomerDataForm Component**
```typescript
// Funcionalidades:
- Campo de nome com validação
- Campo de endereço com autocompletar
- Indicadores visuais de preenchimento
- Design responsivo e acessível
```

## 🔒 Segurança e Performance

### **Segurança:**
- ✅ Chave de API restrita por domínio
- ✅ Validação de entrada nos campos
- ✅ Sanitização de dados antes do envio

### **Performance:**
- ✅ Carregamento lazy da API do Google
- ✅ Debounce no autocompletar
- ✅ Memoização de componentes React
- ✅ Limpeza de recursos ao desmontar

## 🧪 Testes e Validação

### **Cenários de Teste:**
1. **Preenchimento Parcial**: Só nome ou só endereço
2. **Preenchimento Completo**: Ambos os campos preenchidos
3. **Autocompletar**: Seleção de endereço do Google
4. **Envio WhatsApp**: Verificar inclusão dos dados
5. **Responsividade**: Teste em diferentes tamanhos de tela

### **Validações:**
- ✅ Campos obrigatórios
- ✅ Formato de endereço válido
- ✅ Integração com WhatsApp
- ✅ Mensagem formatada corretamente

## 📱 Experiência do Usuário

### **Estados do Botão:**
- **Desabilitado**: "Preencha seus dados" (cinza)
- **Habilitado**: "Enviar Pedido" (verde)
- **Carregando**: "Carregando..." (com spinner)

### **Feedback Visual:**
- **Indicadores**: Bolinhas verdes/cinzas para cada campo
- **Autocompletar**: Ícone de check quando API carregada
- **Loading**: Spinner durante carregamento da API

### **Acessibilidade:**
- ✅ Labels associados aos campos
- ✅ ARIA labels nos botões
- ✅ Navegação por teclado
- ✅ Contraste adequado
- ✅ Textos descritivos

## 🚀 Próximos Passos

### **Melhorias Futuras:**
1. **Cache de Endereços**: Salvar endereços recentes
2. **Validação Avançada**: Verificar CEP e coordenadas
3. **Histórico**: Mostrar pedidos anteriores
4. **Geolocalização**: Detectar localização atual
5. **Múltiplos Endereços**: Permitir salvar endereços favoritos

### **Integrações Adicionais:**
1. **Google Maps**: Mostrar localização no mapa
2. **Calculadora de Frete**: Integrar com APIs de entrega
3. **Tempo de Entrega**: Estimativa baseada na distância
4. **Notificações**: Avisos sobre status do pedido

---

## 📋 Resumo da Implementação

✅ **Campos de dados do cliente adicionados**  
✅ **Autocompletar de endereços implementado**  
✅ **Integração com WhatsApp completa**  
✅ **Validação e feedback visual**  
✅ **Design responsivo e acessível**  
✅ **Documentação técnica completa**  

A funcionalidade está pronta para uso e pode ser testada imediatamente após a configuração da chave da API do Google Maps.
