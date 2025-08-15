# Funcionalidade: Chamar Garçom

Esta funcionalidade permite que clientes chamem garçons através da interface do cardápio digital, e que a equipe do restaurante receba notificações em tempo real.

## Estrutura Implementada

### 1. Banco de Dados
- **Tabela**: `waiter_calls`
- **Campos**:
  - `id`: UUID (chave primária)
  - `restaurant_id`: UUID (referência ao restaurante)
  - `table_number`: INTEGER (número da mesa)
  - `status`: TEXT ('pending', 'attended', 'cancelled')
  - `created_at`: TIMESTAMPTZ (timestamp da criação)
  - `attended_at`: TIMESTAMPTZ (timestamp do atendimento)
  - `attended_by`: UUID (ID do garçom que atendeu)
  - `notes`: TEXT (observações opcionais)

- **Tabela**: `restaurants` (campo adicionado)
- **Campo**: `waiter_call_enabled`
  - Tipo: BOOLEAN
  - Padrão: false
  - Descrição: Controla se a funcionalidade de chamar garçom está habilitada para o restaurante

### 2. Edge Function
- **Nome**: `waiter-calls`
- **Endpoint**: `/functions/v1/waiter-calls`
- **Métodos**:
  - `POST`: Criar nova chamada
  - `GET`: Buscar chamadas (com filtros)
  - `PUT`: Atualizar status da chamada

### 3. Hook React
- **Arquivo**: `src/hooks/useWaiterCalls.ts`
- **Funcionalidades**:
  - `createCall`: Criar nova chamada
  - `fetchCalls`: Buscar chamadas
  - `updateCall`: Atualizar chamada
  - Gerenciamento de estado e erros

### 4. Componentes
- **WaiterCallButton**: Botão circular laranja com ícone `call-waiter.svg` (só aparece se `waiter_call_enabled = true`)
- **WaiterCallNotifications**: Painel de notificações para a equipe

## Como Usar no Projeto Atual

### Para Clientes (Cardápio Digital)
O botão está integrado no Header e aparece automaticamente **apenas** quando o campo `waiter_call_enabled` está habilitado para o restaurante.

**Para habilitar a funcionalidade:**
```sql
UPDATE restaurants SET waiter_call_enabled = true WHERE id = 'restaurant-uuid';
```

**Para desabilitar a funcionalidade:**
```sql
UPDATE restaurants SET waiter_call_enabled = false WHERE id = 'restaurant-uuid';
```

### Para a Equipe do Restaurante (Interface de Gestão)

Adicione o componente `WaiterCallNotifications` no header ou sidebar da interface de gestão:

```tsx
import WaiterCallNotifications from '@/components/WaiterCallNotifications';

// No componente de layout da interface de gestão
<WaiterCallNotifications 
  restaurantId={restaurant.id}
  onCallAttended={(call) => {
    // Callback opcional quando uma chamada é atendida
    console.log(`Chamada da mesa ${call.table_number} atendida`);
  }}
/>
```

## Prompt para Implementar no Projeto da Interface do Restaurante

```
Implemente a funcionalidade de notificações de chamadas de garçom na interface de gestão do restaurante.

### Requisitos:

1. **Componente de Notificações**: 
   - Adicione o componente `WaiterCallNotifications` no header ou sidebar
   - O componente deve mostrar um badge com o número de chamadas pendentes
   - Ao clicar, deve abrir um painel com todas as chamadas pendentes

2. **Funcionalidades do Painel**:
   - Listar todas as chamadas pendentes com:
     - Número da mesa
     - Horário da chamada
     - Observações (se houver)
   - Botões para "Atender" ou "Cancelar" cada chamada
   - Atualização automática a cada 10 segundos

3. **Integração com Supabase**:
   - Use a Edge Function `/functions/v1/waiter-calls`
   - Implemente o hook `useWaiterCalls` para gerenciar as chamadas
   - Configure as variáveis de ambiente do Supabase

4. **Interface**:
   - Design responsivo e acessível
   - Tema claro/escuro compatível
   - Animações suaves
   - Feedback visual para ações

5. **Estrutura de Arquivos**:
   - `src/hooks/useWaiterCalls.ts` - Hook para gerenciar chamadas
   - `src/components/WaiterCallNotifications.tsx` - Componente de notificações
   - Integrar no layout principal da interface de gestão

### Exemplo de Implementação:

```tsx
// No layout principal da interface de gestão
import WaiterCallNotifications from '@/components/WaiterCallNotifications';

function RestaurantDashboard({ restaurant }) {
  return (
    <div>
      <header className="flex items-center justify-between p-4">
        <h1>Dashboard - {restaurant.name}</h1>
        <div className="flex items-center gap-4">
          <WaiterCallNotifications 
            restaurantId={restaurant.id}
            onCallAttended={(call) => {
              // Opcional: mostrar toast de confirmação
              toast.success(`Mesa ${call.table_number} atendida com sucesso!`);
            }}
          />
          {/* Outros botões do header */}
        </div>
      </header>
      {/* Resto do conteúdo */}
    </div>
  );
}
```

### Variáveis de Ambiente Necessárias:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### Funcionalidades Adicionais (Opcionais):
- Som de notificação para novas chamadas
- Notificações push do navegador
- Histórico de chamadas atendidas
- Relatórios de tempo de resposta
- Integração com sistema de mesas
```

