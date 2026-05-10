const API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:8001/api';
const currentPage = document.body.dataset.page;
const PLAN_DRAFT_STORAGE_KEY = 'axisWork.planDraft';
const pageState = {
  clientes: [],
  salas: [],
  planos: [],
  assinaturas: [],
  reservas: [],
  avaliacoes: [],
  planDraft: readPlanDraft(),
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

async function apiGet(path) {
  const response = await fetch(apiUrl(path));

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}: ${response.status}`);
  }

  return response.json();
}

async function apiSend(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
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
  message.textContent = 'Não foi possível carregar os dados da API. Verifique se a API está rodando na porta 8001.';
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

function getReviewById(id) {
  return pageState.avaliacoes.find((review) => String(review.id_avaliacao) === String(id));
}

async function refreshReviews() {
  const [avaliacoes, reservas, salas] = await Promise.all([
    apiGet('/avaliacoes'),
    apiGet('/reservas?limit=100'),
    apiGet('/salas'),
  ]);
  renderReviews({ avaliacoes, reservas, salas });
}

function getRoomById(id) {
  return pageState.salas.find((sala) => String(sala.id_sala) === String(id));
}

async function refreshRooms() {
  const salas = await apiGet('/salas');
  renderRooms({ salas });
}

function getUserById(id) {
  return pageState.clientes.find((cliente) => String(cliente.id_cliente) === String(id));
}

async function refreshUsers() {
  const [clientes, planos, assinaturas] = await Promise.all([
    apiGet('/clientes'),
    apiGet('/planos'),
    apiGet('/assinaturas'),
  ]);
  renderUsers({ clientes, planos, assinaturas });
}

function userSubscription(cliente) {
  return latestSubscriptionByClient(pageState.assinaturas).get(cliente?.id_cliente);
}

function userPlan(cliente) {
  const assinatura = userSubscription(cliente);
  return planById(pageState.planos).get(assinatura?.id_plano);
}

function userStatus(cliente, assinatura = userSubscription(cliente)) {
  if (!cliente?.ativo) {
    return { label: 'Desabilitado', dot: 'dot--bad', key: 'disabled' };
  }
  if (!assinatura || !assinatura.id_plano) {
    return { label: 'Sem plano', dot: 'dot--warn', key: 'no_plan' };
  }

  const statuses = {
    Ativa: { label: 'Ativo', dot: 'dot--ok', key: 'active' },
    Pendente: { label: 'Pendente', dot: 'dot--warn', key: 'pending' },
    Suspensa: { label: 'Suspenso', dot: 'dot--warn', key: 'suspended' },
    Vencida: { label: 'Vencido', dot: 'dot--warn', key: 'expired' },
    Cancelada: { label: 'Cancelado', dot: 'dot--bad', key: 'cancelled' },
  };

  if (statuses[assinatura.status]) {
    return statuses[assinatura.status];
  }

  return { label: assinatura.status || 'Pendente', dot: 'dot--warn', key: 'pending' };
}

function userAvatar(cliente, className = 'avatar-sm') {
  if (cliente?.foto_perfil) {
    return `<img class="${className} avatar-photo" alt="${escapeHtml(cliente.nome)}" src="${escapeHtml(cliente.foto_perfil)}" />`;
  }
  return `<div class="${className}">${escapeHtml(initials(cliente?.nome || ''))}</div>`;
}

function userFormBody(cliente = null) {
  return `
    <label>
      <div class="field-label">Nome</div>
      <input class="field-input" name="nome" value="${escapeHtml(cliente?.nome || '')}" maxlength="50" required />
    </label>
    <div class="form-grid-2">
      <label>
        <div class="field-label">CPF</div>
        <input class="field-input" name="cpf" value="${escapeHtml(cliente?.cpf || '')}" minlength="11" maxlength="11" required />
      </label>
      <label>
        <div class="field-label">Telefone</div>
        <input class="field-input" name="telefone" value="${escapeHtml(cliente?.telefone || '')}" maxlength="11" />
      </label>
    </div>
    <label>
      <div class="field-label">E-mail</div>
      <input class="field-input" name="email" type="email" value="${escapeHtml(cliente?.email || '')}" maxlength="100" required />
    </label>
    <label>
      <div class="field-label">${cliente ? 'Nova senha' : 'Senha'}</div>
      <input class="field-input" name="senha" type="password" ${cliente ? 'placeholder="Deixe em branco para manter"' : 'required'} />
    </label>
    <label class="toggle-field">
      <input type="checkbox" name="ativo"${cliente?.ativo === false ? '' : ' checked'} />
      <span>Usuário habilitado</span>
    </label>
  `;
}

function userPayloadFromForm(formElement, cliente = null) {
  const form = new FormData(formElement);
  const payload = {
    nome: String(form.get('nome') || '').trim(),
    cpf: String(form.get('cpf') || '').replace(/\D/g, ''),
    email: String(form.get('email') || '').trim(),
    telefone: String(form.get('telefone') || '').replace(/\D/g, '') || null,
    ativo: Boolean(form.get('ativo')),
  };
  const senha = String(form.get('senha') || '');
  if (senha || !cliente) {
    payload.senha = senha;
  }
  return payload;
}

function validateUserPayload(payload, isEdit) {
  if (!payload.nome || payload.cpf.length !== 11 || !payload.email) {
    return 'Preencha nome, CPF e e-mail do usuário.';
  }
  if (!isEdit && !payload.senha) {
    return 'Informe uma senha para o novo usuário.';
  }
  return '';
}

function userFormBody(cliente = null) {
  const assinatura = userSubscription(cliente);
  const currentStatus = assinatura?.status || 'Ativa';
  const currentPlan = assinatura?.id_plano || '';
  const currentPhoto = cliente?.foto_perfil || '';

  return `
    <div class="profile-photo-field">
      <div class="profile-photo-preview" data-user-photo-preview>
        ${currentPhoto ? `<img alt="${escapeHtml(cliente?.nome || 'Foto de perfil')}" src="${escapeHtml(currentPhoto)}" />` : userAvatar(cliente || { nome: 'Novo usuário' }, 'avatar-sm')}
      </div>
      <label>
        <div class="field-label">Foto de perfil opcional</div>
        <input class="field-input" type="file" name="foto_perfil" accept="image/*" />
      </label>
    </div>
    ${currentPhoto ? `
      <label class="toggle-field">
        <input type="checkbox" name="remover_foto" />
        <span>Remover foto atual</span>
      </label>
    ` : ''}
    <label>
      <div class="field-label">Nome</div>
      <input class="field-input" name="nome" value="${escapeHtml(cliente?.nome || '')}" maxlength="50" required />
    </label>
    <div class="form-grid-2">
      <label>
        <div class="field-label">CPF</div>
        <input class="field-input" name="cpf" value="${escapeHtml(cliente?.cpf || '')}" minlength="11" maxlength="11" required />
      </label>
      <label>
        <div class="field-label">Telefone</div>
        <input class="field-input" name="telefone" value="${escapeHtml(cliente?.telefone || '')}" maxlength="11" />
      </label>
    </div>
    <label>
      <div class="field-label">E-mail</div>
      <input class="field-input" name="email" type="email" value="${escapeHtml(cliente?.email || '')}" maxlength="100" required />
    </label>
    <label>
      <div class="field-label">${cliente ? 'Nova senha' : 'Senha'}</div>
      <input class="field-input" name="senha" type="password" ${cliente ? 'placeholder="Deixe em branco para manter"' : 'required'} />
    </label>
    <div class="form-grid-2">
      <label>
        <div class="field-label">Plano do usuário</div>
        <select class="field-select" name="id_plano">
          <option value="">Sem plano</option>
          ${pageState.planos.map((plano) => `<option value="${plano.id_plano}"${String(plano.id_plano) === String(currentPlan) ? ' selected' : ''}>${escapeHtml(plano.nome)}</option>`).join('')}
        </select>
      </label>
      <label>
        <div class="field-label">Status do plano</div>
        <select class="field-select" name="status_assinatura">
          ${USER_SUBSCRIPTION_STATUS_OPTIONS.map(([value, label]) => `<option value="${value}"${value === currentStatus ? ' selected' : ''}>${label}</option>`).join('')}
        </select>
      </label>
    </div>
    <label>
      <div class="field-label">Validade do plano</div>
      <input class="field-input" name="validade" type="date" value="${escapeHtml(assinatura?.validade || '')}" />
    </label>
    <label class="toggle-field">
      <input type="checkbox" name="ativo"${cliente?.ativo === false ? '' : ' checked'} />
      <span>Usuário habilitado</span>
    </label>
  `;
}

async function userPayloadFromForm(formElement, cliente = null) {
  const form = new FormData(formElement);
  const files = Array.from(formElement.querySelector('input[name="foto_perfil"]')?.files || []);
  const fotoPerfil = files.length ? (await readFilesAsDataUrls(files.slice(0, 1)))[0] : cliente?.foto_perfil || null;
  const payload = {
    nome: String(form.get('nome') || '').trim(),
    cpf: String(form.get('cpf') || '').replace(/\D/g, ''),
    email: String(form.get('email') || '').trim(),
    telefone: String(form.get('telefone') || '').replace(/\D/g, '') || null,
    ativo: Boolean(form.get('ativo')),
    foto_perfil: form.get('remover_foto') ? null : fotoPerfil,
  };
  const senha = String(form.get('senha') || '');
  if (senha || !cliente) {
    payload.senha = senha;
  }
  return {
    cliente: payload,
    assinatura: {
      id_plano: String(form.get('id_plano') || ''),
      status: String(form.get('status_assinatura') || 'Ativa'),
      validade: String(form.get('validade') || ''),
    },
  };
}

function validateUserPayload(payload, isEdit) {
  if (!payload.cliente.nome || payload.cliente.cpf.length !== 11 || !payload.cliente.email) {
    return 'Preencha nome, CPF e e-mail do usuário.';
  }
  if (!isEdit && !payload.cliente.senha) {
    return 'Informe uma senha para o novo usuário.';
  }
  return '';
}

async function syncUserSubscription(idCliente, assinaturaForm) {
  const assinaturaAtual = latestSubscriptionByClient(pageState.assinaturas).get(idCliente);
  const idPlano = assinaturaForm.id_plano ? Number(assinaturaForm.id_plano) : null;
  const validade = assinaturaForm.validade || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  if (!idPlano) {
    if (assinaturaAtual) {
      await apiSend(`/assinaturas/${assinaturaAtual.id_assinatura}`, {
        method: 'PUT',
        body: JSON.stringify({ id_plano: null, status: 'Cancelada', validade }),
      });
    }
    return;
  }

  const payload = {
    id_plano: idPlano,
    status: assinaturaForm.status,
    validade,
  };

  if (assinaturaAtual) {
    await apiSend(`/assinaturas/${assinaturaAtual.id_assinatura}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return;
  }

  await apiSend('/assinaturas', {
    method: 'POST',
    body: JSON.stringify({ id_cliente: idCliente, ...payload }),
  });
}

function openUserFormModal(cliente = null) {
  const isEdit = Boolean(cliente?.id_cliente);
  const modal = openModal({
    title: isEdit ? 'Editar usuário' : 'Novo usuário',
    subtitle: isEdit ? 'Atualize os dados cadastrais e o acesso do usuário.' : 'Cadastre um novo membro do coworking.',
    body: `<form id="user-form" class="modal-body">${userFormBody(cliente)}</form>`,
    actions: `
      <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
      <button class="btn btn--primary" type="submit" form="user-form">${isEdit ? 'Salvar alterações' : 'Criar usuário'}</button>
    `,
  });

  modal.querySelector('input[name="foto_perfil"]')?.addEventListener('change', async (event) => {
    const file = event.currentTarget.files?.[0];
    const preview = modal.querySelector('[data-user-photo-preview]');
    if (!file || !preview) return;
    const [photo] = await readFilesAsDataUrls([file]);
    preview.innerHTML = `<img alt="Foto de perfil" src="${escapeHtml(photo)}" />`;
  });

  modal.querySelector('#user-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = await userPayloadFromForm(event.currentTarget, cliente);
    const validationMessage = validateUserPayload(payload, isEdit);
    if (validationMessage) {
      showActionMessage(validationMessage);
      return;
    }

    try {
      const usuarioSalvo = await apiSend(isEdit ? `/clientes/${cliente.id_cliente}` : '/clientes', {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload.cliente),
      });
      await syncUserSubscription(usuarioSalvo.id_cliente, payload.assinatura);
      closeModal();
      await refreshUsers();
      showActionMessage(isEdit ? 'Usuário atualizado com sucesso.' : 'Usuário criado com sucesso.');
    } catch (error) {
      console.error(error);
      showActionMessage('Não foi possível salvar o usuário. Verifique CPF e e-mail.');
    }
  });
}

