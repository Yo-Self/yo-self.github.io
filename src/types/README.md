# Estrutura de Dados de Restaurantes

Este documento descreve a estrutura de dados completa para restaurantes, baseada no sistema de menu digital do Moendo.

## Visão Geral

A estrutura de dados de restaurantes é composta por um objeto principal `Restaurant` que contém todas as informações necessárias para exibir um menu digital completo, incluindo pratos em destaque, categorias, itens do menu e sistema de complementos.

## Estrutura Principal

### Restaurant
O objeto principal que representa um restaurante completo:

```typescript
interface Restaurant {
  id: string;                    // ID único do restaurante
  name: string;                  // Nome do restaurante
  welcome_message: string;       // Mensagem de boas-vindas
  image: string;                 // URL da imagem principal
  menu_categories: string[];     // Lista de categorias disponíveis
  featured_dishes: MenuItem[];   // Pratos em destaque
  menu_items: MenuItem[];        // Todos os itens do menu
}
```

### MenuItem
Representa um item individual do menu (prato, bebida, sobremesa):

```typescript
interface MenuItem {
  category: string;              // Categoria do item
  name: string;                  // Nome do prato
  description: string;           // Descrição detalhada
  price: string;                 // Preço (formato brasileiro: "35,00")
  image: string;                 // URL da imagem
  tags: string[];                // Tags especiais (Destaque, Vegano, etc.)
  ingredients: string;           // Lista de ingredientes
  allergens: string;             // Informações sobre alérgenos
  portion: string;               // Informação sobre porção
  complement_groups?: ComplementGroup[]; // Complementos opcionais
}
```

### ComplementGroup
Grupo de complementos que podem ser adicionados a um item:

```typescript
interface ComplementGroup {
  title: string;                 // Título do grupo
  description: string;           // Descrição do grupo
  required: boolean;             // Se é obrigatório escolher
  max_selections: number;        // Máximo de itens selecionáveis
  complements: Complement[];     // Lista de complementos disponíveis
}
```

### Complement
Complemento individual que pode ser adicionado:

```typescript
interface Complement {
  name: string;                  // Nome do complemento
  description: string;           // Descrição
  price: string;                 // Preço adicional
  image: string;                 // URL da imagem
  ingredients: string;           // Lista de ingredientes
}
```

## Categorias Disponíveis

As categorias padrão incluem:
- `Menu Principal` - Pratos principais
- `Sobremesas` - Sobremesas e doces
- `Bebidas` - Bebidas não alcoólicas
- `Carta de Drinks` - Coquetéis e drinks
- `Destilados` - Bebidas destiladas
- `Carta de Vinhos` - Vinhos
- `Menu Executivo` - Pratos do menu executivo
- `Happy hour` - Itens do happy hour
- `Sunset Moendo` - Itens especiais do sunset
- `Couver artistico` - Taxa de couvert artístico

## Tags Especiais

Tags que podem ser aplicadas aos itens:
- `Destaque` - Item em destaque
- `Vegano` - Item vegano
- `Vegetariano` - Item vegetariano
- `Sem Glúten` - Item sem glúten
- `Sem Lactose` - Item sem lactose

## Alérgenos

Informações sobre alérgenos:
- `Contém Lactose` - Contém lactose
- `Contém glúten` - Contém glúten
- `Sem Lactose` - Sem lactose
- `Sem Gluten` - Sem glúten
- `Vegano` - Item vegano
- `Vegetariano` - Item vegetariano
- `Apimentado` - Item apimentado
- `Levemente Apimentado` - Item levemente apimentado
- `Nenhum` - Sem alérgenos específicos

## Sistema de Complementos

O sistema de complementos permite personalização dos pratos:

1. **Grupos Obrigatórios**: `required: true` - O cliente deve escolher pelo menos um item
2. **Grupos Opcionais**: `required: false` - O cliente pode escolher ou não
3. **Limite de Seleções**: `max_selections` define quantos itens podem ser escolhidos
4. **Preços Adicionais**: Cada complemento pode ter um preço adicional

### Exemplo de Uso dos Complementos

```typescript
// Exemplo: Hambúrguer com escolha de pão obrigatória
{
  title: "Escolha o Pão",
  description: "Selecione o tipo de pão para seu hambúrguer",
  required: true,
  max_selections: 1,
  complements: [
    {
      name: "Pão Brioche",
      description: "Pão brioche tradicional",
      price: "0,00",
      image: "...",
      ingredients: "Farinha, ovos, manteiga, açúcar, sal"
    }
  ]
}

// Exemplo: Adicionais opcionais
{
  title: "Adicionais",
  description: "Personalize seu hambúrguer com ingredientes extras",
  required: false,
  max_selections: 3,
  complements: [
    {
      name: "Queijo Cheddar",
      description: "Fatia de queijo cheddar derretido",
      price: "3,00",
      image: "...",
      ingredients: "Queijo cheddar"
    }
  ]
}
```

## Validação de Dados

O arquivo inclui funções de validação para garantir a integridade dos dados:

- `isValidRestaurant()` - Valida se um objeto é um restaurante válido
- `isValidMenuItem()` - Valida se um objeto é um item de menu válido
- `isValidComplementGroup()` - Valida se um objeto é um grupo de complementos válido
- `isValidComplement()` - Valida se um objeto é um complemento válido

## Exemplo de Uso

```typescript
import { Restaurant, isValidRestaurant } from './restaurant';

// Carregar dados do restaurante
const restaurantData = await fetch('/api/restaurant/moendo');
const restaurant: Restaurant = await restaurantData.json();

// Validar dados
if (isValidRestaurant(restaurant)) {
  // Dados válidos, pode usar com segurança
  console.log(`Restaurante: ${restaurant.name}`);
  console.log(`Categorias: ${restaurant.menu_categories.join(', ')}`);
  console.log(`Pratos em destaque: ${restaurant.featured_dishes.length}`);
  console.log(`Total de itens: ${restaurant.menu_items.length}`);
} else {
  console.error('Dados do restaurante inválidos');
}
```

## Casos de Uso Comuns

1. **Exibição do Menu**: Usar `menu_items` agrupados por `category`
2. **Pratos em Destaque**: Exibir `featured_dishes` na página inicial
3. **Filtros**: Usar `tags` e `allergens` para filtros
4. **Personalização**: Usar `complement_groups` para permitir customização
5. **Busca**: Buscar em `name`, `description` e `ingredients`
6. **Categorização**: Agrupar por `category` ou `tags`

## Considerações para IA

Para uma IA entender e trabalhar com esta estrutura:

1. **Contexto**: Esta é uma estrutura de menu de restaurante brasileiro
2. **Preços**: Formato brasileiro com vírgula como separador decimal
3. **Idioma**: Conteúdo em português brasileiro
4. **Flexibilidade**: Sistema de complementos permite alta personalização
5. **Acessibilidade**: Informações de alérgenos importantes para saúde
6. **Imagens**: URLs de imagens para cada item
7. **Categorização**: Sistema hierárquico de categorias e tags

Esta estrutura permite criar uma experiência completa de menu digital com personalização, filtros e informações detalhadas sobre cada item.

