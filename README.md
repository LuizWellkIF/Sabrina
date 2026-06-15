# Sabrina

Sabrina é uma aplicação web para gestão de conhecimento corporativo. O projeto combina um backend Flask, um frontend React/Vite e uma base Supabase para organizar documentos internos por setor, categoria, cargo e nível de acesso. A aplicação também possui uma assistente de IA com Gemini para responder perguntas com base nos documentos cadastrados.

## Funcionalidades

- Autenticação com JWT.
- Cadastro e gestão de usuários, setores, cargos, categorias e documentos.
- Controle de acesso por nível de usuário.
- Organização de documentos por categoria e cargo-alvo.
- Dashboard com busca e filtros por categoria.
- Página individual de documento com conteúdo renderizado e navegação por seções.
- Assistente Sabrina IA com fluxo RAG baseado nos documentos do setor.
- Histórico de conversas com a IA, com exclusão individual ou limpeza completa pelo usuário.
- Deploy separado para backend Flask e frontend React.

## Stack

Backend:

- Python
- Flask
- Flask JWT Extended
- Flask CORS
- Supabase Python Client
- Google GenAI
- Gunicorn

Frontend:

- React
- Vite
- React Router
- Axios
- Tailwind CSS
- Lucide React

Banco e serviços:

- Supabase
- Gemini API
- Render

## Estrutura

```txt
.
+-- app/
|   +-- models/          # Acesso às tabelas do Supabase
|   +-- routes/          # Rotas da API Flask
|   +-- services/        # Regras de negócio
|   +-- utils/           # Utilitários de acesso/permissão
|   +-- config.py        # Configurações por variáveis de ambiente
|   +-- extensions.py    # JWT, CORS e cliente Supabase
|   +-- __init__.py      # Factory da aplicação Flask
+-- sabrina/
|   +-- src/
|   |   +-- components/
|   |   +-- contexts/
|   |   +-- pages/
|   |   +-- services/
|   +-- package.json
|   +-- vite.config.js
+-- requirements.txt
+-- run.py
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz para o backend local:

```env
JWT_SECRET_KEY=sua_chave_jwt_forte

SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_chave_supabase

GEMINI_API_KEY=sua_chave_gemini
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODELS=gemini-2.0-flash,gemini-flash-latest,gemini-flash-lite-latest
GEMINI_EMBED_MODEL=gemini-embedding-001

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

Para o frontend local, crie `sabrina/.env` se quiser apontar explicitamente para a API:

```env
VITE_API_URL=http://localhost:5000/api
```

Se `VITE_API_URL` não for definido, o frontend usa `/api`.

## Como rodar localmente

### Backend

Instale as dependências Python:

```bash
pip install -r requirements.txt
```

Rode a API:

```bash
python run.py
```

Por padrão, o Flask sobe em:

```txt
http://localhost:5000
```

### Frontend

Entre na pasta do frontend:

```bash
cd sabrina
```

Instale as dependências:

```bash
npm install
```

Rode o Vite:

```bash
npm run dev
```

Por padrão, o frontend sobe em:

```txt
http://localhost:5173
```

## Scripts

Backend:

```bash
python run.py
python -m compileall app run.py
```

Frontend:

```bash
cd sabrina
npm run dev
npm run build
npm run lint
npm run preview
```

## Rotas principais da API

Autenticação:

```txt
POST /api/auth/login
POST /api/auth/registrar
GET  /api/auth/me
```

Documentos:

```txt
GET    /api/documentos/
GET    /api/documentos/:id
POST   /api/documentos/
PUT    /api/documentos/:id
DELETE /api/documentos/:id
```

Categorias, cargos, setores e usuários:

```txt
/api/categorias
/api/cargos
/api/setores
/api/usuarios
```

Sabrina IA:

```txt
POST   /api/agente/perguntar
GET    /api/agente/historico
DELETE /api/agente/historico
DELETE /api/agente/historico/:id_consulta
```

## Tabelas esperadas no Supabase

O backend espera as seguintes tabelas:

```txt
USUARIO
SETOR
CARGO
CATEGORIA
DOCUMENTOS
HISTORICO
```

A tabela `DOCUMENTOS` também é usada para busca semântica via embedding. O projeto gera embeddings com Gemini e espera dimensão compatível com `GEMINI_EMBED_DIMENSIONS`, atualmente `768`.

## Deploy no Render

O projeto deve ser publicado como dois serviços separados.

### Backend: Web Service

Root directory:

```txt
.
```

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
gunicorn run:app
```

Environment variables:

```env
JWT_SECRET_KEY=...
SUPABASE_URL=...
SUPABASE_KEY=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODELS=gemini-2.0-flash,gemini-flash-latest,gemini-flash-lite-latest
GEMINI_EMBED_MODEL=gemini-embedding-001
CORS_ORIGINS=https://url-do-frontend.onrender.com
```

### Frontend: Static Site

Root directory:

```txt
sabrina
```

Build command:

```bash
npm ci && npm run build
```

Publish directory:

```txt
dist
```

Environment variables:

```env
VITE_API_URL=https://url-do-backend.onrender.com/api
```

Para o React Router funcionar em rotas como `/dashboard`, `/documento/:id` e `/categoria/:id`, configure um rewrite no Static Site:

```txt
Source: /*
Destination: /index.html
Action: Rewrite
```

## Observações de produção

- Nunca suba `.env` para o repositório.
- Gere um `JWT_SECRET_KEY` forte para produção.
- Depois de alterar variáveis `VITE_`, faça novo build do frontend.
- Depois de alterar variáveis do backend, faça redeploy do Web Service.
- Em planos gratuitos do Render e Supabase, a primeira requisição pode ser mais lenta por cold start.

## Licença

Este projeto está sob a licença definida em `LICENSE`.
