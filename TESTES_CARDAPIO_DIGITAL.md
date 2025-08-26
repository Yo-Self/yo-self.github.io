# Testes Funcionais - Cardápio Digital

## Visão Geral
Este documento contém a suíte completa de testes funcionais para o site de cardápio digital interativo desenvolvido com Next.js, React e TypeScript, utilizando Supabase como backend.

## Tecnologias de Teste Recomendadas
- **Testes E2E**: Playwright (recomendado) ou Cypress
- **Testes de Unidade/Integração**: Jest + React Testing Library
- **Testes de API**: Jest + Supertest

---

## 1. Visualização do Cardápio e Navegação

### Cenário 1.1: Lista de Restaurantes e Seleção
**Descrição**: O usuário deve conseguir ver a lista de restaurantes e selecionar um para ver o cardápio.

**Casos de Teste**:

#### CT-1.1.1: Exibição da Lista de Restaurantes
- **Passos**:
  1. Acessar a página inicial do site
  2. Verificar se a lista de restaurantes está visível
- **Resultado Esperado**: Lista de restaurantes deve ser exibida com nomes, imagens e informações básicas

#### CT-1.1.2: Seleção de Restaurante
- **Passos**:
  1. Clicar no dropdown de seleção de restaurante
  2. Selecionar um restaurante diferente da lista
- **Resultado Esperado**: 
  - O cardápio deve ser atualizado para o restaurante selecionado
  - A URL deve ser atualizada com o slug do restaurante
  - O modo de visualização deve voltar para "grid"

#### CT-1.1.3: Troca de Restaurante com Carrinho Ativo
- **Passos**:
  1. Adicionar itens ao carrinho em um restaurante
  2. Trocar para outro restaurante
- **Resultado Esperado**: 
  - O carrinho deve ser limpo automaticamente
  - Uma mensagem deve informar que o carrinho foi limpo devido à troca de restaurante

### Cenário 1.2: Carrossel de Pratos em Destaque
**Descrição**: Ao entrar no cardápio, o carrossel de pratos em destaque deve ser visível e funcional.

**Casos de Teste**:

#### CT-1.2.1: Exibição do Carrossel
- **Passos**:
  1. Acessar um restaurante com pratos em destaque
  2. Verificar se o carrossel está visível na página inicial
- **Resultado Esperado**: 
  - Carrossel deve exibir pratos em destaque
  - Navegação por setas deve estar visível
  - Indicadores de slide devem estar presentes

#### CT-1.2.2: Navegação por Setas
- **Passos**:
  1. Clicar na seta direita do carrossel
  2. Clicar na seta esquerda do carrossel
- **Resultado Esperado**: 
  - Pratos devem avançar/retroceder corretamente
  - Indicadores de slide devem ser atualizados
  - Animações de transição devem ser suaves

#### CT-1.2.3: Navegação por Swipe (Mobile)
- **Passos**:
  1. Em dispositivo móvel, fazer swipe para direita no carrossel
  2. Fazer swipe para esquerda no carrossel
- **Resultado Esperado**: 
  - Pratos devem responder ao gesto de swipe
  - Transições devem ser fluidas
  - Indicadores devem ser atualizados

#### CT-1.2.4: Carrossel sem Pratos em Destaque
- **Passos**:
  1. Acessar um restaurante sem pratos em destaque
- **Resultado Esperado**: 
  - O carrossel não deve ser exibido
  - A página deve continuar funcionando normalmente

### Cenário 1.3: Navegação por Categorias
**Descrição**: O usuário deve conseguir navegar pelas categorias de pratos, e a lista de itens deve ser atualizada de acordo com a categoria selecionada.

**Casos de Teste**:

#### CT-1.3.1: Exibição das Categorias
- **Passos**:
  1. Acessar um restaurante
  2. Verificar se as categorias estão visíveis no modo grid
- **Resultado Esperado**: 
  - Todas as categorias do restaurante devem estar visíveis
  - Cada categoria deve ter uma imagem representativa
  - Layout deve ser responsivo

#### CT-1.3.2: Seleção de Categoria
- **Passos**:
  1. Clicar em uma categoria específica