function openUserDetailsModal(cliente) {
  if (!cliente) return;
  const assinatura = userSubscription(cliente);
  const plano = userPlan(cliente);
  const status = userStatus(cliente, assinatura);
  const modal = openModal({
    title: cliente.nome,
    subtitle: 'Informações do usuário selecionado.',
    body: `
      <div class="user-profile-card">
        ${userAvatar(cliente)}
        <div>
          <b>${escapeHtml(cliente.nome)}</b>
          <small>${escapeHtml(cliente.email)}</small>
        </div>
      </div>
      <div class="report-grid">
        <div class="report-card"><span>CPF</span><b>${escapeHtml(cliente.cpf)}</b></div>
        <div class="report-card"><span>Telefone</span><b>${escapeHtml(cliente.telefone || '-')}</b></div>
        <div class="report-card"><span>Plano</span><b>${escapeHtml(plano?.nome || 'Sem plano')}</b></div>
        <div class="report-card"><span>Status</span><b>${status.label}</b></div>
        <div class="report-card"><span>Validade</span><b>${formatDate(assinatura?.validade)}</b></div>
        <div class="report-card"><span>Conta</span><b>${cliente.ativo ? 'Habilitada' : 'Desabilitada'}</b></div>
      </div>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-user-edit>Editar</button>
      <button class="btn btn--primary" type="button" data-modal-close>Fechar</button>
    `,
  });
  modal.querySelector('[data-user-edit]').addEventListener('click', () => openUserFormModal(cliente));
}

function openDeleteUserModal(cliente) {
  if (!cliente) return;
  const modal = openModal({
    title: 'Excluir usuário',
    subtitle: 'Reservas e assinaturas antigas serão preservadas sem usuário vinculado.',
    body: `<p class="modal-copy">Deseja excluir <b>${escapeHtml(cliente.nome)}</b>?</p>`,
    actions: `
      <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
      <button class="btn btn--primary" type="button" data-confirm-delete-user>Excluir</button>
    `,
  });

  modal.querySelector('[data-confirm-delete-user]').addEventListener('click', async () => {
    try {
      await apiSend(`/clientes/${cliente.id_cliente}`, { method: 'DELETE' });
      closeModal();
      await refreshUsers();
      showActionMessage('Usuário excluído com sucesso.');
    } catch (error) {
      console.error(error);
      showActionMessage('Não foi possível excluir o usuário.');
    }
  });
}

