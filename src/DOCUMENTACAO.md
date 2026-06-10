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

# Recomendado (PC + celular/emulador na mesma rede):
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
#  (no Windows: dê duplo clique em "iniciar backend.bat" ou rode .\run-mobile-api.ps1)

# Apenas este PC (loopback):
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
> **Atenção (dispositivos não acessam a API):** use **`--host 0.0.0.0`**. Com
> `--host 127.0.0.1` a API só responde no próprio PC, e o celular/emulador fica
> sem acesso (notificações, planos e tudo mais deixam de carregar no app). O
> `iniciar backend.bat` já usa `0.0.0.0`. No Windows, libere a porta 8000 no
> firewall: `New-NetFirewallRule -DisplayName "Axis API 8000" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow` (PowerShell como Administrador).

- Swagger / documentação interativa: `http://127.0.0.1:8000/docs`
- Se o banco estiver vazio, há um seed: `POST /api/admin/bootstrap?confirmar=true`
  (o front também dispara isso automaticamente quando necessário).

### 3.3. Criar um usuário administrador
O painel admin só libera para clientes com `is_admin = true`.

> O **seed já cria o admin padrão** (`CPF 00000000000 / senha admin`,
> `id_cliente = 9`), então após o bootstrap o painel já está acessível. Sem ele,
> o `TRUNCATE ... cliente` do seed deixaria o banco **sem nenhum admin** (causa
> comum de "o admin não loga no app").

Para criar um admin personalizado ou **promover** um cliente existente:
```bash
cd backend
python scripts/criar_admin.py
#  cria/promove o admin padrão  ->  CPF 00000000000 / senha admin
#  personalizado:
python scripts/criar_admin.py --cpf 12345678900 --senha 1234 --nome "Maria" --email maria@axis.com
```
O script garante a coluna `is_admin` (em bancos antigos) e faz upsert do admin.
**Rode-o novamente sempre que reexecutar o bootstrap com um seed antigo** (sem o
admin), ou atualize o seed.

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

