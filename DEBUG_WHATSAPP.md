# Debug WhatsApp - Guia de Teste

## Problema
O botão "Fazer Pedido" não está abrindo o WhatsApp após criar o pedido.

## Mudanças Implementadas

### 1. Validações Adicionais
- ✅ Verificação se `config.enabled` é `true`
- ✅ Verificação se `config.phoneNumber` existe e não está vazio
- ✅ Logs detalhados em cada etapa do processo

### 2. Logs para Debug
Abra o **Console do Navegador** (F12) e procure por:

#### Ao carregar a página do restaurante:
```
[useWhatsAppConfig] Dados do restaurante recebidos: {...}
[useWhatsAppConfig] WhatsApp HABILITADO: {...}
```
ou
```
[useWhatsAppConfig] WhatsApp DESABILITADO - sem número de telefone
```

#### Ao abrir o carrinho:
```
[CartModal] Modal aberto com restaurantId: {...}
[CartWhatsAppButton] Estado atual: {
  restaurantId: "...",
  config.enabled: true/false,
  config.phoneNumber: "...",
  ...
}
```

#### Ao clicar em "Fazer Pedido":

**Quando popups são permitidos (cenário ideal):**
```
[CartWhatsAppButton] Config WhatsApp: { enabled: true, phoneNumber: "...", ... }
[CartWhatsAppButton] Iniciando a criação do pedido...
[CartWhatsAppButton] Restaurante: { id: "...", name: "...", slug: "..." }
[CartWhatsAppButton] Telefone WhatsApp: "..."
[CartWhatsAppButton] Chamando createOrder...
[CartWhatsAppButton] Pedido criado com sucesso: {...}
[CartWhatsAppButton] Mensagem do WhatsApp gerada.
[CartWhatsAppButton] URL do WhatsApp: https://wa.me/...
[CartWhatsAppButton] Abrindo WhatsApp...
[CartWhatsAppButton] WhatsApp aberto com sucesso!
```

**Quando popups são bloqueados (fallback):**
```
[CartWhatsAppButton] Config WhatsApp: { enabled: true, phoneNumber: "...", ... }
[CartWhatsAppButton] Iniciando a criação do pedido...
[CartWhatsAppButton] Restaurante: { id: "...", name: "...", slug: "..." }
[CartWhatsAppButton] Telefone WhatsApp: "..."
[CartWhatsAppButton] Chamando createOrder...
[CartWhatsAppButton] Pedido criado com sucesso: {...}
[CartWhatsAppButton] Mensagem do WhatsApp gerada.
[CartWhatsAppButton] URL do WhatsApp: https://wa.me/...
[CartWhatsAppButton] Abrindo WhatsApp...
[CartWhatsAppButton] Popup bloqueado pelo navegador, mostrando fallback
[CartWhatsAppButton] Usuário confirmou, redirecionando...
```

### 3. Possíveis Problemas

#### A. WhatsApp Desabilitado
Se aparecer no console:
```
[useWhatsAppConfig] WhatsApp DESABILITADO - sem número de telefone
```

**Solução**: Verificar no Supabase se o restaurante tem:
- `whatsapp_phone` preenchido (ex: "5511999999999")
- `whatsapp_enabled` = `true` (ou `NULL`, que é considerado `true`)

#### B. Popup Bloqueado pelo Navegador
Se o WhatsApp não abrir e aparecer um popup de confirmação, significa que o navegador está bloqueando popups.

**Comportamento Atual**:
1. Sistema tenta abrir WhatsApp automaticamente
2. Navegador bloqueia
3. Sistema detecta e mostra popup pedindo confirmação
4. Usuário clica OK → WhatsApp abre na mesma aba

**Solução Permanente**: 
1. Permitir popups para o site nas configurações do navegador
2. Após permitir, não haverá mais popup de confirmação
3. WhatsApp abrirá direto em nova aba

**Ícone de Bloqueio**: Geralmente aparece na barra de endereço do navegador

#### C. Número Inválido
Se o WhatsApp abrir mas der erro, verifique o formato do número:
- ✅ Correto: `5511999999999` (país + DDD + número)
- ❌ Errado: `(11) 99999-9999` (com formatação)

### 4. Como Testar

1. Abra o console do navegador (F12)
2. Acesse a página do restaurante
3. Adicione itens ao carrinho
4. Clique em "Fazer Pedido"
5. Copie todos os logs que aparecem no console
6. Compartilhe os logs para análise

### 5. Checklist de Verificação

- [ ] O botão aparece verde (não cinza)?
- [ ] O texto do botão diz "Fazer Pedido" (não "WhatsApp Indisponível")?
- [ ] Ao clicar, aparece "Criando Pedido..." momentaneamente?
- [ ] Aparece algum alerta de erro?
- [ ] O WhatsApp abre em nova aba?
- [ ] Se não abrir, aparece o diálogo de confirmação?

### 6. Comportamento Esperado

Ao clicar em "Fazer Pedido", o sistema deve:
1. ✅ Mostrar "Criando Pedido..." no botão
2. ✅ Criar o pedido no banco de dados
3. ✅ Gerar a mensagem formatada para WhatsApp
4. ✅ **Tentar abrir o WhatsApp automaticamente em nova aba**

**Dois cenários possíveis:**

#### Cenário A - Popups Permitidos (Ideal)
- WhatsApp abre automaticamente em nova aba
- Sem nenhum popup intermediário
- Experiência 100% fluida ✅

#### Cenário B - Popups Bloqueados
- Navegador bloqueia a abertura automática
- Sistema detecta o bloqueio
- Mostra popup com mensagem:
  ```
  ⚠️ O navegador bloqueou a abertura do WhatsApp.
  
  Clique em OK para abrir o WhatsApp agora.
  
  Dica: Permita popups para este site nas configurações do navegador para uma experiência melhor.
  ```
- Se usuário clicar OK → Redireciona para WhatsApp
- Se usuário clicar Cancelar → Nada acontece (pedido já foi criado no banco)

**Nota**: O popup SÓ aparece quando o navegador bloqueia. Na maioria dos casos, abre direto!

## Comandos de Teste

Para testar localmente:
```bash
npm run dev
```

Para fazer build e deploy:
```bash
npm run build
npm run deploy
```

## Próximos Passos

Se o problema persistir, compartilhe:
1. Todos os logs do console
2. Qual navegador está usando
3. Se o botão está verde ou cinza
4. Se aparece alguma mensagem de erro