async function toggleUserStatus(cliente) {
  if (!cliente) return;
  try {
    await apiSend(`/clientes/${cliente.id_cliente}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ ativo: !cliente.ativo }),
    });
    await refreshUsers();
    showActionMessage(cliente.ativo ? 'Usuário desabilitado.' : 'Usuário habilitado.');
  } catch (error) {
    console.error(error);
    showActionMessage('Não foi possível alterar o status do usuário.');
  }
}

function roomFormBody(room) {
  const tipo = room?.tipo || '4 Sala de Reunião';
  const status = room?.status_operacional || (room?.ativa === false ? 'Manutenção' : 'Disponível');
  const fotos = roomPhotos(room);
  const tipos = ['1 Mesa de Trabalho', '2 Sala Individual', '3 Sala de Atendimento', '4 Sala de Reunião'];
  const statuses = ['Disponível', 'Ocupada', 'Manutenção', 'Indisponível'];

  return `
    <label>
      <div class="field-label">Nome da sala</div>
      <input class="field-input" name="nome" value="${escapeHtml(room?.nome || '')}" maxlength="50" required />
    </label>
    <div class="form-grid-2">
      <label>
        <div class="field-label">Capacidade</div>
        <input class="field-input" name="capacidade" type="number" min="1" step="1" value="${Number(room?.capacidade || 1)}" required />
      </label>
      <label>
        <div class="field-label">Valor por hora</div>
        <input class="field-input" name="valor_hora" type="number" min="0" step="0.01" value="${Number(room?.valor_hora || 0)}" required />
      </label>
    </div>
    <label>
      <div class="field-label">Tipo do espaço</div>
      <select class="field-select" name="tipo" required>
        ${tipos.map((option) => `<option value="${escapeHtml(option)}"${option === tipo ? ' selected' : ''}>${escapeHtml(option)}</option>`).join('')}
      </select>
    </label>
    <div class="form-grid-2">
      <label>
        <div class="field-label">Ambiente</div>
        <input class="field-input" name="ambiente" value="${escapeHtml(room?.ambiente || '')}" placeholder="Ex: Sala executiva" />
      </label>
      <label>
        <div class="field-label">Andar/local</div>
        <input class="field-input" name="andar" value="${escapeHtml(room?.andar || roomFloor(room || {}))}" placeholder="Ex: 2º andar" />
      </label>
    </div>
    <label>
      <div class="field-label">Status</div>
      <select class="field-select" name="status_operacional" required>
        ${statuses.map((option) => `<option value="${escapeHtml(option)}"${option === status ? ' selected' : ''}>${escapeHtml(option)}</option>`).join('')}
      </select>
    </label>
    <label>
      <div class="field-label">Recursos</div>
      <input class="field-input" name="recursos" value="${escapeHtml(room?.recursos || '')}" placeholder="Wifi, monitor, café..." />
    </label>
    <label>
      <div class="field-label">Descrição</div>
      <textarea class="field-textarea field-textarea--sm" name="descricao" maxlength="280">${escapeHtml(room?.descricao || '')}</textarea>
    </label>
    <div>
      <div class="field-label">Fotos da sala</div>
      <input class="field-input" name="fotos" type="file" accept="image/*" multiple />
      <div class="modal-sub">Adicione de 1 a 5 fotos. Novos arquivos substituem as fotos atuais ao salvar.</div>
      <div class="photo-preview" data-room-photo-preview>
        ${fotos.map((foto, index) => `<img alt="Foto ${index + 1}" src="${escapeHtml(foto.startsWith('room-photo:') ? placeholderRoomPhoto(room) : foto)}" />`).join('')}
      </div>
    </div>
  `;
}

function readFilesAsDataUrls(files) {
  return Promise.all(files.map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })));
}

async function roomPayloadFromForm(formElement, existingRoom = null) {
  const form = new FormData(formElement);
  const status = String(form.get('status_operacional') || 'Disponível');
  const files = Array.from(formElement.querySelector('input[name="fotos"]')?.files || []);
  const fotos = files.length ? await readFilesAsDataUrls(files.slice(0, 5)) : roomPhotos(existingRoom);

  return {
    nome: String(form.get('nome') || '').trim(),
    capacidade: Number(form.get('capacidade')),
    tipo: form.get('tipo'),
    descricao: String(form.get('descricao') || '').trim(),
    recursos: String(form.get('recursos') || '').trim(),
    ambiente: String(form.get('ambiente') || '').trim(),
    andar: String(form.get('andar') || '').trim(),
    valor_hora: Number(form.get('valor_hora')),
    status_operacional: status,
    fotos,
    ativa: !['Manutenção', 'Indisponível'].includes(status),
    criado_em: new Date().toISOString().slice(0, 10),
  };
}

function validateRoomPayload(payload) {
  if (!payload.nome || !payload.tipo || !Number.isFinite(payload.capacidade) || payload.capacidade <= 0) {
    return 'Preencha nome, tipo e capacidade da sala.';
  }
  if (!Number.isFinite(payload.valor_hora) || payload.valor_hora < 0) {
    return 'Informe um valor por hora válido.';
  }
  if (!Array.isArray(payload.fotos) || payload.fotos.length < 1 || payload.fotos.length > 5) {
    return 'Adicione no mínimo 1 e no máximo 5 fotos da sala.';
  }
  return '';
}

function openRoomFormModal(room = null) {
  const isEdit = Boolean(room?.id_sala);
  const modal = openModal({
    title: isEdit ? 'Editar sala' : 'Nova sala',
    subtitle: isEdit ? 'Atualize ambiente, preço, capacidade e disponibilidade.' : 'Cadastre um espaço disponível para reservas.',
    body: `<form id="room-form" class="modal-body">${roomFormBody(room)}</form>`,
    actions: `
      <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
      <button class="btn btn--primary" type="submit" form="room-form">${isEdit ? 'Salvar alterações' : 'Criar sala'}</button>
    `,
  });

  const formElement = modal.querySelector('#room-form');
  const fileInput = formElement.querySelector('input[name="fotos"]');
  const preview = formElement.querySelector('[data-room-photo-preview]');

  fileInput?.addEventListener('change', async () => {
    const files = Array.from(fileInput.files || []);
    if (files.length > 5) {
      showActionMessage('Selecione no máximo 5 fotos.');
      fileInput.value = '';
      return;
    }
    const photos = await readFilesAsDataUrls(files);
    if (preview) {
      preview.innerHTML = photos.map((foto, index) => `<img alt="Foto ${index + 1}" src="${escapeHtml(foto)}" />`).join('');
    }
  });

  formElement.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = await roomPayloadFromForm(event.currentTarget, room);
    if (isEdit) {
      payload.criado_em = room.criado_em;
    }

    const validationMessage = validateRoomPayload(payload);
    if (validationMessage) {
      showActionMessage(validationMessage);
      return;
    }

    try {
      await apiSend(isEdit ? `/salas/${room.id_sala}` : '/salas', {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      closeModal();
      await refreshRooms();
      showActionMessage(isEdit ? 'Sala atualizada com sucesso.' : 'Sala criada com sucesso.');
    } catch (error) {
      console.error(error);
      showActionMessage('Não foi possível salvar a sala.');
    }
  });
}

function openDeleteRoomModal(room) {
  if (!room) return;

  const modal = openModal({
    title: 'Excluir sala',
    subtitle: 'As reservas antigas serão preservadas sem sala vinculada.',
    body: `
      <p class="modal-copy">Deseja excluir <b>${escapeHtml(room.nome)}</b>?</p>
      <div class="report-card"><span>Capacidade</span><b>${room.capacidade} pessoas</b></div>
      <div class="report-card"><span>Valor por hora</span><b>${roomPrice(room)}</b></div>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
      <button class="btn btn--primary" type="button" data-confirm-delete-room>Excluir</button>
    `,
  });

  modal.querySelector('[data-confirm-delete-room]').addEventListener('click', async () => {
    try {
      await apiSend(`/salas/${room.id_sala}`, { method: 'DELETE' });
      closeModal();
      await refreshRooms();
      showActionMessage('Sala excluída com sucesso.');
    } catch (error) {
      console.error(error);
      showActionMessage('Não foi possível excluir a sala.');
    }
  });
}

function getPlanById(id) {
  return pageState.planos.find((plano) => String(plano.id_plano) === String(id));
}

async function refreshPlans() {
  const [planos, assinaturas] = await Promise.all([
    apiGet('/planos'),
    apiGet('/assinaturas'),
  ]);
  renderPlans({ planos, assinaturas });
}

function planRevenueRows() {
  return pageState.planos
    .map((plano) => {
      const membros = pageState.assinaturas.filter(
        (assinatura) => assinatura.status === 'Ativa' && assinatura.id_plano === plano.id_plano,
      ).length;
      const receita = membros * Number(plano.preco || 0);
      return { plano, membros, receita };
    })
    .sort((a, b) => b.receita - a.receita);
}

function normalizePlanBenefits(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function uniqueBenefits(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalize(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function readPlanDraft() {
  try {
    return JSON.parse(localStorage.getItem(PLAN_DRAFT_STORAGE_KEY) || 'null');
  } catch (error) {
    console.error(error);
    return null;
  }
}

function persistPlanDraft(draft) {
  pageState.planDraft = draft;
  if (draft) {
    localStorage.setItem(PLAN_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } else {
    localStorage.removeItem(PLAN_DRAFT_STORAGE_KEY);
  }
  renderPlanDraftCard();
}

function planPayloadFromForm(formElement) {
  const form = new FormData(formElement);
  const selectedBenefits = Array.from(formElement.querySelectorAll('input[name="beneficios"]:checked'))
    .map((input) => input.value);
  const customBenefits = String(form.get('beneficios_livres') || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    nome: String(form.get('nome') || '').trim(),
    acesso: form.get('acesso'),
    preco: Number(form.get('preco')),
    descricao: String(form.get('descricao') || '').trim(),
    beneficios: uniqueBenefits([...selectedBenefits, ...customBenefits]),
  };
}

function validatePlanPayload(payload) {
  if (!payload.nome || !payload.acesso || !Number.isFinite(payload.preco) || payload.preco <= 0 || !payload.descricao) {
    return 'Preencha nome, acesso, preco e descricao do plano.';
  }
  if (!payload.beneficios.length) {
    return 'Selecione ou escreva pelo menos um beneficio.';
  }
  return '';
}

function normalizePlanDraftPayload(plano = {}) {
  return {
    nome: String(plano.nome || '').trim(),
    acesso: plano.acesso || '1 Mesa de Trabalho',
    preco: Number(plano.preco || 0),
    descricao: String(plano.descricao || planDescription(plano.nome || '') || '').trim(),
    beneficios: uniqueBenefits(normalizePlanBenefits(plano.beneficios || planFeatures(plano.nome || ''))),
  };
}

function isEmptyNewPlanDraft(payload) {
  return (
    !payload.nome
    && Number(payload.preco || 0) <= 0
    && !payload.descricao
    && !payload.beneficios.length
  );
}

function renderPlanDraftCard() {
  const card = document.querySelector('[data-plan-draft-card]') || document.querySelector('.page[data-page="plans"] .promo-row')?.closest('.card');
  if (!card) return;

  const draft = pageState.planDraft;
  card.hidden = !draft;
  if (!draft) return;

  const title = card.querySelector('[data-plan-draft-title]') || card.querySelector('.promo-row div[style*="font-size:13px"]');
  const meta = card.querySelector('[data-plan-draft-meta]') || card.querySelector('.promo-row div[style*="font-size:11px"]');
  const buttons = card.querySelectorAll('.promo-row .btn');
  const payload = draft.payload || {};
  const updatedAt = draft.updatedAt ? formatDate(String(draft.updatedAt).slice(0, 10)) : 'agora';

  if (title) {
    title.textContent = `${draft.mode === 'edit' ? 'Edicao nao salva' : 'Novo plano nao salvo'}: ${payload.nome || 'Sem nome'}`;
  }
  if (meta) {
    meta.textContent = `Alterado em ${updatedAt}. Continue a edicao ou salve para finalizar.`;
  }
  if (buttons[1]) {
    buttons[1].innerHTML = `${icon('icon-check', 13)}Salvar`;
  }
}

async function savePlanDraft() {
  const draft = pageState.planDraft;
  if (!draft?.payload) return;

  const validationMessage = validatePlanPayload(draft.payload);
  if (validationMessage) {
    showActionMessage(validationMessage);
    openPlanFormModal({ id_plano: draft.id_plano, ...draft.payload });
    return;
  }

  const isEdit = draft.mode === 'edit' && draft.id_plano;
  try {
    await apiSend(isEdit ? `/planos/${draft.id_plano}` : '/planos', {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(draft.payload),
    });
    persistPlanDraft(null);
    await refreshPlans();
    showActionMessage(isEdit ? 'Plano atualizado com sucesso.' : 'Plano criado com sucesso.');
  } catch (error) {
    console.error(error);
    showActionMessage('Nao foi possivel salvar o rascunho do plano.');
  }
}

function planFormBody(plano) {
  const acesso = plano?.acesso || '1 Mesa de Trabalho';
  const selectedBenefits = normalizePlanBenefits(plano?.beneficios || planFeatures(plano?.nome || ''));
  const selectedKeys = new Set(selectedBenefits.map((benefit) => normalize(benefit)));
  const customBenefits = selectedBenefits.filter(
    (benefit) => !PLAN_BENEFIT_OPTIONS.some((option) => normalize(option) === normalize(benefit)),
  );
  const options = [
    '1 Mesa de Trabalho',
    '2 Sala Individual',
    '3 Sala de Atendimento',
    '4 Sala de Reuni\u00e3o',
  ];

  return `
    <label>
      <div class="field-label">Nome do plano</div>
      <input class="field-input" name="nome" value="${escapeHtml(plano?.nome || '')}" maxlength="50" required />
    </label>
    <label>
      <div class="field-label">Tipo de acesso</div>
      <select class="field-select" name="acesso" required>
        ${options.map((option) => `<option value="${escapeHtml(option)}"${option === acesso ? ' selected' : ''}>${escapeHtml(option)}</option>`).join('')}
      </select>
    </label>
    <label>
      <div class="field-label">Preco</div>
      <input class="field-input" name="preco" type="number" min="1" step="0.01" value="${Number(plano?.preco || 0)}" required />
    </label>
    <label>
      <div class="field-label">Descricao</div>
      <textarea class="field-textarea field-textarea--sm" name="descricao" maxlength="240" required>${escapeHtml(plano?.descricao || planDescription(plano?.nome || ''))}</textarea>
    </label>
    <div>
      <div class="field-label">Beneficios do plano</div>
      <div class="benefit-grid">
        ${PLAN_BENEFIT_OPTIONS.map((benefit) => `
          <label class="benefit-option">
            <input type="checkbox" name="beneficios" value="${escapeHtml(benefit)}"${selectedKeys.has(normalize(benefit)) ? ' checked' : ''} />
            <span>${escapeHtml(benefit)}</span>
          </label>
        `).join('')}
      </div>
    </div>
    <label>
      <div class="field-label">Beneficios livres</div>
      <textarea class="field-textarea field-textarea--sm" name="beneficios_livres" placeholder="Um beneficio por linha">${escapeHtml(customBenefits.join('\n'))}</textarea>
    </label>
  `;
}

function openPlanFormModal(plano = null) {
  const isEdit = Boolean(plano?.id_plano);
  const modal = openModal({
    title: isEdit ? 'Editar plano' : 'Novo plano',
    subtitle: isEdit ? 'Atualize os dados do plano selecionado.' : 'Crie um plano e publique na lista do site.',
    body: `<form id="plan-form" class="modal-body">${planFormBody(plano)}</form>`,
    actions: `
      <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
      <button class="btn btn--primary" type="submit" form="plan-form">${isEdit ? 'Salvar alteracoes' : 'Criar plano'}</button>
    `,
  });

  const formElement = modal.querySelector('#plan-form');
  const initialSnapshot = JSON.stringify(normalizePlanDraftPayload(plano || {}));

  formElement.addEventListener('input', () => {
    const payload = planPayloadFromForm(formElement);
    const draftSnapshot = JSON.stringify(payload);

    if ((!isEdit && isEmptyNewPlanDraft(payload)) || draftSnapshot === initialSnapshot) {
      persistPlanDraft(null);
      return;
    }

    persistPlanDraft({
      mode: isEdit ? 'edit' : 'create',
      id_plano: plano?.id_plano || null,
      payload,
      updatedAt: new Date().toISOString(),
    });
  });

  formElement.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = planPayloadFromForm(event.currentTarget);
    const validationMessage = validatePlanPayload(payload);

    if (validationMessage) {
      showActionMessage(validationMessage);
      return;
    }

    try {
      await apiSend(isEdit ? `/planos/${plano.id_plano}` : '/planos', {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      persistPlanDraft(null);
      closeModal();
      await refreshPlans();
      showActionMessage(isEdit ? 'Plano atualizado com sucesso.' : 'Plano criado com sucesso.');
    } catch (error) {
      console.error(error);
      showActionMessage('Nao foi possivel salvar o plano.');
    }
  });
}

function openDeletePlanModal(plano) {
  if (!plano) return;

  const membros = pageState.assinaturas.filter(
    (assinatura) => assinatura.status === 'Ativa' && assinatura.id_plano === plano.id_plano,
  ).length;

  const modal = openModal({
    title: 'Excluir plano',
    subtitle: 'As assinaturas vinculadas serao preservadas sem plano associado.',
    body: `
      <p class="modal-copy">Deseja excluir <b>${escapeHtml(plano.nome)}</b>?</p>
      <div class="report-card">
        <span>Membros ativos vinculados</span>
        <b>${membros}</b>
      </div>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
      <button class="btn btn--primary" type="button" data-confirm-delete-plano>Excluir</button>
    `,
  });

  modal.querySelector('[data-confirm-delete-plano]').addEventListener('click', async () => {
    try {
      await apiSend(`/planos/${plano.id_plano}`, { method: 'DELETE' });
      closeModal();
      await refreshPlans();
      showActionMessage('Plano excluido do banco de dados.');
    } catch (error) {
      console.error(error);
      showActionMessage('Nao foi possivel excluir o plano.');
    }
  });
}

function openPlanSettingsModal(plano) {
  if (!plano) return;
  const row = planRevenueRows().find((item) => item.plano.id_plano === plano.id_plano);
  const beneficios = normalizePlanBenefits(plano.beneficios || planFeatures(plano.nome));

  const modal = openModal({
    title: `Configuracoes de ${plano.nome}`,
    subtitle: 'Acoes rapidas para o plano selecionado.',
    body: `
      <div class="report-card"><span>Acesso</span><b>${escapeHtml(plano.acesso)}</b></div>
      <div class="report-card"><span>Preco</span><b>${money.format(Number(plano.preco || 0))}</b></div>
      <div class="report-card"><span>Receita atual</span><b>${money.format(row?.receita || 0)}</b></div>
      <div class="report-card"><span>Descricao</span><b>${escapeHtml(plano.descricao || planDescription(plano.nome))}</b></div>
      <div class="benefit-preview">
        ${beneficios.map((benefit) => `<span>${escapeHtml(benefit)}</span>`).join('')}
      </div>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-settings-report>Relatorio</button>
      <button class="btn btn--ghost" type="button" data-settings-edit>Editar</button>
      <button class="btn btn--primary" type="button" data-settings-delete>Excluir</button>
    `,
  });

  modal.querySelector('[data-settings-report]').addEventListener('click', openRevenueReportModal);
  modal.querySelector('[data-settings-edit]').addEventListener('click', () => openPlanFormModal(plano));
  modal.querySelector('[data-settings-delete]').addEventListener('click', () => openDeletePlanModal(plano));
}

function openRevenueReportModal() {
  const rows = planRevenueRows();
  const total = rows.reduce((sum, row) => sum + row.receita, 0);
  const top = rows.find((row) => row.receita > 0) || rows[0];
  const projections = [1, 2, 3].map((offset) => {
    const date = new Date();
    date.setMonth(date.getMonth() + offset);
    return {
      label: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      valor: total * (1.05 ** offset),
    };
  });

  openModal({
    title: 'Relatorio de receita',
    subtitle: 'Baseado nas assinaturas ativas e em crescimento estimado de 5% ao mes.',
    body: `
      <div class="report-grid">
        <div class="report-card"><span>Receita mensal atual</span><b>${money.format(total)}</b></div>
        <div class="report-card"><span>Plano mais rentavel</span><b>${escapeHtml(top?.plano.nome || '-')}</b></div>
      </div>
      <div class="report-list">
        ${rows.map((row, index) => `
          <div class="report-row">
            <span>${index + 1}. ${escapeHtml(row.plano.nome)}<small>${row.membros} membros ativos</small></span>
            <b>${money.format(row.receita)}</b>
          </div>
        `).join('')}
      </div>
      <div class="report-list">
        ${projections.map((projection) => `
          <div class="report-row">
            <span>${escapeHtml(projection.label)}</span>
            <b>${money.format(projection.valor)}</b>
          </div>
        `).join('')}
      </div>
    `,
    actions: '<button class="btn btn--primary" type="button" data-modal-close>Fechar</button>',
  });
}

async function publishWeekendPass() {
  try {
    const existing = pageState.planos.find((plano) => normalize(plano.nome) === 'weekend pass');
    if (existing) {
      openPlanFormModal(existing);
      return;
    }

    await apiSend('/planos', {
      method: 'POST',
      body: JSON.stringify({
        nome: 'Weekend Pass',
        acesso: '1 Mesa de Trabalho',
        preco: 120,
        descricao: 'Acesso de fim de semana para uso pontual da estrutura compartilhada.',
        beneficios: ['Hot Desk por 8h', 'Café e wifi', 'Eventos da comunidade'],
      }),
    });
    await refreshPlans();
    showActionMessage('Weekend Pass publicado como novo plano.');
  } catch (error) {
    console.error(error);
    showActionMessage('Nao foi possivel publicar o rascunho.');
  }
}

function bindStaticControls() {
  document.querySelectorAll('.nav a[data-page]').forEach((link) => {
    link.classList.toggle('is-active', link.dataset.page === currentPage);
  });

  document.querySelectorAll('.type-tabs').forEach((tabs) => {
    tabs.addEventListener('click', (event) => {
      const tab = event.target.closest('.type-tab');
      if (!tab) return;

      tabs.querySelectorAll('.type-tab').forEach((item) => {
        item.classList.toggle('is-active', item === tab);
      });

      if (currentPage === 'rooms') {
        renderRooms({ salas: pageState.salas });
      }
    });
  });

  document.querySelectorAll('.view-toggle').forEach((toggle) => {
    toggle.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      toggle.querySelectorAll('button').forEach((item) => {
        item.classList.toggle('is-active', item === button);
      });
    });
  });
}

function bindSearchControls() {
  const usersSearch = document.querySelector('.page[data-page="users"] .toolbar .search-mini input');
  usersSearch?.addEventListener('input', () => {
    pageState.userPagination.page = 1;
    renderUsers({
      clientes: pageState.clientes,
      planos: pageState.planos,
      assinaturas: pageState.assinaturas,
    });
  });

  if (currentPage === 'users') {
    const inviteButton = document.querySelector('.page[data-page="users"] .page-header .btn--ghost');
    const newUserButton = document.querySelector('.page[data-page="users"] .page-header .btn--primary');
    const filterIconButton = document.querySelector('.page[data-page="users"] .toolbar .icon-btn');

    inviteButton?.addEventListener('click', () => openUserFormModal());
    newUserButton?.addEventListener('click', () => openUserFormModal());
    filterIconButton?.addEventListener('click', openUserFiltersModal);
  }

  const roomsSearch = document.querySelector('.page[data-page="rooms"] .search-mini input');
  roomsSearch?.addEventListener('input', () => {
    renderRooms({ salas: pageState.salas });
  });

  if (currentPage === 'rooms') {
    const exportButton = document.querySelector('.page[data-page="rooms"] .page-header .btn--ghost');
    const newRoomButton = document.querySelector('.page[data-page="rooms"] .page-header .btn--primary');
    exportButton?.addEventListener('click', exportRoomsCsv);
    newRoomButton?.addEventListener('click', () => openRoomFormModal());
  }

  const reviewsSearch = document.querySelector('.page[data-page="reviews"] .search-mini input');
  reviewsSearch?.addEventListener('input', () => {
    pageState.reviewFilters.query = reviewsSearch.value;
    renderReviews({
      avaliacoes: pageState.avaliacoes,
      reservas: pageState.reservas,
      salas: pageState.salas,
    });
  });

  if (currentPage === 'reviews') {
    const exportButton = document.querySelector('.page-header .actions .btn--ghost');
    exportButton?.addEventListener('click', exportReviewsCsv);

    const filterButtons = document.querySelectorAll('.page[data-page="reviews"] .filter-chip');
    filterButtons[0]?.addEventListener('click', openStarsFilterModal);
    filterButtons[1]?.addEventListener('click', openStatusFilterModal);
  }

  if (currentPage === 'plans') {
    const plansSearch = document.querySelector('.topbar .search input');
    const reportButton = document.querySelector('.page[data-page="plans"] .page-header .btn--ghost');
    const newPlanButton = document.querySelector('.page[data-page="plans"] .page-header .btn--primary');
    const draftButtons = document.querySelectorAll('.page[data-page="plans"] .promo-row .btn');

    plansSearch?.addEventListener('input', () => {
      renderPlans({
        planos: pageState.planos,
        assinaturas: pageState.assinaturas,
      });
    });
    reportButton?.addEventListener('click', openRevenueReportModal);
    newPlanButton?.addEventListener('click', () => openPlanFormModal());
    draftButtons[0]?.addEventListener('click', () => {
      if (!pageState.planDraft) return;
      openPlanFormModal({
        id_plano: pageState.planDraft.id_plano,
        ...pageState.planDraft.payload,
      });
    });
    draftButtons[1]?.addEventListener('click', savePlanDraft);
    renderPlanDraftCard();
  }
}

function bindUserActions() {
  document.querySelectorAll('[data-action="view-cliente"]').forEach((button) => {
    button.addEventListener('click', () => {
      openUserDetailsModal(getUserById(button.dataset.id));
    });
  });

  document.querySelectorAll('[data-action="edit-cliente"]').forEach((button) => {
    button.addEventListener('click', () => {
      openUserFormModal(getUserById(button.dataset.id));
    });
  });

  document.querySelectorAll('[data-action="toggle-cliente"]').forEach((button) => {
    button.addEventListener('click', () => {
      toggleUserStatus(getUserById(button.dataset.id));
    });
  });

  document.querySelectorAll('[data-action="delete-cliente"]').forEach((button) => {
    button.addEventListener('click', () => {
      openDeleteUserModal(getUserById(button.dataset.id));
    });
  });
}

function bindRoomActions() {
  document.querySelectorAll('[data-action="edit-sala"]').forEach((button) => {
    button.addEventListener('click', () => {
      openRoomFormModal(getRoomById(button.dataset.id));
    });
  });

  document.querySelectorAll('[data-action="delete-sala"]').forEach((button) => {
    button.addEventListener('click', () => {
      openDeleteRoomModal(getRoomById(button.dataset.id));
    });
  });
}

function bindPlanCrudActions() {
  document.querySelectorAll('[data-action="plan-settings"]').forEach((button) => {
    button.addEventListener('click', () => {
      openPlanSettingsModal(getPlanById(button.dataset.id));
    });
  });

  document.querySelectorAll('[data-action="edit-plano"]').forEach((button) => {
    button.addEventListener('click', () => {
      openPlanFormModal(getPlanById(button.dataset.id));
    });
  });

  document.querySelectorAll('[data-action="delete-plano"]').forEach((button) => {
    button.addEventListener('click', () => {
      openDeletePlanModal(getPlanById(button.dataset.id));
    });
  });
}

function bindPlanActions() {
  document.querySelectorAll('[data-action="delete-plano"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      try {
        await apiSend(`/planos/${id}`, { method: 'DELETE' });
        const [planos, assinaturas] = await Promise.all([
          apiGet('/planos'),
          apiGet('/assinaturas'),
        ]);
        renderPlans({ planos, assinaturas });
        showActionMessage('Plano removido do banco de dados.');
      } catch (error) {
        console.error(error);
        showActionMessage('Não foi possível remover o plano porque ele possui assinaturas relacionadas.');
      }
    });
  });
}

async function loadCoreData() {
  const [clientes, salas, planos, assinaturas, reservas] = await Promise.all([
    apiGet('/clientes'),
    apiGet('/salas'),
    apiGet('/planos'),
    apiGet('/assinaturas'),
    apiGet('/reservas?limit=100'),
  ]);

  return { clientes, salas, planos, assinaturas, reservas };
}

function hasInitialData(data) {
  return (
    (data.clientes?.length || 0) > 0
    && (data.salas?.length || 0) > 0
    && (data.planos?.length || 0) > 0
  );
}

function sortedReservations(reservas) {
  return [...reservas].sort((a, b) => {
    const dateA = new Date(a.feito_em || a.entrada || 0).getTime();
    const dateB = new Date(b.feito_em || b.entrada || 0).getTime();
    if (dateA !== dateB) return dateB - dateA;
    return Number(b.id_reserva || 0) - Number(a.id_reserva || 0);
  });
}

function dashboardReservationRow(reserva, clientesMap, salasMap) {
  const sala = salasMap.get(reserva.id_sala);
  const cliente = clientesMap.get(reserva.id_cliente);
  return `
    <tr>
      <td><div style="display:flex;align-items:center;gap:8px">${icon('icon-calendar')} ${escapeHtml(sala?.nome || 'Sala removida')}</div></td>
      <td style="color:#1F3A57">${escapeHtml(cliente?.nome || 'Cliente removido')}</td>
      <td>${formatTimeRange(reserva.entrada, reserva.saida)}</td>
      <td><span class="pill ${reservationPill(reserva.status)}">${escapeHtml(reserva.status)}</span></td>
    </tr>
  `;
}

function openAllReservationsModal() {
  const clientesMap = clienteById(pageState.clientes);
  const salasMap = salaById(pageState.salas);
  const reservas = sortedReservations(pageState.reservas);
  openModal({
    title: 'Todas as reservas',
    subtitle: `${reservas.length} reservas registradas no banco de dados.`,
    body: `
      <div class="modal-table-wrap">
        <table>
          <thead><tr><th>SALA</th><th>RESPONSÁVEL</th><th>HORÁRIO</th><th>STATUS</th></tr></thead>
          <tbody>
            ${reservas.map((reserva) => dashboardReservationRow(reserva, clientesMap, salasMap)).join('')}
          </tbody>
        </table>
      </div>
    `,
    actions: '<button class="btn btn--primary" type="button" data-modal-close>Fechar</button>',
  });
}

function exportReservationsCsv() {
  const clientesMap = clienteById(pageState.clientes);
  const salasMap = salaById(pageState.salas);
  const rows = sortedReservations(pageState.reservas);
  const header = ['id_reserva', 'sala', 'cliente', 'status', 'feito_em', 'entrada', 'saida'];
  const lines = [
    header.join(','),
    ...rows.map((reserva) => {
      const sala = salasMap.get(reserva.id_sala);
      const cliente = clientesMap.get(reserva.id_cliente);
      return [
        reserva.id_reserva,
        sala?.nome || 'Sala removida',
        cliente?.nome || 'Cliente removido',
        reserva.status,
        reserva.feito_em,
        reserva.entrada,
        reserva.saida,
      ].map(csvValue).join(',');
    }),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reservas-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function dashboardReservationDefaultDates() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(11, 0, 0, 0);
  const toInputValue = (date) => {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:00`;
  };
  return { entrada: toInputValue(start), saida: toInputValue(end) };
}

function reservationPayloadFromForm(formElement) {
  const form = new FormData(formElement);
  return {
    id_cliente: Number(form.get('id_cliente')),
    id_sala: Number(form.get('id_sala')),
    entrada: String(form.get('entrada') || ''),
    saida: String(form.get('saida') || ''),
  };
}

function validateReservationPayload(payload) {
  const entrada = new Date(payload.entrada);
  const saida = new Date(payload.saida);
  if (!payload.id_cliente || !payload.id_sala || !payload.entrada || !payload.saida) {
    return 'Selecione cliente, sala, entrada e saída.';
  }
  if (entrada >= saida) {
    return 'A saída precisa ser depois da entrada.';
  }
  if (entrada.toDateString() !== saida.toDateString()) {
    return 'A reserva precisa começar e terminar no mesmo dia.';
  }
  if (entrada <= new Date()) {
    return 'A reserva precisa ser criada para um horário futuro.';
  }
  if (entrada.getMinutes() !== 0 || saida.getMinutes() !== 0) {
    return 'Use horários em horas inteiras.';
  }
  return '';
}

async function refreshDashboard() {
  const data = await loadCoreData();
  renderDashboard(data);
}

function openNewReservationModal() {
  const defaults = dashboardReservationDefaultDates();
  const activeClientes = pageState.clientes.filter((cliente) => cliente.ativo !== false);
  const activeSalas = pageState.salas.filter((sala) => sala.ativa !== false);
  const modal = openModal({
    title: 'Nova reserva',
    subtitle: 'Crie uma reserva futura para uma sala cadastrada.',
    body: `
      <form id="dashboard-reservation-form" class="modal-body">
        <label>
          <div class="field-label">Cliente</div>
          <select class="field-select" name="id_cliente" required>
            <option value="">Selecione</option>
            ${activeClientes.map((cliente) => `<option value="${cliente.id_cliente}">${escapeHtml(cliente.nome)}</option>`).join('')}
          </select>
        </label>
        <label>
          <div class="field-label">Sala</div>
          <select class="field-select" name="id_sala" required>
            <option value="">Selecione</option>
            ${activeSalas.map((sala) => `<option value="${sala.id_sala}">${escapeHtml(sala.nome)} · ${sala.capacidade} pessoas</option>`).join('')}
          </select>
        </label>
        <div class="form-grid-2">
          <label>
            <div class="field-label">Entrada</div>
            <input class="field-input" name="entrada" type="datetime-local" step="3600" value="${defaults.entrada}" required />
          </label>
          <label>
            <div class="field-label">Saída</div>
            <input class="field-input" name="saida" type="datetime-local" step="3600" value="${defaults.saida}" required />
          </label>
        </div>
      </form>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
      <button class="btn btn--primary" type="submit" form="dashboard-reservation-form">Criar reserva</button>
    `,
  });

  modal.querySelector('#dashboard-reservation-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = reservationPayloadFromForm(event.currentTarget);
    const validationMessage = validateReservationPayload(payload);
    if (validationMessage) {
      showActionMessage(validationMessage);
      return;
    }

    try {
      await apiSend('/reservas', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      closeModal();
      await refreshDashboard();
      showActionMessage('Reserva criada com sucesso.');
    } catch (error) {
      console.error(error);
      showActionMessage('Não foi possível criar a reserva. Verifique conflito de horário e dados selecionados.');
    }
  });
}

function monthlyRevenueRows() {
  return pageState.planos
    .map((plano) => {
      const assinaturas = pageState.assinaturas.filter(
        (assinatura) => assinatura.status === 'Ativa' && assinatura.id_plano === plano.id_plano,
      );
      return {
        plano,
        membros: assinaturas.length,
        receita: assinaturas.length * Number(plano.preco || 0),
      };
    })
    .sort((a, b) => b.receita - a.receita);
}

function openDashboardRevenueModal() {
  const rows = monthlyRevenueRows();
  const receitaAtual = rows.reduce((total, row) => total + row.receita, 0);
  const projectionRows = [1, 2, 3].map((month) => {
    const growth = 1 + (month * 0.06);
    return {
      label: `Mês +${month}`,
      value: receitaAtual * growth,
    };
  });

  openModal({
    title: 'Receita mensal',
    subtitle: 'Receita calculada pelas assinaturas ativas e projeção com crescimento estimado de 6% ao mês.',
    body: `
      <div class="report-grid">
        <div class="report-card"><span>Receita atual</span><b>${money.format(receitaAtual)}</b></div>
        <div class="report-card"><span>Planos rentáveis</span><b>${rows.filter((row) => row.receita > 0).length}</b></div>
      </div>
      <div class="modal-table-wrap">
        <table>
          <thead><tr><th>PLANO</th><th>MEMBROS</th><th>RECEITA</th></tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.plano.nome)}</td>
                <td>${row.membros}</td>
                <td>${money.format(row.receita)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="report-grid">
        ${projectionRows.map((row) => `<div class="report-card"><span>${row.label}</span><b>${money.format(row.value)}</b></div>`).join('')}
      </div>
    `,
    actions: '<button class="btn btn--primary" type="button" data-modal-close>Fechar</button>',
  });
}

function renderDashboardPlanDistribution(activeSubscriptions, planos) {
  const container = document.querySelector('.page[data-page="dashboard"] .grid-2 > .card:not(.card--flush)');
  if (!container) return;

  const total = activeSubscriptions.length;
  const rows = planos.map((plano) => {
    const membros = activeSubscriptions.filter((assinatura) => assinatura.id_plano === plano.id_plano).length;
    const percent = total ? Math.round((membros / total) * 100) : 0;
    return { plano, membros, percent };
  }).sort((a, b) => b.membros - a.membros);

  container.innerHTML = `
    <div class="title" style="font-size:13px;font-weight:700;color:#0A1F33">Distribuição por plano</div>
    <div style="font-size:11px;color:#6B7A8A;margin-top:2px">${total} membros ativos no total</div>
    <div style="display:flex;flex-direction:column;gap:14px;margin-top:18px">
      ${rows.map((row) => `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#0A1F33">
            <b>${escapeHtml(row.plano.nome)}</b>
            <span style="color:#6B7A8A">${row.membros} <span style="color:#A9BDCB">·</span> ${row.percent}%</span>
          </div>
          <div class="bar" style="margin-top:6px"><span style="width:${row.percent}%"></span></div>
        </div>
      `).join('')}
    </div>
  `;
}

function bindDashboardActions() {
  const exportButton = document.querySelector('.page[data-page="dashboard"] .page-header .btn--ghost');
  const newReservationButton = document.querySelector('.page[data-page="dashboard"] .page-header .btn--primary');
  const statCards = document.querySelectorAll('.page[data-page="dashboard"] .grid-4 > .card');
  const arrows = [...statCards].map((card) => card.querySelector('.stat-row > svg:last-child'));
  ['Ver usuários ativos', 'Ver salas cadastradas', 'Ver planos', 'Ver receita mensal'].forEach((label, index) => {
    if (!arrows[index]) return;
    arrows[index].setAttribute('role', 'button');
    arrows[index].setAttribute('tabindex', '0');
    arrows[index].setAttribute('aria-label', label);
  });
  if (exportButton) exportButton.onclick = exportReservationsCsv;
  if (newReservationButton) newReservationButton.onclick = openNewReservationModal;
  if (arrows[0]) arrows[0].onclick = () => { window.location.href = 'pages/users.html?status=active'; };
  if (arrows[1]) arrows[1].onclick = () => { window.location.href = 'pages/rooms.html'; };
  if (arrows[2]) arrows[2].onclick = () => { window.location.href = 'pages/plans.html'; };
  if (arrows[3]) arrows[3].onclick = openDashboardRevenueModal;

  const viewAll = document.querySelector('.page[data-page="dashboard"] .section-head a');
  if (viewAll) viewAll.onclick = (event) => {
    event.preventDefault();
    openAllReservationsModal();
  };
}

function applyUserFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('status');
  const allowedStatuses = ['all', 'active', 'pending', 'suspended', 'expired', 'cancelled', 'disabled', 'no_plan'];
  if (status && allowedStatuses.includes(status)) {
    pageState.userFilters.status = status;
    pageState.userPagination.page = 1;
  }
}

