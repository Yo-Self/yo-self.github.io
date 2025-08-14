# 🔊 Funcionalidade de Leitura de Voz

## Visão Geral

O chatbot agora inclui uma funcionalidade de **Text-to-Speech** que permite que as respostas sejam lidas em voz alta automaticamente. Esta funcionalidade melhora significativamente a acessibilidade e a experiência do usuário.

## ✨ Funcionalidades

### 🎯 Leitura Automática
- **Ativação/Desativação**: Botão toggle no header do chat
- **Leitura Automática**: Respostas são lidas automaticamente apenas uma vez
- **Leitura Manual**: Botão 🔊 em cada mensagem para reler quando quiser
- **Controle de Repetição**: Evita leitura repetida automática da mesma mensagem

### 🎛️ Configurações Avançadas
- **Seleção de Voz**: Escolha entre vozes disponíveis no sistema
- **Priorização**: Vozes em português são priorizadas
- **Teste de Voz**: Botão para testar a voz selecionada

### 🎨 Interface Intuitiva
- **Indicadores Visuais**: Status da funcionalidade no header
- **Animações**: Indicador pulsante durante a fala
- **Notificação**: Tutorial na primeira vez que o chat é aberto

## 🚀 Como Usar

### 1. Ativar a Funcionalidade
1. Abra o chatbot
2. Clique no botão 🔊 no header (ícone de alto-falante)
3. O botão ficará verde quando ativado

### 2. Configurar a Voz
1. Clique no botão de configurações (ícone de engrenagem)
2. Selecione a voz desejada no dropdown
3. Use o botão "Testar Voz" para verificar

### 3. Usar a Leitura
- **Automática**: Quando ativada, as respostas são lidas automaticamente apenas uma vez
- **Manual**: Clique no ícone 🔊 em qualquer mensagem para reler quando quiser
- **Controle**: Botão 🔄 nas configurações para limpar histórico de leituras

## 🛠️ Implementação Técnica

### Hook Personalizado: `useTextToSpeech`

```typescript
interface UseTextToSpeechReturn {
  isEnabled: boolean;           // Status da funcionalidade
  isSpeaking: boolean;          // Se está falando no momento
  toggleSpeech: () => void;     // Ativar/desativar
  speak: (text: string, isManual?: boolean) => void; // Ler texto (automático/manual)
  stop: () => void;             // Parar leitura
  setVoice: (voice: SpeechSynthesisVoice) => void; // Definir voz
  clearReadHistory: () => void; // Limpar histórico de mensagens lidas
  availableVoices: SpeechSynthesisVoice[]; // Vozes disponíveis
  selectedVoice: SpeechSynthesisVoice | null; // Voz selecionada
}
```

### Características Técnicas

- **Web Speech API**: Usa a API nativa do navegador
- **Fallback**: Funciona mesmo se algumas vozes não estiverem disponíveis
- **Performance**: Otimizado para não bloquear a interface
- **Acessibilidade**: Compatível com leitores de tela
- **Controle de Repetição**: Evita leitura automática repetida da mesma mensagem

### Configurações de Voz

```typescript
// Configurações padrão
utterance.rate = 0.9;    // Velocidade (0.1 a 10)
utterance.pitch = 1.0;   // Tom (0 a 2)
utterance.volume = 1.0;  // Volume (0 a 1)
utterance.lang = 'pt-BR'; // Idioma
```

## 🎨 Componentes

### 1. ChatBot Atualizado
- Botões de controle no header
- Painel de configurações expansível
- Indicadores visuais de status

### 2. VoiceNotification
- Tutorial interativo
- Verificação de compatibilidade
- Instruções de uso

### 3. useTextToSpeech Hook
- Gerenciamento de estado
- Controle de síntese de fala
- Carregamento de vozes

## 📱 Compatibilidade

### Navegadores Suportados
- ✅ Chrome 33+
- ✅ Firefox 49+
- ✅ Safari 7+
- ✅ Edge 79+
- ❌ Internet Explorer (não suportado)

