const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL) || 'http://127.0.0.1:8000/api';

const tipoMap = {
  privado: ['2 Sala Individual'],
  compartilhado: ['1 Mesa de Trabalho'],
  fixa: ['1 Mesa de Trabalho'],
  reuniao: ['3 Sala de Atendimento', '4 Sala de Reunião', '4 Sala de ReuniÃ£o'],
};

const imagensSala = [
  '../img/individual.jpeg',
  '../img/compartilhada.jpeg',
  '../img/fixa.jpeg',
  '../img/reuniao.jpeg',
];

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const _hoje = new Date();
let currentMonth = _hoje.getMonth();
let currentYear  = _hoje.getFullYear();
let selectedDay  = null;
let reservasDaSala = [];

function apiList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.value)) return data.value;
  return [];
}

async function fetchApi(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error(`Erro ${response.status} em ${path}`);
  return response.json();
}

function isLogged() {
  return !!localStorage.getItem('axisWork.auth') || !!localStorage.getItem('token_acesso');
}

function goTipo(tipo) {
  const tipoAtual = localStorage.getItem('tipoSalaFiltro') || '';
  const novoTipo = tipoAtual === tipo ? '' : tipo;
  localStorage.setItem('tipoSalaFiltro', novoTipo);

  document.querySelectorAll('.top-card').forEach((item) => item.classList.remove('active'));
  if (novoTipo) document.getElementById(novoTipo)?.classList.add('active');

  carregarSalas();
}

function tipoSalaCorresponde(sala, tipoSelecionado) {
  if (!tipoSelecionado) return true;
  const tipos = tipoMap[tipoSelecionado] || [];
  return tipos.some((tipo) => String(sala.tipo || '').toLowerCase() === tipo.toLowerCase());
}

function imagemPorIndice(index) {
  return imagensSala[index % imagensSala.length];
}