### 3.5. Testes
```bash
cd backend
# 1) suba a API em outra janela na porta de teste:
set AXIS_API_BASE_URL=http://127.0.0.1:8001   &&  python -m uvicorn main:app --port 8001
# 2) rode a suíte:
python run_tests.py            # unit + integração   (usa AXIS_API_BASE_URL, padrão :8001)
python run_tests.py --unit     # só unit (não precisa de API nem banco)
python run_tests.py --all      # unit + integração + carga
```
- **Unit** (`tests/test_unit_core.py`): segurança (hash/token) e schemas — sem API/banco.
- **Integração** (`tests/test_integration_api.py`): fluxo real cliente→plano→assinatura→reserva→**notificação** (criar, marcar como lida, listar por cliente).
- **Carga** (`tests/load_test_api.py`): GET concorrente em endpoints, incluindo `/notificacoes/cliente/{id}`.
- O runner já força saída UTF-8, funcionando no console do Windows.

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
│   ├── theme.ts                  # design tokens
│   ├── components/
│   │   ├── shared.tsx            # Header (com sino de notificações), Card, botões…
│   │   ├── pickers.tsx           # DateField (calendário) e TimeField (lista de horas)
│   │   └── ui.tsx  TopBar.tsx  Drawer.tsx  Screen.tsx
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── user/  (Home, Salas, ReservarSala, Reservas, EditarReserva, Perfil,
│       │          Plano, MeuPlano, Notificacoes, SobreNos)
│       └── admin/ (Dashboard, Users, Rooms, Plans, Reviews, Notifications)
```

**Navegação do usuário (tabs):** Home · Salas · Reservas · Perfil.
- **Sino de notificações:** o `Header` (`components/shared.tsx`) exibe o sino
  **automaticamente em todas as telas do usuário** (com badge de não lidas) —
  **exceto na tela de Perfil** (que tem cabeçalho próprio) e na própria tela de
  Notificações. O contador vem do hook `useUnreadCount` e recarrega ao focar.
- **Rota `Notificacoes`** fica no **stack raiz do usuário** (`App.tsx`), então o
  sino navega para ela a partir de qualquer aba; a tela é empilhada sobre as tabs
  e tem botão **voltar** (`Header onBack`).
- **Perfil** abre **Meu Plano** (assinatura atual: status, validade, trocar/cancelar)
  e **Notificações** (lista, marcar uma/todas como lidas).
- As telas de notificação/contador recarregam **ao ganhar foco** (`useFocusEffect`),
  então o badge e a lista refletem leituras e novas notificações sem reabrir o app.
- **Geração de notificações:** o app cria uma notificação (`POST /notificacoes`,
  best-effort) ao **criar** uma reserva (`ReservarSala`) e ao **alterar/cancelar**
  uma reserva (`EditarReserva` → tipo *Confirmação de Reserva* ou *Alerta*).
  Notificações criadas pelo **administrador** também aparecem para o usuário pelo
  sino. No painel admin → "Criar gatilho" é possível escolher **usuários
  específicos** ou marcar **"Enviar para todos os usuários"** (broadcast) — tanto
  na web quanto no mobile.
- **Reserva** (criar/editar): dia escolhido em **calendário** (`DateField`) e horários
  de início/término em **seletor de lista** 07h–21h (`TimeField`) — sem digitação.
- **Planos:** "Assinar"/"Trocar" cria a assinatura; a troca é livre (a anterior é
  cancelada automaticamente no backend). Se houver reserva ativa de sala de
  categoria superior ao **nível** do novo plano, o app avisa para cancelar a
  reserva antes. O **nível** (`planos.nivel`, 1–4) é configurado pelo admin
  (form de plano, web e mobile) e **não é exibido ao usuário comum** — ele
  desempata planos com o mesmo `acesso` (ex.: Day Pass=1, Flex=2, Dedicated=3,
  Office=4). Fallback: se o plano não tiver nível, usa o tier derivado do `acesso`.

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
| "Não consigo acessar a API" / no celular nada carrega | backend só em `localhost` (`127.0.0.1`), celular em outra rede, ou porta bloqueada | rode `--host 0.0.0.0 --port 8000` (o `iniciar backend.bat` já faz isso); mesmo Wi‑Fi; libere a porta 8000 no firewall |
| Notificações/planos "não aparecem" no app | API inacessível ao dispositivo (ver acima) — **não** é bug de tela | confirme `http://IP_DA_MAQUINA:8000/health` pelo celular |
| Badge do sino não atualiza / notificação nova não aparece | tela aberta antes da mudança | as telas recarregam ao focar; puxe para atualizar (pull‑to‑refresh) ou volte à tela |
| `run_tests.py` quebra com `UnicodeEncodeError` | console Windows em cp1252 | já corrigido (runner força UTF‑8); atualize o arquivo se estiver antigo |
| `GET /planos` falha: *column "nivel" does not exist* | banco criado antes do campo `nivel` | rebootstrap (`POST /api/admin/bootstrap?confirmar=true`) **ou** `ALTER TABLE planos ADD COLUMN IF NOT EXISTS nivel integer NOT NULL DEFAULT 1` |
| Admin entra como usuário comum | banco sem `is_admin` / backend desatualizado | rode `scripts/criar_admin.py` e **reinicie** o backend |
| Admin **não loga** no app (mobile/web) | banco **sem admin** (seed faz `TRUNCATE cliente`; bootstrap antigo não criava admin) | use o seed atualizado (admin `id 9`) **ou** rode `scripts/criar_admin.py` (CPF `00000000000` / senha `admin`) |
| Expo Go não conecta | SDK incompatível | o app está no **SDK 56**; atualize o Expo Go |
| Painel admin pede login de novo após logar no site | sessões diferentes | confirme que ambos usam `localStorage['axisWork.auth']` (via `js/auth.js`) |
| Página web "trava" sem dados | aberta via `file://` | sirva por HTTP (`npx serve .`) |

---

## 9. Onde está cada README específico
- `backend/README.md` — detalhes da API.
- `Front-End Mobile/axis-working-app/README.md` — detalhes do app mobile.
- Este arquivo (`DOCUMENTACAO.md`) — visão geral e integração entre tudo.
