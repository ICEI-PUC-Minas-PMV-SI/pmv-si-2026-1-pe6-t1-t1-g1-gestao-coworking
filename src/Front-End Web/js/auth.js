/**
 * AxisAuth — sessão e autenticação compartilhadas do front-end web.
 *
 * Uma ÚNICA sessão (localStorage 'axisWork.auth') é usada tanto pelo site
 * público/usuário quanto pelo painel administrativo, no mesmo formato:
 *
 *   { token, tokenType, cpf, user: <cliente com is_admin>, loggedAt }
 *
 * Fluxo (igual ao app mobile):
 *   - O backend (/api/login) devolve só o token → buscamos o cliente em
 *     /api/clientes para obter is_admin.
 *   - Login direciona: is_admin ? painel administrativo : área do usuário.
 *   - O cabeçalho público mostra "Entrar/Cadastrar" (visitante) ou
 *     "Olá, Fulano + Minha conta + Sair" (logado), com link para o painel admin.
 */
(function () {
  const STORAGE_KEY = 'axisWork.auth';
  const apiBase = () => window.API_BASE_URL || 'http://127.0.0.1:8000/api';

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  function setSession(session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  const getCliente = () => getSession()?.user || null;
  const getToken = () => getSession()?.token || null;
  const isLogged = () => Boolean(getToken());
  const isAdmin = () => Boolean(getCliente()?.is_admin);

  /** fetch já com a base /api e o token Bearer da sessão. */
  function apiFetch(path, options = {}) {
    const token = getToken();
    return fetch(`${apiBase()}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  }

  async function login(cpfRaw, senha) {
    const cpf = String(cpfRaw || '').replace(/\D/g, '');
    if (!cpf || !senha) throw new Error('Informe CPF e senha.');

    const res = await fetch(`${apiBase()}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf, senha }),
    });
    const data = await res.json().catch(() => ({}));

    if (data.erro) throw new Error(data.erro);
    if (!res.ok || !data.access_token) {
      throw new Error(data.detail || 'CPF ou senha inválidos.');
    }

    // O login do agregador devolve apenas o token → buscamos o cliente (is_admin).
    let cliente = data.cliente || null;
    if (!cliente) {
      const r = await fetch(`${apiBase()}/clientes`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const lista = r.ok ? await r.json() : [];
      cliente = lista.find((c) => String(c.cpf).replace(/\D/g, '') === cpf) || null;
    }
    if (!cliente) {
      throw new Error('Login efetuado, mas não foi possível carregar os dados do cliente.');
    }

    const session = {
      token: data.access_token,
      tokenType: data.token_type || 'bearer',
      cpf,
      user: cliente,
      loggedAt: new Date().toISOString(),
    };
    setSession(session);
    return session;
  }

  function logout(redirectTo) {
    clear();
    if (redirectTo) window.location.href = redirectTo;
  }

  /**
   * Atualiza o cabeçalho público conforme a sessão.
   * Visitante: mantém os botões "Entrar/Cadastrar".
   * Logado: "Olá, <nome>" + (admin) "Painel admin" + "Minha conta" + "Sair".
   */
  function mountHeader() {
    const trigger = document.querySelector(
      "header [onclick*='login.html'], header a[href*='login.html']"
    );
    const container = trigger ? trigger.parentElement : document.querySelector('header > div:last-child');
    if (!container) return;

    const cli = getCliente();
    if (!cli) return; // visitante: mantém Entrar/Cadastrar

    const first = (cli.nome || 'Usuário').split(' ')[0];
    const adminBtn = cli.is_admin
      ? '<button class="bot1 bot" data-axis-admin>Painel admin</button>'
      : '';

    container.innerHTML = `
      <span data-axis-greet style="color:var(--aw-navy,#0A2A44);font-weight:700;align-self:center;margin-right:8px;">Olá, ${first}</span>
      ${adminBtn}
      <button class="bot2 bot" data-axis-account>Minha conta</button>
      <button class="bot1 bot" data-axis-logout>Sair</button>
    `;

    container.querySelector('[data-axis-admin]')?.addEventListener('click', () => {
      window.location.href = '../admin/admin-coworking.html';
    });
    container.querySelector('[data-axis-account]')?.addEventListener('click', () => {
      window.location.href = 'gerenciamento-conta.html';
    });
    container.querySelector('[data-axis-logout]')?.addEventListener('click', () => {
      clear();
      window.location.reload();
    });
  }

  window.AxisAuth = {
    getSession, getCliente, getToken, isLogged, isAdmin,
    login, logout, clear, apiFetch, mountHeader, apiBase,
  };

  document.addEventListener('DOMContentLoaded', mountHeader);
})();