- **Resultado Esperado**: 
  - Modo de visualização deve mudar para "list"
  - Apenas itens da categoria selecionada devem ser exibidos
  - Categoria selecionada deve estar destacada

#### CT-1.3.3: Filtro por Categoria
- **Passos**:
  1. Selecionar uma categoria
  2. Verificar se os itens exibidos pertencem à categoria
- **Resultado Esperado**: 
  - Todos os itens exibidos devem pertencer à categoria selecionada
  - Contador de itens deve ser atualizado
  - Mensagem "Nenhum item encontrado" deve aparecer se a categoria estiver vazia

#### CT-1.3.4: Retorno ao Grid de Categorias
- **Passos**:
  1. Estar no modo lista com uma categoria selecionada
  2. Clicar no botão "Voltar" ou no título da categoria
- **Resultado Esperado**: 
  - Modo deve voltar para "grid"
  - Todas as categorias devem estar visíveis novamente
  - Filtro de categoria deve ser limpo

### Cenário 1.4: Modal de Detalhes do Prato
**Descrição**: Ao clicar em um prato, um modal com os detalhes (descrição, ingredientes, preço, etc.) deve abrir.

**Casos de Teste**:

#### CT-1.4.1: Abertura do Modal
- **Passos**:
  1. Clicar em um prato na lista ou no carrossel
- **Resultado Esperado**: 
  - Modal deve abrir com animação suave
  - Scroll da página deve ser bloqueado
  - Overlay escuro deve cobrir o fundo

#### CT-1.4.2: Conteúdo do Modal
- **Passos**:
  1. Abrir o modal de um prato
  2. Verificar todos os elementos do modal
- **Resultado Esperado**: 
  - Imagem do prato deve estar visível
  - Nome, descrição e preço devem estar corretos
  - Ingredientes devem ser exibidos
  - Informações sobre alérgenos devem estar presentes
  - Informação sobre porção deve ser exibida

#### CT-1.4.3: Complementos no Modal
- **Passos**:
  1. Abrir modal de um prato com complementos
  2. Verificar se os grupos de complementos estão visíveis
- **Resultado Esperado**: 
  - Grupos de complementos devem estar organizados
  - Complementos obrigatórios devem estar marcados
  - Limite máximo de seleções deve ser respeitado
  - Preços dos complementos devem estar visíveis

#### CT-1.4.4: Fechamento do Modal
- **Passos**:
  1. Abrir modal de um prato
  2. Clicar no botão de fechar (X)
  3. Clicar fora do modal
  4. Pressionar tecla ESC
- **Resultado Esperado**: 
  - Modal deve fechar com animação
  - Scroll da página deve ser restaurado
  - Overlay deve desaparecer

### Cenário 1.5: Modo Jornal
**Descrição**: O "Modo Jornal" deve ser funcional, permitindo ao usuário "folhear" o cardápio.

**Casos de Teste**:

#### CT-1.5.1: Acesso ao Modo Jornal
- **Passos**:
  1. Clicar no botão "Modo Jornal" no header
- **Resultado Esperado**: 
  - Interface deve mudar para o modo jornal
  - Layout deve simular um cardápio físico
  - Navegação deve ser intuitiva

#### CT-1.5.2: Navegação no Modo Jornal
- **Passos**:
  1. Estar no modo jornal
  2. Navegar entre as páginas do cardápio
- **Resultado Esperado**: 
  - Transições entre páginas devem ser suaves
  - Navegação deve ser intuitiva (setas, gestos)
  - Indicadores de página devem estar visíveis

#### CT-1.5.3: Funcionalidades no Modo Jornal
- **Passos**:
  1. No modo jornal, clicar em um prato
  2. Adicionar prato ao carrinho
- **Resultado Esperado**: 
  - Modal de detalhes deve abrir normalmente
  - Funcionalidades de carrinho devem funcionar
  - Modo jornal deve ser mantido após fechar o modal

---

## 2. Funcionalidade da Comanda (Carrinho de Compras)

### Cenário 2.1: Adição de Itens à Comanda
**Descrição**: O usuário deve conseguir adicionar um item à comanda a partir do modal de detalhes do prato.

**Casos de Teste**:

#### CT-2.1.1: Adição de Prato Simples
- **Passos**:
  1. Abrir modal de um prato sem complementos
  2. Clicar no botão "Adicionar à Comanda"
