# Chatbot de IA para Menu do Restaurante

## Visão Geral

Este projeto implementa um chatbot de IA totalmente no navegador que permite aos clientes fazer perguntas sobre os pratos do menu, ingredientes, alergênicos e obter recomendações personalizadas.

## Funcionalidades

### 🤖 Chatbot Inteligente
- **Processamento local**: Toda a IA roda no navegador do usuário
- **Sem servidores**: Não requer backend ou APIs externas
- **Respostas contextuais**: Entende perguntas sobre pratos específicos
- **Fallback inteligente**: Funciona mesmo quando o WebLLM não está disponível

### 🔍 Recursos de Busca
- **Busca por pratos específicos**: "Filé ao Poivre", "Torta de Chocolate"
- **Busca por categorias**: "Menu Principal", "Sobremesas", "Bebidas"
- **Busca por restrições**: "sem glúten", "vegetariano", "sem lactose"
- **Busca por preços**: "pratos mais baratos", "acessíveis"
- **Busca por ingredientes**: "o que tem no Filé ao Poivre"

### 💡 Recomendações Inteligentes
- Pratos em destaque
- Opções para restrições alimentares
- Pratos por categoria
- Sugestões baseadas em preferências

## Tecnologias Utilizadas

### WebLLM
- **Framework**: @mlc-ai/web-llm
- **Modelo**: Llama-2-7b-chat-q4f16_1
- **API**: Compatível com OpenAI API
- **Processamento**: Totalmente no navegador
- **Performance**: Otimizado para dispositivos móveis

### React + TypeScript
- **Interface moderna**: Design responsivo e acessível
- **TypeScript**: Tipagem forte para melhor desenvolvimento
- **Hooks personalizados**: useWebLLM para gerenciamento de estado

### Tailwind CSS
- **Design system**: Componentes consistentes
- **Responsivo**: Funciona em mobile e desktop
- **Tema escuro**: Suporte a modo escuro

## Estrutura do Projeto

```
src/
├── components/
│   ├── AIChatbot.tsx          # Componente principal do chatbot
│   ├── SearchBar.tsx          # Barra de busca com botão do chatbot
│   └── ...
├── hooks/
│   └── useWebLLM.ts           # Hook personalizado para WebLLM
├── lib/
│   └── webllm-config.ts       # Configurações e utilitários do WebLLM
└── ...
```

## Como Usar

### Para o Cliente
1. **Acesse o menu** do restaurante
2. **Clique no botão de IA** (ícone de lâmpada) no canto inferior direito
3. **Faça perguntas** como:
   - "Quais são os pratos mais populares?"
   - "Tem opções sem glúten?"
   - "Quais são os ingredientes do Filé ao Poivre?"
   - "Recomendações para vegetarianos?"

### Para o Desenvolvedor

#### Instalação
```bash
npm install @mlc-ai/web-llm
```

#### Configuração
O chatbot é configurado automaticamente com:
- Detecção de compatibilidade do navegador
- Fallback para dispositivos não suportados
- Otimizações de performance

#### Personalização
```typescript
// Em src/hooks/useWebLLM.ts
const createSystemPrompt = useCallback(() => {
  // Personalize o prompt do sistema aqui
  return `Você é um assistente especializado no restaurante ${menuData?.name}...`;
}, [menuData]);
```

## Configurações de Performance

### WebLLM
- **Modelo**: Llama-2-7b-chat-q4f16_1 (otimizado para performance)
- **Tokens máximos**: 512
- **Temperatura**: 0.7 (criatividade balanceada)
- **API**: OpenAI-compatible completions
- **Engine**: MLCEngine para inferência otimizada

### Fallback
- **Busca inteligente**: Algoritmo de busca baseado em palavras-chave
- **Respostas contextuais**: Entende contexto das perguntas
- **Sugestões**: Oferece opções relevantes

## Compatibilidade

### Navegadores Suportados
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Dispositivos
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile (Android/iOS)

### Requisitos
- WebAssembly habilitado
- 4GB+ RAM (recomendado)
- Conexão inicial para download do modelo

## Limitações

### WebLLM
- **Download inicial**: ~2GB do modelo (uma vez)
- **Memória**: Requer RAM suficiente para o modelo
- **Performance**: Pode ser lento em dispositivos antigos

### Fallback
- **Respostas limitadas**: Baseadas em regras predefinidas
- **Menos criativo**: Respostas mais diretas
- **Contexto limitado**: Não mantém conversa complexa

## Melhorias Futuras

### Funcionalidades
- [ ] Reconhecimento de voz
- [ ] Sugestões baseadas em histórico
- [ ] Integração com sistema de pedidos
- [ ] Análise de sentimentos

### Performance
- [ ] Modelos menores para mobile
- [ ] Cache mais inteligente
- [ ] Lazy loading de componentes
- [ ] Otimizações de WebAssembly

### UX/UI
- [ ] Animações mais fluidas
- [ ] Temas personalizáveis
- [ ] Acessibilidade melhorada
- [ ] Modo offline

## Troubleshooting

### Problemas Comuns

#### WebLLM não carrega
```bash
# Verifique se o WebAssembly está habilitado
# No console do navegador:
typeof WebAssembly !== 'undefined'
```

#### Performance lenta
- Reduza o tamanho do modelo em `webllm-config.ts`
- Aumente o cache disponível
- Verifique a memória do dispositivo

#### Erros de rede
- O fallback funciona offline
- Verifique a conexão para download inicial
- Cache local mantém funcionalidade

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes. 