function renderDashboard({ clientes, salas, planos, assinaturas, reservas }) {
  pageState.clientes = clientes;
  pageState.salas = salas;
  pageState.planos = planos;
  pageState.assinaturas = assinaturas;
  pageState.reservas = reservas;

  const activeSubscriptions = assinaturas.filter((assinatura) => assinatura.status === 'Ativa');
  const planosMap = planById(planos);
  const receita = activeSubscriptions.reduce((total, assinatura) => {
    const plano = planosMap.get(assinatura.id_plano);
    return total + Number(plano?.preco || 0);
  }, 0);

  updateText(document.querySelectorAll('.stat-value'), [
    activeSubscriptions.length,
    salas.length,
    planos.length,
    money.format(receita),
  ]);
  const activePlanIds = new Set(activeSubscriptions.map((assinatura) => assinatura.id_plano).filter(Boolean));
  const occupiedRooms = salas.filter((sala) => roomStatus(sala).label === 'Ocupada').length;
  updateText(document.querySelectorAll('.stat-delta'), [
    `${clientes.length} usuários cadastrados`,
    `${occupiedRooms} ocupadas agora`,
    `${activePlanIds.size} com membros ativos`,
    'Projeção disponível',
  ]);

  const clientesMap = clienteById(clientes);
  const salasMap = salaById(salas);
  const tbody = document.querySelector('table tbody');

  if (!tbody) return;

  tbody.innerHTML = sortedReservations(reservas).slice(0, 5)
    .map((reserva) => dashboardReservationRow(reserva, clientesMap, salasMap))
    .join('');

  renderDashboardPlanDistribution(activeSubscriptions, planos);
  bindDashboardActions();
}

