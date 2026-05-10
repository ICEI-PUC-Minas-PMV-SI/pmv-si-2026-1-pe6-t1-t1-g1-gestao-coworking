function goTipo(tipo){
  localStorage.setItem('tipo', tipo);
  location.href = 'salas.html';
}

function alertLogin(){
  alert('Você não está logado');
}

/* =========================
   LISTA DE SALAS
========================= */

if(document.getElementById('lista')){

  let lista = document.getElementById('lista');

  if(document.getElementById('lista')){

  let lista = document.getElementById('lista');

  /*const salas = [
    {
      nome:'Espaço privativo',
      img:'https://picsum.photos/500/300?1'
    },
    {
      nome:'Mesa compartilhada',
      img:'https://picsum.photos/500/300?2'
    },
    {
      nome:'Estação fixa',
      img:'https://picsum.photos/500/300?3'
    },
    {
      nome:'Sala de reunião',
      img:'https://picsum.photos/500/300?4'
    }
  ];

  salas.forEach(sala => {

    let el = document.createElement('div');

    el.className = 'card';

    el.innerHTML = `
      <img src="${sala.img}">

      <div class="card-content">
        <h3>${sala.nome}</h3>

        <p>Capacidade: 1 pessoa</p>

        <p>
          Wi-Fi de alta velocidade,
          climatização e ambiente confortável.
        </p>
      </div>
    `;

    el.onclick = () => location.href = 'sala.html';

    lista.appendChild(el);
  });*/
}};

async function carregarSalas(){

  const lista =
    document.getElementById("lista");

  if(!lista) return;

  try{

    const tipo =
      localStorage.getItem("tipo");

    let url =
      "http://localhost:8000/salas";

    /* filtro por tipo */

    if(tipo){

      url += `?tipoSala=${tipo}`;
    }

    const response =
      await fetch(url);

    const salas =
      await response.json();

    lista.innerHTML = "";

    salas.forEach(sala => {

      const el =
        document.createElement("div");

      el.className = "card";

      el.innerHTML = `
        <img src="${
          sala.imagem ||
          'https://picsum.photos/500/300'
        }">

        <div class="card-content">

          <h3>${sala.nome}</h3>

          <p>
            Capacidade:
            ${sala.capacidade} pessoas
          </p>

          <p>
            ${sala.recursos}
          </p>

        </div>
      `;

      el.onclick = () => {

        localStorage.setItem(
          "salaId",
          sala.id
        );

        location.href =
          "sala.html";
      };

      lista.appendChild(el);
    });

  }catch(error){

    console.log(error);
  }
}

carregarSalas();

/* =========================
   CALENDÁRIO 
========================= */

const monthNames = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

let currentMonth = 4;
let currentYear = 2026;

/* dias indisponíveis */
let unavailableDays = [];

/* horários indisponíveis */
let unavailableTimes = [];


function renderCalendar(){

  const calendar =
    document.getElementById("calendar");

  if(!calendar) return;

  calendar.innerHTML = "";

  document.getElementById("monthTitle")
    .innerText =
      `${monthNames[currentMonth]} ${currentYear}`;

  const daysInMonth =
    new Date(currentYear, currentMonth + 1, 0)
    .getDate();

  for(let day = 1; day <= daysInMonth; day++){

    const div = document.createElement("div");

    div.className = "calendar-day";

    div.innerText = day;

    if(unavailableDays.includes(day)){
      div.classList.add("disabled");
    }

    div.addEventListener("click", () => {

      if(div.classList.contains("disabled")) return;

      document
        .querySelectorAll(".calendar-day")
        .forEach(d => d.classList.remove("selected"));

      div.classList.add("selected");
    });

    calendar.appendChild(div);
  }
}

/* botão mês anterior */

document
.getElementById("prevMonth")
?.addEventListener("click", () => {

  currentMonth--;

  if(currentMonth < 0){
    currentMonth = 11;
    currentYear--;
  }

  renderCalendar();
});

/* botão próximo mês */

document
.getElementById("nextMonth")
?.addEventListener("click", () => {

  currentMonth++;

  if(currentMonth > 11){
    currentMonth = 0;
    currentYear++;
  }

  renderCalendar();
});

/* horários no caledário*/

function renderTimes(){

  const timesList =
    document.getElementById("times-list");

  if(!timesList) return;

  timesList.innerHTML = "";

  const times = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00",
    "18:00","19:00","20:00"];

  times.forEach(time => {

    const div = document.createElement("div");

    div.className = "time-slot";

    div.innerText = time;

    if(unavailableTimes.includes(time)){
      div.classList.add("disabled");
    }

    div.addEventListener("click", () => {

      if(div.classList.contains("disabled")) return;

      div.classList.toggle("selected");
    });

    timesList.appendChild(div);
  });
}

