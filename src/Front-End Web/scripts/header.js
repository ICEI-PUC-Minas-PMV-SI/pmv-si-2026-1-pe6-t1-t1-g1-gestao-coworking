const logado = localStorage.getItem("axisAuth");
let header = document.getElementsByClassName("header-logado");

if (logado) {
    header.innerHTML += `
        <div class="header-logado-user">
            <button id="btn-notificacao" class="bot-icon" title="Notificações">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"
                    fill="#0F2A44">
                    <path
                        d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q63 16 113 80.5T703-560v280h81v80H160Zm320-240Zm0 480q-33 0-56.5-23.5T400-240h160q0 33-23.5 56.5T480-40Zm-240-320h400v-280q0-83-58.5-141.5T480-720q-83 0-141.5 58.5T280-540v280Z" />
                </svg>
                <span class="badge-notificacao"></span>
            </button>

            <div class="user-profile" onclick="window.location.href = 'perfil.html'">
                <img src="../img/user.png" alt="">
                <span class="user-name">Marina</span>
            </div>
        </div>
    `
} else {
    header.innerHTML += `
        <div>
            <button class="bot2 bot" onclick="window.location.href = 'cadastro.html'">Cadastrar</button>
            <button class="bot1 bot" onclick="window.location.href = 'login.html'">Entrar</button>
        </div>
    `;
};