function userPaginationPages(currentPageValue, totalPages) {
  const pages = new Set([1, totalPages, currentPageValue - 1, currentPageValue, currentPageValue + 1]);
  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

function renderUserPagination(totalPages, totalItems) {
  const pagination = document.querySelector('.page[data-page="users"] .pagination');
  const pagesContainer = pagination?.querySelector('.pages');
  if (!pagination || !pagesContainer) return;

  const currentUserPage = pageState.userPagination.page || 1;
  const paginationLabel = pagination.querySelector('div:first-child');
  if (paginationLabel) {
    paginationLabel.textContent = totalItems ? `Página ${currentUserPage} de ${totalPages}` : 'Nenhuma página';
  }
  const pageNumbers = userPaginationPages(currentUserPage, totalPages);
  const buttons = [
    `<button class="page-btn" data-user-page="${Math.max(1, currentUserPage - 1)}"${currentUserPage === 1 ? ' disabled' : ''}>${icon('icon-chevron-left')}</button>`,
  ];

  pageNumbers.forEach((page, index) => {
    if (index > 0 && page - pageNumbers[index - 1] > 1) {
      buttons.push('<button class="page-btn" disabled>...</button>');
    }
    buttons.push(`<button class="page-btn${page === currentUserPage ? ' is-active' : ''}" data-user-page="${page}">${page}</button>`);
  });

  buttons.push(`<button class="page-btn" data-user-page="${Math.min(totalPages, currentUserPage + 1)}"${currentUserPage === totalPages ? ' disabled' : ''}>${icon('icon-chevron-right')}</button>`);
  pagesContainer.innerHTML = buttons.join('');
  pagination.style.display = totalItems ? 'flex' : 'none';

  pagesContainer.querySelectorAll('[data-user-page]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextPage = Number(button.dataset.userPage);
      if (!Number.isFinite(nextPage) || nextPage === pageState.userPagination.page) return;
      pageState.userPagination.page = nextPage;
      renderUsers(pageState);
    });
  });
}

