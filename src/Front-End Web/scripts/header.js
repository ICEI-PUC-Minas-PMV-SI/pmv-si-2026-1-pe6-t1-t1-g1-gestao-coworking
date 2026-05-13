const logado = localStorage.getItem("axisAuth");
let header = document.getElementsByClassName("header-logado");

if (logado) {
    console.log('logado');
} else {
    header.innerHTML += `
        <div>
            <button class="bot2 bot" onclick="window.location.href = 'cadastro.html'">Cadastrar</button>
            <button class="bot1 bot" onclick="window.location.href = 'login.html'">Entrar</button>
        </div>
    `;
};