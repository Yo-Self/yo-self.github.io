# Configuração da API do Google Maps

## ⚠️ Problemas Identificados

Baseado nos logs de erro, identifiquei os seguintes problemas:

1. **API não ativada**: `ApiNotActivatedMapError`
2. **Múltiplos carregamentos**: "You have included the Google Maps JavaScript API multiple times"
3. **Chave de API exposta**: A chave está visível nos logs

## 🔧 Soluções Implementadas

### 1. **Detecção de Carregamento Duplo**
- Verificação se a API já está carregada antes de carregar novamente
- Prevenção de múltiplos scripts do Google Maps

### 2. **Fallback para Input Simples**
- Se a API do Google Maps não estiver disponível, usa um input simples
- Funcionalidade básica mantida mesmo sem autocompletar

### 3. **Tratamento de Erros**
- Mensagens de erro claras para o usuário
- Indicadores visuais de status da API

## 🚀 Como Configurar Corretamente

### **Passo 1: Google Cloud Console**

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Navegue até **"APIs e Serviços" > "Biblioteca"**
4. Procure por **"Places API"** e ative
5. Procure por **"Maps JavaScript API"** e ative

### **Passo 2: Criar Chave de API**

1. Vá para **"APIs e Serviços" > "Credenciais"**
2. Clique em **"+ Criar Credenciais" > "Chave de API"**
3. Copie a chave gerada

### **Passo 3: Configurar Restrições (IMPORTANTE)**

1. Clique na chave criada para editá-la
2. Em **"Restrições de aplicativo"**:
   - Selecione **"Sites HTTP (sites da Web)"**
   - Adicione seus domínios:
     - `localhost:3001` (para desenvolvimento)
     - `seu-dominio.com` (para produção)
3. Em **"Restrições de API"**:
   - Selecione **"Restringir chave"**
   - Adicione apenas:
     - `Places API`
     - `Maps JavaScript API`

### **Passo 4: Configurar Variável de Ambiente**

```bash
# Adicionar ao .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_api_aqui
```

## 🔒 Segurança

### **Nunca faça:**
- ❌ Expor a chave em repositórios públicos
- ❌ Usar a mesma chave em múltiplos projetos
- ❌ Deixar a chave sem restrições

### **Sempre faça:**
- ✅ Restringir por domínio
- ✅ Restringir por API
- ✅ Monitorar uso no console
- ✅ Rotacionar chaves regularmente

## 🧪 Testando a Configuração

### **Verificar se está funcionando:**

1. Abra o console do navegador
2. Procure por erros relacionados ao Google Maps
3. Teste o campo de endereço na comanda
4. Verifique se aparecem sugestões ao digitar

### **Se não funcionar:**

1. Verifique se as APIs estão ativadas
2. Confirme se as restrições estão corretas
3. Teste a chave no [Google Maps Platform](https://developers.google.com/maps/documentation/javascript/tutorial)

## 📱 Funcionalidade Atual

### **Com API do Google Maps:**
- ✅ Autocompletar de endereços
- ✅ Sugestões em tempo real
- ✅ Validação de endereços
- ✅ Restrição ao Brasil

### **Sem API do Google Maps:**
- ✅ Campo de texto simples
- ✅ Validação básica
- ✅ Funcionalidade completa mantida
- ✅ Experiência do usuário preservada

## 🔄 Migração para Nova API

O Google está recomendando migrar para `PlaceAutocompleteElement`. A implementação atual:

1. **Tenta usar a nova API** se disponível
2. **Fallback para API antiga** se necessário
3. **Input simples** se nenhuma API estiver disponível

## 📊 Monitoramento

### **No Google Cloud Console:**
- Monitore uso da API
- Verifique quotas e limites
- Configure alertas de uso

### **Na aplicação:**
- Logs de erro no console
- Indicadores visuais de status
- Fallback automático em caso de erro

---

## ✅ Status Atual

- ✅ **Detecção de carregamento duplo** implementada
- ✅ **Fallback para input simples** criado
- ✅ **Tratamento de erros** adicionado
- ✅ **Nova API suportada** com fallback
- ✅ **Documentação completa** criada

A funcionalidade está pronta e funcionará mesmo sem a API do Google Maps configurada!
