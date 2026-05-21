// Nucleo compartilhado, estado e helpers
// Arquivo extraido de admin-coworking.js para organizar o painel por dominio.

const API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:8000/api';
const currentPage = document.body.dataset.page;
const PLAN_DRAFT_STORAGE_KEY = 'axisWork.planDraft';
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