- **Resultado Esperado**: 
  - Prato deve ser adicionado ao carrinho
  - Modal deve fechar automaticamente
  - Feedback visual deve confirmar a adição
  - Ícone do carrinho deve aparecer no header

#### CT-2.1.2: Adição de Prato com Complementos
- **Passos**:
  1. Abrir modal de um prato com complementos
  2. Selecionar complementos obrigatórios
  3. Selecionar complementos opcionais
  4. Clicar em "Adicionar à Comanda"
- **Resultado Esperado**: 
  - Prato com complementos selecionados deve ser adicionado
  - Preço total deve incluir complementos
  - Modal deve fechar após adição

#### CT-2.1.3: Validação de Complementos Obrigatórios
- **Passos**:
  1. Abrir modal de prato com complementos obrigatórios
  2. Tentar adicionar sem selecionar complementos obrigatórios
- **Resultado Esperado**: 
  - Botão deve estar desabilitado
  - Mensagem deve informar sobre complementos obrigatórios
  - Prato não deve ser adicionado

#### CT-2.1.4: Limite de Complementos
- **Passos**:
  1. Abrir modal de prato com limite de complementos
  2. Tentar selecionar mais complementos que o permitido
- **Resultado Esperado**: 
  - Checkbox deve ser desabilitado
  - Mensagem deve informar sobre o limite
  - Seleção não deve ser permitida

### Cenário 2.2: Ícone da Comanda no Cabeçalho
**Descrição**: O ícone da comanda no cabeçalho deve aparecer e exibir a contagem correta de itens.

**Casos de Teste**:

#### CT-2.2.1: Exibição do Ícone
- **Passos**:
  1. Adicionar um item ao carrinho
- **Resultado Esperado**: 
  - Ícone do carrinho deve aparecer no header
  - Badge com contagem deve estar visível
  - Ícone deve ter animação de entrada

#### CT-2.2.2: Contagem de Itens
- **Passos**:
  1. Adicionar múltiplos itens ao carrinho
  2. Verificar a contagem no badge
- **Resultado Esperado**: 
  - Badge deve mostrar o número total de itens
  - Contagem deve ser atualizada em tempo real
  - Para mais de 99 itens, deve mostrar "99+"

#### CT-2.2.3: Ícone com Carrinho Vazio
- **Passos**:
  1. Limpar o carrinho completamente
- **Resultado Esperado**: 
  - Ícone do carrinho deve desaparecer
  - Badge não deve estar visível

### Cenário 2.3: Modal da Comanda
**Descrição**: No modal da comanda, o usuário deve conseguir ver a lista de itens, aumentar/diminuir a quantidade e remover um item.

**Casos de Teste**:

#### CT-2.3.1: Abertura do Modal
- **Passos**:
  1. Clicar no ícone do carrinho no header
- **Resultado Esperado**: 
  - Modal da comanda deve abrir
  - Lista de itens deve estar visível
  - Preço total deve ser exibido

#### CT-2.3.2: Lista de Itens
- **Passos**:
  1. Abrir modal da comanda com múltiplos itens
- **Resultado Esperado**: 
  - Todos os itens devem estar listados
  - Nome, preço e quantidade de cada item devem estar visíveis
  - Complementos selecionados devem ser exibidos

#### CT-2.3.3: Controles de Quantidade
- **Passos**:
  1. No modal da comanda, clicar no botão "+" de um item
  2. Clicar no botão "-" de um item
- **Resultado Esperado**: 
  - Quantidade deve aumentar/diminuir
  - Preço total deve ser recalculado
  - Contador no header deve ser atualizado

#### CT-2.3.4: Remoção de Itens
- **Passos**:
  1. No modal da comanda, clicar no botão de remover (lixeira)
- **Resultado Esperado**: 
  - Item deve ser removido da comanda
  - Preço total deve ser recalculado
  - Contador no header deve ser atualizado
  - Modal deve fechar se o carrinho ficar vazio

### Cenário 2.4: Cálculo de Preços
**Descrição**: O preço total da comanda deve ser calculado corretamente, incluindo os complementos selecionados.

**Casos de Teste**:

