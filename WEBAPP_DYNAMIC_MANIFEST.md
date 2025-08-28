# WebApp com Manifest Dinâmico - Solução para Salvamento de Rota

## 🎯 **Problema Resolvido**

Anteriormente, o webapp sempre salvava a home (`/`) independentemente de onde o usuário estivesse. Agora implementamos uma solução que **modifica dinamicamente o manifest** para salvar a rota atual.

## 🔧 **Como Funciona a Nova Solução**

### **1. Manifest Dinâmico em Tempo Real**
- O hook `useDynamicManifest` detecta mudanças de rota
- Quando o usuário está em um restaurante, cria um manifest personalizado
- O `start_url` é alterado para a rota atual
- O nome e descrição são personalizados para o restaurante

### **2. Atualização Automática do Manifest**
```javascript
// Manifest padrão (home)
{
  "name": "Restaurant App",
  "start_url": "/"
}

// Manifest dinâmico para restaurante
{
  "name": "Café Moendo - Cardápio",
  "start_url": "/restaurant/cafe-moendo"
}
```

### **3. Implementação Técnica**
- **Blob URLs**: Cria um novo manifest como blob
- **Link Update**: Atualiza o `<link rel="manifest">` dinamicamente
- **Memory Management**: Remove URLs de blob antigas para evitar vazamentos
- **Fallback**: Volta ao manifest padrão quando não está em restaurante

## 📱 **Fluxo de Funcionamento**

### **Passo 1: Usuário Navega para Restaurante**
```
URL: /restaurant/cafe-moendo
Hook detecta: isRestaurantPage = true, restaurantName = "Café Moendo"
```

### **Passo 2: Manifest é Atualizado**
```javascript
// Manifest anterior é substituído por:
{
  "name": "Café Moendo - Cardápio",
  "short_name": "Café Moendo",
  "description": "Cardápio digital de Café Moendo",
  "start_url": "/restaurant/cafe-moendo"
}
```

### **Passo 3: Usuário Instala o App**
- O prompt mostra "Instalar Café Moendo"
- O manifest atualizado é usado para a instalação
- O app é salvo com `/restaurant/cafe-moendo` como ponto de entrada

### **Passo 4: App Abre no Restaurante**
- Ao abrir o app instalado, vai direto para o Café Moendo
- Não redireciona para a home
- Funciona offline na página específica

## 🛠️ **Componentes e Hooks**

### **DynamicManifestProvider**
- Componente invisível que gerencia o manifest
- Executa automaticamente em todas as páginas
- Não interfere na interface do usuário

### **useDynamicManifest**
- Hook principal que detecta mudanças de rota
- Cria manifests personalizados para restaurantes
- Gerencia a atualização do DOM

### **useCurrentRoute**
- Detecta a rota atual e contexto
- Identifica se está em página de restaurante
- Extrai nome do restaurante da URL

## 📊 **Exemplos de Manifest Dinâmico**

### **Café Moendo**
```json
{
  "name": "Café Moendo - Cardápio",
  "short_name": "Café Moendo",
  "description": "Cardápio digital de Café Moendo",
  "start_url": "/restaurant/cafe-moendo"
}
```

### **Dragon Palace**
```json
{
  "name": "Dragon Palace - Cardápio",
  "short_name": "Dragon Palace",
  "description": "Cardápio digital de Dragon Palace",
  "start_url": "/restaurant/dragon-palace"
}
```

### **Home (Padrão)**
```json
{
  "name": "Restaurant App",
  "short_name": "Restaurant",
  "description": "Aplicativo de restaurante com cardápio digital e pedidos",
  "start_url": "/"
}
```

## 🔄 **Cache Inteligente**

### **Service Worker Atualizado**
- Cacheia a página atual automaticamente
- Para restaurantes, cacheia também a rota base
- Mantém funcionalidade offline na página específica

### **Estratégia de Cache**
```javascript
// URLs sempre em cache
['/', '/offline', '/about', '/organization', '/restaurant']

// Página atual cacheada dinamicamente
// + recursos relacionados do restaurante
```

## 🧪 **Testando a Funcionalidade**

### **1. Navegue para um restaurante**
```
http://localhost:3001/restaurant/cafe-moendo
```

### **2. Verifique o console**
- Deve mostrar: "Manifest atualizado para: /restaurant/cafe-moendo"

### **3. Inspecione o DOM**
- `<link rel="manifest">` deve ter href atualizado
- O manifest deve apontar para a rota atual

### **4. Teste a instalação**
- Prompt deve mostrar "Instalar Café Moendo"
- App deve abrir direto no restaurante

## 🚀 **Vantagens da Nova Solução**

### **Para o Usuário**
- ✅ **Salva exatamente onde está** - não perde contexto
- ✅ **Acesso direto** ao restaurante escolhido
- ✅ **Experiência personalizada** por estabelecimento
- ✅ **Funciona offline** na página específica

### **Para o Desenvolvedor**
- ✅ **Solução robusta** que funciona em todos os navegadores
- ✅ **Manifest dinâmico** sem necessidade de múltiplos arquivos
- ✅ **Memory management** adequado para evitar vazamentos
- ✅ **Fallback automático** para páginas não-restaurante

### **Para o Restaurante**
- ✅ **Branding personalizado** no prompt de instalação
- ✅ **Maior engajamento** com usuários
- ✅ **Acesso rápido** ao cardápio específico
- ✅ **Experiência dedicada** para cada estabelecimento

## 🔍 **Debugging e Troubleshooting**

### **Verificar se o manifest foi atualizado**
```javascript
// No console do navegador
const manifestLink = document.querySelector('link[rel="manifest"]');
console.log('Current manifest:', manifestLink.href);
```

### **Verificar logs do hook**
```javascript
// Deve aparecer no console:
// "Manifest atualizado para: /restaurant/cafe-moendo"
```

### **Problemas comuns**
1. **Manifest não atualiza**: Verificar se o hook está sendo executado
2. **Erro de blob**: Verificar se há vazamentos de memória
3. **Cache não funciona**: Verificar se o service worker está registrado

## 📈 **Métricas e Analytics**

### **O que monitorar**
- Taxa de instalação por restaurante
- Rota onde o usuário instalou o app
- Tempo entre navegação e instalação
- Erros de manifest dinâmico

### **Eventos importantes**
- `manifest_updated`: Quando o manifest é alterado
- `restaurant_manifest_created`: Manifest específico de restaurante criado
- `manifest_fallback`: Volta ao manifest padrão

---

**Status**: ✅ Implementado e funcionando
**Versão**: 2.0.0
**Última atualização**: Dezembro 2024
**Técnica**: Manifest dinâmico com Blob URLs
