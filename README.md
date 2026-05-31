# Atividade Final API - Frontend

SPA de gerenciamento de inventario desenvolvida em React + Vite para consumir a API Spring Boot da atividade final.

## Tecnologias

- React
- Vite
- Bootstrap
- Fetch API

## Requisitos

- Node.js instalado
- API Spring Boot rodando
- PostgreSQL configurado para a API

Por padrao, a interface espera a API em:

```text
http://localhost:8081
```

## Instalar dependencias

Na pasta do frontend:

```bash
cd interface
npm install
```

## Rodar o projeto

```bash
npm run dev
```

Tambem e possivel usar:

```bash
npm start
```

O Vite inicia por padrao em:

```text
http://localhost:5173
```

## API em outra porta

Se a API estiver em outra porta, informe o alvo antes de iniciar o frontend.

PowerShell:

```bash
$env:VITE_API_TARGET="http://localhost:8080"
npm run dev
```

## Acesso mestre

A API cria automaticamente um usuario mestre na primeira inicializacao, caso ele ainda nao exista no banco:

- Email: `admin@fatec.sp.gov.br`
- Senha: `admin123`

## Funcionalidades

- Tela de login com validacao visual.
- Login validado contra a API em `/api/auth/login`.
- Mensagem de erro quando as credenciais sao invalidas.
- Dashboard com listagem responsiva de produtos em cards.
- Exibicao de nome do produto, preco formatado em R$ e categoria.
- Exclusao de produto integrada com `DELETE`.
- Cadastro de produto com select de categorias carregado da API.
- Filtro de produtos por categoria.
- Cadastro de usuario com validacao de senha.

## CORS

O backend Spring Boot foi configurado para permitir o acesso do frontend rodando em:

```text
http://localhost:5173
http://127.0.0.1:5173
http://192.168.*.*:*
```

## Build

Para gerar a versao de producao:

```bash
npm run build
```