## API Endpoints

### POST /functions/v1/waiter-calls
Criar nova chamada de garçom

**Body:**
```json
{
  "restaurant_id": "uuid",
  "table_number": 5,
  "notes": "Preciso de mais água"
}
```

**Response:**
```json
{
  "success": true,
  "call": {
    "id": "uuid",
    "restaurant_id": "uuid",
    "table_number": 5,
    "status": "pending",
    "created_at": "2024-01-01T12:00:00Z",
    "notes": "Preciso de mais água"
  }
}
```

### GET /functions/v1/waiter-calls?restaurant_id=uuid&status=pending
Buscar chamadas de garçom

**Response:**
```json
{
  "success": true,
  "calls": [
    {
      "id": "uuid",
      "restaurant_id": "uuid",
      "table_number": 5,
      "status": "pending",
      "created_at": "2024-01-01T12:00:00Z",
      "notes": "Preciso de mais água"
    }
  ]
}
```

### PUT /functions/v1/waiter-calls
Atualizar status da chamada

**Body:**
```json
{
  "call_id": "uuid",
  "status": "attended",
  "attended_by": "uuid_do_garcom",
  "notes": "Observações adicionais"
}
```

## Como Testar a Funcionalidade

### 1. Habilitar para um Restaurante
```sql
UPDATE restaurants SET waiter_call_enabled = true WHERE id = 'e1e057fc-ea38-42f7-b7b2-226580130355';
```

### 2. Verificar se o Botão Aparece
- Acesse a página do restaurante no cardápio digital
- A cápsula laranja "Chamar Garçom" deve aparecer no header

### 3. Testar a Chamada
- Clique no botão
- Digite o número da mesa (ex: 5)
- Adicione observações (opcional)
- Clique em "Chamar Garçom"

### 4. Verificar no Painel da Equipe
- Use o componente `WaiterCallNotifications` na interface de gestão
- A chamada deve aparecer na lista de pendentes

### 5. Desabilitar para Testar
```sql
UPDATE restaurants SET waiter_call_enabled = false WHERE id = 'e1e057fc-ea38-42f7-b7b2-226580130355';
```
- A cápsula "Chamar Garçom" deve desaparecer do header

## Considerações de Segurança

1. **RLS (Row Level Security)**: A tabela `waiter_calls` deve ter políticas RLS configuradas
2. **Validação**: A Edge Function valida todos os inputs
3. **Rate Limiting**: Considerar implementar rate limiting para evitar spam
4. **Autenticação**: Verificar se o usuário tem permissão para acessar o restaurante

## Status da Implementação

✅ **Deploy Concluído**: A Edge Function `waiter-calls` foi deployada com sucesso no Supabase
✅ **Testes Realizados**: Todos os endpoints foram testados e estão funcionando corretamente
✅ **Validações Implementadas**: Prevenção de chamadas duplicadas funcionando
✅ **Interface Cliente**: Botão integrado no header do cardápio digital
✅ **Controle por Restaurante**: Campo `waiter_call_enabled` implementado para habilitar/desabilitar por restaurante
✅ **Design Simplificado**: Botão circular com ícone apenas

## Próximos Passos

1. ✅ ~~Implementar no projeto da interface do restaurante~~ (use o prompt abaixo)
2. Adicionar notificações sonoras
3. Implementar notificações push
4. Criar relatórios de performance
5. Integrar com sistema de mesas existente

## 🔧 Troubleshooting

### Problema: Ícone não aparece no GitHub Pages
**Sintoma**: Botão "Chamar Garçom" aparece sem ícone no GitHub Pages, mas funciona localmente.

**Causa**: Caminho relativo do SVG não resolve corretamente em rotas aninhadas do GitHub Pages.

**Solução**: Usar URL absoluta para o ícone SVG:
```tsx
src="https://yo-self.github.io/call-waiter.svg"
```

**Verificação**: Testar se o arquivo está acessível em `https://yo-self.github.io/call-waiter.svg`

## 🎨 Design do Botão

### Características Visuais
- **Formato**: Botão circular laranja
- **Tamanho**: 40x40px (w-10 h-10)
- **Ícone**: Arquivo `call-waiter.svg` convertido para branco via filtros CSS
- **Hover**: Transição suave para laranja mais escuro
- **Sombra**: Efeito de elevação sutil
- **Posição**: Canto superior direito do header

### Layout do Header
- **Esquerda**: Botão de acessibilidade + Botão de ordenação
- **Direita**: Botão de compartilhamento + Botão "Chamar Garçom"

### Ícone Utilizado
O botão usa o arquivo `call-waiter.svg` que representa uma mão segurando um prato com cloche (tampa de prato), simbolizando o serviço de garçom de forma elegante e intuitiva. O ícone é convertido para branco através de filtros CSS para contrastar com o fundo laranja.

**Nota para GitHub Pages**: O ícone usa URL absoluta (`https://yo-self.github.io/call-waiter.svg`) para garantir que funcione corretamente em todas as rotas do site.

## 🎯 Comportamento da Interface

- **Quando `waiter_call_enabled = true`**: O botão circular laranja com ícone aparece no header
- **Quando `waiter_call_enabled = false` ou `null`**: O botão não é renderizado
- **Design**: Botão circular laranja com ícone `call-waiter.svg`
- **Controle granular**: Cada restaurante pode ter sua própria configuração