function renderUsers({ clientes, planos, assinaturas }) {
  pageState.clientes = clientes;
  pageState.planos = planos;
  pageState.assinaturas = assinaturas;

  const search = document.querySelector('.toolbar .search-mini input');
  const query = normalize(search?.value || '');
  const planosMap = planById(planos);
  const assinaturaPorCliente = latestSubscriptionByClient(assinaturas);
  const filters = pageState.userFilters;
  const filteredClientes = clientes.filter((cliente) => {
    const assinatura = assinaturaPorCliente.get(cliente.id_cliente);
    const plano = planosMap.get(assinatura?.id_plano);
    const status = userStatus(cliente, assinatura);
    const matchesQuery = !query || normalize(`${cliente.nome} ${cliente.email} ${cliente.cpf} ${status.label} ${plano?.nome || ''}`).includes(query);
    const matchesPlan = filters.plano === 'all' || String(plano?.id_plano || 'none') === String(filters.plano);
    const matchesStatus = filters.status === 'all' || status.key === filters.status;
    return matchesQuery && matchesPlan && matchesStatus;
  });
  const active = clientes.filter((cliente) => userStatus(cliente, assinaturaPorCliente.get(cliente.id_cliente)).key === 'active').length;
  const pending = clientes.filter((cliente) => userStatus(cliente, assinaturaPorCliente.get(cliente.id_cliente)).key === 'pending').length;
  const inactive = clientes.filter((cliente) => ['cancelled', 'disabled', 'suspended', 'expired', 'no_plan'].includes(userStatus(cliente, assinaturaPorCliente.get(cliente.id_cliente)).key)).length;

  updateText(document.querySelectorAll('.mini-stat .value'), [clientes.length, active, pending, inactive]);
  userFilterLabels().update();

  const perPage = Number(filters.perPage || 8);
  const totalPages = Math.max(1, Math.ceil(filteredClientes.length / perPage));
  pageState.userPagination.page = Math.min(Math.max(1, pageState.userPagination.page || 1), totalPages);
  const currentUserPage = pageState.userPagination.page;
  const startIndex = (currentUserPage - 1) * perPage;
  const pageClientes = filteredClientes.slice(startIndex, startIndex + perPage);

  const toolbarCount = document.querySelector('.toolbar > div:last-child');
  if (toolbarCount) {
    const from = filteredClientes.length ? startIndex + 1 : 0;
    const to = Math.min(startIndex + pageClientes.length, filteredClientes.length);
    toolbarCount.textContent = `${from}-${to} de ${filteredClientes.length} mostrados`;
  }

  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  if (!pageClientes.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#6B7A8A;padding:28px">Nenhum usuário encontrado.</td></tr>';
    renderUserPagination(totalPages, filteredClientes.length);
    bindUserActions();
    return;
  }

  tbody.innerHTML = pageClientes.map((cliente) => {
    const assinatura = assinaturaPorCliente.get(cliente.id_cliente);
    const plano = planosMap.get(assinatura?.id_plano);
    const status = userStatus(cliente, assinatura);
    return `
      <tr>
        <td><input type="checkbox" /></td>
        <td>
          <div class="user-cell">
            ${userAvatar(cliente)}
            <div><b>${escapeHtml(cliente.nome)}</b><small>${escapeHtml(cliente.email)}</small></div>
          </div>
        </td>
        <td><span class="pill ${pillForPlan(plano?.nome)}">${escapeHtml(plano?.nome || 'Sem plano')}</span></td>
        <td><span class="status-dot"><span class="dot ${status.dot}"></span>${status.label}</span></td>
        <td style="color:#1F3A57">${formatDate(assinatura?.feita_em)}</td>
        <td style="text-align:right">
          <div class="row-actions">
            <button title="${cliente.ativo ? 'Desabilitar' : 'Habilitar'}" data-action="toggle-cliente" data-id="${cliente.id_cliente}">${icon('icon-user-check')}</button>
            <button title="Editar" data-action="edit-cliente" data-id="${cliente.id_cliente}">${icon('icon-pencil')}</button>
            <button class="danger" title="Excluir" data-action="delete-cliente" data-id="${cliente.id_cliente}">${icon('icon-trash')}</button>
            <button title="Detalhes" data-action="view-cliente" data-id="${cliente.id_cliente}">${icon('icon-more')}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const paginationLabel = document.querySelector('.pagination > div:first-child');
  if (paginationLabel) {
    paginationLabel.textContent = `Página ${currentUserPage} de ${totalPages}`;
  }

  renderUserPagination(totalPages, filteredClientes.length);
  bindUserActions();
}

function roomCard(room) {
  const status = roomStatus(room);
  const type = cleanRoomType(room.tipo);
  const ambiente = room.ambiente || type;
  const amenities = [
    ['wifi', 'icon-wifi'],
    ['monitor', 'icon-monitor'],
    ['cafe', 'icon-coffee'],
  ].filter(([needle]) => normalize(room.recursos || '').includes(normalize(needle)));

  return `
    <div class="card" data-room-card="${room.id_sala}">
      <div class="room-media" style="background-image:url('${escapeHtml(roomPhotoSrc(room))}')">
        <span class="badge"><span class="pill ${status.className}">${status.label}</span></span>
        <span class="photo-count">${roomPhotos(room).length || 1}/5 fotos</span>
      </div>
      <div class="room-title">
        <div><b>${escapeHtml(room.nome)}</b><br><small>${escapeHtml(type.toUpperCase())}</small></div>
        <div class="room-price">${roomPrice(room)}</div>
      </div>
      <p class="room-description">${escapeHtml(room.descricao || ambiente)}</p>
      <div class="room-meta">
        <span>${icon('icon-users', 12)}${room.capacidade} pessoas</span>
        <span>${icon('icon-map-pin', 12)}${roomFloor(room)}</span>
      </div>
      <div class="room-meta">
        <span>${icon('icon-building', 12)}${escapeHtml(ambiente)}</span>
      </div>
      <div class="amenities">
        ${amenities.map(([, iconName]) => `<span class="amenity">${icon(iconName, 12)}</span>`).join('')}
      </div>
      <div class="room-actions">
        <button class="btn btn--ghost btn--sm" data-action="edit-sala" data-id="${room.id_sala}">${icon('icon-pencil', 11)}Editar</button>
        <div class="row-actions"><button class="danger" data-action="delete-sala" data-id="${room.id_sala}">${icon('icon-trash')}</button></div>
      </div>
    </div>
  `;
}

function renderRooms({ salas }) {
  pageState.salas = salas;

  const container = document.querySelector('.grid-3.mt-16');
  if (!container) return;

  const search = document.querySelector('.page[data-page="rooms"] .search-mini input');
  const activeTab = document.querySelector('.type-tab.is-active')?.textContent || 'Todos';
  const query = normalize(search?.value || '');
  const activeType = normalize(activeTab);
  const filteredSalas = salas.filter((sala) => {
    const matchesSearch = !query || normalize(`${sala.nome} ${sala.tipo} ${sala.descricao} ${sala.ambiente || ''} ${sala.andar || ''} ${sala.recursos || ''}`).includes(query);
    const matchesType = activeType === 'todos' || normalize(cleanRoomType(sala.tipo)).includes(activeType);
    return matchesSearch && matchesType;
  });

  container.innerHTML = filteredSalas.length
    ? filteredSalas.map(roomCard).join('')
    : '<div class="card center" style="grid-column:1 / -1">Nenhuma sala encontrada.</div>';
  bindRoomActions();
}

function planFeatures(planName) {
  const features = {
    'Day Pass': ['Hot Desk por 8h', 'Café e wifi', '1h de sala de reunião'],
    Flex: ['Hot Desk ilimitado', '5h/mês de salas de reunião', 'Eventos da comunidade', 'Locker pessoal'],
    Dedicated: ['Mesa dedicada 24/7', '10h/mês de salas', 'Endereço fiscal', 'Recepção de correspondência'],
    Office: ['Sala privativa até 6 pessoas', '20h/mês de salas extras', 'Endereço fiscal', 'Estacionamento (2 vagas)'],
  };
  return features[planName] || ['Acesso conforme categoria', 'Suporte da comunidade', 'Wifi incluso'];
}

function planDescription(planName) {
  const descriptions = {
    'Day Pass': 'Acesso pontual para visitantes',
    Flex: 'Para quem trabalha em ritmo livre',
    Dedicated: 'Sua mesa fixa, sempre disponível',
    Office: 'Sala privativa para times',
  };
  return descriptions[planName] || 'Plano ativo do coworking';
}

function renderPlanCard(plano, memberCount, featured) {
  const period = normalize(plano.nome).includes('day') ? '/dia' : '/mês';
  const descricao = plano.descricao || planDescription(plano.nome);
  const beneficios = normalizePlanBenefits(plano.beneficios || planFeatures(plano.nome));

  return `
    <div class="plan-card${featured ? ' is-featured' : ''}" data-plan-card="${plano.id_plano}">
      ${featured ? '<span class="badge-pop">MAIS POPULAR</span>' : ''}
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:14px;font-weight:700">${escapeHtml(plano.nome)}</div>
          <div style="font-size:10px;color:${featured ? '#A9BDCB' : '#6B7A8A'};margin-top:4px;line-height:1.4">${escapeHtml(descricao)}</div>
        </div>
        <button class="icon-pill" title="Configurar" data-action="plan-settings" data-id="${plano.id_plano}" style="width:26px;height:26px;background:transparent;border:1px solid ${featured ? '#1F3A57' : '#D9DEDC'};color:${featured ? '#A9BDCB' : '#6B7A8A'}">${icon('icon-more', 12)}</button>
      </div>
      <div class="price"><b>${money.format(Number(plano.preco))}</b><small>${period}</small></div>
      <ul>
        ${beneficios.slice(0, 5).map((feature) => `<li><span class="check">${icon('icon-check', 9)}</span><span>${escapeHtml(feature)}</span></li>`).join('')}
      </ul>
      <div class="footer">
        <span class="members">${icon('icon-users', 12)}${memberCount} membros</span>
        <div style="display:inline-flex;gap:6px">
          <button class="icon-pill" title="Editar" data-action="edit-plano" data-id="${plano.id_plano}">${icon('icon-pencil', 12)}</button>
          <button class="icon-pill danger" title="Arquivar" data-action="delete-plano" data-id="${plano.id_plano}">${icon('icon-trash', 12)}</button>
        </div>
      </div>
    </div>
  `;
}

function renderPlans({ planos, assinaturas }) {
  pageState.planos = planos;
  pageState.assinaturas = assinaturas;

  const counts = new Map();
  assinaturas
    .filter((assinatura) => assinatura.status === 'Ativa')
    .forEach((assinatura) => counts.set(assinatura.id_plano, (counts.get(assinatura.id_plano) || 0) + 1));

  const receita = assinaturas
    .filter((assinatura) => assinatura.status === 'Ativa')
    .reduce((total, assinatura) => {
      const plano = planos.find((item) => item.id_plano === assinatura.id_plano);
      return total + Number(plano?.preco || 0);
    }, 0);

  const popular = planos.reduce((best, plano) => {
    const count = counts.get(plano.id_plano) || 0;
    return count > (counts.get(best?.id_plano) || 0) ? plano : best;
  }, planos[0]);

  updateText(document.querySelectorAll('.grid-3.mb-20 .stat-value'), [
    planos.length,
    money.format(receita),
    popular?.nome || '-',
  ]);

  const deltas = document.querySelectorAll('.grid-3.mb-20 .stat-delta');
  updateText(deltas, [
    `${planos.length} ativos`,
    'Baseado em assinaturas ativas',
    `${counts.get(popular?.id_plano) || 0} membros`,
  ]);

  const container = document.querySelector('.grid-4.mb-16');
  if (!container) return;

  const query = normalize(document.querySelector('.topbar .search input')?.value || '');
  const filteredPlanos = planos.filter((plano) => (
    !query
    || normalize(plano.nome).includes(query)
    || normalize(plano.acesso).includes(query)
  ));

  container.innerHTML = filteredPlanos.length
    ? filteredPlanos
      .map((plano) => renderPlanCard(plano, counts.get(plano.id_plano) || 0, plano.id_plano === popular?.id_plano))
      .join('')
    : '<div class="card center" style="grid-column:1 / -1">Nenhum plano encontrado.</div>';

  renderPlanDraftCard();
  bindPlanCrudActions();
}

function stars(nota, size = 14) {
  const rounded = Math.round(Number(nota || 0));
  return `
    <div class="stars">
      ${[1, 2, 3, 4, 5].map((index) => icon(index <= rounded ? 'icon-star-fill' : 'icon-star', size)).join('')}
      <span class="num">${Number(nota || 0).toFixed(1).replace('.', ',')}</span>
    </div>
  `;
}

function renderReviewCard(review) {
  const status = review.nota <= 3 ? ['Em moderação', 'pill--warn'] : ['Publicada', 'pill--ok'];
  return `
    <div class="card review-item" data-review-card="${review.id_avaliacao}">
      <div class="review-head">
        <div style="display:flex;gap:12px;align-items:center;min-width:0">
          <div class="avatar-sm" style="width:38px;height:38px;font-size:11px">${escapeHtml(initials(review.nome_usuario))}</div>
          <div>
            <div style="font-size:13px;font-weight:700;color:#0A1F33">${escapeHtml(review.nome_usuario)}</div>
            <div class="review-meta">
              <span>avaliou</span><b>${escapeHtml(review.nome_sala)}</b>
              <span style="color:#A9BDCB">·</span>
              <span class="pill pill--ok">${escapeHtml(cleanRoomType(review.tipo_sala))}</span>
              <span style="color:#A9BDCB">·</span><span>${formatDate(review.criado_em)}</span>
              ${review.resposta_admin ? '<span style="color:#A9BDCB">·</span><span>respondida</span>' : ''}
            </div>
          </div>
        </div>
        <span class="pill ${status[1]}">${status[0]}</span>
      </div>
      <div class="review-body">
        ${stars(review.nota)}
        <p class="review-comment">"${escapeHtml(review.corpo || 'Sem comentário informado.')}"</p>
        ${review.resposta_admin ? `<p class="review-response"><b>Resposta:</b> ${escapeHtml(review.resposta_admin)}<br><small>${formatDate(review.respondido_em)}</small></p>` : ''}
      </div>
      <div class="review-foot">
        <button class="link-btn" data-action="reply-review" data-id="${review.id_avaliacao}">${icon('icon-message', 12)}Responder</button>
        <div style="display:inline-flex;gap:6px">
          <button class="btn btn--ghost btn--sm" data-action="edit-review" data-id="${review.id_avaliacao}">${icon('icon-pencil', 11)}Editar</button>
          <button class="btn btn--sm" data-action="delete-review" data-id="${review.id_avaliacao}" style="background:#FFF;color:#8A3A3A;border:1px solid #D9DEDC">${icon('icon-trash', 11)}Excluir</button>
          <div class="row-actions"><button>${icon('icon-more')}</button></div>
        </div>
      </div>
    </div>
  `;
}

function renderDistribution(avaliacoes) {
  const distribution = [5, 4, 3, 2, 1].map((nota) => ({
    nota,
    count: avaliacoes.filter((review) => Number(review.nota) === nota).length,
  }));
  const total = Math.max(avaliacoes.length, 1);
  const container = document.querySelector('.row-bar')?.parentElement;

  if (!container) return;

  container.innerHTML = distribution.map(({ nota, count }) => {
    const width = Math.round((count / total) * 100);
    return `
      <div class="row-bar">
        <span class="lbl">${nota} ${icon('icon-star-fill', 10)}</span>
        <div class="bar" style="flex:1"><span style="width:${width}%"></span></div>
        <span class="num">${count}</span>
      </div>
    `;
  }).join('');
}

function renderPendingReviews(reservas, avaliacoes, salas) {
  const reviewedIds = new Set(avaliacoes.map((review) => review.id_reserva));
  const salasMap = salaById(salas);
  const pending = reservas.filter((reserva) => reserva.status === 'Finalizada' && !reviewedIds.has(reserva.id_reserva));
  const list = document.querySelector('.pending-list');
  const count = document.querySelector('.badge-count');

  if (count) {
    count.textContent = pending.length;
  }

  if (!list) return;

  list.innerHTML = pending.slice(0, 4).map((reserva) => {
    const sala = salasMap.get(reserva.id_sala);
    return `
      <li>
        <div>
          <div style="font-size:12px;font-weight:700;color:#0A1F33">${sala?.nome || 'Sala removida'}</div>
          <div class="pending-meta">
            <span class="pill pill--ok">${cleanRoomType(sala?.tipo || '')}</span>
            <span style="display:inline-flex;align-items:center;gap:4px">${icon('icon-calendar', 10)}${formatDate(reserva.feito_em)}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span class="days ${pending.length > 2 ? 'bad' : 'warn'}">pendente</span>
          <button class="btn btn--ghost btn--xs">Solicitar ${icon('icon-chevron-right', 11)}</button>
        </div>
      </li>
    `;
  }).join('');
}

function getFilteredReviews() {
  const filters = pageState.reviewFilters;
  const query = normalize(filters.query || '');
  return pageState.avaliacoes.filter((review) => {
    const matchesQuery = !query || normalize(`${review.nome_usuario} ${review.nome_sala} ${review.corpo} ${review.resposta_admin || ''}`).includes(query);
    const matchesStars = filters.stars === 'all' || Number(review.nota) === Number(filters.stars);
    const matchesStatus = (
      filters.status === 'all'
      || (filters.status === 'published' && Number(review.nota) > 3)
      || (filters.status === 'moderation' && Number(review.nota) <= 3)
      || (filters.status === 'answered' && Boolean(review.resposta_admin))
      || (filters.status === 'unanswered' && !review.resposta_admin)
    );
    return matchesQuery && matchesStars && matchesStatus;
  });
}

function openStarsFilterModal() {
  const modal = openModal({
    title: 'Filtrar por estrelas',
    subtitle: 'Escolha uma nota para refinar a lista de avaliações.',
    body: `
      <label>
        <div class="field-label">Nota</div>
        <select class="field-select" id="review-stars-filter">
          <option value="all">Todas</option>
          <option value="5">5 estrelas</option>
          <option value="4">4 estrelas</option>
          <option value="3">3 estrelas</option>
          <option value="2">2 estrelas</option>
          <option value="1">1 estrela</option>
        </select>
      </label>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
      <button class="btn btn--primary" type="button" data-apply-stars>Aplicar filtro</button>
    `,
  });

  modal.querySelector('#review-stars-filter').value = pageState.reviewFilters.stars;
  modal.querySelector('[data-apply-stars]').addEventListener('click', () => {
    pageState.reviewFilters.stars = modal.querySelector('#review-stars-filter').value;
    const label = pageState.reviewFilters.stars === 'all' ? 'Todas' : `${pageState.reviewFilters.stars} estrelas`;
    document.querySelectorAll('.page[data-page="reviews"] .filter-chip')[0].textContent = `Estrelas: ${label}`;
    closeModal();
    renderReviews(pageState);
  });
}

function openStatusFilterModal() {
  const modal = openModal({
    title: 'Filtrar por status',
    subtitle: 'Refine a lista por publicação, moderação ou resposta.',
    body: `
      <label>
        <div class="field-label">Status</div>
        <select class="field-select" id="review-status-filter">
          <option value="all">Todos</option>
          <option value="published">Publicadas</option>
          <option value="moderation">Em moderação</option>
          <option value="answered">Respondidas</option>
          <option value="unanswered">Sem resposta</option>
        </select>
      </label>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
      <button class="btn btn--primary" type="button" data-apply-status>Aplicar filtro</button>
    `,
  });

  modal.querySelector('#review-status-filter').value = pageState.reviewFilters.status;
  modal.querySelector('[data-apply-status]').addEventListener('click', () => {
    pageState.reviewFilters.status = modal.querySelector('#review-status-filter').value;
    const labels = {
      all: 'Todos',
      published: 'Publicadas',
      moderation: 'Em moderação',
      answered: 'Respondidas',
      unanswered: 'Sem resposta',
    };
    document.querySelectorAll('.page[data-page="reviews"] .filter-chip')[1].textContent = `Status: ${labels[pageState.reviewFilters.status]}`;
    closeModal();
    renderReviews(pageState);
  });
}

function csvValue(value) {
  return `"${(value ?? '').toString().replace(/"/g, '""')}"`;
}

