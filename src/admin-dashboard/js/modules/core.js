// Nucleo compartilhado, estado e helpers
// Arquivo extraido de admin-coworking.js para organizar o painel por dominio.

const API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:8000/api';
const currentPage = document.body.dataset.page;
const PLAN_DRAFT_STORAGE_KEY = 'axisWork.planDraft';
const ADMIN_AUTH_STORAGE_KEY = 'axisWork.adminAuth';
const pageState = {
  clientes: [],
  salas: [],
  planos: [],
  assinaturas: [],
  reservas: [],
  avaliacoes: [],
  notificacoes: [],
  notificacaoTipos: [],
  planDraft: null,
  userFilters: {
    plano: 'all',
    status: 'all',
    perPage: 8,
  },
  userPagination: {
    page: 1,
  },
  reviewFilters: {
    query: '',
    stars: 'all',
    status: 'all',
  },
};

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const PLAN_BENEFIT_OPTIONS = [
  'Hot Desk por 8h',
  'Hot Desk ilimitado',
  'Café e wifi',
  '1h de sala de reunião',
  '5h/mês de salas de reunião',
  '10h/mês de salas',
  '20h/mês de salas extras',
  'Eventos da comunidade',
  'Locker pessoal',
  'Mesa dedicada 24/7',
  'Endereço fiscal',
  'Recepção de correspondência',
  'Estacionamento',
  'Sala privativa',
];

const USER_SUBSCRIPTION_STATUS_OPTIONS = [
  ['Ativa', 'Ativo'],
  ['Pendente', 'Pendente'],
  ['Suspensa', 'Suspenso'],
  ['Vencida', 'Vencido'],
  ['Cancelada', 'Cancelado'],
];

const shortDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function getAdminAuth() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) || 'null');
  } catch {
    clearAdminAuth();
    return null;
  }
}

function setAdminAuth(auth) {
  localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(auth));
}

function clearAdminAuth() {
  localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
}

function adminAuthHeader() {
  const auth = getAdminAuth();
  return auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
}

async function apiGet(path) {
  const response = await fetch(apiUrl(path), {
    headers: adminAuthHeader(),
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}: ${response.status}`);
  }

  return response.json();
}

async function apiSend(path, options = {}) {
  const { headers = {}, ...requestOptions } = options;
  const response = await fetch(apiUrl(path), {
    ...requestOptions,
    headers: { 'Content-Type': 'application/json', ...adminAuthHeader(), ...headers },
  });

  if (!response.ok) {
    throw new Error(`Falha na requisição ${path}: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function bootstrapAndRetry(loader) {
  await apiSend('/admin/bootstrap?confirmar=true', { method: 'POST' });
  return loader();
}

function icon(name, size = 13) {
  return `<svg width="${size}" height="${size}"><use href="#${name}"/></svg>`;
}

function escapeHtml(value = '') {
  return value
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function fallbackAdminUser(cpf = '33333333333') {
  return {
    nome: 'Marina Reis',
    cpf,
    email: 'marina@axis.work',
    telefone: '(11) 4002-8922',
  };
}

function currentAdminUser() {
  return getAdminAuth()?.user || fallbackAdminUser();
}

function updateStoredAdminUser(user) {
  const auth = getAdminAuth();
  if (!auth) return;
  setAdminAuth({ ...auth, user: { ...(auth.user || {}), ...user } });
  updateAdminProfileUi();
}

function updateAdminProfileUi() {
  const user = currentAdminUser();
  document.querySelectorAll('.user-pill').forEach((pill) => {
    pill.setAttribute('role', 'button');
    pill.setAttribute('tabindex', '0');
    pill.setAttribute('aria-label', 'Abrir perfil do administrador');
    pill.querySelector('.avatar')?.replaceChildren(document.createTextNode(initials(user.nome) || 'AD'));
    const name = pill.querySelector('.meta b');
    const role = pill.querySelector('.meta small');
    if (name) name.textContent = user.nome || 'Administrador';
    if (role) role.textContent = 'Administrador';
  });
}

async function findAdminProfile(cpf) {
  try {
    const clientes = await apiGet('/clientes');
    return clientes.find((cliente) => cliente.cpf === cpf) || fallbackAdminUser(cpf);
  } catch {
    return fallbackAdminUser(cpf);
  }
}

function ensureAdminSession() {
  if (getAdminAuth()?.token) {
    updateAdminProfileUi();
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const screen = document.createElement('div');
    screen.className = 'login-screen';
    screen.innerHTML = `
      <div class="login-brand">
        <div class="logo">AW</div>
        <div>
          <strong>Axis Work</strong>
          <span>Painel administrativo</span>
        </div>
      </div>
      <form class="login-panel" id="admin-login-form">
        <div>
          <p class="login-eyebrow">Acesso administrativo</p>
          <h1>Entrar no painel</h1>
          <p class="login-copy">Use as credenciais do administrador para gerenciar reservas, usuarios, salas, planos e notificacoes.</p>
        </div>
        <label>
          CPF
          <input name="cpf" inputmode="numeric" autocomplete="username" placeholder="33333333333" required>
        </label>
        <label>
          Senha
          <input name="senha" type="password" autocomplete="current-password" placeholder="Digite sua senha" required>
        </label>
        <div class="login-error" data-login-error hidden></div>
        <button class="btn btn--primary" type="submit">Entrar</button>
      </form>
    `;

    document.body.appendChild(screen);

    const form = screen.querySelector('#admin-login-form');
    const errorBox = screen.querySelector('[data-login-error]');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      const cpf = form.cpf.value.trim().replace(/\D/g, '');
      const senha = form.senha.value;
      errorBox.hidden = true;
      submitButton.disabled = true;
      submitButton.textContent = 'Entrando...';

      try {
        const login = await apiSend('/login', {
          method: 'POST',
          body: JSON.stringify({ cpf, senha }),
        });
        setAdminAuth({
          token: login.access_token,
          tokenType: login.token_type || 'bearer',
          cpf,
          user: await findAdminProfile(cpf),
          loggedAt: new Date().toISOString(),
        });
        updateAdminProfileUi();
        screen.remove();
        resolve(true);
      } catch (error) {
        errorBox.textContent = 'CPF ou senha invalidos. Verifique os dados e tente novamente.';
        errorBox.hidden = false;
        submitButton.disabled = false;
        submitButton.textContent = 'Entrar';
        console.error(error);
      }
    });
  });
}

