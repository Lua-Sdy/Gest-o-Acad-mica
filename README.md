# Sistema de Gestão de Professores e Cursos - Versão React

Este projeto é uma versão modernizada do sistema de gestão, migrada para uma arquitetura de Single Page Application (SPA) utilizando React no frontend e Node.js no backend.

## Como Executar o Projeto

Siga os passos abaixo para configurar e executar o ambiente de desenvolvimento localmente.

### Pré-requisitos

*   **Node.js:** Versão 18 ou superior.
*   **NPM:** Geralmente instalado junto com o Node.js.
*   **MySQL:** Um servidor de banco de dados MySQL em execução.

### 1. Configuração do Backend

O backend é responsável pela lógica de negócio e comunicação com o banco de dados.

1.  **Navegue até a pasta raiz** do projeto.

2.  **Crie o arquivo de ambiente:**
    *   Dentro da pasta `backend`, crie uma cópia do arquivo `.env.example` e renomeie para `.env`.
    *   Abra o arquivo `.env` e preencha as variáveis do banco de dados (`DB_USER`, `DB_PASSWORD`, `DB_NAME`) com as suas credenciais do MySQL.
    *   Altere a `SECRET_KEY` para uma frase longa e segura de sua preferência.

3.  **Instale as dependências:**
    ```bash
    npm install
    ```

4.  **Execute o servidor:**
    ```bash
    node backend/server.js
    ```
    O servidor backend estará em execução na porta 3000.

### 2. Configuração do Frontend

O frontend é a interface com a qual o usuário interage, construída em React.

1.  **Abra um novo terminal** e navegue até a pasta `frontend`:
    ```bash
    cd frontend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    O servidor de desenvolvimento do React será iniciado.

### 3. Acesso à Aplicação

Abra seu navegador e acesse o endereço fornecido pelo Vite (geralmente `http://localhost:5173`). A página de login da aplicação deve ser exibida.

---

## Resumo da Migração e Melhorias

Este projeto foi completamente migrado de uma arquitetura tradicional de arquivos HTML/CSS/JS para uma aplicação React moderna. Abaixo estão os detalhes de tudo que foi feito:

### 1. Arquitetura e Tecnologia

*   **Frontend:** Desenvolvido em **React com TypeScript**, utilizando **Vite** como ferramenta de build para alta performance.
    *   **`react-router-dom`**: Para gerenciamento de rotas e navegação.
    *   **`axios`**: Para comunicação padronizada com o backend.
*   **Backend:** Manteve-se em **Node.js com Express**, mas foi aprimorado para suportar a nova arquitetura.
*   **Estilo:** A identidade visual foi padronizada para seguir o tema do **SENAI CIMATEC**, com foco no azul institucional.

### 2. Estrutura do Projeto

*   **`frontend/`**: Contém toda a aplicação React.
    *   **`src/pages/`**: Onde fica cada página da aplicação (Login, Home, Cadastros).
    *   **`src/components/`**: Componentes reutilizáveis, como a barra de navegação (`Navbar`).
    *   **`src/services/`**: Centraliza a lógica de comunicação com a API.
*   **`backend/`**: Contém o servidor Node.js.
*   **`public/`**: (Obsoleta) Continha a aplicação antiga.

### 3. Funcionalidades Implementadas

*   **Sistema de Autenticação Completo:**
    *   A tela de login agora se comunica com o backend e, em caso de sucesso, recebe um **Token JWT (JSON Web Token)**.
    *   Este token é armazenado no navegador e enviado a cada requisição, garantindo a segurança.
    *   Foi implementado um sistema de **Rotas Privadas**, que impede o acesso a páginas internas por usuários não logados.
    *   A função de **Logout** foi adicionada, limpando o token e redirecionando para o login.

*   **Migração de Todas as Páginas para React:**
    *   **Login:** Formulário com validação e comunicação com a API.
    *   **Home:** Página inicial pós-login.
    *   **Cadastros:** Todas as páginas de cadastro foram recriadas como componentes React, com formulários controlados e feedback para o usuário.
        *   Cadastro de Usuário
        *   Cadastro de Curso
        *   Cadastro de Disciplina (com busca dinâmica de cursos)
        *   Cadastro de Sala
    *   **Grade Curricular:** A página de relatório foi criada para exibir os dados da grade em uma tabela.

### 4. Correções e Alinhamento do Backend

*   **Padronização de Rotas:** As rotas do backend foram renomeadas para seguir um padrão de API REST (ex: `/cadastroCurso` virou `/cursos`).
*   **Geração de Token:** A rota `/login` foi modificada para gerar e retornar o token JWT.
*   **Ajuste de Dados:** As rotas foram ajustadas para receber exatamente os dados que o frontend envia.
*   **Correção do Relatório:** A consulta SQL da grade curricular foi otimizada com `LEFT JOIN` para ser mais robusta e evitar falhas por dados ausentes, resolvendo o erro crítico do sistema original.
