const API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:8000/api';
const currentPage = document.body.dataset.page;
const pageState = {
  clientes: [],
  salas: [],
  planos: [],
  assinaturas: [],
  reservas: [],
  avaliacoes: [],
};

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

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
  const description = normalize(room.descricao || '');
  if (!room.ativa || description.includes('manutencao')) return { label: 'Manutenção', className: 'pill--warn' };
  if (description.includes('ocupada')) return { label: 'Ocupada', className: 'pill--solid' };
  return { label: 'Disponível', className: 'pill--green' };
}

function roomPrice(room) {
  const match = (room.descricao || '').match(/R\$\s?[\d.,]+\/(?:h|dia|mês|mes)/i);
  return match ? match[0].replace('/mes', '/mês') : 'Sob consulta';
}

function roomFloor(room) {
  const match = (room.descricao || '').match(/(?:no|na)\s([^.]*(?:andar|térreo|terreo))/i);
  return match ? match[1].replace('terreo', 'térreo') : 'Sem local';
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
    renderUsers({
      clientes: pageState.clientes,
      planos: pageState.planos,
      assinaturas: pageState.assinaturas,
    });
  });

  const roomsSearch = document.querySelector('.page[data-page="rooms"] .search-mini input');
  roomsSearch?.addEventListener('input', () => {
    renderRooms({ salas: pageState.salas });
  });

  const reviewsSearch = document.querySelector('.page[data-page="reviews"] .search-mini input');
  reviewsSearch?.addEventListener('input', () => {
    renderReviews({
      avaliacoes: pageState.avaliacoes,
      reservas: pageState.reservas,
      salas: pageState.salas,
    });
  });
}

function bindUserActions() {
  document.querySelectorAll('[data-action="delete-cliente"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      try {
        await apiSend(`/clientes/${id}`, { method: 'DELETE' });
        const [clientes, planos, assinaturas] = await Promise.all([
          apiGet('/clientes'),
          apiGet('/planos'),
          apiGet('/assinaturas'),
        ]);
        renderUsers({ clientes, planos, assinaturas });
        showActionMessage('Usuário removido do banco de dados.');
      } catch (error) {
        console.error(error);
        showActionMessage('Não foi possível remover o usuário porque ele possui reservas ou assinaturas relacionadas.');
      }
    });
  });
}

