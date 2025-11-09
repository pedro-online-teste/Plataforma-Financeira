# Plataforma Financeira SPA

## Descrição do Projeto

Esta é uma plataforma Single Page Application (SPA) para controle financeiro pessoal, desenvolvida inteiramente em **HTML5**, **CSS3** e **JavaScript puro**, com integração do **Chart.js** para visualização gráfica. A aplicação permite:

- Simular login de usuário com sessão armazenada no `localStorage`.
- Gerenciar transações financeiras (receitas e despesas).
- Visualizar um dashboard com resumo financeiro e gráficos dinâmicos.
- Gerar relatórios mensais filtrados por data.
- Gerenciar investimentos com registro de tipo, valor, data e retorno percentual.
- Visualizar gráficos de investimentos com distribuição por tipo.

## Funcionalidades

- Login simulado sem backend, utilizando `localStorage` para manter sessão.
- Validação robusta de formulários com mensagens de erro acessíveis.
- Armazenamento persistente de dados financeiros e investimentos no `localStorage`.
- Navegação entre seções sem recarregar a página, via JavaScript.
- Gráficos responsivos com dados atualizados dinamicamente.
- Interface responsiva e acessível, adequada para desktops e dispositivos móveis.

## Tecnologias Utilizadas

- HTML5 semântico e acessível
- CSS3 com Flexbox, Grid e media queries para responsividade
- JavaScript ES6+ com classes, módulos (sem bundler), e manipulação DOM
- Chart.js via CDN para gráficos interativos
- Armazenamento local via `localStorage` para dados e sessão

## Pré-requisitos

- Navegador moderno atualizado (Chrome, Firefox, Edge, Safari)
- Não requer servidor backend, mas para evitar restrições CORS, recomenda-se usar um servidor local simples

## Instalação e Execução

1. Clone ou baixe o repositório em sua máquina local.

2. Para facilitar a execução, utilize o `live-server` (ou outro servidor local):

    - Caso não tenha o `live-server` instalado globalmente, instale via npm:

        npm install -g live-server

    - No terminal, dentro da pasta do projeto, execute:

        live-server --open=index.html

3. O navegador abrirá a aplicação automaticamente.

4. Alternativamente, abra o arquivo `index.html` diretamente no navegador, porém algumas funcionalidades podem ser restritas devido a políticas de segurança do navegador.

## Configuração (Variáveis de Ambiente)

- Nenhuma configuração adicional é necessária para uso local.
- Caso deseje adaptar para uso com backend, crie variáveis de ambiente conforme seu ambiente.

## Estrutura de Pastas

