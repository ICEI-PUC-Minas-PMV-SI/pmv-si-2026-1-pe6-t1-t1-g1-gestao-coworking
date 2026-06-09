// Salas, fotos, formularios e exportacao
// Arquivo extraido de admin-coworking.js para organizar o painel por dominio.

function getRoomById(id) {
  return pageState.salas.find((sala) => String(sala.id_sala) === String(id));
}

async function refreshRooms() {
  const salas = await apiGet('/salas');
  renderRooms({ salas });
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
