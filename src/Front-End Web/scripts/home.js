function check_login() {
    const token = localStorage.getItem('token_acesso');
    return !!token
}

function direcionar_marcar() {
    const logado = check_login();
    let pagina = '';

    if (logado) {
        pagina = 'marcar.html';
    } else {
        pagina = 'login.html';
    };

    window.location.href= pagina;
}

function direcionar_plano(escolha) {
    const logado = check_login();
    const plano = escolha;
    let pagina = '';

    if (!logado) {
        pagina = 'login.html';
    } else {
        switch (plano) {
            case 0 :
                pagina = 'planos.html';
                break;
            default :
                localStorage.setItem('plano_escolhido', plano);
                pagina = 'carrinho.html';
        }
    }

    window.location.href= pagina;
}

async function carregarHome() {
    console.log("Carregando...")

    try {
        await Promise.all([
            carregarSalas(),
            carregarPlanos()
        ]);

        console.log("Site carregado.");
    } catch (erro) {
        console.error("Erro ao carregar:", erro);
    }
}

async function carregarSalas() {
    const container = document.querySelector('.salas');
    
    try {
        const resposta = await fetch('http://127.0.0.1:8001//api/salas');
        const objeto = await resposta.json();
        const dados = objeto.slice(0,4);

        container.innerHTML = '';

        dados.forEach(sala => {
            const cardHTML = `
                <div class="salas-card">
                    <img src="${sala.imagem}" alt="${sala.titulo}">
                    <div class="salas-info">
                        <h3>${sala.titulo}</h3>
                        <p>${sala.descricao}</p>
                    </div>
                </div>
            `;
            
            container.innerHTML += cardHTML;
        });

        const botoes = `
            <button class="bot bot2" onclick="window.location.href = 'salas.html'">Veja mais sobre os nossos espaços.</button>
            <button id="marcar" class="bot bot1" onclick="direcionar_marcar()">Marque um horário !</button>
        `;

        container.innerHTML += cardHTML;
    } catch (erro) {
        console.error('Erro ao buscar salas:', erro);
        container.innerHTML = '<p style="grid-column: span4;">Não foi possível carregar as salas no momento.</p>';
    }
}

async function carregarPlanos() {
    const container = document.querySelector('.plano-grid');
    
    try {
        const resposta = await fetch('http://127.0.0.1:8001//api/planos');
        const objeto = await resposta.json();
        const dados = objeto.slice(0,3);

        container.innerHTML = '';

        let contador = 1;

        dados.forEach(plano => {
            const cardHTML = `
                <div class="plano-card">
                    <h3>${plano.titulo}</h3>
                    <div class="preco">R$${plano.preco}<span>/mês</span></div>
                    <button class="bot bot1" onclick="direcionar_plano(${contador})">Assine Já !</button>
                </div>
            `;

            contador += 1;
            
            container.innerHTML += cardHTML;
        });

        const botoes = `
            <button class="bot bot1" onclick="direcionar_plano(0)">Veja mais sobre nossos planos !</button>
        `;
        
        container.innerHTML += cardHTML;
    } catch (erro) {
        console.error('Erro ao buscar planos:', erro);
        container.innerHTML = '<p style="grid-column: span3;">Não foi possível carregar os planos no momento.</p>';
    }
}

window.onload = carregarHome;