#### CT-2.4.1: Cálculo de Item Simples
- **Passos**:
  1. Adicionar um prato sem complementos ao carrinho
  2. Verificar o preço total
- **Resultado Esperado**: 
  - Preço total deve ser igual ao preço do prato
  - Formatação deve estar em formato brasileiro (R$ X,XX)

#### CT-2.4.2: Cálculo com Complementos
- **Passos**:
  1. Adicionar prato com complementos selecionados
  2. Verificar o preço total
- **Resultado Esperado**: 
  - Preço total deve incluir prato + complementos
  - Cálculo deve ser preciso (sem arredondamentos incorretos)

#### CT-2.4.3: Cálculo com Múltiplos Itens
- **Passos**:
  1. Adicionar múltiplos itens com diferentes quantidades
  2. Verificar o preço total
- **Resultado Esperado**: 
  - Preço total deve ser a soma de todos os itens
  - Quantidades devem ser consideradas corretamente

#### CT-2.4.4: Atualização em Tempo Real
- **Passos**:
  1. No modal da comanda, alterar quantidades
  2. Verificar se o preço total é atualizado
- **Resultado Esperado**: 
  - Preço total deve ser atualizado imediatamente
  - Não deve haver atrasos na atualização

### Cenário 2.5: Limpeza da Comanda
**Descrição**: O usuário deve conseguir limpar a comanda, com uma etapa de confirmação.

**Casos de Teste**:

#### CT-2.5.1: Botão de Limpar
- **Passos**:
  1. Abrir modal da comanda com itens
  2. Clicar no botão "Limpar Comanda"
- **Resultado Esperado**: 
  - Modal de confirmação deve aparecer
  - Mensagem deve ser clara sobre a ação

#### CT-2.5.2: Confirmação de Limpeza
- **Passos**:
  1. Clicar em "Sim" no modal de confirmação
- **Resultado Esperado**: 
  - Comanda deve ser limpa completamente
  - Modal deve fechar
  - Ícone do carrinho deve desaparecer
  - Mensagem de confirmação deve ser exibida

#### CT-2.5.3: Cancelamento da Limpeza
- **Passos**:
  1. Clicar em "Não" no modal de confirmação
- **Resultado Esperado**: 
  - Modal de confirmação deve fechar
  - Comanda deve permanecer inalterada
  - Modal da comanda deve continuar aberto

---

## 3. Busca e Chatbot com IA

### Cenário 3.1: Interface de Busca/IA
**Descrição**: O usuário deve conseguir abrir a interface de busca/IA.

**Casos de Teste**:

#### CT-3.1.1: Abertura da Interface
- **Passos**:
  1. Clicar no botão de busca/IA no header
- **Resultado Esperado**: 
  - Interface de busca deve abrir
  - Campo de input deve estar focado
  - Teclado virtual deve aparecer em dispositivos móveis

#### CT-3.1.2: Fechamento da Interface
- **Passos**:
  1. Abrir interface de busca
  2. Clicar fora da interface
  3. Pressionar tecla ESC
- **Resultado Esperado**: 
  - Interface deve fechar
  - Campo de busca deve ser limpo
  - Resultados anteriores devem ser limpos

### Cenário 3.2: Busca Simples
**Descrição**: Ao digitar um termo de busca simples (ex: "frango"), a IA deve retornar os pratos correspondentes.

**Casos de Teste**:

#### CT-3.2.1: Busca por Nome do Prato
- **Passos**:
  1. Abrir interface de busca
  2. Digitar "frango" no campo de busca
  3. Aguardar resultados
- **Resultado Esperado**: 
  - Pratos com "frango" no nome devem ser exibidos
  - Resultados devem aparecer em tempo razoável (< 3 segundos)
  - Cards dos pratos devem ser clicáveis

#### CT-3.2.2: Busca por Ingrediente
- **Passos**:
  1. Abrir interface de busca
  2. Digitar "arroz" no campo de busca
- **Resultado Esperado**: 
  - Pratos que contenham "arroz" nos ingredientes devem ser exibidos
  - Resultados devem ser relevantes

#### CT-3.2.3: Busca sem Resultados
- **Passos**:
  1. Abrir interface de busca
  2. Digitar um termo que não existe no cardápio
