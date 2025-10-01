# 📍 Funcionalidade: Geolocalização para Endereços Próximos

## ✨ **Funcionalidade Implementada**

Esta funcionalidade permite que o usuário use sua localização atual para encontrar e selecionar endereços próximos automaticamente, facilitando o preenchimento do campo de endereço.

## 🚀 **Como Funciona**

### **1. Captura de Localização**
- Botão "Usar minha localização" no campo de endereço
- Solicita permissão de geolocalização do navegador
- Captura coordenadas GPS com alta precisão
- Timeout de 10 segundos para evitar travamentos

### **2. Reverse Geocoding**
- Converte coordenadas GPS em endereços legíveis
- Usa Google Maps Geocoder API
- Filtra resultados para o Brasil
- Retorna múltiplas opções de endereços próximos

### **3. Seleção de Endereços**
- Modal com lista de endereços encontrados
- Interface intuitiva para seleção
- Mostra coordenadas de cada endereço
- Atualiza automaticamente o campo de endereço

## 🔧 **Componentes Criados**

### **1. useGeolocation Hook**
```typescript
// src/hooks/useGeolocation.ts
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    isLoading: false,
    error: null,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator
  });

  const getCurrentPosition = useCallback(() => {
    // Solicita permissão e captura localização
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          position: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          },
          isLoading: false,
          error: null,
          isSupported: true
        });
      },
      (error) => {
        // Trata erros de permissão e disponibilidade
      }
    );
  }, []);
}
```

