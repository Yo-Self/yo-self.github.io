# 🔍 Funcionalidade de Zoom de Imagem

## Descrição

Implementada a funcionalidade para **abrir imagens em tela cheia** quando clicadas **APENAS na tela de detalhes do prato**. Agora os usuários podem clicar em qualquer foto de prato para visualizá-la em tamanho completo com um design elegante e responsivo, **independente de outros modais**.

## ⚠️ Comportamento Controlado

### ✅ **Zoom ATIVADO** (apenas na tela de detalhes):
- **DishModal**: Imagem principal do prato
- **ComplementGrid**: Imagens de complementos e adicionais
- **Página de demonstração**: `/preview/image-zoom-demo` (para testes)

### ❌ **Zoom DESATIVADO** (nos cards e listagens):
- **DishCard**: Cards de pratos (clique abre modal de detalhes)
- **Carousel**: Imagens do carrossel (clique abre modal de detalhes)
- **DynamicCarousel**: Carrossel dinâmico (clique abre modal de detalhes)
- **SearchBar**: Resultados de busca (clique abre modal de detalhes)
- **ChatDishCards**: Cards do chatbot (clique abre modal de detalhes)
- **CardJornal**: Cards do jornal (clique abre modal de detalhes)
- **CategoryGrid**: Grid de categorias (clique seleciona categoria)
- **AnimatedCategoryGrid**: Grid animado de categorias (clique seleciona categoria)
- **AnimatedDishCard**: Cards animados de pratos (clique abre modal de detalhes)
- **AnimatedStaticDishCard**: Cards estáticos animados (clique abre modal de detalhes)
- **Header**: Seletor de restaurantes (clique seleciona restaurante)
- **Página principal**: Cards de demonstração (clique abre modal de detalhes)

## Como Funciona

### 1. Clique na Imagem (Tela de Detalhes)
- **Clique simples** em qualquer imagem de prato **dentro do modal de detalhes**
- **Cursor pointer** indica que a imagem é clicável
- **Hover effect** com transparência sutil

### 2. Clique no Card (Listagens)
- **Clique em qualquer ponto** do card abre a **tela de detalhes do prato**
- **NÃO abre** o zoom da imagem
- **Navegação normal** para modal de detalhes

### 3. Modal de Imagem em Tela Cheia
- **View independente** renderizada acima de tudo
- **Fundo escuro** com blur avançado para foco na imagem
- **Imagem centralizada** com tamanho máximo de 95% da tela
- **Preserva proporções** da imagem original
- **Bordas elegantes** com sombras e efeitos visuais
- **Fundo branco/escuro** que se adapta ao tema

### 4. Controles de Navegação
- **Botão X elegante** no canto superior direito
- **Clique fora** da imagem para fechar
- **Tecla ESC** para fechar rapidamente
- **Indicador visual** na parte inferior

## Componentes Criados/Modificados

### Novo Componente: `ImageModal.tsx`
```tsx
interface ImageModalProps {
  isOpen: boolean;
  imageSrc: string;
  imageAlt: string;
  onClose: () => void;
}
```

**Características:**
- **Portal independente** renderizado no body do DOM
- Modal responsivo com z-index ultra-alto (99999999)
- **Posicionamento absoluto** acima de todos os outros elementos
- Backdrop com blur avançado e transparência otimizada
- Bordas elegantes com sombras e efeitos visuais
- Controles de acessibilidade (aria-label)
- Prevenção de scroll do body
- Design adaptativo para tema claro/escuro

### Componente Modificado: `ImageWithLoading.tsx`
**Nova Prop:**
```tsx
clickable?: boolean; // Controla se a imagem é clicável
```

**Funcionalidades Adicionadas:**
- Estado do modal de imagem
- Handler de clique na imagem
- Estilos condicionais (cursor, hover)
- Integração automática com ImageModal

## Uso em Diferentes Contextos

### 1. Cards de Pratos (Zoom DESATIVADO)
- **DishCard**: `clickable={false}` - Clique abre modal de detalhes
- **Carousel**: `clickable={false}` - Clique abre modal de detalhes
- **SearchBar**: `clickable={false}` - Clique abre modal de detalhes
- **CategoryGrid**: `clickable={false}` - Clique seleciona categoria
- **AnimatedDishCard**: `clickable={false}` - Clique abre modal de detalhes

### 2. Modal de Detalhes (Zoom ATIVADO)
- **DishModal**: `clickable={true}` - Clique na imagem abre zoom
- **ComplementGrid**: `clickable={true}` - Clique na imagem abre zoom

### 3. Chatbot (Zoom DESATIVADO)
- **ChatDishCards**: `clickable={false}` - Clique abre modal de detalhes

### 4. Navegação (Zoom DESATIVADO)
- **Header**: `clickable={false}` - Clique seleciona restaurante
- **Página principal**: `clickable={false}` - Clique abre modal de detalhes

## Exemplos de Implementação

### Uso com Zoom (Tela de Detalhes)
```tsx
<ImageWithLoading
  src={dish.image}
  alt={dish.name}
  clickable={true} // ou omitir (padrão)
  className="w-full h-48 object-cover"
/>
```

### Uso sem Zoom (Cards e Listagens)
```tsx
<ImageWithLoading
  src={dish.image}
  alt={dish.name}
  clickable={false}
  className="w-full h-48 object-cover"
/>
```

