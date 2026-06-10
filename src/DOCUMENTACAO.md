# Axis Work — Documentação para Desenvolvedores

Guia para a equipe rodar o projeto localmente, entender a arquitetura e
implementar melhorias com segurança. O sistema tem **três aplicações** que
conversam com **uma única API**:

| Aplicação | Pasta | Stack | Para quem |
|-----------|-------|-------|-----------|
| **Backend (API única)** | `backend/` | Python · FastAPI · SQLAlchemy · PostgreSQL | servidor |
| **App mobile** | `Front-End Mobile/axis-working-app/` | Expo SDK 56 · React Native · TypeScript | usuário e admin |
| **App web** | `Front-End Web/` | HTML · CSS · JavaScript (sem framework) | usuário e admin |

> As pastas `admin-mobile/`, `admin-dashboard/` e o antigo `app/` (Expo Router)
> **foram unificadas** dentro das aplicações acima. Hoje existe **um** app mobile e
> **um** app web, cada um contendo a área do usuário **e** o painel administrativo.

---

## 1. Visão geral da arquitetura

```
                    ┌──────────────────────────────┐
                    │  Backend FastAPI (porta 8000) │
                    │  Tudo sob /api/...            │
                    │  PostgreSQL "eixo6"           │
                    └───────────────┬──────────────┘
                                    │  HTTP JSON
              ┌─────────────────────┼─────────────────────┐
              ▼                                           ▼
   ┌────────────────────┐                     ┌────────────────────────┐
   │  App Web            │                     │  App Mobile (Expo)     │
   │  Front-End Web/     │                     │  axis-working-app/     │
   │  • site público     │                     │  • abas públicas       │
   │  • área do usuário  │                     │  • área do usuário     │
   │  • painel admin     │                     │  • painel admin        │
   └────────────────────┘                     └────────────────────────┘
```

**Princípio comum (web e mobile funcionam igual):**
1. A aplicação **abre na versão pública** (qualquer visitante navega por salas,
   planos e sobre nós).
2. O **login** só é solicitado ao tocar/clicar em **Entrar** (ou ao tentar reservar).
3. Após o login, o roteamento é **por papel** (`is_admin`):
   - `is_admin = true`  → **painel administrativo**
   - `is_admin = false` → **área do usuário**
4. O **administrador pode alternar** entre o painel e a aplicação do usuário.

---

## 2. Pré-requisitos

- **Node.js 18+** (mobile e para servir o web localmente)
- **Python 3.12+** (backend)
- **PostgreSQL** rodando localmente (banco `eixo6`)
- App **Expo Go** atualizado no celular (para o mobile)

---

## 3. Backend (API)

### 3.1. Configuração do banco
A conexão é lida de `backend/API Avaliacao/appsettings.json`
(`ConnectionStrings.DefaultConnection`) ou da variável de ambiente `DATABASE_URL`.
Padrão local:

```
Host=localhost;Port=5432;Database=eixo6;Username=postgres;Password=admin
```

### 3.2. Instalar e rodar
```bash
cd backend
python -m pip install -r requirements.txt

# Local (só este PC):
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Acesso por celular/emulador (escuta na rede):
python -m uvicorn main:app --host 0.0.0.0 --port 8000
#  (no Windows: .\run-mobile-api.ps1)
```
- Swagger / documentação interativa: `http://127.0.0.1:8000/docs`
- Se o banco estiver vazio, há um seed: `POST /api/admin/bootstrap?confirmar=true`
  (o front também dispara isso automaticamente quando necessário).

### 3.3. Criar um usuário administrador
O painel admin só libera para clientes com `is_admin = true`:
```bash
cd backend
python scripts/criar_admin.py
#  cria/promove o admin padrão  ->  CPF 00000000000 / senha admin
#  personalizado:
python scripts/criar_admin.py --cpf 12345678900 --senha 1234 --nome "Maria" --email maria@axis.com
```
O script garante a coluna `is_admin` (em bancos antigos) e faz upsert do admin.

### 3.4. Endpoints (resumo)
Tudo sob o prefixo **`/api`** (há aliases legados sem `/api` apenas para
`/clientes`, `/login`, `/planos`, `/assinaturas`, `/notificacoes`):

