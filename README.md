# 🍽️ Cardápio Digital - Web Version

Uma aplicação moderna de cardápio digital com chatbot inteligente usando **Google Gemma 3 SuperTo**.

## ✨ Funcionalidades

- 📱 **Interface Responsiva**: Design moderno e adaptável
- 🤖 **Chatbot Inteligente**: Assistente de IA com Google Gemma 3 SuperTo
- 🔊 **Leitura de Voz**: Text-to-speech para respostas do chatbot
- 🍽️ **Cardápio Interativo**: Navegação por categorias e busca
- 🌙 **Modo Escuro**: Suporte completo a tema escuro
- 🔍 **Busca Avançada**: Filtros por categoria e preço
- 📊 **Analytics**: Integração com PostHog e OpenReplay
- 🚀 **Performance**: Otimizado para velocidade

## 🚀 Chatbot com Gemma 3 SuperTo

O chatbot agora usa o **Google Gemma 3 SuperTo** como modelo padrão, oferecendo:

- ⚡ **Velocidade**: 2-3x mais rápido que modelos anteriores
- 🧠 **Qualidade**: Melhor compreensão e respostas mais naturais
- 💪 **Confiabilidade**: Sistema de fallback automático
- 🎯 **Precisão**: Informações precisas sobre pratos e preços

### Modelos Disponíveis

1. **🤖 Gemma 3 SuperTo** (Padrão) - Mais rápido e inteligente
2. **⚡ Gemma 3 Flash** (Fallback) - Otimizado para velocidade
3. **💎 Gemini 1.5 Flash** (Último recurso) - Compatibilidade garantida

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS 4
- **IA**: Google Generative AI (Gemma 3 SuperTo)
- **Backend**: Supabase Edge Functions
- **Analytics**: PostHog, OpenReplay
- **Deploy**: GitHub Pages

## 🚀 Getting Started

### Pré-requisitos

- Node.js 18+
- Conta no Supabase
- Chave da API do Google AI

### Instalação

1. **Clone o repositório**:
   ```bash
   git clone <repository-url>
   cd web-version
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   ```bash
   cp env.example .env.local
   ```
   
   Edite `.env.local` com suas configurações:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
   NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY=your_openreplay_key
   ```

4. **Configure o Supabase**:
   - Crie um projeto no [Supabase](https://supabase.com)
   - Configure a Edge Function `ai-chat`
   - Adicione a variável `GOOGLE_AI_API_KEY` nas configurações

5. **Execute o projeto**:
   ```bash
   npm run dev
   ```

6. **Acesse**: [http://localhost:3000](http://localhost:3000)

## 🧪 Testando

### Gemma 3 SuperTo
Execute o script de teste para verificar se tudo está funcionando:

```bash
node test-gemma3.js
```

### Funcionalidade de Voz
Para testar a funcionalidade de text-to-speech:

```bash
node test-voice.js
```

Ou abra o console do navegador e execute o código fornecido pelo script.

## 📚 Documentação

- [📖 Setup do Ambiente](SETUP_ENVIRONMENT.md)
- [🚀 Deploy da Edge Function](DEPLOY_EDGE_FUNCTION.md)
- [🤖 Migração para Gemma 3](GEMMA_3_MIGRATION.md)
- [🔊 Funcionalidade de Voz](VOICE_FEATURE.md)
- [📊 Configuração de Analytics](ANALYTICS_SETUP.md)

## 🏗️ Estrutura do Projeto

```
web-version/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # Componentes React
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Bibliotecas e configurações
│   ├── services/           # Serviços de API
│   └── types/              # Definições TypeScript
├── supabase-functions/     # Edge Functions do Supabase
├── public/                 # Arquivos estáticos
└── docs/                   # Documentação
```

## 🚀 Deploy

### GitHub Pages

```bash
npm run build
npm run deploy
```

### Vercel

```bash
npm run build
# Deploy via Vercel CLI ou GitHub integration
```

## 🔧 Configuração Avançada

### Edge Function

A Edge Function `ai-chat` está configurada para usar o Gemma 3 SuperTo com fallback automático. Para atualizar:

```bash
supabase functions deploy ai-chat
```

### Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase | ✅ |
| `NEXT_PUBLIC_POSTHOG_KEY` | Chave do PostHog | ❌ |
| `NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY` | Chave do OpenReplay | ❌ |
| `GOOGLE_AI_API_KEY` | Chave da API do Google AI (Supabase) | ✅ |

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- 📖 [Documentação](SETUP_ENVIRONMENT.md)
- 🐛 [Issues](https://github.com/seu-usuario/web-version/issues)
- 💬 [Discussions](https://github.com/seu-usuario/web-version/discussions)

---

Desenvolvido com ❤️ usando Next.js e Google Gemma 3 SuperTo
