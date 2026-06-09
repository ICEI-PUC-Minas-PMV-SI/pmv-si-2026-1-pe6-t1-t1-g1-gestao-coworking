// Dashboard, reservas e indicadores
// Arquivo extraido de admin-coworking.js para organizar o painel por dominio.

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
