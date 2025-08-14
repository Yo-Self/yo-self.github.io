# 🍽️ Cards de Pratos no Chatbot

## Funcionalidade Implementada

O chatbot agora exibe **cards dos pratos recomendados** abaixo das respostas da IA, permitindo que os usuários vejam rapidamente os detalhes dos pratos e abram a tela de detalhes com um clique.

## Como Funciona

### 1. Detecção Automática de Pratos
O sistema analisa automaticamente as respostas da IA para identificar:
- **Pratos específicos** mencionados na resposta
- **Recomendações gerais** quando a IA sugere pratos
- **Palavras-chave** como "recomendo", "sugiro", "popular", "cardápio"

### 2. Exibição dos Cards
Quando pratos são detectados, o chatbot exibe:
- 🍽️ **Cards compactos** com imagem, nome, preço e descrição
- **Design responsivo** que se adapta ao tema claro/escuro
- **Animações suaves** com hover effects
- **Limite de 3 pratos** para não sobrecarregar a interface

### 3. Modal de Detalhes
Ao clicar em um card:
- **Modal abre** com detalhes completos do prato
- **Informações completas**: ingredientes, porção, alergênicos
- **Imagem em alta resolução**
- **Fácil fechamento** com botão X ou clique fora

## Exemplos de Uso

### Perguntas que Ativam os Cards:
- "Quais são os pratos principais?"
- "Recomende algo para mim"
- "Quais são os pratos mais populares?"
- "Me sugira algo do cardápio"
- "Fale sobre o X-Burger" (detecta prato específico)

### Resposta da IA:
```
Olá! Recomendo alguns dos nossos pratos mais populares:

• X-Burger - R$ 25,90
  Hambúrguer artesanal com queijo e molho especial

• Pizza Margherita - R$ 32,50
  Pizza tradicional com molho de tomate e mussarela

• Salada Caesar - R$ 18,90
  Salada fresca com alface, croutons e molho caesar
```

### Cards Exibidos:
- 3 cards compactos aparecem abaixo da resposta
- Cada card mostra imagem, nome, preço e descrição
- Clique em qualquer card abre o modal de detalhes

## Arquivos Modificados

### Novos Arquivos:
- `src/components/ChatDishCards.tsx` - Componente dos cards
- `CHATBOT_DISH_CARDS.md` - Esta documentação

### Arquivos Atualizados:
- `src/hooks/useWebLLM.ts` - Adicionada detecção de pratos
- `src/components/ChatBot.tsx` - Integração dos cards e modal
- `src/app/globals.css` - Classes CSS para line-clamp

## Funcionalidades Técnicas

### Detecção Inteligente:
```typescript
function extractRecommendedDishes(message: string, restaurantData: any): any[] {
  // Busca por nomes específicos de pratos
  // Detecta palavras-chave de recomendação
  // Limita a 3 pratos para UX otimizada
}
```

### Interface Responsiva:
- **Cards compactos** (80x80px de imagem)
- **Texto truncado** com line-clamp
- **Hover effects** suaves
- **Tema adaptativo** (claro/escuro)

### Modal de Detalhes:
- **Z-index alto** (300) para ficar sobre o chat
- **Backdrop blur** para foco
- **Informações completas** do prato
- **Fechamento intuitivo**

## Benefícios

### Para o Usuário:
- ✅ **Acesso rápido** aos detalhes dos pratos
- ✅ **Visualização clara** das recomendações
- ✅ **Experiência fluida** sem sair do chat
- ✅ **Informações completas** em um clique

### Para o Negócio:
- ✅ **Maior engajamento** com o cardápio
- ✅ **Conversão facilitada** para pedidos
- ✅ **UX melhorada** no chatbot
- ✅ **Destaque automático** dos pratos

## Teste

1. **Abra o chatbot** no site
2. **Faça perguntas** como:
   - "Quais são os pratos principais?"
   - "Recomende algo para mim"
   - "Fale sobre o [nome do prato]"
3. **Observe os cards** aparecerem abaixo da resposta
4. **Clique nos cards** para ver os detalhes
5. **Teste o modal** de detalhes

A funcionalidade está totalmente integrada e funcionando! 🎉