/* =========================
   DISPONIBILIDADE
========================= */
/*
async function carregarDisponibilidade(){

  const salaId =
    localStorage.getItem("salaId");

  if(!salaId) return;

  try{

    const response =
      await fetch(
        `https://localhost:8000/api/reserva?id_sala=1
      );

    const data =
      await response.json();

    unavailableDays =
      data.diasIndisponiveis;

    unavailableTimes =
      data.horariosIndisponiveis;

    renderCalendar();

    renderTimes();

  }catch(error){

    console.log(error);
  }
}

carregarDisponibilidade();

renderCalendar();
renderTimes();
*/
async function carregarDisponibilidade(){

  const salaId =
    localStorage.getItem("salaId");

  if(!salaId) return;

  try{

    const response =
      await fetch(
        `http://localhost:8000/api/reserva?id_sala=${salaId}`
      );

    const reservas =
      await response.json();

    /* limpa arrays */

    unavailableDays = [];
    unavailableTimes = [];

    reservas.forEach(reserva => {

      const entrada =
        new Date(reserva.entrada);

      /* dia indisponível */

      const dia =
        entrada.getDate();

      if(
        !unavailableDays.includes(dia)
      ){
        unavailableDays.push(dia);
      }

      /* horário indisponível */

      const hora =
        entrada.toLocaleTimeString(
          "pt-BR",
          {
            hour:"2-digit",
            minute:"2-digit"
          }
        );

      if(
        !unavailableTimes.includes(hora)
      ){
        unavailableTimes.push(hora);
      }
    });

    renderCalendar();

    renderTimes();

  }catch(error){

    console.log(error);
  }
}

/* iniciar */

carregarDisponibilidade();



/* =========================
   AVALIAÇÕES DA SALA - na parte de cima
========================= */

async function carregarAvaliacaoSala(){

  try{

    /* ALTERE PARA A URL */
    const response =
      await fetch("https://localhost:8000/api/avaliacoes/1");

    if(!response.ok){
      throw new Error("Erro ao carregar avaliações");
    }

    const data = await response.json();



    /* NOTA */

    document.getElementById("rating-score")
      .innerText =
        Number(data.media).toFixed(1);

    /* TOTAL DE AVALIAÇÕES */

    document.getElementById("rating-count")
      .innerText =
        `${data.totalAvaliacoes} avaliações`;

    /* MELHOR COMENTÁRIO */

    document.getElementById("best-review-text")
      .innerText =
        `"${data.melhorComentario}"`;

    /* USUÁRIO */

    document.getElementById("best-review-user")
      .innerText =
        data.usuario;

    /* PRIMEIRA LETRA DO AVATAR */

    document.querySelector(".review-avatar")
      .innerText =
        data.usuario.charAt(0).toUpperCase();

    /* TÍTULO AUTOMÁTICO */

    const media = Number(data.media);

    let titulo = "Muito bom";

    if(media >= 4.8){
      titulo = "Maravilhoso";
    }
    else if(media >= 4.5){
      titulo = "Excelente";
    }
    else if(media >= 4){
      titulo = "Ótimo";
    }

    document.getElementById("rating-title")
      .innerText = titulo;

  }catch(error){

    console.log(error);

    document.getElementById("rating-title")
      .innerText = "Avaliações indisponíveis";
  }
}

/* INICIAR */

carregarAvaliacaoSala();


/* =========================
   AVALIAÇÕES -  na parte de baixo
========================= */

async function carregarReviews(){

  try{

    const response =
      await fetch("https://localhost:8000/api/reviews/1");

    const data = await response.json();

   

    /* MÉDIA */

    document.getElementById("review-average")
      .innerText = data.media.toFixed(1);

    document.getElementById("review-total")
      .innerText =
        `Baseado em ${data.total} avaliações`;

    /* DISTRIBUIÇÃO */

    const distribution =
      document.getElementById("review-distribution");

    distribution.innerHTML = "";

    [5,4,3,2,1].forEach(star => {

      const percent =
        data.distribuicao[star];

      distribution.innerHTML += `
        <div class="distribution-row">

          <span>${star}</span>

          <div class="distribution-bar">
            <div
              class="distribution-fill"
              style="width:${percent}%"
            ></div>
          </div>

          <span>${percent}%</span>

        </div>
      `;
    });

    /* LISTA */

    const reviewsList =
      document.getElementById("reviews-list");

    reviewsList.innerHTML = "";

    data.reviews.forEach(review => {

      reviewsList.innerHTML += `
        <div class="review-item">

          <div class="review-item-top">

            <div class="review-user">

              <div class="review-avatar">
                ${review.usuario.charAt(0)}
              </div>

              <div>

                <strong>
                  ${review.usuario}
                </strong>

                <div class="review-stars">
                  ${"★".repeat(review.nota)}
                </div>

              </div>

            </div>

            <span>
              ${review.tempo}
            </span>

          </div>

          <p>
            ${review.comentario}
          </p>

        </div>
      `;
    });

  }catch(error){

    console.log(error);
  }
}

/* ENVIAR REVIEW */

async function enviarAvaliacao(){

  const texto =
    document.getElementById("review-input").value;

  if(!texto){

    alert("Escreva uma avaliação");

    return;
  }

  const logado =
    localStorage.getItem("logado");

  if(logado !== "true"){

    alert("Você não está logado");

    return;
  }

  try{

    await fetch(
      "https://localhost:8000/api/reviews",
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({
          comentario:texto
        })
      }
    );

    alert("Avaliação enviada!");

    carregarReviews();

  }catch(error){

    console.log(error);
  }
}

carregarReviews();

/* =========================
   CARREGAR SALA
========================= */

async function carregarSala(){

  const salaId =
    localStorage.getItem("salaId");

  if(!salaId) return;

  try{

    const response =
      await fetch(
        `https://localhost:8000/api/salas/${salaId}`
      );

    const sala =
      await response.json();

    /* IMAGEM */

    document.querySelector(".box img")
      .src = sala.imagem;

    /* DESCRIÇÃO */

    document.querySelector(".box p")
      .innerText = sala.descricao;

  }catch(error){

    console.log(error);
  }
}

carregarSala();