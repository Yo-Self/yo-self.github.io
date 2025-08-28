# Correção da Ordenação dos Grupos de Complementos

## Problema Identificado

Foi identificado que dois elementos em `dish_complement_groups` podem ter o mesmo número em `position`, o que poderia causar problemas na renderização dos complementos. Isso acontece porque:

1. A tabela `dish_complement_groups` não tem restrição única na coluna `position`
2. A ordenação anterior não tratava adequadamente casos de posições iguais
3. A lógica de ordenação não considerava a posição específica de cada prato

## Solução Implementada

### 1. Modificação da Busca de Dados

**Arquivo:** `src/services/restaurants.ts`

- **Antes:** A função `fetchComplementGroupsByDishIds` buscava apenas `dish_id` e `complement_group_id`
- **Depois:** Agora busca também a `position` da tabela `dish_complement_groups`

```typescript
// Antes
const junctionRows = await sbFetch<{dish_id: string, complement_group_id: string}[]>(
  `dish_complement_groups?select=dish_id,complement_group_id&dish_id=in.(${inList})`
);

// Depois
const junctionRows = await sbFetch<{dish_id: string, complement_group_id: string, position: number | null}[]>(
  `dish_complement_groups?select=dish_id,complement_group_id,position&dish_id=in.(${inList})`
);
```

### 2. Estrutura de Dados Atualizada

**Tipo:** `ComplementGroupsResult`

- **Antes:** `associations: Map<string, string[]>`
- **Depois:** `associations: Map<string, Array<{groupId: string, position: number | null}>>`

### 3. Algoritmo de Ordenação Inteligente

Implementada uma lógica de ordenação que:

1. **Prioriza por posição:** Grupos com posição definida vêm antes dos sem posição
2. **Ordena por posição numérica:** Menor posição primeiro
3. **Resolve conflitos alfabeticamente:** Em caso de posições iguais, ordena por título
4. **Trata casos especiais:** Grupos sem posição são ordenados alfabeticamente

```typescript
dishGroups.sort((a, b) => {
  // Se ambos têm posição definida
  if (a.position !== null && b.position !== null) {
    // Se posições são diferentes, ordenar por posição
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    // Se posições são iguais, ordenar alfabeticamente por título
    return a.group.title.localeCompare(b.group.title);
  }
  
  // Se apenas um tem posição definida, o com posição vem primeiro
  if (a.position !== null && b.position === null) {
    return -1;
  }
  if (a.position === null && b.position !== null) {
    return 1;
  }
  
  // Se ambos não têm posição, ordenar alfabeticamente por título
  return a.group.title.localeCompare(b.group.title);
});
```

## Exemplo de Funcionamento

### Cenário de Teste
- **Acompanhamentos** (posição: 1)
- **Molhos** (posição: 1) ← Mesma posição
- **Bebidas** (posição: 2)
- **Extras** (posição: null)

### Resultado da Ordenação
1. **Acompanhamentos** (posição: 1) - Primeiro alfabeticamente
2. **Molhos** (posição: 1) - Segundo alfabeticamente
3. **Bebidas** (posição: 2) - Terceiro por posição
4. **Extras** (posição: null) - Último alfabeticamente

## Benefícios da Solução

1. **Consistência:** Sempre haverá uma ordem previsível dos complementos
2. **Robustez:** Trata adequadamente casos de posições duplicadas
3. **Manutenibilidade:** Código claro e bem documentado
4. **Performance:** Ordenação eficiente sem consultas adicionais ao banco
5. **Flexibilidade:** Funciona com ou sem posições definidas

## Arquivos Modificados

- `src/services/restaurants.ts` - Lógica principal de ordenação
- `src/types/restaurant.ts` - Tipos atualizados (se necessário)

## Testes Realizados

- ✅ Build do projeto bem-sucedido
- ✅ Lógica de ordenação testada e validada
- ✅ Tratamento de casos especiais implementado
- ✅ Compatibilidade com código existente mantida

## Considerações de Segurança

- A solução não expõe dados sensíveis
- Mantém as políticas RLS existentes
- Não introduz vulnerabilidades de SQL injection
- Preserva a estrutura de dados existente

## Próximos Passos Recomendados

1. **Monitoramento:** Observar se a ordenação está funcionando conforme esperado em produção
2. **Validação:** Testar com dados reais do banco de dados
3. **Documentação:** Atualizar documentação da API se necessário
4. **Otimização:** Considerar adicionar índices na coluna `position` se o volume de dados for alto
