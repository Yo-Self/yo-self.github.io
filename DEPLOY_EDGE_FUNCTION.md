# 🚀 Deploy da Edge Function Atualizada

## Problema Resolvido

A Edge Function foi atualizada para resolver o erro 500 do chatbot que estava ocorrendo quando o modelo Gemini estava sobrecarregado.

### Melhorias Implementadas:

1. **Google Gemma 3 SuperTo como Modelo Padrão**: Agora usa o modelo mais avançado do Google AI
2. **Sistema de Fallback Inteligente**: Se o Gemma 3 SuperTo não estiver disponível, tenta automaticamente:
   - Gemma 3 Flash
   - Gemini 1.5 Flash (como último recurso)
3. **Retry com Backoff Exponencial**: Tenta novamente automaticamente quando o modelo está sobrecarregado
4. **Tratamento de Erros Específicos**: Mensagens de erro mais claras para diferentes situações
5. **Integração Completa com Google AI**: Usa a biblioteca oficial do Google Generative AI
6. **Contexto Melhorado**: Instruções mais específicas para o assistente do restaurante

## Modelos Disponíveis

A Edge Function agora suporta múltiplos modelos do Google AI:

1. **Gemma 3 SuperTo** (Padrão): Modelo mais avançado e rápido
2. **Gemma 3 Flash**: Versão otimizada para velocidade
3. **Gemini 1.5 Flash**: Fallback para compatibilidade

O sistema automaticamente tenta cada modelo em ordem até encontrar um que funcione.

## Como Fazer o Deploy

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. **Acesse o Dashboard do Supabase**:
   - Vá para [supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecione seu projeto

2. **Vá para Edge Functions**:
   - No menu lateral, clique em **Edge Functions**
   - Procure pela função `ai-chat`

3. **Edite a Função**:
   - Clique em **Edit** na função `ai-chat`
   - Substitua todo o conteúdo pelo código atualizado do arquivo `supabase-functions/ai-chat/index.ts`
   - Clique em **Save**

4. **Configure a Variável de Ambiente**:
   - Vá em **Settings > Edge Functions**
   - Adicione a variável: `GOOGLE_AI_API_KEY` com sua chave da API do Google AI
   - Clique em **Save**

### Opção 2: Via Supabase CLI

1. **Instale o Supabase CLI** (se ainda não tiver):
   ```bash
   npm install -g supabase
   ```

2. **Faça login**:
   ```bash
   supabase login
   ```

3. **Deploy da função**:
   ```bash
   supabase functions deploy ai-chat
   ```

4. **Configure a variável de ambiente**:
   ```bash
   supabase secrets set GOOGLE_AI_API_KEY=sua_chave_aqui
   ```

## Verificação do Deploy

Após o deploy, teste o chatbot:

1. **Abra o site** e vá para um restaurante
2. **Abra o chatbot** e faça uma pergunta
3. **Verifique se funciona** sem erros 500
4. **Monitore os logs** para ver qual modelo está sendo usado

## Tratamento de Erros Implementado

A Edge Function agora trata especificamente:

- **503 Service Unavailable**: "O modelo de IA está sobrecarregado. Tente novamente em alguns segundos."
- **429 Quota Exceeded**: "O limite de uso da API do Google AI foi excedido."
- **API Key não configurada**: "API key do Google AI não está configurada corretamente."
- **Modelo não disponível**: "O modelo Gemma 3 SuperTo não está disponível. Tentando modelo alternativo..."

## Sistema de Fallback

Quando um modelo falha, a função automaticamente:

1. Tenta **Gemma 3 SuperTo** (padrão)
2. Se falhar, tenta **Gemma 3 Flash**
3. Se falhar, tenta **Gemini 1.5 Flash**
4. Se todos falharem, retorna erro

## Retry Automático

Quando o modelo está sobrecarregado, a função:
1. Aguarda 1 segundo
2. Tenta novamente
3. Se falhar, aguarda 2 segundos
4. Tenta novamente
5. Se falhar, aguarda 4 segundos
6. Tenta uma última vez

## Contexto Melhorado

O assistente agora recebe instruções mais específicas:
- Usa exatamente os nomes dos pratos do cardápio
- Fornece informações sobre preços e disponibilidade
- Responde em português brasileiro
- Mantém respostas concisas mas informativas

## Vantagens do Gemma 3 SuperTo

- **Velocidade**: Respostas mais rápidas
- **Qualidade**: Melhor compreensão do contexto
- **Eficiência**: Menor consumo de tokens
- **Confiabilidade**: Maior estabilidade

## Troubleshooting

### Erro 500 persistente:
- ✅ Verifique se a variável `GOOGLE_AI_API_KEY` está configurada
- ✅ Confirme se a chave da API é válida
- ✅ Teste a chave no Google AI Studio
- ✅ Verifique se tem acesso aos modelos Gemma 3

### Função não responde:
- ✅ Verifique se o deploy foi bem-sucedido
- ✅ Confirme se a função está ativa no dashboard
- ✅ Teste com uma requisição simples

### Erro de CORS:
- ✅ A função já está configurada com CORS adequado
- ✅ Verifique se está usando a URL correta

### Modelo não disponível:
- ✅ Verifique se sua conta tem acesso aos modelos Gemma 3
- ✅ O sistema automaticamente tentará modelos alternativos
- ✅ Monitore os logs para ver qual modelo está sendo usado

A Edge Function atualizada deve resolver o problema do erro 500 e melhorar significativamente a experiência do chatbot com o novo modelo Gemma 3 SuperTo! 🎉
