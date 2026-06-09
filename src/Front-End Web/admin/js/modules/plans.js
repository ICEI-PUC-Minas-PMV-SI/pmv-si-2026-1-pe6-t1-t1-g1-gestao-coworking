// Planos, beneficios, rascunhos e relatorios
// Arquivo extraido de admin-coworking.js para organizar o painel por dominio.

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
