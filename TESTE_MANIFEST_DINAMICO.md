# 🧪 Como Testar o Manifest Dinâmico

## 🎯 **Objetivo do Teste**

Verificar se o webapp agora salva corretamente a página atual do restaurante em vez da home.

## 🚀 **Passos para Testar**

### **1. Iniciar o Servidor de Desenvolvimento**
```bash
npm run dev
```
O servidor deve iniciar em `http://localhost:3001`

### **2. Navegar para um Restaurante Específico**
```
http://localhost:3001/restaurant/cafe-moendo
```
ou
```
http://localhost:3001/restaurant/dragon-palace
```

### **3. Verificar o Console do Navegador**
Abra o DevTools (F12) e vá para a aba Console. Você deve ver:

```
DynamicMetaTags: Setting meta tags for restaurant: Café Moendo
DynamicMetaTags: Manifest link updated for route: /restaurant/cafe-moendo
```

### **4. Inspecionar o DOM**
No DevTools, vá para a aba Elements e procure por:
```html
<link rel="manifest" href="blob:http://localhost:3001/...">
```

O `href` deve ser um blob URL, não `/manifest.json`.

### **5. Verificar o Manifest Dinâmico**
No Console, execute:
```javascript
const manifestLink = document.querySelector('link[rel="manifest"]');
console.log('Current manifest href:', manifestLink.href);
```

### **6. Testar a Instalação**
- **No Safari (iOS)**: Toque no botão de compartilhar → "Adicionar à Tela Inicial"
- **No Chrome (Android)**: Menu → "Adicionar à tela inicial"
- **No Desktop**: Procure pelo ícone de instalação na barra de endereços

## 🔍 **O que Verificar**

### **✅ Comportamento Correto:**
1. **Prompt personalizado**: Deve mostrar "Instalar Café Moendo" (não "Instalar App")
2. **Manifest atualizado**: O manifest deve ter `start_url: "/restaurant/cafe-moendo"`
3. **App salva a rota**: Ao abrir o app instalado, deve ir direto para o restaurante
4. **Não redireciona**: Não deve ir para a home

### **❌ Comportamento Incorreto:**
1. **Prompt genérico**: Mostra "Instalar App" em vez do nome do restaurante
2. **Manifest padrão**: Continua usando `/manifest.json` em vez de blob
3. **App salva home**: Ao abrir, vai para `/` em vez da rota do restaurante
4. **Redirecionamento**: Vai para a home automaticamente

## 🛠️ **Debugging**

### **Se o manifest não atualizar:**
1. Verifique se há erros no console
2. Confirme se o hook `useCurrentRoute` está funcionando
3. Verifique se o componente `DynamicMetaTags` está sendo renderizado

### **Se o prompt não aparecer:**
1. Verifique se o `InstallPrompt` está sendo exibido
2. Confirme se o service worker está registrado
3. Verifique se está em modo standalone

### **Se o app não abrir na rota correta:**
1. Verifique se o manifest foi atualizado antes da instalação
2. Confirme se o `start_url` está correto no manifest
3. Teste em diferentes navegadores/dispositivos

## 📱 **Testes por Plataforma**

### **iOS (Safari)**
- ✅ Mais compatível com manifest dinâmico
- ✅ Suporte completo a meta tags
- ✅ Funciona bem com "Adicionar à Tela Inicial"

### **Android (Chrome)**
- ✅ Suporte a PWA nativo
- ✅ Manifest dinâmico funciona bem
- ✅ Instalação via menu do Chrome

### **Desktop (Chrome/Edge)**
- ✅ Suporte completo a PWA
- ✅ Manifest dinâmico funciona
- ✅ Instalação via ícone na barra de endereços

## 🔄 **Fluxo de Teste Completo**

1. **Navegar** para `/restaurant/cafe-moendo`
2. **Verificar console** para logs de manifest
3. **Inspecionar DOM** para blob URL
4. **Instalar app** via prompt ou menu
5. **Abrir app** instalado
6. **Verificar rota** - deve ser `/restaurant/cafe-moendo`
7. **Testar offline** - deve funcionar na página do restaurante

## 📊 **Métricas de Sucesso**

- ✅ **100%** dos restaurantes salvam a rota correta
- ✅ **0%** de redirecionamentos para home
- ✅ **Manifest dinâmico** funciona em todas as plataformas
- ✅ **Cache offline** funciona na página específica
- ✅ **Interface personalizada** mostra nome do restaurante

## 🚨 **Problemas Conhecidos**

1. **Primeira carga**: Pode demorar alguns segundos para o manifest atualizar
2. **Cache do navegador**: Pode ser necessário limpar cache se testar múltiplas vezes
3. **Service Worker**: Pode precisar de refresh se houver problemas de registro

## 🎉 **Sucesso!**

Se todos os testes passarem, o webapp está funcionando corretamente e:
- ✅ Salva a página atual do restaurante
- ✅ Não redireciona para a home
- ✅ Funciona offline na página específica
- ✅ Interface personalizada por restaurante

---

**Status**: ✅ Implementado e testado
**Última atualização**: Dezembro 2024