- `POST /api/login` · `GET/POST/PUT/PATCH/DELETE /api/clientes[...]`
- `GET/POST/PUT/DELETE /api/salas` · `GET /api/salas/tipos`
- `GET/POST/PATCH/DELETE /api/reservas`
- `GET /api/planos` · `GET /api/assinaturas`
- `GET /api/avaliacoes` · `GET/POST/PATCH/DELETE /api/notificacoes`
- `POST /api/admin/bootstrap?confirmar=true`

> **Importante sobre o login:** `/api/login` devolve **apenas** `access_token`.
> O `is_admin` vem de `GET /api/clientes` (campo exposto em `ClienteRead`). Tanto o
> web quanto o mobile fazem login → buscam o cliente pelo CPF → leem `is_admin`.

---

## 4. App Web (`Front-End Web/`)

### 4.1. Estrutura
```
Front-End Web/
├── Pages/                  # site público + área do usuário
│   ├── index.html          # home pública
│   ├── salas.html sala.html
│   ├── planos.html  sobrenos.html
│   ├── login.html  cadastro.html
│   ├── carrinho.html  confirmar-reserva.html  alterar-reserva.html
│   └── gerenciamento-conta.html   # área logada do usuário
├── admin/                  # PAINEL ADMINISTRATIVO (modular)
│   ├── admin-coworking.html       # dashboard (entrada)
│   ├── pages/  (users, rooms, plans, reviews, dashboard)
│   ├── js/modules/  (core, boot, dashboard, users, rooms, plans, reviews, notifications, controls)
│   └── css/modules/
├── js/
│   ├── config.js           # ⚙️ base ÚNICA da API (window.API_BASE_URL)
│   ├── auth.js             # 🔐 sessão única + login + header (AxisAuth)
│   ├── home.js  salas.js   # lógica das páginas públicas
└── css/  img/
```

### 4.2. Como servir
O painel usa `fetch`, então **sirva por HTTP** (não abra via `file://`):
```bash
cd "Front-End Web"
npx serve .          # ou:  python -m http.server 5500
```
Depois acesse, por exemplo, `http://localhost:5500/Pages/index.html`.
(No VS Code, a extensão **Live Server** também funciona.)

### 4.3. Autenticação e sessão (módulos compartilhados)
- **`js/config.js`** define `window.API_BASE_URL` (uma única origem `…:8000/api`).
  Para mudar de host/porta, edite só este arquivo.
- **`js/auth.js`** expõe `window.AxisAuth`:
  - `login(cpf, senha)` → autentica, busca o cliente (com `is_admin`) e grava a
    sessão única em `localStorage['axisWork.auth']`
    (formato `{ token, tokenType, cpf, user, loggedAt }`).
  - `getSession() · getCliente() · getToken() · isLogged() · isAdmin() · logout() · apiFetch(path, opts)`
  - `mountHeader()` atualiza o cabeçalho público: visitante vê **Entrar/Cadastrar**;
    logado vê **Olá, Nome · (admin) Painel admin · Minha conta · Sair**.
- O **painel admin** (`admin/js/modules/core.js`) lê a **mesma** sessão
  (`axisWork.auth`), exige `is_admin` (senão volta ao site) e tem o botão
  **"Ir para o site"** no modal de perfil.

> Qualquer página nova deve incluir, **antes** do seu script:
> ```html
> <script src="../js/config.js"></script>
> <script src="../js/auth.js"></script>
> ```

---

## 5. App Mobile (`Front-End Mobile/axis-working-app/`)

### 5.1. Rodar
```bash
cd "Front-End Mobile/axis-working-app"
npm install
npx expo start -c          # -c limpa o cache do Metro
```
Abra no **Expo Go** (escaneando o QR). Requer **Expo SDK 56** (RN 0.85 / React 19).