- **Resultado Esperado**: 
  - Mensagem "Nenhum resultado encontrado" deve aparecer
  - Sugestões de busca devem ser oferecidas

#### CT-3.2.4: Busca com Filtro de Categoria
- **Passos**:
  1. Estar em uma categoria específica
  2. Abrir interface de busca
  3. Realizar uma busca
- **Resultado Esperado**: 
  - Resultados devem respeitar o filtro de categoria ativo
  - Apenas pratos da categoria atual devem ser exibidos

### Cenário 3.3: Chatbot com IA
**Descrição**: Ao fazer uma pergunta (ex: "Qual o prato mais popular?"), o chatbot deve fornecer uma resposta em texto e, se aplicável, exibir cards dos pratos recomendados.

**Casos de Teste**:

#### CT-3.3.1: Pergunta sobre Popularidade
- **Passos**:
  1. Abrir interface de busca
  2. Digitar "Qual o prato mais popular?"
  3. Aguardar resposta da IA
- **Resultado Esperado**: 
  - IA deve responder com texto explicativo
  - Cards dos pratos recomendados devem ser exibidos
  - Resposta deve ser contextualizada ao restaurante

#### CT-3.3.2: Pergunta sobre Ingredientes
- **Passos**:
  1. Abrir interface de busca
  2. Digitar "Quais pratos são veganos?"
- **Resultado Esperado**: 
  - IA deve identificar pratos veganos
  - Cards dos pratos devem ser exibidos
  - Explicação sobre critérios deve ser fornecida

#### CT-3.3.3: Pergunta sobre Preços
- **Passos**:
  1. Abrir interface de busca
  2. Digitar "Quais são os pratos mais baratos?"
- **Resultado Esperado**: 
  - IA deve listar pratos por ordem de preço
  - Preços devem estar visíveis
  - Explicação sobre a seleção deve ser fornecida

#### CT-3.3.4: Histórico de Conversa
- **Passos**:
  1. Fazer múltiplas perguntas no chat
  2. Verificar se o histórico é mantido
- **Resultado Esperado**: 
  - Todas as perguntas e respostas devem estar visíveis
  - Scroll deve funcionar para navegar pelo histórico
  - Contexto da conversa deve ser mantido

### Cenário 3.4: Funcionalidade de Voz
**Descrição**: A funcionalidade de leitura por voz (Text-to-Speech) do chatbot deve poder ser ativada, desativada e a voz deve poder ser trocada.

**Casos de Teste**:

#### CT-3.4.1: Ativação da Voz
- **Passos**:
  1. Abrir interface de busca
  2. Clicar no botão de ativar voz
- **Resultado Esperado**: 
  - Voz deve ser ativada
  - Ícone deve mudar para indicar estado ativo
  - Respostas da IA devem ser lidas em voz alta

#### CT-3.4.2: Desativação da Voz
- **Passos**:
  1. Com voz ativada, clicar no botão novamente
- **Resultado Esperado**: 
  - Voz deve ser desativada
  - Ícone deve voltar ao estado inativo
  - Respostas não devem mais ser lidas

#### CT-3.4.3: Troca de Voz
- **Passos**:
  1. Abrir configurações de voz
  2. Selecionar uma voz diferente da lista
- **Resultado Esperado**: 
  - Nova voz deve ser aplicada
  - Configuração deve ser salva
  - Próximas respostas devem usar a nova voz

#### CT-3.4.4: Controle de Voz
- **Passos**:
  1. Com voz ativada, receber uma resposta da IA
  2. Clicar no botão de pausar durante a leitura
  3. Clicar no botão de continuar
- **Resultado Esperado**: 
  - Leitura deve pausar ao clicar em pausar
  - Leitura deve continuar ao clicar em continuar
  - Controles devem ser responsivos

---

## 4. Funcionalidades Adicionais

### Cenário 4.1: Chamar Garçom
**Descrição**: Se a funcionalidade "Chamar Garçom" estiver ativa para o restaurante, o botão deve estar visível e, ao ser clicado, abrir um modal para o usuário inserir o número da mesa.

**Casos de Teste**:

#### CT-4.1.1: Visibilidade do Botão
- **Passos**:
  1. Acessar restaurante com funcionalidade de garçom ativada