async function carregarSalas() {
  const lista = document.getElementById('lista');
  if (!lista) return;

  try {
    const tipoSelecionado = localStorage.getItem('tipoSalaFiltro') || '';
    const salas = apiList(await fetchApi('/salas?ativas=true'))
      .filter((sala) => tipoSalaCorresponde(sala, tipoSelecionado));

    if (!salas.length) {
      lista.innerHTML = '<p>Nenhuma sala encontrada para esse filtro.</p>';
      return;
    }

    lista.innerHTML = salas.map((sala, index) => `
      <div class="card" onclick="abrirSala(${sala.id_sala})">
        <img src="${imagemPorIndice(index)}" alt="${sala.nome || 'Sala Axis'}">
        <div class="card-content">
          <h3>${sala.nome || 'Sala sem nome'}</h3>
          <p>Capacidade: ${sala.capacidade || 0} pessoas</p>
          <p>${sala.descricao || sala.recursos || sala.tipo || 'Espaço disponível para reserva.'}</p>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error(error);
    lista.innerHTML = '<p>Não foi possível carregar as salas no momento.</p>';
  }
}

function abrirSala(idSala) {
  localStorage.setItem('salaId', String(idSala));
  window.location.href = `sala.html?id=${encodeURIComponent(idSala)}`;
}

function getSalaId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || localStorage.getItem('salaId') || '1';
}

async function carregarSala() {
  if (!document.getElementById('sala-nome')) return;

  const salaId = getSalaId();
  localStorage.setItem('salaId', salaId);

  try {
    const sala = await fetchApi(`/salas/${salaId}`);
    document.getElementById('sala-nome').textContent = sala.nome || 'Sala';
    document.getElementById('sala-descricao').textContent = sala.descricao || 'Sala moderna com ótima estrutura.';
    document.getElementById('sala-recursos').textContent = sala.recursos || 'Wi-Fi, projetor e ar-condicionado';
    document.getElementById('sala-imagem').src = imagemPorIndice(Number(sala.id_sala || 1) - 1);
  } catch (error) {
    console.error(error);
    document.getElementById('sala-descricao').textContent = 'Não foi possível carregar os dados da sala.';
  }
}

async function carregarDisponibilidade() {
  if (!document.getElementById('calendar')) return;

  const salaId = getSalaId();
  try {
    reservasDaSala = apiList(await fetchApi(`/reservas?id_sala=${encodeURIComponent(salaId)}&limit=100`));
  } catch (error) {
    console.error(error);
    reservasDaSala = [];
  }

  selectedDay = null;
  renderCalendar();
  renderTimes(null); // horários ficam ocultos até o usuário clicar num dia
}

function diasOcupados() {
  // Retorna Set com os dias que têm TODOS os horários tomados (dia inteiro bloqueado)
  // Para simplificar: marca o dia como "parcialmente ocupado" só na cor, não bloqueado
  const diasDoMes = reservasDaSala
    .filter((reserva) => {
      const entrada = new Date(reserva.entrada);
      return entrada.getMonth() === currentMonth && entrada.getFullYear() === currentYear;
    })
    .map((reserva) => new Date(reserva.entrada).getDate());
  return diasDoMes; // dias que têm ao menos 1 reserva
}

function horariosOcupadosNoDia(dia) {
  // Retorna array de strings "HH:MM" das reservas no dia/mês/ano atual
  return reservasDaSala
    .filter((reserva) => {
      const entrada = new Date(reserva.entrada);
      return (
        entrada.getDate()     === dia &&
        entrada.getMonth()    === currentMonth &&
        entrada.getFullYear() === currentYear
      );
    })
    .map((reserva) =>
      new Date(reserva.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    );
}

function renderCalendar() {
  const calendar = document.getElementById('calendar');
  if (!calendar) return;

  document.getElementById('monthTitle').textContent = `${monthNames[currentMonth]} ${currentYear}`;

  const diasComReserva = new Set(diasOcupados());
  const daysInMonth    = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstWeekDay   = new Date(currentYear, currentMonth, 1).getDay(); // 0=Dom
  const hoje           = new Date();
  const ehMesAtual     = hoje.getMonth() === currentMonth && hoje.getFullYear() === currentYear;

  calendar.innerHTML = '';

  // Células vazias para alinhar o dia 1 na coluna certa
  for (let i = 0; i < firstWeekDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-day empty';
    calendar.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    div.textContent = day;

    // Dia no passado → desabilitado
    const dataDia = new Date(currentYear, currentMonth, day);
    const hoje0   = new Date(); hoje0.setHours(0,0,0,0);
    if (dataDia < hoje0) {
      div.classList.add('disabled');
      calendar.appendChild(div);
      continue;
    }

    // Hoje → destaque visual extra
    if (ehMesAtual && day === hoje.getDate()) {
      div.classList.add('today');
    }

    // Tem ao menos uma reserva → pontinho indicador, mas ainda clicável
    if (diasComReserva.has(day)) {
      div.classList.add('has-reserva');
    }

    // Restaurar seleção ao trocar de mês (se mesmo dia ainda existir)
    if (selectedDay === day) {
      div.classList.add('selected');
    }

    div.addEventListener('click', () => {
      document.querySelectorAll('.calendar-day').forEach((item) => item.classList.remove('selected'));
      div.classList.add('selected');
      selectedDay = day;
      renderTimes(day);
    });

    calendar.appendChild(div);
  }
}

function renderTimes(dia) {
  const timesList = document.getElementById('times-list');
  if (!timesList) return;

  // Sem dia selecionado: mostra mensagem orientativa
  if (dia == null) {
    timesList.innerHTML = '<p class="times-hint">Selecione um dia no calendário para ver os horários disponíveis.</p>';
    return;
  }

  const ocupados = new Set(horariosOcupadosNoDia(dia));
  const times = ['07:00','08:00','09:00','10:00','11:00','12:00',
                  '13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
  const disponiveis = times.filter((t) => !ocupados.has(t));

  if (!disponiveis.length) {
    timesList.innerHTML = '<p class="times-hint">Nenhum horário disponível neste dia.</p>';
    return;
  }

  timesList.innerHTML = disponiveis.map((time) => `
    <div class="time-slot" onclick="selecionarHorario(this)" data-time="${time}">${time}</div>
  `).join('');
}

function selecionarHorario(element) {
  if (element.classList.contains('disabled')) return;
  document.querySelectorAll('.time-slot').forEach((item) => item.classList.remove('selected'));
  element.classList.add('selected');
}

function mudarMes(delta) {
  currentMonth += delta;
  if (currentMonth < 0)  { currentMonth = 11; currentYear -= 1; }
  if (currentMonth > 11) { currentMonth = 0;  currentYear += 1; }
  selectedDay = null;
  renderCalendar();
  renderTimes(null); // limpa os horários ao trocar de mês
}

async function carregarAvaliacoes() {
  if (!document.getElementById('reviews-list')) return;

  try {
    const salaId = Number(getSalaId());
    const avaliacoes = apiList(await fetchApi('/avaliacoes'))
      .filter((avaliacao) => Number(avaliacao.id_sala) === salaId);

    const total = avaliacoes.length;
    const media = total ? avaliacoes.reduce((sum, avaliacao) => sum + Number(avaliacao.nota || 0), 0) / total : 0;
    const melhor = [...avaliacoes].sort((a, b) => Number(b.nota || 0) - Number(a.nota || 0))[0];

    document.getElementById('review-average').textContent = media.toFixed(1);
    document.getElementById('review-total').textContent = `Baseado em ${total} avaliações`;
    document.getElementById('review-stars').textContent = '★'.repeat(Math.round(media)).padEnd(5, '-');
    document.getElementById('rating-score').textContent = media.toFixed(1);
    document.getElementById('rating-count').textContent = `${total} avaliações`;
    document.getElementById('rating-title').textContent = media >= 4.8 ? 'Maravilhoso' : media >= 4.5 ? 'Excelente' : media >= 4 ? 'Ótimo' : 'Avaliações';
    document.getElementById('best-review-text').textContent = melhor?.corpo || 'Nenhuma avaliação encontrada.';
    document.getElementById('best-review-user').textContent = melhor?.nome_usuario || 'Axis';
    document.getElementById('best-review-avatar').textContent = (melhor?.nome_usuario || 'A').charAt(0).toUpperCase();

    document.getElementById('reviews-list').innerHTML = avaliacoes.slice(0, 4).map((avaliacao) => `
      <div class="review-item">
        <div class="review-item-top">
          <div class="review-user">
            <div class="review-avatar">${(avaliacao.nome_usuario || 'A').charAt(0)}</div>
            <div>
              <strong>${avaliacao.nome_usuario || 'Usuário'}</strong>
              <div class="review-stars">${'★'.repeat(Number(avaliacao.nota || 0))}</div>
            </div>
          </div>
          <span>${avaliacao.criado_em || ''}</span>
        </div>
        <p>${avaliacao.corpo || 'Sem comentário.'}</p>
      </div>
    `).join('') || '<p>Nenhuma avaliação encontrada.</p>';
  } catch (error) {
    console.error(error);
    document.getElementById('reviews-list').innerHTML = '<p>Não foi possível carregar avaliações.</p>';
  }
}

function reservarSala() {
  if (!isLogged()) {
    window.location.href = 'login.html';
    return;
  }

  if (!selectedDay) {
    alert('Selecione um dia no calendário antes de reservar.');
    return;
  }

  const slotSelecionado = document.querySelector('.time-slot.selected');
  if (!slotSelecionado) {
    alert('Selecione um horário antes de reservar.');
    return;
  }

  const horario = slotSelecionado.dataset.time; // "HH:MM"
  const mes     = String(currentMonth + 1).padStart(2, '0');
  const dia     = String(selectedDay).padStart(2, '0');
  const data    = `${currentYear}-${mes}-${dia}`; // "YYYY-MM-DD"
  const salaId  = getSalaId();

  const params = new URLSearchParams({
    sala:    salaId,
    data:    data,
    horario: horario,
  });

  window.location.href = `confirmar-reserva.html?${params.toString()}`;
}

document.getElementById('prevMonth')?.addEventListener('click', () => mudarMes(-1));
document.getElementById('nextMonth')?.addEventListener('click', () => mudarMes(1));

if (window.location.pathname.endsWith('salas.html')) {
  localStorage.setItem('tipoSalaFiltro', '');
  carregarSalas();
}

if (window.location.pathname.endsWith('sala.html')) {
  carregarSala();
  carregarDisponibilidade();
  carregarAvaliacoes();
}