function bindRoomActions() {
  document.querySelectorAll('[data-action="delete-sala"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      try {
        await apiSend(`/salas/${id}`, { method: 'DELETE' });
        const salas = await apiGet('/salas');
        renderRooms({ salas });
        showActionMessage('Sala removida do banco de dados.');
      } catch (error) {
        console.error(error);
        showActionMessage('Não foi possível remover a sala porque ela possui reservas relacionadas.');
      }
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

function renderDashboard({ clientes, salas, planos, assinaturas, reservas }) {
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

  const clientesMap = clienteById(clientes);
  const salasMap = salaById(salas);
  const tbody = document.querySelector('table tbody');

  if (!tbody) return;

  tbody.innerHTML = reservas.slice(0, 5).map((reserva) => {
    const sala = salasMap.get(reserva.id_sala);
    const cliente = clientesMap.get(reserva.id_cliente);
    return `
      <tr>
        <td><div style="display:flex;align-items:center;gap:8px">${icon('icon-calendar')} ${sala?.nome || 'Sala removida'}</div></td>
        <td style="color:#1F3A57">${cliente?.nome || 'Cliente removido'}</td>
        <td>${formatTimeRange(reserva.entrada, reserva.saida)}</td>
        <td><span class="pill ${reservationPill(reserva.status)}">${reserva.status}</span></td>
      </tr>
    `;
  }).join('');
}

function renderUsers({ clientes, planos, assinaturas }) {
  pageState.clientes = clientes;
  pageState.planos = planos;
  pageState.assinaturas = assinaturas;

  const search = document.querySelector('.toolbar .search-mini input');
  const query = normalize(search?.value || '');
  const filteredClientes = query
    ? clientes.filter((cliente) => normalize(`${cliente.nome} ${cliente.email}`).includes(query))
    : clientes;

  const planosMap = planById(planos);
  const assinaturaPorCliente = latestSubscriptionByClient(assinaturas);
  const active = assinaturas.filter((assinatura) => assinatura.status === 'Ativa').length;
  const pending = assinaturas.filter((assinatura) => assinatura.status === 'Vencida').length;
  const inactive = assinaturas.filter((assinatura) => assinatura.status === 'Cancelada').length;

  updateText(document.querySelectorAll('.mini-stat .value'), [clientes.length, active, pending, inactive]);

  const toolbarCount = document.querySelector('.toolbar > div:last-child');
  if (toolbarCount) {
    toolbarCount.textContent = `${filteredClientes.length} de ${clientes.length} mostrados`;
  }

  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  tbody.innerHTML = filteredClientes.map((cliente) => {
    const assinatura = assinaturaPorCliente.get(cliente.id_cliente);
    const plano = planosMap.get(assinatura?.id_plano);
    return `
      <tr>
        <td><input type="checkbox" /></td>
        <td>
          <div class="user-cell">
            <div class="avatar-sm">${initials(cliente.nome)}</div>
            <div><b>${cliente.nome}</b><small>${cliente.email}</small></div>
          </div>
        </td>
        <td><span class="pill ${pillForPlan(plano?.nome)}">${plano?.nome || 'Sem plano'}</span></td>
        <td><span class="status-dot"><span class="dot ${statusDot(assinatura?.status)}"></span>${statusLabel(assinatura?.status)}</span></td>
        <td style="color:#1F3A57">${formatDate(assinatura?.feita_em)}</td>
        <td style="text-align:right">
          <div class="row-actions">
            <button title="Ativar">${icon('icon-user-check')}</button>
            <button title="Editar">${icon('icon-pencil')}</button>
            <button class="danger" title="Excluir" data-action="delete-cliente" data-id="${cliente.id_cliente}">${icon('icon-trash')}</button>
            <button title="Mais">${icon('icon-more')}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const paginationLabel = document.querySelector('.pagination > div:first-child');
  if (paginationLabel) {
    paginationLabel.textContent = 'Página 1 de 1';
  }

  bindUserActions();
}

function roomCard(room) {
  const status = roomStatus(room);
  const type = cleanRoomType(room.tipo);
  const amenities = [
    ['wifi', 'icon-wifi'],
    ['monitor', 'icon-monitor'],
    ['cafe', 'icon-coffee'],
  ].filter(([needle]) => normalize(room.recursos || '').includes(normalize(needle)));

  return `
    <div class="card" data-room-card="${room.id_sala}">
      <div class="room-media">
        <svg width="100%" height="100%" viewBox="0 0 300 110" preserveAspectRatio="none">
          <rect x="20" y="60" width="60" height="40" fill="#1F3A57" opacity="0.6"/>
          <rect x="90" y="40" width="80" height="60" fill="#0A1F33" opacity="0.7"/>
          <rect x="180" y="55" width="50" height="45" fill="#1F3A57" opacity="0.5"/>
          <rect x="240" y="35" width="50" height="65" fill="#0A1F33" opacity="0.5"/>
        </svg>
        <span class="badge"><span class="pill ${status.className}">${status.label}</span></span>
      </div>
      <div class="room-title">
        <div><b>${room.nome}</b><br><small>${type.toUpperCase()}</small></div>
        <div class="room-price">${roomPrice(room)}</div>
      </div>
      <div class="room-meta">
        <span>${icon('icon-users', 12)}${room.capacidade} pessoas</span>
        <span>${icon('icon-map-pin', 12)}${roomFloor(room)}</span>
      </div>
      <div class="amenities">
        ${amenities.map(([, iconName]) => `<span class="amenity">${icon(iconName, 12)}</span>`).join('')}
      </div>
      <div class="room-actions">
        <button class="btn btn--ghost btn--sm">${icon('icon-pencil', 11)}Editar</button>
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
    const matchesSearch = !query || normalize(`${sala.nome} ${sala.tipo} ${sala.descricao}`).includes(query);
    const matchesType = activeType === 'todos' || normalize(cleanRoomType(sala.tipo)).includes(activeType);
    return matchesSearch && matchesType;
  });

  container.innerHTML = filteredSalas.map(roomCard).join('');
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

  return `
    <div class="plan-card${featured ? ' is-featured' : ''}" data-plan-card="${plano.id_plano}">
      ${featured ? '<span class="badge-pop">MAIS POPULAR</span>' : ''}
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:14px;font-weight:700">${plano.nome}</div>
          <div style="font-size:10px;color:${featured ? '#A9BDCB' : '#6B7A8A'};margin-top:4px;line-height:1.4">${planDescription(plano.nome)}</div>
        </div>
        <button class="icon-pill" style="width:26px;height:26px;background:transparent;border:1px solid ${featured ? '#1F3A57' : '#D9DEDC'};color:${featured ? '#A9BDCB' : '#6B7A8A'}">${icon('icon-more', 12)}</button>
      </div>
      <div class="price"><b>${money.format(Number(plano.preco))}</b><small>${period}</small></div>
      <ul>
        ${planFeatures(plano.nome).map((feature) => `<li><span class="check">${icon('icon-check', 9)}</span><span>${feature}</span></li>`).join('')}
      </ul>
      <div class="footer">
        <span class="members">${icon('icon-users', 12)}${memberCount} membros</span>
        <div style="display:inline-flex;gap:6px">
          <button class="icon-pill" title="Editar">${icon('icon-pencil', 12)}</button>
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

  container.innerHTML = planos
    .map((plano) => renderPlanCard(plano, counts.get(plano.id_plano) || 0, plano.id_plano === popular?.id_plano))
    .join('');

  bindPlanActions();
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
    <div class="card review-item">
      <div class="review-head">
        <div style="display:flex;gap:12px;align-items:center;min-width:0">
          <div class="avatar-sm" style="width:38px;height:38px;font-size:11px">${initials(review.nome_usuario)}</div>
          <div>
            <div style="font-size:13px;font-weight:700;color:#0A1F33">${review.nome_usuario}</div>
            <div class="review-meta">
              <span>avaliou</span><b>${review.nome_sala}</b>
              <span style="color:#A9BDCB">·</span>
              <span class="pill pill--ok">${cleanRoomType(review.tipo_sala)}</span>
              <span style="color:#A9BDCB">·</span><span>${formatDate(review.criado_em)}</span>
            </div>
          </div>
        </div>
        <span class="pill ${status[1]}">${status[0]}</span>
      </div>
      <div class="review-body">
        ${stars(review.nota)}
        <p class="review-comment">"${review.corpo || 'Sem comentário informado.'}"</p>
      </div>
      <div class="review-foot">
        <button class="link-btn">${icon('icon-message', 12)}Responder</button>
        <div style="display:inline-flex;gap:6px">
          <button class="btn btn--ghost btn--sm">${icon('icon-pencil', 11)}Editar</button>
          <button class="btn btn--sm" style="background:#FFF;color:#8A3A3A;border:1px solid #D9DEDC">${icon('icon-trash', 11)}Excluir</button>
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

function renderReviews({ avaliacoes, reservas, salas }) {
  pageState.avaliacoes = avaliacoes;
  pageState.reservas = reservas;
  pageState.salas = salas;

  const search = document.querySelector('.page[data-page="reviews"] .search-mini input');
  const query = normalize(search?.value || '');
  const filteredAvaliacoes = query
    ? avaliacoes.filter((review) => normalize(`${review.nome_usuario} ${review.nome_sala} ${review.corpo}`).includes(query))
    : avaliacoes;

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