- **Resultado Esperado**: 
  - Botão "Chamar Garçom" deve estar visível no header
  - Ícone deve ser claro e intuitivo

#### CT-4.1.2: Botão Oculto
- **Passos**:
  1. Acessar restaurante sem funcionalidade de garçom
- **Resultado Esperado**: 
  - Botão "Chamar Garçom" não deve estar visível

#### CT-4.1.3: Abertura do Modal
- **Passos**:
  1. Clicar no botão "Chamar Garçom"
- **Resultado Esperado**: 
  - Modal deve abrir com formulário
  - Campo para número da mesa deve estar focado
  - Campo para observações deve estar disponível

#### CT-4.1.4: Validação do Formulário
- **Passos**:
  1. Abrir modal de chamar garçom
  2. Tentar enviar sem preencher número da mesa
- **Resultado Esperado**: 
  - Mensagem de erro deve aparecer
  - Formulário não deve ser enviado
  - Campo deve ser destacado como inválido

#### CT-4.1.5: Envio da Chamada
- **Passos**:
  1. Preencher número da mesa válido
  2. Adicionar observações opcionais
  3. Clicar em "Enviar"
- **Resultado Esperado**: 
  - Chamada deve ser enviada com sucesso
  - Som de sino deve tocar
  - Modal deve fechar
  - Mensagem de confirmação deve aparecer

### Cenário 4.2: Envio via WhatsApp
**Descrição**: O envio do pedido via WhatsApp deve gerar uma mensagem formatada corretamente com os detalhes dos itens da comanda.

**Casos de Teste**:

#### CT-4.2.1: Botão WhatsApp
- **Passos**:
  1. Abrir modal da comanda com itens
- **Resultado Esperado**: 
  - Botão "Enviar via WhatsApp" deve estar visível
  - Ícone do WhatsApp deve estar presente

#### CT-4.2.2: Formatação da Mensagem
- **Passos**:
  1. Com itens no carrinho, clicar em "Enviar via WhatsApp"
- **Resultado Esperado**: 
  - Aplicativo WhatsApp deve abrir
  - Mensagem deve conter:
    - Nome do restaurante
    - Lista completa de itens com quantidades
    - Preços individuais
    - Preço total
    - Complementos selecionados

#### CT-4.2.3: Mensagem com Complementos
- **Passos**:
  1. Adicionar prato com complementos ao carrinho
  2. Enviar via WhatsApp
- **Resultado Esperado**: 
  - Complementos devem estar listados claramente
  - Preços dos complementos devem estar visíveis
  - Formatação deve ser legível

#### CT-4.2.4: Mensagem sem Itens
- **Passos**:
  1. Tentar enviar comanda vazia via WhatsApp
- **Resultado Esperado**: 
  - Botão deve estar desabilitado
  - Mensagem deve informar que o carrinho está vazio

---

## 5. Acessibilidade e Responsividade

### Cenário 5.1: Responsividade
**Descrição**: O site deve ser totalmente funcional e visualmente agradável em diferentes tamanhos de tela (desktop, tablet e mobile).

**Casos de Teste**:

#### CT-5.1.1: Layout Desktop
- **Passos**:
  1. Acessar o site em tela desktop (1920x1080)
- **Resultado Esperado**: 
  - Layout deve usar todo o espaço disponível
  - Elementos devem estar bem distribuídos
  - Navegação deve ser intuitiva

#### CT-5.1.2: Layout Tablet
- **Passos**:
  1. Redimensionar janela para tamanho tablet (768x1024)
- **Resultado Esperado**: 
  - Layout deve se adaptar ao tamanho da tela
  - Elementos devem ser redimensionados adequadamente
  - Funcionalidades devem permanecer acessíveis

#### CT-5.1.3: Layout Mobile
- **Passos**:
  1. Redimensionar janela para tamanho mobile (375x667)
- **Resultado Esperado**: 
  - Layout deve ser otimizado para mobile
  - Botões devem ter tamanho adequado para toque
  - Navegação deve ser adaptada para gestos

#### CT-5.1.4: Orientação Landscape/Portrait
- **Passos**:
  1. Em dispositivo móvel, rotacionar a tela
