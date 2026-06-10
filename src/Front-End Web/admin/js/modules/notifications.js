// Notificacoes do painel administrativo
// Arquivo extraido de admin-coworking.js para organizar o painel por dominio.

function notificationUserName(idCliente) {
  const cliente = pageState.clientes.find((item) => Number(item.id_cliente) === Number(idCliente));
  return cliente?.nome || `Usuário #${idCliente}`;
}

async function loadNotificationData() {
  const [notificacoes, clientes, tipos] = await Promise.all([
    apiGet('/notificacoes'),
    pageState.clientes.length ? Promise.resolve(pageState.clientes) : apiGet('/clientes'),
    pageState.notificacaoTipos.length ? Promise.resolve(pageState.notificacaoTipos) : apiGet('/notificacoes/tipos'),
  ]);
  pageState.notificacoes = notificacoes;
  pageState.clientes = clientes;
  pageState.notificacaoTipos = tipos;
  return { notificacoes, clientes, tipos };
}

async function refreshNotificationBadge() {
  try {
    const unread = await apiGet('/notificacoes?lida=false');
    const dot = document.querySelector('.topbar-right .icon-btn .dot');
    if (dot) {
      dot.style.display = unread.length ? 'block' : 'none';
      dot.title = unread.length ? `${unread.length} notificações não lidas` : 'Sem notificações não lidas';
    }
  } catch (error) {
    console.error(error);
  }
}

function notificationItem(notificacao) {
  const status = notificacao.lida ? 'Lida' : 'Não lida';
  return `
    <div class="notification-item${notificacao.lida ? '' : ' is-unread'}" data-notification-id="${notificacao.id_notificacao}">
      <div class="notification-marker">${notificacao.lida ? icon('icon-more', 12) : icon('icon-bell', 12)}</div>
      <div class="notification-content">
        <div class="notification-topline">
          <div class="notification-title">${escapeHtml(notificacao.tipo)}</div>
          <span class="notification-status${notificacao.lida ? '' : ' is-active'}">${status}</span>
        </div>
        <div class="notification-meta">${escapeHtml(notificationUserName(notificacao.id_cliente))} · ${formatDate(notificacao.criado_em)}</div>
        <p>${escapeHtml(notificacao.corpo)}</p>
      </div>
      <div class="row-actions">
        ${notificacao.lida ? '' : `<button title="Marcar como lida" data-action="read-notification" data-id="${notificacao.id_notificacao}">${icon('icon-user-check', 14)}</button>`}
        <button title="Detalhes" data-action="view-notification" data-id="${notificacao.id_notificacao}">${icon('icon-more', 14)}</button>
      </div>
    </div>
  `;
}

function bindNotificationActions() {
  document.querySelectorAll('[data-action="read-notification"]').forEach((button) => {
    button.addEventListener('click', async () => {
      await apiSend(`/notificacoes/${button.dataset.id}/lida`, { method: 'PATCH' });
      await refreshNotificationBadge();
      openNotificationsModal();
    });
  });

  document.querySelectorAll('[data-action="view-notification"]').forEach((button) => {
    button.addEventListener('click', () => openNotificationDetailModal(button.dataset.id));
  });

  document.querySelector('[data-read-all-notifications]')?.addEventListener('click', async () => {
    const unread = pageState.notificacoes.filter((item) => !item.lida);
    await Promise.all(unread.map((item) => apiSend(`/notificacoes/${item.id_notificacao}/lida`, { method: 'PATCH' })));
    await refreshNotificationBadge();
    openNotificationsModal();
  });
}

async function openNotificationsModal() {
  try {
    await loadNotificationData();
    const unread = pageState.notificacoes.filter((item) => !item.lida).length;
    const read = pageState.notificacoes.length - unread;
    const modal = openModal({
      title: 'Notificações',
      subtitle: `${unread} não lidas de ${pageState.notificacoes.length} notificações.`,
      body: `
        <div class="notification-center-head">
          <div class="notification-stat">
            <span>Total</span>
            <strong>${pageState.notificacoes.length}</strong>
          </div>
          <div class="notification-stat is-hot">
            <span>Não lidas</span>
            <strong>${unread}</strong>
          </div>
          <div class="notification-stat">
            <span>Lidas</span>
            <strong>${read}</strong>
          </div>
        </div>
        <div class="notification-list">
          ${pageState.notificacoes.length
            ? pageState.notificacoes.map(notificationItem).join('')
            : '<p class="modal-copy">Nenhuma notificação cadastrada.</p>'}
        </div>
      `,
      actions: `
        ${unread ? '<button class="btn btn--ghost" type="button" data-read-all-notifications>Marcar todas como lidas</button>' : ''}
        <button class="btn btn--ghost" type="button" data-create-notification>Criar gatilho</button>
        <button class="btn btn--primary" type="button" data-modal-close>Fechar</button>
      `,
    });
    modal.querySelector('[data-create-notification]').addEventListener('click', openCreateNotificationModal);
    bindNotificationActions();
  } catch (error) {
    console.error(error);
    showActionMessage('Não foi possível carregar as notificações.');
  }
}

