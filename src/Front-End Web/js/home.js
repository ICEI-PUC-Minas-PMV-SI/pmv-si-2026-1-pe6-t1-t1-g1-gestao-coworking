const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL) || 'http://127.0.0.1:8000/api';

function check_login() {
    return !!localStorage.getItem('axisWork.auth') || !!localStorage.getItem('token_acesso');
}

function direcionar_marcar() {
    window.location.href = check_login() ? 'gerenciamento-conta.html#reservas' : 'login.html';
}

function direcionar_plano(escolha) {
    if (!check_login()) {
        window.location.href = 'login.html';
        return;
    }

    if (Number(escolha) === 0) {
        window.location.href = 'planos.html';
        return;
    }

    localStorage.setItem('plano_escolhido', String(escolha));
    window.location.href = `carrinho.html?plano=${encodeURIComponent(escolha)}`;
}

function listaDeApi(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.value)) return data.value;
    return [];
}

function textoPreco(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
    });
}

function imagemSala(index) {
    const imagens = [
        '../img/fundo-escritorio.jpg',
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80',
    ];
    return imagens[index % imagens.length];
}

async function buscarApi(path) {
    const resposta = await fetch(`${API_BASE_URL}${path}`);
    if (!resposta.ok) {
        throw new Error(`Erro ${resposta.status} ao buscar ${path}`);
    }
    return resposta.json();
}

async function carregarHome() {
    try {
        await Promise.all([
            carregarSalas(),
            carregarPlanos(),
        ]);
    } catch (erro) {
        console.error('Erro ao carregar home:', erro);
    }
}

async function carregarSalas() {
    const container = document.querySelector('.salas');

    try {
        const dados = listaDeApi(await buscarApi('/salas')).slice(0, 4);

        if (!dados.length) {
            container.innerHTML = '<p style="grid-column: span 4;">Nenhuma sala disponivel no momento.</p>';
            return;
        }

        container.innerHTML = dados.map((sala, index) => `
            <div class="salas-card">
                <img src="${imagemSala(index)}" alt="${sala.nome || 'Sala Axis Working'}">
                <div class="salas-info">
                    <h3>${sala.nome || 'Sala sem nome'}</h3>
                    <p>${sala.descricao || sala.tipo || 'Espaco disponivel para reserva.'}</p>
                    <div class="lista">
                        <p>${sala.capacidade || 0} pessoas</p>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML += `
            <button class="bot bot2" onclick="window.location.href = 'salas.html'">Veja mais sobre os nossos espaços.</button>
            <button id="marcar" class="bot bot1" onclick="direcionar_marcar()">Marque um horário !</button>
        `;
    } catch (erro) {
        console.error('Erro ao buscar salas:', erro);
        container.innerHTML = '<p style="grid-column: span 4;">Não foi possível carregar as salas no momento.</p>';
    }
}

async function carregarPlanos() {
    const container = document.querySelector('.plano-grid');

    try {
        const dados = listaDeApi(await buscarApi('/planos')).slice(0, 3);

        if (!dados.length) {
            container.innerHTML = '<p style="grid-column: span 3;">Nenhum plano disponivel no momento.</p>';
            return;
        }

        container.innerHTML = dados.map((plano) => `
            <div class="plano-card">
                <h3>${plano.nome || 'Plano Axis'}</h3>
                <div class="preco">${textoPreco(plano.preco)}<span>/mês</span></div>
                <div class="lista">
                    <p>${plano.acesso || 'Acesso ao coworking'}</p>
                </div>
                <button class="bot bot1" onclick="direcionar_plano(${plano.id_plano})">Assine Já !</button>
            </div>
        `).join('');

        container.innerHTML += `
            <button class="bot bot1" onclick="direcionar_plano(0)">Veja mais sobre nossos planos !</button>
        `;
    } catch (erro) {
        console.error('Erro ao buscar planos:', erro);
        container.innerHTML = '<p style="grid-column: span 3;">Não foi possível carregar os planos no momento.</p>';
    }
}

window.addEventListener('load', carregarHome);
