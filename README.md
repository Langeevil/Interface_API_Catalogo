# Interface React da API

Interface criada em pasta separada para consumir o projeto Spring Boot local da atividade final.

## Como executar

```bash
cd interface
npm install
npm start
```

Por padrao, o Vite usa proxy para `http://localhost:8081`.
Se a API estiver em outra porta:

```bash
$env:VITE_API_TARGET="http://localhost:8080"
npm start
```

## Acesso mestre

- Email: `admin@fatec.sp.gov.br`
- Senha: `admin123`

## Telas

- Login: valida as credenciais em `/api/auth/login`.
- Produtos: cards responsivos, busca, filtro por categoria, criacao, edicao e exclusao.
- Categorias: listagem, busca, criacao, edicao e exclusao.
- Usuarios: listagem e cadastro com senha criptografada pela API.

## Framework CSS

O projeto usa Bootstrap via `bootstrap` e componentes React/Vite. O CSS local apenas complementa o layout e os estados de acessibilidade.

## Acessibilidade

A interface usa labels explicitos, foco visivel, contraste alto, `aria-live` para feedback e respeita `prefers-reduced-motion`.