function openNotificationDetailModal(idNotificacao) {
  const notificacao = pageState.notificacoes.find((item) => String(item.id_notificacao) === String(idNotificacao));
  if (!notificacao) return;
  const modal = openModal({
    title: notificacao.tipo,
    subtitle: `${notificationUserName(notificacao.id_cliente)} · ${formatDate(notificacao.criado_em)}`,
    body: `
      <div class="report-grid">
        <div class="report-card"><span>Usuário</span><b>${escapeHtml(notificationUserName(notificacao.id_cliente))}</b></div>
        <div class="report-card"><span>Status</span><b>${notificacao.lida ? 'Lida' : 'Não lida'}</b></div>
      </div>
      <p class="modal-copy">${escapeHtml(notificacao.corpo)}</p>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-back-notifications>Voltar</button>
      ${notificacao.lida ? '' : '<button class="btn btn--ghost" type="button" data-read-current>Marcar como lida</button>'}
      <button class="btn btn--primary" type="button" data-modal-close>Fechar</button>
    `,
  });
  modal.querySelector('[data-back-notifications]').addEventListener('click', openNotificationsModal);
  modal.querySelector('[data-read-current]')?.addEventListener('click', async () => {
    await apiSend(`/notificacoes/${notificacao.id_notificacao}/lida`, { method: 'PATCH' });
    await refreshNotificationBadge();
    openNotificationsModal();
  });
}

function openCreateNotificationModal() {
  const today = new Date().toISOString().slice(0, 10);
  const modal = openModal({
    title: 'Criar gatilho de notificação',
    subtitle: 'Selecione os usuários que receberão a notificação.',
    body: `
      <form id="notification-form" class="modal-body">
        <label style="display:flex;align-items:center;gap:8px;flex-direction:row">
          <input type="checkbox" name="todos" />
          <span class="field-label" style="margin:0">Enviar para todos os usuários</span>
        </label>
        <label>
          <div class="field-label">Usuários</div>
          <select class="field-select notification-users-select" name="id_clientes" multiple>
            ${pageState.clientes.map((cliente) => `<option value="${cliente.id_cliente}">${escapeHtml(cliente.nome)} · ${escapeHtml(cliente.email || '')}</option>`).join('')}
          </select>
        </label>
        <label>
          <div class="field-label">Gatilho</div>
          <select class="field-select" name="tipo" required>
            ${pageState.notificacaoTipos.map((tipo) => `<option value="${escapeHtml(tipo)}">${escapeHtml(tipo)}</option>`).join('')}
          </select>
        </label>
        <label>
          <div class="field-label">Mensagem</div>
          <textarea class="field-textarea" name="corpo" maxlength="500" required></textarea>
        </label>
        <label>
          <div class="field-label">Data de criação</div>
          <input class="field-input" name="criado_em" type="date" value="${today}" required />
        </label>
      </form>
    `,
    actions: `
      <button class="btn btn--ghost" type="button" data-back-notifications>Voltar</button>
      <button class="btn btn--primary" type="submit" form="notification-form">Criar notificação</button>
    `,
  });

  modal.querySelector('[data-back-notifications]').addEventListener('click', openNotificationsModal);

  // "Todos os usuários": desabilita a seleção individual quando marcado.
  const usersSelect = modal.querySelector('select[name="id_clientes"]');
  const todosCheckbox = modal.querySelector('input[name="todos"]');
  todosCheckbox.addEventListener('change', () => {
    usersSelect.disabled = todosCheckbox.checked;
  });

  modal.querySelector('#notification-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ids = todosCheckbox.checked
      ? pageState.clientes.map((cliente) => Number(cliente.id_cliente))
      : [...usersSelect.selectedOptions].map((option) => Number(option.value));
    const corpo = String(form.get('corpo') || '').trim();
    if (!ids.length || !corpo) {
      showActionMessage('Selecione ao menos um usuário (ou marque "todos") e informe a mensagem.');
      return;
    }

    try {
      await Promise.all(ids.map((idCliente) => apiSend('/notificacoes', {
        method: 'POST',
        body: JSON.stringify({
          id_cliente: idCliente,
          tipo: form.get('tipo'),
          corpo,
          lida: false,
          criado_em: form.get('criado_em'),
        }),
      })));
      await refreshNotificationBadge();
      showActionMessage('Notificação criada com sucesso.');
      openNotificationsModal();
    } catch (error) {
      console.error(error);
      showActionMessage('Não foi possível criar a notificação.');
    }
  });
}

function bindNotificationBell() {
  const bellButton = document.querySelector('.topbar-right .icon-btn');
  if (!bellButton) return;
  bellButton.addEventListener('click', openNotificationsModal);
  refreshNotificationBadge();
}