### 5.2. Estrutura
```
axis-working-app/
├── App.tsx                       # navegação raiz (público / usuário / admin) + troca de modo
├── src/
│   ├── context/AuthContext.tsx   # login, logout, viewMode (painel/app)
│   ├── api/client.ts             # base ÚNICA :8000 + prefixo /api automático
│   ├── theme.ts  components/     # design system (base do app)
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── user/  (Home, Salas, ReservarSala, Reservas, EditarReserva, Perfil, Plano, SobreNos)
│       └── admin/ (Dashboard, Users, Rooms, Plans, Reviews, Notifications)
```

### 5.3. Conexão com a API
- `src/api/client.ts` detecta o **IP do Expo Dev Server** e usa `http://SEU_IP:8000`,
  com `/api` aplicado automaticamente a todas as chamadas.
- Override manual: crie `.env` com `EXPO_PUBLIC_API_URL=http://SEU_IP:8000`.
- O celular precisa estar **na mesma rede** e o backend rodando com `--host 0.0.0.0`.

---

## 6. Fluxo de autenticação (idêntico em web e mobile)

```
Visitante  ──Entrar──►  POST /api/login  ──►  token
                                  │
                                  ▼
                       GET /api/clientes (acha por CPF) ──► cliente { is_admin }
                                  │
              ┌───────────────────┴───────────────────┐
       is_admin = true                          is_admin = false
              ▼                                          ▼
      Painel administrativo                       Área do usuário
   (pode alternar p/ a aplicação)            (pode ir ao painel se virar admin)
```

- **Sessão única** por plataforma:
  - Web: `localStorage['axisWork.auth']`
  - Mobile: estado em memória do `AuthContext` (+ token no header das requisições)
- **Conta de teste admin:** CPF `00000000000` / senha `admin` (após rodar `criar_admin.py`).

---

## 7. Como implementar melhorias (receitas rápidas)

### Adicionar uma página ao painel admin (web)
1. Crie `Front-End Web/admin/pages/minha.html` (copie uma existente como base) com
   `<body data-page="minha">`.
2. Crie um módulo `admin/js/modules/minha.js` com a função `renderMinha(data)`.
3. Registre o carregamento no `admin/js/modules/boot.js` (bloco `if (currentPage === 'minha')`).
4. Inclua o `<script src="../js/modules/minha.js">` nas páginas que usam.

### Adicionar uma tela ao app do usuário (mobile)
1. Crie `src/screens/user/MinhaScreen.tsx` usando os componentes de `src/components/shared.tsx`.
2. Registre no `App.tsx` (uma `Tab.Screen` ou `Stack.Screen` dentro do stack adequado).
3. Para dados, use `userApi.get('/...')` / `userApi.send('/...', 'POST', body)` de `src/api/client.ts`.

### Adicionar um endpoint no backend
1. Crie/edite o router em `backend/app/routes/` e os schemas em `backend/app/schemas.py`.
2. O `app/main.py` já monta os routers com prefixo `/api`.
3. Reinicie o `uvicorn` (com `--reload` recarrega sozinho).

### Convenções importantes
- **Sempre** chame a API sob `/api/...` (a base já inclui isso no web `config.js` e no mobile `client.ts`).
- O modelo `Cliente` usa **`id_cliente`** como ID; o front mapeia isso ao logar.
- Papel do usuário = **`is_admin`** (boolean no banco/`ClienteRead`).

---

## 8. Solução de problemas

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| "Não consigo acessar a API" | backend só em `localhost`, ou celular em outra rede | rode `--host 0.0.0.0 --port 8000`; mesmo Wi‑Fi; libere a porta no firewall |
| Admin entra como usuário comum | banco sem `is_admin` / backend desatualizado | rode `scripts/criar_admin.py` e **reinicie** o backend |
| Expo Go não conecta | SDK incompatível | o app está no **SDK 56**; atualize o Expo Go |
| Painel admin pede login de novo após logar no site | sessões diferentes | confirme que ambos usam `localStorage['axisWork.auth']` (via `js/auth.js`) |
| Página web "trava" sem dados | aberta via `file://` | sirva por HTTP (`npx serve .`) |

---

## 9. Onde está cada README específico
- `backend/README.md` — detalhes da API.
- `Front-End Mobile/axis-working-app/README.md` — detalhes do app mobile.
- Este arquivo (`DOCUMENTACAO.md`) — visão geral e integração entre tudo.