### Dispositivos
- ✅ Desktop (Windows, macOS, Linux)
- ✅ Mobile (iOS Safari, Chrome Mobile)
- ✅ Tablet (iPad, Android)

## 🎯 Experiência do Usuário

### Controle de Repetição
- **Leitura Automática**: Cada mensagem é lida automaticamente apenas uma vez
- **Leitura Manual**: Clique no ícone 🔊 para reler qualquer mensagem
- **Histórico**: Sistema mantém registro de mensagens já lidas automaticamente
- **Limpeza**: Botão 🔄 nas configurações para resetar o histórico

### Primeira Vez
1. **Notificação Tutorial**: Explicação da funcionalidade
2. **Verificação Automática**: Teste de compatibilidade
3. **Guia Visual**: Instruções passo a passo

### Uso Diário
1. **Ativação Simples**: Um clique para ativar/desativar
2. **Feedback Visual**: Indicadores claros de status
3. **Controle Granular**: Leitura manual quando necessário

### Acessibilidade
- **Navegação por Teclado**: Todos os controles acessíveis
- **Leitores de Tela**: Compatível com tecnologias assistivas
- **Contraste**: Indicadores visuais com bom contraste

## 🔧 Configuração Avançada

### Personalização de Voz

```typescript
// Exemplo de configuração personalizada
const customUtterance = new SpeechSynthesisUtterance(text);
customUtterance.rate = 1.2;     // Mais rápido
customUtterance.pitch = 1.1;    // Tom mais alto
customUtterance.volume = 0.8;   // Volume menor
```

### Eventos Disponíveis

```typescript
utterance.onstart = () => {
  // Fala iniciou
};

utterance.onend = () => {
  // Fala terminou
};

utterance.onerror = (event) => {
  // Erro na fala
};
```

## 🐛 Troubleshooting

### Problema: Voz não funciona
**Soluções:**
1. Verificar se o navegador suporta Web Speech API
2. Verificar se há vozes instaladas no sistema
3. Verificar permissões de áudio

### Problema: Voz muito rápida/lenta
**Solução:**
1. Acessar configurações de voz
2. Testar diferentes vozes
3. Ajustar velocidade se necessário

### Problema: Não há vozes em português
**Soluções:**
1. Instalar pacotes de idioma no sistema
2. Usar vozes em inglês como alternativa
3. Verificar configurações de idioma do navegador

## 📊 Métricas e Analytics

### Eventos Rastreados
- Ativação/desativação da funcionalidade
- Uso de leitura manual vs automática
- Seleção de vozes
- Erros de síntese de fala

### Insights Valiosos
- Taxa de adoção da funcionalidade
- Preferências de voz dos usuários
- Problemas de compatibilidade
- Impacto na experiência do usuário

## 🚀 Próximos Passos

### Curto Prazo
- [ ] Adicionar mais opções de velocidade
- [ ] Implementar cache de configurações
- [ ] Adicionar suporte a pausa/retomar

### Médio Prazo
- [ ] Integração com APIs de TTS externas
- [ ] Vozes personalizadas por restaurante
- [ ] Controle de volume individual

### Longo Prazo
- [ ] IA para seleção automática de voz
- [ ] Síntese de fala em tempo real
- [ ] Suporte a múltiplos idiomas

## 🎉 Benefícios

### Para Usuários
- **Acessibilidade**: Melhor experiência para usuários com deficiência visual
- **Conveniência**: Pode ouvir enquanto faz outras atividades
- **Compreensão**: Melhor entendimento de respostas longas

### Para Restaurantes
- **Engajamento**: Usuários passam mais tempo no chat
- **Acessibilidade**: Atende a um público mais amplo
- **Diferenciação**: Funcionalidade única no mercado

A funcionalidade de leitura de voz representa um salto significativo na acessibilidade e usabilidade do chatbot! 🎉
