# Axis Work — App Unificado

App React Native / Expo que combina o modo usuário e o painel administrativo em um único projeto.

> **Esta é a aplicação mobile única do sistema.** Ela consolidou as antigas pastas
> `admin-mobile`, o fluxo de reservas em Expo Router (`app/`) e o design system
> `ui.tsx.txt` — todas já removidas do repositório. Toda a estilização segue o padrão
> do painel admin (`src/theme.ts` + `src/components/`).

## Instalação

```bash
cd "Front-End Mobile/axis-working-app"
npm install
npx expo start -c   # -c limpa o cache do Metro
```

> **Compatibilidade:** projeto em **Expo SDK 56** (React Native 0.85 / React 19),
> compatível com a versão atual do app **Expo Go**. Requer Node 18+.

## Conta de teste (admin)

| Campo | Valor         |
|-------|---------------|
| CPF   | 00000000000   |
| Senha | admin         |

> O seed é criado automaticamente na primeira vez que a **API Usuário** inicializar.

## Fluxo de login

```
Abertura do app
  └── Versão pública (sem login) → tabs: Início / Salas / Planos / Sobre Nós / Entrar
        │ toca em "Entrar" (ou tenta reservar uma sala)
        ▼
      Tela de Login
        ├── is_admin = true  → Painel Administrativo (drawer lateral)
        │                         ⇄ alterna para a aplicação do usuário pelo menu lateral
        │                           ("Ir para o aplicativo") e volta pelo Perfil
        │                           ("Painel administrativo")
        └── is_admin = false → App do Usuário (bottom tabs: Home / Salas / Reservas / Perfil)
```

O **administrador** pode alternar livremente entre o **painel administrativo** e a
**aplicação do usuário** (mesma experiência do app web): no painel, abre o menu lateral e
toca em **"Ir para o aplicativo"**; estando no app, vai em **Perfil → "Painel administrativo"**.

O app **abre direto na versão pública** (igual ao site web): qualquer visitante pode navegar
por Salas, Planos e Sobre Nós. O login só é solicitado ao tocar em **Entrar** ou ao tentar
**reservar uma sala**. Após autenticar, o app passa a renderizar o painel admin ou as telas
de usuário conforme o `is_admin`.

## Fluxo de reservas (usuário)

```
Salas (tab) → seleciona uma sala → ReservarSala (data + horário) → confirma
                                      └→ cria reserva (POST /api/reservas) + notificação
Reservas (tab) → card "Alterar / cancelar" → EditarReserva
                                      └→ PATCH /api/reservas/{id} (alterar ou cancelar)
```

## Variáveis de ambiente (opcional)

O backend é **um único servidor FastAPI na porta 8000** (`backend/run-mobile-api.ps1`),
com todos os endpoints sob `/api/...`. O app monta as URLs sozinho a partir do host do
Expo Dev Server (`http://SEU_IP:8000`). Para apontar manualmente, crie um `.env`:

```
EXPO_PUBLIC_API_URL=http://SEU_IP:8000
```

> **Importante:** para um celular físico acessar a API, o backend precisa escutar na rede
> (`uvicorn main:app --host 0.0.0.0 --port 8000`) e o celular deve estar **na mesma rede**
> do computador (e o firewall liberar a porta 8000).

## Estrutura

```
axis-working-app/
├── App.tsx                          # Navegação raiz + provider de auth
├── src/
│   ├── context/AuthContext.tsx      # Login, logout, dados do usuário
│   ├── api/
│   │   ├── client.ts                # Clientes HTTP (userApi 8001 + adminApi 8000)
│   │   └── adminData.ts             # Carga agregada de dados do painel admin
│   ├── theme.ts                     # Design tokens (base de estilização do app)
│   ├── components/
│   │   ├── shared.tsx               # Componentes do modo usuário
│   │   ├── ui.tsx                   # Componentes do painel admin (AppButton, Card, Sheet…)
│   │   ├── Screen.tsx / TopBar.tsx / Drawer.tsx
│   ├── utils/format.ts              # Datas, moeda e helpers de reserva
│   └── screens/
│       ├── LoginScreen.tsx          # Tela de login unificada
│       ├── user/
│       │   ├── HomeScreen.tsx       # Home com reservas, salas e planos
│       │   ├── SalasScreen.tsx      # Lista de salas
│       │   ├── ReservarSalaScreen.tsx # Detalhe da sala + criar reserva
│       │   ├── ReservasScreen.tsx   # Minhas reservas (+ alterar/cancelar)
│       │   ├── EditarReservaScreen.tsx # Alterar/cancelar uma reserva
│       │   ├── PerfilScreen.tsx     # Perfil do usuário
│       │   ├── PlanoScreen.tsx      # Lista de planos
│       │   └── SobreNosScreen.tsx   # Sobre o Axis Work
│       └── admin/                   # Painel admin (dashboard + todas as entidades)
│           ├── DashboardScreen.tsx  # Dashboard + ReservationsScreen
│           ├── UsersScreen.tsx  RoomsScreen.tsx  PlansScreen.tsx
│           └── ReviewsScreen.tsx  NotificationsScreen.tsx
```