### **2. useReverseGeocoding Hook**
```typescript
// src/hooks/useReverseGeocoding.ts
export function useReverseGeocoding() {
  const getAddressesFromCoordinates = useCallback(async (position: GeolocationPosition) => {
    const geocoder = new window.google.maps.Geocoder();
    
    const results = await new Promise<any[]>((resolve, reject) => {
      geocoder.geocode(
        {
          location: {
            lat: position.latitude,
            lng: position.longitude
          },
          componentRestrictions: { country: 'br' }
        },
        (results: any, status: any) => {
          if (status === 'OK' && results) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding falhou: ${status}`));
          }
        }
      );
    });
  }, []);
}
```

### **3. NearbyAddresses Component**
```typescript
// src/components/NearbyAddresses.tsx
export default function NearbyAddresses({
  addresses,
  isLoading,
  error,
  onSelectAddress,
  onClose
}: NearbyAddressesProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Lista de endereços próximos */}
        {addresses.map((address, index) => (
          <button
            key={address.place_id}
            onClick={() => onSelectAddress(address)}
            className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {address.formatted_address}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              📍 Coordenadas: {address.geometry.location.lat.toFixed(6)}, {address.geometry.location.lng.toFixed(6)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### **4. CustomerDataForm Atualizado**
```typescript
// src/components/CustomerDataForm.tsx
export default function CustomerDataForm({ className = "" }: CustomerDataFormProps) {
  const { getCurrentPosition, isLoading: isGeolocationLoading, error: geolocationError, isSupported } = useGeolocation();
  const { addresses, getAddressesFromCoordinates, clearAddresses } = useReverseGeocoding();
  const [showNearbyAddresses, setShowNearbyAddresses] = useState(false);

  const handleUseLocation = async () => {
    await getCurrentPosition();
  };

  const handleSelectNearbyAddress = (address: AddressResult) => {
    updateAddress(address.formatted_address);
    updateCoordinates({
      latitude: address.geometry.location.lat,
      longitude: address.geometry.location.lng
    }, address.formatted_address);
    setShowNearbyAddresses(false);
    clearAddresses();
  };
}
```

## 🎯 **Interface do Usuário**

### **Botão de Localização**
- Aparece ao lado do label "Endereço Completo"
- Ícone de localização com texto "Usar minha localização"
- Estado de loading durante captura
- Desabilitado se geolocalização não for suportada

### **Modal de Endereços Próximos**
- Lista numerada de endereços encontrados
- Mostra coordenadas de cada endereço
- Botão de cancelar para fechar
- Loading state durante busca

### **Tratamento de Erros**
- Mensagens claras para diferentes tipos de erro
- Permissão negada: "Permissão de localização negada"
- Localização indisponível: "Localização não disponível"
- Timeout: "Tempo limite para obter localização"

## 📱 **Fluxo de Uso**

### **1. Usuário Clica no Botão**
```
📍 Usuário clica em "Usar minha localização"
↓
🔒 Navegador solicita permissão de localização
↓
📍 Sistema captura coordenadas GPS
↓
🔄 Faz reverse geocoding com Google Maps
↓
📋 Mostra modal com endereços próximos
↓
✅ Usuário seleciona endereço desejado
↓
📝 Campo de endereço é preenchido automaticamente
```

### **2. Logs de Debug**
```
📍 Iniciando captura de localização...
📍 Localização obtida: {latitude: -7.1056277, longitude: -34.8331074, accuracy: 10}
🔄 Fazendo reverse geocoding para: {latitude: -7.1056277, longitude: -34.8331074}
✅ Endereços encontrados: [Array de endereços]
✅ Endereço selecionado: Av. Pombal - Manaíra, João Pessoa - PB, Brasil
```

## 🔒 **Segurança e Privacidade**

### **Permissões**
- Solicita permissão apenas quando usuário clica no botão
- Não captura localização automaticamente
- Usuário tem controle total sobre quando usar a funcionalidade

### **Dados**
- Coordenadas são usadas apenas para buscar endereços
- Não são armazenadas permanentemente
- São limpas após seleção do endereço

### **Fallback**
- Funciona mesmo se geolocalização for negada
- Usuário pode digitar endereço manualmente
- Google Places Autocomplete continua funcionando

## 🎨 **Estados Visuais**

### **Botão Normal**
```typescript
className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
```

### **Botão Loading**
```typescript
disabled={isGeolocationLoading}
className="disabled:opacity-50 disabled:cursor-not-allowed"
```

### **Modal de Endereços**
```typescript
className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
```

## 📊 **Benefícios**

### **Para o Usuário**
- ✅ Preenchimento mais rápido do endereço
- ✅ Menos erros de digitação
- ✅ Endereços mais precisos
- ✅ Experiência mais fluida

### **Para o Restaurante**
- ✅ Endereços mais precisos para entrega
- ✅ Menos confusão sobre localização
- ✅ Cálculo de distância mais preciso
- ✅ Redução de entregas em endereços errados

### **Para o Sistema**
- ✅ Integração perfeita com Google Maps
- ✅ Reutilização de APIs existentes
- ✅ Código modular e reutilizável
- ✅ Tratamento robusto de erros

## 🔧 **Arquivos Criados/Modificados**

### **Novos Arquivos:**
- `src/hooks/useGeolocation.ts` - Hook para geolocalização
- `src/hooks/useReverseGeocoding.ts` - Hook para reverse geocoding
- `src/components/NearbyAddresses.tsx` - Modal de endereços próximos

### **Arquivos Modificados:**
- `src/components/CustomerDataForm.tsx` - Adicionado botão e funcionalidade

### **Dependências:**
- Google Maps JavaScript API (já existente)
- Geolocation API do navegador
- React hooks (useState, useCallback, useEffect)

## 🚀 **Como Testar**

### **1. Teste Básico:**
1. Abrir cardápio digital
2. Adicionar item ao carrinho
3. Abrir formulário de dados do cliente
4. Clicar em "Usar minha localização"
5. Permitir acesso à localização
6. Selecionar um endereço da lista
7. Verificar se campo foi preenchido

### **2. Teste de Permissões:**
1. Negar permissão de localização
2. Verificar mensagem de erro
3. Testar digitação manual do endereço

### **3. Teste de Compatibilidade:**
1. Testar em diferentes navegadores
2. Verificar se botão aparece apenas quando suportado
3. Testar em dispositivos móveis

A funcionalidade está completamente implementada e integrada ao sistema existente, proporcionando uma experiência mais fluida para o usuário ao preencher o endereço de entrega.


