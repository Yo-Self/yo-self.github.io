# Funcionalidade: Cálculo de Distância de Entrega

Esta funcionalidade calcula automaticamente a distância entre o restaurante e o endereço do cliente quando um pedido é enviado via WhatsApp, fornecendo informações precisas sobre a distância de entrega.

## ✨ Funcionalidades Implementadas

### 🗺️ **Cálculo de Distância**
- **Fórmula de Haversine**: Usa a fórmula matemática mais precisa para calcular distância entre coordenadas geográficas
- **Distância em Linha Reta**: Calcula a distância direta entre restaurante e cliente
- **Formatação Inteligente**: Exibe distância em metros (até 1km) ou quilômetros (acima de 1km)
- **Validação de Coordenadas**: Verifica se as coordenadas são válidas antes do cálculo

### 📍 **Captura de Coordenadas**
- **Google Places API**: Captura automaticamente latitude e longitude quando cliente seleciona endereço
- **Armazenamento Local**: Salva coordenadas do cliente no localStorage para persistência
- **Coordenadas do Restaurante**: Busca coordenadas do restaurante no banco de dados
- **Fallback Gracioso**: Funciona mesmo se coordenadas não estiverem disponíveis

### 📱 **Integração WhatsApp**
- **Mensagem Enriquecida**: Inclui distância de entrega na mensagem do WhatsApp
- **Formato Legível**: Exibe distância de forma clara e profissional
- **Informação Contextual**: Aparece junto com outros dados do cliente

## 🚀 Como Funciona

### 1. **Captura de Coordenadas do Cliente**
```typescript
// Quando cliente seleciona endereço no Google Places
const coordinates = {
  latitude: place.geometry.location.lat(),
  longitude: place.geometry.location.lng()
};
updateCoordinates(coordinates, address);
```

### 2. **Busca de Coordenadas do Restaurante**
```typescript
// Busca no banco de dados
const restaurant = await fetch(`/rest/v1/restaurants?slug=${restaurantId}&select=latitude,longitude,address`);
```

### 3. **Cálculo de Distância**
```typescript
// Usa fórmula de Haversine
const distance = calculateDeliveryDistance(restaurantCoords, customerCoords);
// Resultado: { distanceKm: 2.5, distanceMeters: 2500, formattedDistance: "2.5 km" }
```

### 4. **Integração na Mensagem**
```
👤 *DADOS DO CLIENTE:*
• *Nome:* João Silva
• *Endereço:* Rua das Flores, 123 - Apartamento 45
• *Distância de Entrega:* 2.5 km
```

## 🔧 Arquivos Criados/Modificados

### **Novos Arquivos:**
- `src/utils/distanceCalculator.ts` - Utilitário para cálculo de distância
- `src/hooks/useCustomerCoordinates.ts` - Hook para gerenciar coordenadas do cliente
- `src/hooks/useRestaurantCoordinates.ts` - Hook para buscar coordenadas do restaurante

### **Arquivos Modificados:**
- `src/components/GooglePlacesAutocompleteRobust.tsx` - Captura coordenadas do Google Places
- `src/components/CustomerDataForm.tsx` - Integra captura de coordenadas
- `src/components/CartWhatsAppButton.tsx` - Inclui distância na mensagem WhatsApp

## 📊 Estrutura do Banco de Dados

### **Tabela `restaurants`:**
```sql
-- Campos já existentes
latitude NUMERIC,  -- Latitude do restaurante
longitude NUMERIC, -- Longitude do restaurante  
address TEXT       -- Endereço do restaurante
```

## 🎯 Exemplo de Uso

### **Mensagem WhatsApp com Distância:**
```
🛒 *PEDIDO COMPLETO*

👤 *DADOS DO CLIENTE:*
• *Nome:* Maria Santos
• *Endereço:* Av. Paulista, 1000 - Conjunto 101
• *Distância de Entrega:* 1.2 km

📋 *Itens do Pedido:*
1️⃣ *Pizza Margherita* (1x)
*Subtotal:* R$ 35,00

💰 *TOTAL: R$ 35,00*

📱 *Pedido via Cardápio Digital*
🕐 15/12/2024 14:30

Olá! Gostaria de fazer este pedido completo.
```

## ⚡ Benefícios

### **Para o Restaurante:**
- **Informação Precisa**: Sabe exatamente a distância para calcular frete
- **Otimização de Rotas**: Pode planejar entregas de forma mais eficiente
- **Transparência**: Cliente vê a distância antes de confirmar pedido

### **Para o Cliente:**
- **Transparência**: Vê a distância de entrega antes de finalizar
- **Expectativa Realista**: Sabe aproximadamente quanto tempo levará
- **Confiança**: Informações precisas aumentam confiança no serviço

## 🔍 Validações e Segurança

### **Validação de Coordenadas:**
- Latitude: -90 a 90 graus
- Longitude: -180 a 180 graus
- Valores numéricos válidos (não NaN)

### **Tratamento de Erros:**
- Coordenadas inválidas são ignoradas silenciosamente
- Mensagem funciona normalmente mesmo sem distância
- Logs detalhados para debugging

## 🚀 Próximos Passos

### **Melhorias Futuras:**
- **Cálculo de Tempo**: Estimar tempo de entrega baseado na distância
- **Cálculo de Frete**: Integrar com sistema de cálculo de frete
- **Histórico**: Salvar distâncias para análise
- **Mapas**: Mostrar rota no mapa (opcional)

## 📝 Notas Técnicas

### **Precisão do Cálculo:**
- Usa fórmula de Haversine (precisão ~99.5%)
- Considera curvatura da Terra
- Adequado para distâncias até ~200km

### **Performance:**
- Cálculo é instantâneo (operações matemáticas simples)
- Coordenadas são cacheadas no localStorage
- Não impacta performance da aplicação

### **Compatibilidade:**
- Funciona em todos os navegadores modernos
- Não requer bibliotecas externas
- Fallback gracioso se coordenadas não disponíveis