- **Resultado Esperado**: 
  - Layout deve se adaptar à nova orientação
  - Elementos devem ser reposicionados adequadamente
  - Funcionalidades devem continuar funcionando

### Cenário 5.2: Funcionalidades de Acessibilidade
**Descrição**: As funcionalidades de acessibilidade (aumento de fonte, mudança de tema) devem funcionar e persistir durante a navegação.

**Casos de Teste**:

#### CT-5.2.1: Aumento de Fonte
- **Passos**:
  1. Clicar no botão de acessibilidade
  2. Aumentar o tamanho da fonte
- **Resultado Esperado**: 
  - Texto deve aumentar proporcionalmente
  - Layout deve se ajustar ao novo tamanho
  - Funcionalidades devem continuar funcionando

#### CT-5.2.2: Mudança de Tema
- **Passos**:
  1. Clicar no botão de acessibilidade
  2. Alternar entre tema claro e escuro
- **Resultado Esperado**: 
  - Cores devem mudar adequadamente
  - Contraste deve ser mantido
  - Transição deve ser suave

#### CT-5.2.3: Persistência das Configurações
- **Passos**:
  1. Configurar acessibilidade (fonte grande, tema escuro)
  2. Navegar entre páginas
  3. Recarregar a página
- **Resultado Esperado**: 
  - Configurações devem ser mantidas
  - Preferências devem ser salvas no localStorage
  - Aplicação deve funcionar normalmente

#### CT-5.2.4: Navegação por Teclado
- **Passos**:
  1. Usar apenas teclado para navegar
  2. Pressionar TAB para navegar entre elementos
  3. Pressionar ENTER para ativar elementos
- **Resultado Esperado**: 
  - Todos os elementos interativos devem ser acessíveis
  - Foco deve ser visível e claro
  - Navegação deve ser lógica e intuitiva

---

## 6. Testes de Performance e Estabilidade

### Cenário 6.1: Performance
**Descrição**: O site deve carregar rapidamente e responder de forma ágil às interações do usuário.

**Casos de Teste**:

#### CT-6.1.1: Tempo de Carregamento
- **Passos**:
  1. Medir tempo de carregamento da página inicial
- **Resultado Esperado**: 
  - Página deve carregar em menos de 3 segundos
  - Imagens devem carregar progressivamente
  - Indicador de loading deve estar visível

#### CT-6.1.2: Responsividade da Interface
- **Passos**:
  1. Realizar ações rápidas (cliques, digitação)
- **Resultado Esperado**: 
  - Interface deve responder imediatamente
  - Não deve haver travamentos ou lentidão
  - Animações devem ser suaves

#### CT-6.1.3: Carregamento de Imagens
- **Passos**:
  1. Navegar por diferentes seções do cardápio
- **Resultado Esperado**: 
  - Imagens devem carregar de forma otimizada
  - Placeholders devem ser exibidos durante carregamento
  - Cache deve funcionar adequadamente

### Cenário 6.2: Estabilidade
**Descrição**: O site deve funcionar de forma estável em diferentes condições e dispositivos.

**Casos de Teste**:

#### CT-6.2.1: Funcionamento Offline
- **Passos**:
  1. Desconectar da internet
  2. Tentar usar funcionalidades do site
- **Resultado Esperado**: 
  - Funcionalidades básicas devem continuar funcionando
  - Mensagem sobre conexão deve ser exibida
  - Dados em cache devem estar disponíveis

#### CT-6.2.2: Recuperação de Erros
- **Passos**:
  1. Simular erro de carregamento de dados
  2. Verificar comportamento do sistema
- **Resultado Esperado**: 
  - Mensagem de erro deve ser exibida
  - Botão de tentar novamente deve estar disponível
  - Sistema não deve travar

#### CT-6.2.3: Compatibilidade de Navegadores
- **Passos**:
  1. Testar em diferentes navegadores (Chrome, Firefox, Safari, Edge)
- **Resultado Esperado**: 
  - Funcionalidades devem funcionar em todos os navegadores
  - Layout deve ser consistente
  - Performance deve ser similar

---

## 7. Testes de Integração

### Cenário 7.1: Integração com Supabase
**Descrição**: Todas as funcionalidades que dependem do backend devem funcionar corretamente.

**Casos de Teste**:

#### CT-7.1.1: Carregamento de Dados
- **Passos**:
  1. Acessar diferentes restaurantes
- **Resultado Esperado**: 
  - Dados devem ser carregados do Supabase
  - Estrutura dos dados deve estar correta
  - Erros de conexão devem ser tratados adequadamente

#### CT-7.1.2: Funcionalidades de IA
- **Passos**:
  1. Fazer perguntas complexas para o chatbot
- **Resultado Esperado**: 
  - IA deve responder usando dados do Supabase
  - Respostas devem ser contextualizadas
  - Performance deve ser aceitável

#### CT-7.1.3: Chamadas de Garçom
- **Passos**:
  1. Enviar chamada de garçom
- **Resultado Esperado**: 
  - Dados devem ser salvos no Supabase
  - Confirmação deve ser exibida
  - Som deve tocar após sucesso

---

## 8. Testes de Usabilidade

### Cenário 8.1: Experiência do Usuário
**Descrição**: A interface deve ser intuitiva e fácil de usar para diferentes tipos de usuários.

**Casos de Teste**:

#### CT-8.1.1: Primeira Visita
- **Passos**:
  1. Acessar o site pela primeira vez
- **Resultado Esperado**: 
  - Tutorial deve aparecer automaticamente
  - Instruções devem ser claras e úteis
  - Usuário deve conseguir pular o tutorial

#### CT-8.1.2: Navegação Intuitiva
- **Passos**:
  1. Navegar pelo site sem instruções
- **Resultado Esperado**: 
  - Funcionalidades devem ser descobertas facilmente
  - Botões devem ter propósitos claros
  - Feedback visual deve ser adequado

#### CT-8.1.3: Consistência da Interface
- **Passos**:
  1. Usar diferentes funcionalidades do site
- **Resultado Esperado**: 
  - Padrões visuais devem ser consistentes
  - Comportamento deve ser previsível
  - Terminologia deve ser uniforme

---

## 9. Testes de Segurança

### Cenário 9.1: Validação de Dados
**Descrição**: O sistema deve validar adequadamente todos os dados de entrada.

**Casos de Teste**:

#### CT-9.1.1: Injeção de Script
- **Passos**:
  1. Tentar inserir código JavaScript em campos de texto
- **Resultado Esperado**: 
  - Código não deve ser executado
  - Dados devem ser sanitizados
  - Sistema deve continuar funcionando

#### CT-9.1.2: Validação de Formulários
- **Passos**:
  1. Tentar enviar dados inválidos em formulários
- **Resultado Esperado**: 
  - Validação deve impedir envio
  - Mensagens de erro devem ser claras
  - Sistema não deve quebrar

---

## 10. Testes de Acessibilidade Avançada

### Cenário 10.1: Suporte a Leitores de Tela
**Descrição**: O site deve ser acessível para usuários com deficiência visual.

**Casos de Teste**:

#### CT-10.1.1: Navegação por Leitor de Tela
- **Passos**:
  1. Usar leitor de tela para navegar pelo site
- **Resultado Esperado**: 
  - Todos os elementos devem ser anunciados
  - Navegação deve ser lógica
  - Contexto deve ser claro

#### CT-10.1.2: Textos Alternativos
- **Passos**:
  1. Verificar imagens e elementos visuais
- **Resultado Esperado**: 
  - Todas as imagens devem ter alt text
  - Elementos decorativos devem ser marcados adequadamente
  - Informações importantes devem estar em texto

---

## Conclusão

Esta suíte de testes cobre todas as funcionalidades principais do cardápio digital, garantindo que:

1. **Funcionalidades Core**: Visualização, navegação e interação com o cardápio funcionem perfeitamente
2. **Sistema de Comanda**: Adição, remoção e gerenciamento de itens seja intuitivo e confiável
3. **IA e Busca**: Chatbot e sistema de busca sejam responsivos e úteis
4. **Acessibilidade**: Site seja utilizável por todos os tipos de usuários
5. **Performance**: Sistema seja rápido e estável em diferentes condições
6. **Segurança**: Dados sejam validados e protegidos adequadamente

Recomenda-se executar estes testes regularmente durante o desenvolvimento e antes de cada deploy para garantir a qualidade da experiência do usuário.