### Com Fallback
```tsx
<ImageWithLoading
  src={dish.image}
  alt={dish.name}
  clickable={false}
  fallbackSrc="/default-dish.jpg"
  className="w-full h-48 object-cover"
/>
```

## Benefícios da Implementação

### 1. Experiência do Usuário
- **Visualização detalhada** das imagens dos pratos **apenas quando necessário**
- **Navegação intuitiva** com controles familiares
- **Feedback visual** com hover effects
- **Design elegante** com bordas e sombras
- **View independente** não limitada por outros modais
- **Comportamento consistente** entre cards e detalhes

### 2. Acessibilidade
- **Teclado**: Suporte completo (ESC para fechar)
- **Screen readers**: Labels descritivos
- **Contraste**: Botões e indicadores visíveis
- **Touch-friendly**: Otimizado para mobile

### 3. Performance
- **Lazy loading** mantido nas imagens
- **Cache de imagens** preservado
- **Modal otimizado** com cleanup automático
- **Z-index otimizado** para evitar conflitos
- **Portal independente** para renderização eficiente

## Responsividade

### Mobile
- **Touch-friendly**: Área de clique adequada
- **Tamanho adaptativo**: 95% da viewport
- **Controles acessíveis**: Botões grandes
- **Blur otimizado** para performance

### Desktop
- **Mouse hover**: Efeitos visuais sutis
- **Teclado**: Atalhos rápidos
- **Scroll lock**: Previne conflitos
- **Efeitos visuais** aprimorados

## Design e Estética

### Visual
- **Backdrop escuro** com blur avançado
- **Bordas elegantes** com sombras sutis
- **Fundo adaptativo** (branco/escuro)
- **Transições suaves** de abertura/fechamento
- **Hover effects** nas imagens clicáveis

### Efeitos
- **Blur de fundo** para foco na imagem
- **Sombras elegantes** com múltiplas camadas
- **Bordas translúcidas** para sofisticação
- **Animações suaves** nos controles

### Posicionamento
- **View independente** acima de todos os elementos
- **Centralização perfeita** na tela
- **Não limitado** por containers de outros modais
- **Z-index ultra-alto** para garantir visibilidade

## Testes Recomendados

### 1. Funcionalidade Básica
- [ ] Clique em imagem na tela de detalhes abre modal de zoom
- [ ] Clique em card abre modal de detalhes (sem zoom)
- [ ] Modal de zoom fecha com botão X
- [ ] Modal de zoom fecha com clique fora
- [ ] Modal de zoom fecha com tecla ESC

### 2. Responsividade
- [ ] Funciona em mobile
- [ ] Funciona em desktop
- [ ] Imagem se adapta ao tamanho da tela
- [ ] Controles são acessíveis

### 3. Integração
- [ ] Zoom funciona apenas na tela de detalhes
- [ ] Cards abrem modal de detalhes (não zoom)
- [ ] Categorias funcionam corretamente (sem zoom)
- [ ] Navegação funciona corretamente (sem zoom)
- [ ] Não interfere com outras funcionalidades
- [ ] Preserva cache de imagens
- [ ] Mantém lazy loading

### 4. Design
- [ ] Bordas elegantes visíveis
- [ ] Botão X bem posicionado
- [ ] Blur de fundo funcional
- [ ] Tema claro/escuro funcional

### 5. Posicionamento
- [ ] Modal de zoom abre acima de outros modais
- [ ] Não é limitado por containers
- [ ] Centralizado na tela inteira
- [ ] Backdrop cobre toda a tela

### 6. Comportamento Correto
- [ ] Cards não abrem zoom (abrem detalhes)
- [ ] Categorias não abrem zoom (selecionam categoria)
- [ ] Navegação não abre zoom (funciona normalmente)
- [ ] Apenas imagens na tela de detalhes abrem zoom
- [ ] Navegação funciona corretamente em todos os contextos

## Arquivos Modificados

### Novos:
- `src/components/ImageModal.tsx`

### Atualizados:
- `src/components/ImageWithLoading.tsx` - Adicionada funcionalidade de clique
- `src/components/DishCard.tsx` - `clickable={false}` para cards
- `src/components/Carousel.tsx` - `clickable={false}` para carrossel
- `src/components/DynamicCarousel.tsx` - `clickable={false}` para carrossel dinâmico
- `src/components/CardJornal.tsx` - `clickable={false}` para cards do jornal
- `src/components/ComplementGrid.tsx` - `clickable={true}` para complementos (tela de detalhes)
- `src/components/CategoryGrid.tsx` - `clickable={false}` para grid de categorias
- `src/components/AnimatedCategoryGrid.tsx` - `clickable={false}` para grid animado de categorias
- `src/components/AnimatedDishCard.tsx` - `clickable={false}` para cards animados
- `src/components/AnimatedStaticDishCard.tsx` - `clickable={false}` para cards estáticos animados
- `src/components/Header.tsx` - `clickable={false}` para seletor de restaurantes
- `src/app/page.tsx` - `clickable={false}` para cards de demonstração

### Impacto:
- **Zoom funciona apenas** na tela de detalhes do prato
- **Cards abrem modal de detalhes** (não zoom)
- **Categorias funcionam corretamente** (sem zoom)
- **Navegação funciona normalmente** (sem zoom)
- **Comportamento consistente** em toda a aplicação
- **Funcionalidade automática** sem necessidade de modificação adicional
- **Compatível** com tema claro/escuro existente
- **Design elegante** e profissional
- **View independente** não limitada por outros elementos
