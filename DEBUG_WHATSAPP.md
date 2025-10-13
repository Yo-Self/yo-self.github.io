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
```
[CartWhatsAppButton] Config WhatsApp: { enabled: true, phoneNumber: "...", ... }
[CartWhatsAppButton] Iniciando a criação do pedido...
[CartWhatsAppButton] Restaurante: { id: "...", name: "...", slug: "..." }
[CartWhatsAppButton] Telefone WhatsApp: "..."
[CartWhatsAppButton] Chamando createOrder...
[CartWhatsAppButton] Pedido criado com sucesso: {...}
[CartWhatsAppButton] Mensagem do WhatsApp gerada.
[CartWhatsAppButton] URL do WhatsApp: https://wa.me/...
[CartWhatsAppButton] Tentando abrir WhatsApp...
[CartWhatsAppButton] window.open retornou: sucesso/bloqueado/falhou
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

#### B. Popup Bloqueado
Se aparecer:
```
[CartWhatsAppButton] window.open retornou: bloqueado/falhou
```

**Solução**: 
1. O sistema agora mostra um diálogo perguntando se deseja continuar
2. Se confirmar, redireciona na mesma aba
3. Ou permita popups para o site no navegador

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

### 6. Fallback Implementado

Se o `window.open` falhar (popup bloqueado), o sistema:
1. Detecta a falha
2. Mostra um diálogo: "O WhatsApp será aberto em uma nova aba. Você será redirecionado. Deseja continuar?"
3. Se confirmar, usa `window.location.href` para redirecionar

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
