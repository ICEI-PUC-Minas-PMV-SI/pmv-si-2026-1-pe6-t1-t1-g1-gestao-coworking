// Avaliacoes, filtros, CSV e respostas
// Arquivo extraido de admin-coworking.js para organizar o painel por dominio.

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