function userFilterLabels() {
  const statusLabels = {
    all: 'Todos',
    active: 'Ativos',
    pending: 'Pendentes',
    suspended: 'Suspensos',
    expired: 'Vencidos',
    cancelled: 'Cancelados',
    disabled: 'Desabilitados',
    no_plan: 'Sem plano',
  };
  return {
    statusLabels,
    planLabel() {
      const plano = pageState.planos.find((item) => String(item.id_plano) === String(pageState.userFilters.plano));
      return pageState.userFilters.plano === 'all' ? 'Todos' : (plano?.nome || 'Sem plano');
    },
    update() {
      const chips = document.querySelectorAll('.page[data-page="users"] .filter-chip');
      const activeFilters = [];
      if (pageState.userFilters.plano !== 'all') activeFilters.push(`Plano: ${this.planLabel()}`);
      if (pageState.userFilters.status !== 'all') activeFilters.push(`Status: ${statusLabels[pageState.userFilters.status]}`);
      if (Number(pageState.userFilters.perPage || 8) !== 8) activeFilters.push(`${pageState.userFilters.perPage} por página`);
      if (chips[0]) {
        chips[0].textContent = activeFilters.join(' | ');
        chips[0].style.display = activeFilters.length ? 'inline-flex' : 'none';
      }
      if (chips[1]) chips[1].style.display = 'none';
    },
  };
}

function openUserPlanFilterModal() {
  const labels = userFilterLabels();
  const modal = openModal({
    title: 'Filtrar por plano',
    subtitle: 'Refine a lista de usuários pelo plano atual.',
    body: `
      <label>
        <div class="field-label">Plano</div>
        <select class="field-select" id="user-plan-filter">
          <option value="all">Todos</option>
          <option value="none">Sem plano</option>
          ${pageState.planos.map((plano) => `<option value="${plano.id_plano}">${escapeHtml(plano.nome)}</option>`).join('')}
        </select>
      </label>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
      <button class="btn btn--primary" type="button" data-apply-user-plan>Aplicar filtro</button>
    `,
  });

  modal.querySelector('#user-plan-filter').value = pageState.userFilters.plano;
  modal.querySelector('[data-apply-user-plan]').addEventListener('click', () => {
    pageState.userFilters.plano = modal.querySelector('#user-plan-filter').value;
    pageState.userPagination.page = 1;
    labels.update();
    closeModal();
    renderUsers(pageState);
  });
}

function openUserStatusFilterModal() {
  const labels = userFilterLabels();
  const modal = openModal({
    title: 'Filtrar por status',
    subtitle: 'Mostre apenas usuários ativos, pendentes ou inativos.',
    body: `
      <label>
        <div class="field-label">Status</div>
        <select class="field-select" id="user-status-filter">
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="pending">Pendentes</option>
          <option value="suspended">Suspensos</option>
          <option value="expired">Vencidos</option>
          <option value="cancelled">Cancelados</option>
          <option value="disabled">Desabilitados</option>
          <option value="no_plan">Sem plano</option>
        </select>
      </label>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
      <button class="btn btn--primary" type="button" data-apply-user-status>Aplicar filtro</button>
    `,
  });

  modal.querySelector('#user-status-filter').value = pageState.userFilters.status;
  modal.querySelector('[data-apply-user-status]').addEventListener('click', () => {
    pageState.userFilters.status = modal.querySelector('#user-status-filter').value;
    pageState.userPagination.page = 1;
    labels.update();
    closeModal();
    renderUsers(pageState);
  });
}

function openUserFiltersModal() {
  const labels = userFilterLabels();
  const modal = openModal({
    title: 'Filtros de usuários',
    subtitle: 'Combine plano e status para refinar a lista.',
    body: `
      <label>
        <div class="field-label">Plano</div>
        <select class="field-select" id="user-filter-plan">
          <option value="all">Todos</option>
          <option value="none">Sem plano</option>
          ${pageState.planos.map((plano) => `<option value="${plano.id_plano}">${escapeHtml(plano.nome)}</option>`).join('')}
        </select>
      </label>
      <label>
        <div class="field-label">Status</div>
        <select class="field-select" id="user-filter-status">
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="pending">Pendentes</option>
          <option value="suspended">Suspensos</option>
          <option value="expired">Vencidos</option>
          <option value="cancelled">Cancelados</option>
          <option value="disabled">Desabilitados</option>
          <option value="no_plan">Sem plano</option>
        </select>
      </label>
      <label>
        <div class="field-label">Itens por página</div>
        <select class="field-select" id="user-filter-per-page">
          <option value="5">5 usuários</option>
          <option value="8">8 usuários</option>
          <option value="10">10 usuários</option>
          <option value="20">20 usuários</option>
          <option value="50">50 usuários</option>
        </select>
      </label>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-reset-user-filters>Limpar</button>
      <button class="btn btn--primary" type="button" data-apply-user-filters>Aplicar filtros</button>
    `,
  });
  modal.querySelector('#user-filter-plan').value = pageState.userFilters.plano;
  modal.querySelector('#user-filter-status').value = pageState.userFilters.status;
  modal.querySelector('#user-filter-per-page').value = String(pageState.userFilters.perPage || 8);
  modal.querySelector('[data-reset-user-filters]').addEventListener('click', () => {
    pageState.userFilters = { plano: 'all', status: 'all', perPage: 8 };
    pageState.userPagination.page = 1;
    labels.update();
    closeModal();
    renderUsers(pageState);
  });
  modal.querySelector('[data-apply-user-filters]').addEventListener('click', () => {
    pageState.userFilters.plano = modal.querySelector('#user-filter-plan').value;
    pageState.userFilters.status = modal.querySelector('#user-filter-status').value;
    pageState.userFilters.perPage = Number(modal.querySelector('#user-filter-per-page').value || 8);
    pageState.userPagination.page = 1;
    labels.update();
    closeModal();
    renderUsers(pageState);
  });
}

