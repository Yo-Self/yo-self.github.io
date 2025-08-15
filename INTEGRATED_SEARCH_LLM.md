# Busca e LLM Integrados

## Visão Geral

A funcionalidade de busca e LLM foi integrada em uma única interface unificada. Agora o usuário pode usar o mesmo botão (botão de busca) para tanto buscar pratos específicos quanto fazer perguntas para o assistente IA.

## Como Funciona

### Detecção Automática de Tipo de Consulta

O sistema automaticamente detecta se a entrada do usuário é:
- **Busca simples**: Ingredientes, nomes de pratos, tags
- **Pergunta para LLM**: Perguntas complexas, solicitações de recomendação

### Critérios de Detecção

#### Busca Simples (1-2 palavras)
- Palavras únicas como "frango", "arroz", "salada"
- Combinações simples como "sobremesa doce"
- Não contém palavras de pergunta

#### Pergunta para LLM (3+ palavras ou palavras-chave)
- Contém palavras como: "qual", "quais", "como", "recomende", "sugira"
- Termina com "?"
- Perguntas sobre popularidade, ingredientes, alergênicos
- Solicitações de recomendação

## Componentes Criados

### 1. `useIntegratedSearch` Hook
**Arquivo**: `src/hooks/useIntegratedSearch.ts`

Gerencia a lógica de busca integrada:
- Detecta automaticamente o tipo de consulta
- Executa busca simples ou chama LLM conforme necessário
- Retorna resultados padronizados

```typescript
interface SearchResult {
  type: 'search' | 'llm';
  items?: MenuItem[];        // Para busca simples
  message?: string;          // Para respostas LLM
  recommendedDishes?: any[]; // Pratos recomendados pelo LLM
  model?: string;           // Modelo de IA usado
}
```

### 2. `IntegratedChatBot` Component
**Arquivo**: `src/components/IntegratedChatBot.tsx`

Interface unificada que:
- Mostra histórico de conversas
- Exibe resultados de busca como cards de pratos
- Exibe respostas LLM com pratos recomendados
- Mantém funcionalidades de voz e acessibilidade

## Interface do Usuário

### Botão Unificado
- **Localização**: Canto inferior direito
- **Ícone**: Lupa (🔍)
- **Função**: Abre interface de busca & IA integrada

### Interface de Chat
- **Título**: "Busca & IA [Nome do Restaurante]"
- **Placeholder**: "Buscar pratos ou fazer perguntas..."
- **Exemplos**: Sugestões de busca e perguntas na tela inicial

### Exemplos de Uso

#### Busca Simples
```
Entrada: "frango"
Resultado: Lista de pratos que contêm frango
```

#### Pergunta para LLM
```
Entrada: "Qual o prato mais popular?"
Resultado: Resposta da IA + pratos recomendados
```

## Funcionalidades Mantidas

### Voz e Acessibilidade
- ✅ Leitura automática de respostas
- ✅ Configurações de voz
- ✅ Botão de teste de voz
- ✅ Controles de acessibilidade

### Visualização de Pratos
- ✅ Cards de pratos para resultados de busca
- ✅ Cards de pratos recomendados pelo LLM
- ✅ Modal de detalhes do prato
- ✅ Imagens e informações completas

### Histórico e Navegação
- ✅ Histórico de conversas
- ✅ Timestamps nas mensagens
- ✅ Auto-scroll para última mensagem
- ✅ Botão de limpar conversa

## Diferenças da Implementação Anterior

### Antes
- Botão de busca separado do chatbot
- Interface de busca em bottom sheet
- Chatbot apenas para perguntas LLM
- Duas interfaces diferentes

### Agora
- Botão único para busca e IA
- Interface unificada de chat
- Detecção automática do tipo de consulta
- Experiência mais fluida e intuitiva

## Benefícios

1. **Simplicidade**: Uma interface para todas as consultas
2. **Intuitividade**: Detecção automática do que o usuário quer
3. **Eficiência**: Menos cliques para acessar funcionalidades
4. **Consistência**: Mesma experiência visual para busca e IA
5. **Flexibilidade**: Suporte a consultas simples e complexas

## Configuração

A funcionalidade usa as mesmas configurações do LLM existente:
- Edge Function do Supabase: `ai-chat`
- Variáveis de ambiente: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Modelo padrão: `gemma-3-superto`

## Compatibilidade

- ✅ Mantém compatibilidade com funcionalidades existentes
- ✅ Não quebra implementações anteriores
- ✅ Suporte a todos os tipos de restaurante
- ✅ Funciona com dados existentes
