// Usuarios, filtros, paginacao e assinaturas
// Arquivo extraido de admin-coworking.js para organizar o painel por dominio.

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