function exportRoomsCsv() {
  const search = document.querySelector('.page[data-page="rooms"] .search-mini input');
  const activeTab = document.querySelector('.type-tab.is-active')?.textContent || 'Todos';
  const query = normalize(search?.value || '');
  const activeType = normalize(activeTab);
  const rows = pageState.salas.filter((sala) => {
    const matchesSearch = !query || normalize(`${sala.nome} ${sala.tipo} ${sala.descricao} ${sala.ambiente || ''} ${sala.andar || ''} ${sala.recursos || ''}`).includes(query);
    const matchesType = activeType === 'todos' || normalize(cleanRoomType(sala.tipo)).includes(activeType);
    return matchesSearch && matchesType;
  });
  const header = ['id', 'nome', 'ambiente', 'capacidade', 'tipo', 'valor_hora', 'andar', 'status', 'ativa', 'quantidade_fotos', 'recursos', 'descricao', 'criado_em'];
  const lines = [
    header.join(','),
    ...rows.map((sala) => [
      sala.id_sala,
      sala.nome,
      sala.ambiente,
      sala.capacidade,
      cleanRoomType(sala.tipo),
      sala.valor_hora,
      sala.andar,
      sala.status_operacional,
      sala.ativa ? 'sim' : 'nao',
      roomPhotos(sala).length,
      sala.recursos,
      sala.descricao,
      sala.criado_em,
    ].map(csvValue).join(',')),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `salas-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportReviewsCsv() {
  const rows = getFilteredReviews();
  const header = ['id', 'usuario', 'sala', 'tipo_sala', 'nota', 'comentario', 'criado_em', 'resposta_admin', 'respondido_em'];
  const lines = [
    header.join(','),
    ...rows.map((review) => [
      review.id_avaliacao,
      review.nome_usuario,
      review.nome_sala,
      cleanRoomType(review.tipo_sala),
      review.nota,
      review.corpo,
      review.criado_em,
      review.resposta_admin,
      review.respondido_em,
    ].map(csvValue).join(',')),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `avaliacoes-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function openEditReviewModal(review) {
  const modal = openModal({
    title: 'Editar avaliação',
    subtitle: `${review.nome_usuario} avaliou ${review.nome_sala}.`,
    body: `
      <label>
        <div class="field-label">Nota</div>
        <select class="field-select" id="review-edit-note">
          <option value="5">5 estrelas</option>
          <option value="4">4 estrelas</option>
          <option value="3">3 estrelas</option>
          <option value="2">2 estrelas</option>
          <option value="1">1 estrela</option>
          <option value="0">0 estrela</option>
        </select>
      </label>
      <label>
        <div class="field-label">Comentário</div>
        <textarea class="field-textarea" id="review-edit-body">${escapeHtml(review.corpo || '')}</textarea>
      </label>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
      <button class="btn btn--primary" type="button" data-save-review>Salvar alteração</button>
    `,
  });

  modal.querySelector('#review-edit-note').value = String(review.nota);
  modal.querySelector('[data-save-review]').addEventListener('click', async () => {
    try {
      await apiSend(`/avaliacoes/${review.id_avaliacao}`, {
        method: 'PUT',
        body: JSON.stringify({
          id_reserva: review.id_reserva,
          nota: Number(modal.querySelector('#review-edit-note').value),
          corpo: modal.querySelector('#review-edit-body').value,
          criado_em: review.criado_em,
          resposta_admin: review.resposta_admin || null,
          respondido_em: review.respondido_em || null,
        }),
      });
      closeModal();
      await refreshReviews();
      showActionMessage('Avaliação atualizada com sucesso.');
    } catch (error) {
      console.error(error);
      showActionMessage('Não foi possível atualizar a avaliação.');
    }
  });
}

function openReplyReviewModal(review) {
  const modal = openModal({
    title: 'Responder avaliação',
    subtitle: `Resposta pública para ${review.nome_usuario}.`,
    body: `
      <p class="review-comment">"${escapeHtml(review.corpo || 'Sem comentário informado.')}"</p>
      <label>
        <div class="field-label">Resposta</div>
        <textarea class="field-textarea" id="review-reply-body">${escapeHtml(review.resposta_admin || '')}</textarea>
      </label>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
      <button class="btn btn--primary" type="button" data-save-reply>Salvar resposta</button>
    `,
  });

  modal.querySelector('[data-save-reply]').addEventListener('click', async () => {
    const resposta = modal.querySelector('#review-reply-body').value.trim();
    if (!resposta) {
      showActionMessage('Escreva uma resposta antes de salvar.');
      return;
    }

    try {
      await apiSend(`/avaliacoes/${review.id_avaliacao}/resposta`, {
        method: 'PATCH',
        body: JSON.stringify({ resposta_admin: resposta }),
      });
      closeModal();
      await refreshReviews();
      showActionMessage('Resposta salva com sucesso.');
    } catch (error) {
      console.error(error);
      showActionMessage('Não foi possível salvar a resposta.');
    }
  });
}

function openDeleteReviewModal(review) {
  const modal = openModal({
    title: 'Excluir avaliação',
    subtitle: 'Esta ação remove a avaliação do banco de dados.',
    body: `<p class="review-comment">"${escapeHtml(review.corpo || 'Sem comentário informado.')}"</p>`,
    actions: `
      <button class="btn btn--ghost" type="button" data-modal-close>Cancelar</button>
      <button class="btn btn--primary" type="button" data-confirm-delete>Excluir avaliação</button>
    `,
  });

  modal.querySelector('[data-confirm-delete]').addEventListener('click', async () => {
    try {
      await apiSend(`/avaliacoes/${review.id_avaliacao}`, { method: 'DELETE' });
      closeModal();
      await refreshReviews();
      showActionMessage('Avaliação excluída com sucesso.');
    } catch (error) {
      console.error(error);
      showActionMessage('Não foi possível excluir a avaliação.');
    }
  });
}

function bindReviewActions() {
  document.querySelectorAll('[data-action="edit-review"]').forEach((button) => {
    button.addEventListener('click', () => openEditReviewModal(getReviewById(button.dataset.id)));
  });

  document.querySelectorAll('[data-action="reply-review"]').forEach((button) => {
    button.addEventListener('click', () => openReplyReviewModal(getReviewById(button.dataset.id)));
  });

  document.querySelectorAll('[data-action="delete-review"]').forEach((button) => {
    button.addEventListener('click', () => openDeleteReviewModal(getReviewById(button.dataset.id)));
  });
}

function renderReviews({ avaliacoes, reservas, salas }) {
  pageState.avaliacoes = avaliacoes;
  pageState.reservas = reservas;
  pageState.salas = salas;

  const filters = pageState.reviewFilters;
  const query = normalize(filters.query || '');
  const filteredAvaliacoes = avaliacoes.filter((review) => {
    const matchesQuery = !query || normalize(`${review.nome_usuario} ${review.nome_sala} ${review.corpo} ${review.resposta_admin || ''}`).includes(query);
    const matchesStars = filters.stars === 'all' || Number(review.nota) === Number(filters.stars);
    const matchesStatus = (
      filters.status === 'all'
      || (filters.status === 'published' && Number(review.nota) > 3)
      || (filters.status === 'moderation' && Number(review.nota) <= 3)
      || (filters.status === 'answered' && Boolean(review.resposta_admin))
      || (filters.status === 'unanswered' && !review.resposta_admin)
    );
    return matchesQuery && matchesStars && matchesStatus;
  });

  const average = avaliacoes.length
    ? avaliacoes.reduce((total, review) => total + Number(review.nota), 0) / avaliacoes.length
    : 0;
  const pendingCount = reservas.filter((reserva) => (
    reserva.status === 'Finalizada' && !avaliacoes.some((review) => review.id_reserva === reserva.id_reserva)
  )).length;

  const cards = document.querySelectorAll('.grid-4.mb-16 .card');
  const averageValue = cards[0]?.querySelector('div[style*="align-items:baseline"] span:first-child');
  if (averageValue) averageValue.textContent = average.toFixed(1).replace('.', ',');

  const values = document.querySelectorAll('.grid-4.mb-16 .stat-value');
  if (values[0]) values[0].textContent = avaliacoes.length;
  if (values[1]) values[1].textContent = avaliacoes.filter((review) => review.nota <= 3).length;
  if (values[2]) values[2].textContent = pendingCount;

  const averageText = document.querySelector('.grid-4.mb-16 .stars .num');
  if (averageText) averageText.textContent = average.toFixed(1).replace('.', ',');

  const left = document.querySelector('.grid-2 > div:first-child');
  if (left) {
    const toolbar = left.firstElementChild;
    left.innerHTML = '';
    if (toolbar) left.appendChild(toolbar);
    left.insertAdjacentHTML('beforeend', filteredAvaliacoes.map(renderReviewCard).join(''));
    left.insertAdjacentHTML('beforeend', '<button class="load-more">Carregar mais avaliações</button>');
  }

  renderDistribution(avaliacoes);
  renderPendingReviews(reservas, avaliacoes, salas);
  bindReviewActions();
}

async function boot() {
  bindStaticControls();
  bindSearchControls();

  try {
    if (currentPage === 'dashboard') {
      let data = await loadCoreData().catch(() => bootstrapAndRetry(loadCoreData));
      if (!hasInitialData(data)) {
        data = await bootstrapAndRetry(loadCoreData);
      }
      renderDashboard(data);
      return;
    }

    if (currentPage === 'users') {
      let [clientes, planos, assinaturas] = await Promise.all([
        apiGet('/clientes'),
        apiGet('/planos'),
        apiGet('/assinaturas'),
      ]).catch(() => bootstrapAndRetry(async () => Promise.all([
        apiGet('/clientes'),
        apiGet('/planos'),
        apiGet('/assinaturas'),
      ])));
      if (!clientes.length || !planos.length) {
        [clientes, planos, assinaturas] = await bootstrapAndRetry(async () => Promise.all([
          apiGet('/clientes'),
          apiGet('/planos'),
          apiGet('/assinaturas'),
        ]));
      }
      applyUserFiltersFromUrl();
      renderUsers({ clientes, planos, assinaturas });
      return;
    }

    if (currentPage === 'rooms') {
      let salas = await apiGet('/salas').catch(() => bootstrapAndRetry(() => apiGet('/salas')));
      if (!salas.length) {
        salas = await bootstrapAndRetry(() => apiGet('/salas'));
      }
      renderRooms({ salas });
      return;
    }

    if (currentPage === 'plans') {
      let [planos, assinaturas] = await Promise.all([
        apiGet('/planos'),
        apiGet('/assinaturas'),
      ]).catch(() => bootstrapAndRetry(async () => Promise.all([
        apiGet('/planos'),
        apiGet('/assinaturas'),
      ])));
      if (!planos.length) {
        [planos, assinaturas] = await bootstrapAndRetry(async () => Promise.all([
          apiGet('/planos'),
          apiGet('/assinaturas'),
        ]));
      }
      renderPlans({ planos, assinaturas });
      return;
    }

    if (currentPage === 'reviews') {
      let [avaliacoes, reservas, salas] = await Promise.all([
        apiGet('/avaliacoes'),
        apiGet('/reservas?limit=100'),
        apiGet('/salas'),
      ]).catch(() => bootstrapAndRetry(async () => Promise.all([
        apiGet('/avaliacoes'),
        apiGet('/reservas?limit=100'),
        apiGet('/salas'),
      ])));
      if (!salas.length || !reservas.length) {
        [avaliacoes, reservas, salas] = await bootstrapAndRetry(async () => Promise.all([
          apiGet('/avaliacoes'),
          apiGet('/reservas?limit=100'),
          apiGet('/salas'),
        ]));
      }
      renderReviews({ avaliacoes, reservas, salas });
    }
  } catch (error) {
    showLoadError(error);
  }
}

boot();
