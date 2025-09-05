# AcessiMap-Backend

Este repositório contém o código-fonte do backend da aplicação AcessiMap. O backend é responsável por gerenciar a lógica de negócios, a autenticação de usuários, a comunicação com o banco de dados e a integração com APIs externas.

---

### Tecnologias Utilizadas

O projeto utiliza um conjunto de tecnologias modernas para construir uma API robusta e escalável:

- **Node.js:** Ambiente de execução JavaScript.
- **Express.js:** Framework web para Node.js.
- **PostgreSQL:** Sistema de gerenciamento de banco de dados relacional.
- **JWT (JSON Web Tokens):** Para autenticação de usuários.
- **Passport.js:** Middleware de autenticação para Node.js, integrado com a autenticação do Google.
- **Nodemailer:** Módulo para envio de e-mails, possivelmente para recuperação de senha ou notificações.

---

### Variáveis de Ambiente Necessárias

Para o correto funcionamento do backend, você deve criar um arquivo `.env` na raiz do projeto e preencher as seguintes variáveis.

| Variável | Descrição |
| :--- | :--- |
| `GOOGLE_API_KEY` | Chave da API do Google. |
| `GOOGLE_CLIENT_ID` | ID do cliente para autenticação OAuth 2.0 do Google. |
| `GOOGLE_CLIENT_SECRET` | Chave secreta do cliente para autenticação OAuth 2.0 do Google. |
| `GOOGLE_CALLBACK_URL` | URL de redirecionamento após a autenticação do Google. |
| `JWT_SECRET` | Chave secreta para a assinatura e verificação de JWTs. |
| `EMAIL_USER` | E-mail de usuário para envio de e-mails (ex: Nodemailer). |
| `EMAIL_PASS` | Senha de aplicação para o e-mail de usuário. |
| `DATABASE_URL` | URL de conexão completa do banco de dados PostgreSQL. |
| `DB_HOST` | Host do banco de dados. |
| `DB_USER` | Usuário do banco de dados. |
| `DB_PASSWORD` | Senha do banco de dados. |
| `DB_DATABASE` | Nome do banco de dados. |
| `PORT` | Porta na qual o servidor do backend será executado. |
| `FRONT_URL` | URL do frontend da aplicação (para CORS e redirecionamentos). |

---

### Como Executar Localmente

Siga os passos abaixo para configurar e rodar o projeto em seu ambiente local.

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/ari123rm/AcessiMap-backend.git](https://github.com/ari123rm/AcessiMap-backend.git)
    cd AcessiMap-backend
    ```

2.  **Crie o arquivo `.env`** com as variáveis necessárias (veja a tabela acima).

3.  **Instale as dependências:**
    ```bash
    npm install
    ```

4.  **Execute o servidor:**
    ```bash
    npm start
    ```

O servidor estará rodando em `http://localhost:3001` (ou na porta que você configurou no `.env`).
