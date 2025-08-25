# Personalização de Backgrounds do Modal

## Visão Geral

Esta funcionalidade permite que restaurantes personalizem o fundo do modal de pratos (`DishModal`) com imagens ou cores específicas, separando entre modo claro e escuro.

## Campos do Banco de Dados

A tabela `restaurants` agora inclui dois novos campos opcionais:

- `background_light`: URL da imagem ou código de cor para modo claro
- `background_night`: URL da imagem ou código de cor para modo escuro

## Tipos de Background Suportados

### 1. Imagens
- URLs completas: `https://exemplo.com/imagem.jpg`
- URLs relativas: `/images/background.jpg`
- Formatos suportados: JPG, PNG, GIF, WebP, SVG

### 2. Cores
- Códigos hex: `#FF5733`
- RGB: `rgb(255, 87, 51)`
- RGBA: `rgba(255, 87, 51, 0.8)`
- HSL: `hsl(10, 100%, 60%)`
- Cores CSS: `red`, `blue`, `transparent`
- Variáveis CSS: `var(--primary-color)`

## Como Funciona

### Detecção Automática de Modo
O sistema detecta automaticamente se o usuário está usando modo claro ou escuro através de:
- Classe `dark` no elemento HTML
- Preferência do sistema operacional
- Mudanças em tempo real

### Aplicação do Background
1. **Com Background Personalizado**: Aplica a imagem ou cor correspondente ao modo atual
2. **Sem Background Personalizado**: Mantém o comportamento padrão (fundo escuro semi-transparente)

### Para Imagens
- Aplica a imagem como fundo com overlay escuro para manter legibilidade
- Configurações automáticas: `cover`, `center`, `no-repeat`
- Mantém o efeito de blur para melhor contraste

## Exemplos de Uso

### Exemplo 1: Imagem de Fundo
```sql
UPDATE restaurants 
SET background_light = 'https://exemplo.com/background-light.jpg',
    background_night = 'https://exemplo.com/background-dark.jpg'
WHERE id = 'restaurante-123';
```

### Exemplo 2: Cores Personalizadas
```sql
UPDATE restaurants 
SET background_light = '#E8F5E8',
    background_night = '#1a1a1a'
WHERE id = 'restaurante-123';
```

### Exemplo 3: Mistura de Tipos
```sql
UPDATE restaurants 
SET background_light = 'https://exemplo.com/light-bg.jpg',
    background_night = '#000000'
WHERE id = 'restaurante-123';
```

## Implementação Técnica

### Componente Atualizado
- `DishModal.tsx` agora inclui lógica para backgrounds personalizados
- Hook `useCurrentRestaurant` fornece acesso aos dados do restaurante
- Detecção automática de modo claro/escuro

### Estrutura de Dados
```typescript
interface Restaurant {
  // ... campos existentes ...
  background_light?: string;
  background_night?: string;
}
```

### Lógica de Aplicação
```typescript
const getCustomBackground = () => {
  if (!restaurant) return null;
  
  const backgroundField = isDarkMode ? 
    restaurant.background_night : 
    restaurant.background_light;
  
  if (!backgroundField) return null;
  
  // Detectar tipo (imagem ou cor) e retornar configuração
};
```

## Considerações de Performance

### Otimização de Imagens
- Recomenda-se usar imagens otimizadas (WebP quando possível)
- Tamanhos recomendados: 1920x1080 ou menor
- Compressão adequada para web

### Fallbacks
- Se a imagem falhar ao carregar, volta ao comportamento padrão
- Cores inválidas são ignoradas silenciosamente
- Sem impacto na funcionalidade principal do modal

## Compatibilidade

### Navegadores
- Chrome 76+
- Firefox 70+
- Safari 13.1+
- Edge 79+

### Dispositivos
- Desktop e mobile
- Suporte a modo claro/escuro do sistema
- Responsivo em todas as resoluções

## Troubleshooting

### Background não aparece
1. Verificar se os campos estão preenchidos no banco
2. Confirmar se as URLs são válidas
3. Verificar se as cores são válidas

### Performance lenta
1. Otimizar tamanho das imagens
2. Usar formatos modernos (WebP)
3. Considerar usar cores em vez de imagens para melhor performance

### Modo escuro/claro não detecta
1. Verificar se o tema está sendo aplicado corretamente
2. Confirmar se as classes CSS estão sendo adicionadas
3. Verificar preferências do sistema operacional

## Próximos Passos

- [ ] Suporte a gradientes CSS
- [ ] Animações de transição entre backgrounds
- [ ] Configuração via painel administrativo
- [ ] Cache de imagens para melhor performance
- [ ] Suporte a vídeos de fundo