function openAdminProfileModal() {
  const user = currentAdminUser();
  const auth = getAdminAuth();
  const loggedAt = auth?.loggedAt
    ? new Date(auth.loggedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : '-';

  const modal = openModal({
    title: 'Perfil do administrador',
    subtitle: 'Informacoes da sessao atual',
    body: `
      <div class="profile-popup">
        <div class="profile-avatar">${escapeHtml(initials(user.nome) || 'AD')}</div>
        <div class="profile-info">
          <strong>${escapeHtml(user.nome || 'Administrador')}</strong>
          <span>${escapeHtml(user.email || 'Sem e-mail')}</span>
        </div>
      </div>
      <div class="profile-grid">
        <div><span>CPF</span><strong>${escapeHtml(user.cpf || '-')}</strong></div>
        <div><span>Telefone</span><strong>${escapeHtml(user.telefone || '-')}</strong></div>
        <div><span>Perfil</span><strong>Administrador</strong></div>
        <div><span>Ultimo acesso</span><strong>${escapeHtml(loggedAt)}</strong></div>
      </div>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-edit-admin-profile>Editar perfil</button>
      <button class="btn btn--ghost" type="button" data-change-admin-password>Alterar senha</button>
      <button class="btn btn--ghost" type="button" data-modal-close>Fechar</button>
      <button class="btn btn--danger" type="button" data-admin-logout>Sair da conta</button>
    `,
  });

  modal.querySelector('[data-edit-admin-profile]')?.addEventListener('click', openAdminEditProfileModal);
  modal.querySelector('[data-change-admin-password]')?.addEventListener('click', openAdminPasswordModal);
  modal.querySelector('[data-admin-logout]')?.addEventListener('click', () => {
    clearAdminAuth();
    closeModal();
    window.location.reload();
  });
}

function openAdminEditProfileModal() {
  const user = currentAdminUser();
  const modal = openModal({
    title: 'Editar perfil',
    subtitle: 'Atualize os dados do administrador exibidos no painel.',
    body: `
      <form id="admin-profile-form" class="modal-body">
        <label>
          <div class="field-label">Nome</div>
          <input class="field-input" name="nome" value="${escapeHtml(user.nome || '')}" maxlength="50" required />
        </label>
        <label>
          <div class="field-label">E-mail</div>
          <input class="field-input" name="email" type="email" value="${escapeHtml(user.email || '')}" maxlength="100" required />
        </label>
        <label>
          <div class="field-label">Telefone</div>
          <input class="field-input" name="telefone" value="${escapeHtml(user.telefone || '')}" maxlength="11" placeholder="11999999999" />
        </label>
        <div class="login-error" data-form-error hidden></div>
      </form>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-back-profile>Voltar</button>
      <button class="btn btn--primary" type="submit" form="admin-profile-form">Salvar perfil</button>
    `,
  });

  modal.querySelector('[data-back-profile]').addEventListener('click', openAdminProfileModal);
  modal.querySelector('#admin-profile-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorBox = event.currentTarget.querySelector('[data-form-error]');
    const form = new FormData(event.currentTarget);
    const payload = {
      nome: String(form.get('nome') || '').trim(),
      email: String(form.get('email') || '').trim(),
      telefone: String(form.get('telefone') || '').replace(/\D/g, '') || null,
    };

    if (!user.id_cliente) {
      updateStoredAdminUser(payload);
      showActionMessage('Perfil atualizado localmente.');
      openAdminProfileModal();
      return;
    }

    try {
      const updated = await apiSend(`/clientes/${user.id_cliente}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      updateStoredAdminUser(updated);
      showActionMessage('Perfil atualizado com sucesso.');
      openAdminProfileModal();
    } catch (error) {
      console.error(error);
      errorBox.textContent = 'Nao foi possivel atualizar o perfil. Verifique e-mail e telefone.';
      errorBox.hidden = false;
    }
  });
}

function openAdminPasswordModal() {
  const user = currentAdminUser();
  const modal = openModal({
    title: 'Alterar senha',
    subtitle: 'A nova senha sera usada no proximo login do painel.',
    body: `
      <form id="admin-password-form" class="modal-body">
        <label>
          <div class="field-label">Senha atual</div>
          <input class="field-input" name="senha_atual" type="password" autocomplete="current-password" required />
        </label>
        <label>
          <div class="field-label">Nova senha</div>
          <input class="field-input" name="nova_senha" type="password" autocomplete="new-password" maxlength="50" required />
        </label>
        <label>
          <div class="field-label">Confirmar nova senha</div>
          <input class="field-input" name="confirmar_senha" type="password" autocomplete="new-password" maxlength="50" required />
        </label>
        <div class="login-error" data-form-error hidden></div>
      </form>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-back-profile>Voltar</button>
      <button class="btn btn--primary" type="submit" form="admin-password-form">Salvar senha</button>
    `,
  });

  modal.querySelector('[data-back-profile]').addEventListener('click', openAdminProfileModal);
  modal.querySelector('#admin-password-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorBox = event.currentTarget.querySelector('[data-form-error]');
    const form = new FormData(event.currentTarget);
    const senhaAtual = String(form.get('senha_atual') || '');
    const novaSenha = String(form.get('nova_senha') || '');
    const confirmarSenha = String(form.get('confirmar_senha') || '');

    if (novaSenha !== confirmarSenha) {
      errorBox.textContent = 'A confirmacao da senha nao confere.';
      errorBox.hidden = false;
      return;
    }

    if (!user.id_cliente) {
      errorBox.textContent = 'Nao foi possivel identificar o usuario para alterar a senha.';
      errorBox.hidden = false;
      return;
    }

    try {
      await apiSend(`/clientes/${user.id_cliente}/senha`, {
        method: 'PATCH',
        body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha }),
      });
      showActionMessage('Senha atualizada com sucesso.');
      openAdminProfileModal();
    } catch (error) {
      console.error(error);
      errorBox.textContent = 'Nao foi possivel alterar a senha. Verifique a senha atual.';
      errorBox.hidden = false;
    }
  });
}

function bindAdminProfile() {
  updateAdminProfileUi();
  document.querySelectorAll('.user-pill').forEach((pill) => {
    pill.addEventListener('click', openAdminProfileModal);
    pill.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openAdminProfileModal();
      }
    });
  });
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return shortDate.format(new Date(`${value}T00:00:00`)).replace('.', '');
}

function formatTimeRange(entrada, saida) {
  const start = new Date(entrada);
  const end = new Date(saida);
  const format = (date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${format(start)} - ${format(end)}`;
}

function normalize(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function cleanRoomType(tipo = '') {
  const value = tipo.replace(/^\d+\s*/, '');
  const aliases = {
    'Mesa de Trabalho': 'Hot Desk',
    'Sala Individual': 'Privativa',
    'Sala de Atendimento': 'Sala de atendimento',
    'Sala de Reunião': 'Sala de reunião',
  };
  return aliases[value] || value;
}

function pillForPlan(name = '') {
  const normalized = normalize(name);
  if (normalized.includes('office')) return 'pill--solid';
  if (normalized.includes('dedicated')) return 'pill--neutral';
  if (normalized.includes('flex')) return 'pill--ok';
  return 'pill--soft';
}

function statusLabel(status) {
  const labels = {
    Ativa: 'Ativo',
    Vencida: 'Pendente',
    Cancelada: 'Inativo',
  };
  return labels[status] || status || 'Sem assinatura';
}

function statusDot(status) {
  if (status === 'Ativa') return 'dot--ok';
  if (status === 'Vencida') return 'dot--warn';
  return 'dot--bad';
}

function reservationPill(status) {
  if (status === 'Cancelada') return 'pill--bad';
  if (status === 'Em Andamento') return 'pill--warn';
  return 'pill--ok';
}

function roomStatus(room) {
  const status = normalize(room.status_operacional || '');
  const description = normalize(room.descricao || '');
  if (status.includes('indisponivel')) return { label: 'Indisponível', className: 'pill--warn' };
  if (!room.ativa || status.includes('manutencao') || description.includes('manutencao')) return { label: 'Manutenção', className: 'pill--warn' };
  if (status.includes('ocupada') || description.includes('ocupada')) return { label: 'Ocupada', className: 'pill--solid' };
  return { label: 'Disponível', className: 'pill--green' };
}

function roomPrice(room) {
  if (room.valor_hora !== null && room.valor_hora !== undefined && Number(room.valor_hora) > 0) {
    return `${money.format(Number(room.valor_hora))}/h`;
  }
  const match = (room.descricao || '').match(/R\$\s?[\d.,]+\/(?:h|dia|mês|mes)/i);
  return match ? match[0].replace('/mes', '/mês') : 'Sob consulta';
}

function roomFloor(room) {
  if (room.andar) return room.andar;
  const match = (room.descricao || '').match(/(?:no|na)\s([^.]*(?:andar|térreo|terreo))/i);
  return match ? match[1].replace('terreo', 'térreo') : 'Sem local';
}

function roomPhotos(room) {
  return Array.isArray(room?.fotos) ? room.fotos.filter(Boolean).slice(0, 5) : [];
}

function placeholderRoomPhoto(room) {
  const label = encodeURIComponent(room?.nome || 'Sala');
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 260'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23C9D6DF'/%3E%3Cstop offset='1' stop-color='%231F3A57'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='260' fill='url(%23g)'/%3E%3Crect x='60' y='145' width='120' height='70' rx='8' fill='%230A1F33' opacity='.45'/%3E%3Crect x='210' y='105' width='150' height='110' rx='8' fill='%230A1F33' opacity='.55'/%3E%3Crect x='390' y='130' width='110' height='85' rx='8' fill='%23E8EEF2' opacity='.35'/%3E%3Ctext x='42' y='58' fill='%23FFFFFF' font-family='Arial' font-size='26' font-weight='700'%3E${label}%3C/text%3E%3C/svg%3E`;
}

function roomPhotoSrc(room) {
  const photo = roomPhotos(room)[0];
  if (!photo || photo.startsWith('room-photo:')) {
    return placeholderRoomPhoto(room);
  }
  return photo;
}

function planById(planos) {
  return new Map(planos.map((plano) => [plano.id_plano, plano]));
}

function clienteById(clientes) {
  return new Map(clientes.map((cliente) => [cliente.id_cliente, cliente]));
}

function salaById(salas) {
  return new Map(salas.map((sala) => [sala.id_sala, sala]));
}

function latestSubscriptionByClient(assinaturas) {
  const map = new Map();

  assinaturas.forEach((assinatura) => {
    const current = map.get(assinatura.id_cliente);
    if (!current || assinatura.id_assinatura > current.id_assinatura) {
      map.set(assinatura.id_cliente, assinatura);
    }
  });

  return map;
}

function updateText(elements, values) {
  elements.forEach((element, index) => {
    if (values[index] !== undefined) {
      element.textContent = values[index];
    }
  });
}

function showLoadError(error) {
  console.error(error);
  const pageBody = document.querySelector('.page-body');

  if (!pageBody) {
    return;
  }

  const message = document.createElement('div');
  message.className = 'card center mb-16';
  message.textContent = 'Não foi possível carregar os dados da API. Verifique se a API está rodando na porta 8000.';
  pageBody.prepend(message);
}

function showActionMessage(text) {
  const pageBody = document.querySelector('.page-body');
  if (!pageBody) return;

  const previous = pageBody.querySelector('.js-action-message');
  previous?.remove();

  const message = document.createElement('div');
  message.className = 'card center mb-16 js-action-message';
  message.textContent = text;
  pageBody.prepend(message);

  window.setTimeout(() => message.remove(), 5000);
}

function closeModal() {
  document.querySelector('.modal-backdrop')?.remove();
}

function openModal({ title, subtitle = '', body, actions }) {
  closeModal();

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-head">
        <div>
          <div class="modal-title" id="modal-title">${escapeHtml(title)}</div>
          ${subtitle ? `<div class="modal-sub">${escapeHtml(subtitle)}</div>` : ''}
        </div>
        <button class="modal-close" type="button" data-modal-close>x</button>
      </div>
      <div class="modal-body">${body}</div>
      <div class="modal-actions">${actions}</div>
    </div>
  `;

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop || event.target.closest('[data-modal-close]')) {
      closeModal();
    }
  });

  document.body.appendChild(backdrop);
  return backdrop;
}

function csvValue(value) {
  return `"${(value ?? '').toString().replace(/"/g, '""')}"`;
}
