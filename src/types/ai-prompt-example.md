# Exemplo de Prompt para IA - Estrutura de Dados de Restaurantes

## Prompt Base para IA

```
Você é um assistente especializado em análise de dados de restaurantes. Você trabalha com uma estrutura de dados específica para menus digitais de restaurantes brasileiros.

## Estrutura de Dados

A estrutura de dados de restaurantes segue este formato TypeScript:

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

interface ComplementGroup {
  title: string;                 // Título do grupo
  description: string;           // Descrição do grupo
  required: boolean;             // Se é obrigatório escolher
  max_selections: number;        // Máximo de itens selecionáveis
  complements: Complement[];     // Lista de complementos disponíveis
}

interface Complement {
  name: string;                  // Nome do complemento
  description: string;           // Descrição
  price: string;                 // Preço adicional
  image: string;                 // URL da imagem
  ingredients: string;           // Lista de ingredientes
}
```

## Categorias Disponíveis
- Menu Principal, Sobremesas, Bebidas, Carta de Drinks, Destilados, Carta de Vinhos, Menu Executivo, Happy hour, Sunset Moendo, Couver artistico

## Tags Especiais
- Destaque, Vegano, Vegetariano, Sem Glúten, Sem Lactose

## Alérgenos
- Contém Lactose, Contém glúten, Sem Lactose, Sem Gluten, Vegano, Vegetariano, Apimentado, Levemente Apimentado, Nenhum

## Contexto Importante
- Esta é uma estrutura de menu de restaurante brasileiro
- Preços estão no formato brasileiro (vírgula como separador decimal)
- Conteúdo está em português brasileiro
- Sistema de complementos permite alta personalização
- Informações de alérgenos são importantes para saúde

## Suas Tarefas
1. Analisar dados de restaurantes fornecidos
2. Responder perguntas sobre menus, preços, ingredientes
3. Sugerir pratos baseado em preferências
4. Identificar opções para restrições alimentares
5. Calcular preços com complementos
6. Organizar itens por categorias ou tags

## Exemplo de Dados
[INSERIR DADOS DO RESTAURANTE AQUI]

Agora, responda às seguintes perguntas sobre este restaurante:
```

## Exemplos de Perguntas para IA

### 1. Análise Geral do Menu
```
Analise o menu do restaurante [NOME] e me forneça:
- Quantos itens existem no total?
- Quais são as categorias disponíveis?
- Quantos pratos estão em destaque?
- Qual é a faixa de preços (mais barato e mais caro)?
- Há opções vegetarianas ou veganas?
```

### 2. Recomendações Personalizadas
```
Baseado no menu do restaurante [NOME], me sugira:
- 3 pratos principais para quem gosta de frutos do mar
- Opções para quem tem intolerância à lactose
- Pratos em destaque que valem a pena experimentar
- Combinações de prato + bebida
- Opções para crianças (se houver menu kids)
```

### 3. Análise de Preços
```
Analise os preços do menu do restaurante [NOME]:
- Qual é o prato mais caro e mais barato?
- Qual é o preço médio dos pratos principais?
- Há diferença significativa entre menu executivo e menu principal?
- Quais complementos têm custo adicional?
- Vale a pena o happy hour (comparar preços)?
```

### 4. Informações Nutricionais e Alérgenos
```
Para o restaurante [NOME], identifique:
- Todos os pratos que contêm glúten
- Opções sem lactose
- Pratos apimentados
- Itens vegetarianos e veganos
- Pratos que podem ser adaptados para restrições alimentares
```

### 5. Sistema de Complementos
```
Analise o sistema de complementos do restaurante [NOME]:
- Quais pratos têm opções de personalização?
- Quais complementos são obrigatórios vs opcionais?
- Qual é o custo adicional médio dos complementos?
- Há complementos gratuitos?
- Como funciona a seleção de complementos?
```

### 6. Categorização e Organização
```
Organize o menu do restaurante [NOME] por:
- Faixa de preços (econômico, médio, premium)
- Tipo de proteína (carne, peixe, frango, vegetariano)
- Nível de apimentação
- Tempo de preparo estimado
- Popularidade (baseado em tags de destaque)
```

## Exemplo de Resposta Esperada

```
## Análise do Restaurante Moendo

### Informações Gerais
- **Total de itens**: 45 pratos
- **Categorias**: 10 categorias disponíveis
- **Pratos em destaque**: 8 itens
- **Faixa de preços**: R$ 13,00 a R$ 195,00

### Recomendações por Perfil

**Para amantes de frutos do mar:**
1. Ceviche (R$ 68,00) - Peixe marinado em leite de tigre
2. Camarão crocante (R$ 64,00) - 8 unidades empanadas
3. Fideuá (R$ 0,00) - Paella com massa cabelinho de anjo

**Para vegetarianos:**
- Tartare De Tomate (R$ 32,00)
- Gnhocci Veg (R$ 57,00)
- Risoto Caprese (R$ 65,00)

**Para quem tem restrições:**
- **Sem lactose**: 12 opções disponíveis
- **Sem glúten**: 8 opções disponíveis
- **Vegano**: 3 opções disponíveis

### Sistema de Complementos
- **Mc Fish Moendo**: Escolha de pão (obrigatório) + adicionais (opcional)
- **Filé ao Poivre**: Ponto da carne (obrigatório) + acompanhamentos + molhos
- **Massa A Fiorentina**: Tipo de massa (obrigatório) + adicionais

### Destaques Especiais
- **Torta De Chocolate**: Sobremesa em destaque (R$ 35,00)
- **Fraldinha Gratinada**: Prato principal premium (R$ 98,00)
- **Bacalhau Dona Vera**: Prato signature (R$ 168,00)
```

## Dicas para Uso com IA

1. **Sempre forneça o contexto completo** da estrutura de dados
2. **Especifique o formato** dos preços (brasileiro)
3. **Mencione o idioma** (português brasileiro)
4. **Explique o sistema de complementos** detalhadamente
5. **Forneça exemplos** de uso das funções de validação
6. **Inclua casos de uso específicos** para o seu contexto

Este prompt pode ser adaptado para diferentes tipos de análise e consultas sobre dados de restaurantes.

