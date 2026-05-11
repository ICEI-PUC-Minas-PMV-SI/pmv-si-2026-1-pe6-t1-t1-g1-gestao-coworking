# Front-end Web
<!-- [Inclua uma breve descrição do projeto e seus objetivos.]-->
&nbsp; &nbsp; &nbsp; No desenvolvimento do front-end do projeto do Axis Work coworking, serão utilizadas as linguagens HTML, CSS e JavaScript. A proposta é criar uma interface moderna, responsiva e intuitiva, que possibilite aos usuários conhecerem os serviços oferecidos, as salas, os planos disponíveis, consigam tirar suas duvidas e realizem ações como reservas, alterações ou cancelamentos de forma simples e prática. O foco está na experiência do usuário e organização das informações para deixar a navegação mais fluida e fácil para os usuários.

&nbsp; &nbsp; &nbsp; Objetivos:
- Desenvolver uma interface responsiva que funcione bem em desktops;
- Aplicar boas práticas de estruturação com HTML;
- Utilizar CSS para estilização e layout;
- Implementar interatividade com JavaScript;
- Melhorar a experiência do usuário com navegação clara e intuitiva;
- Simular funcionalidades reais de um site de coworking, como visualização de salas e reservas.


## Projeto da Interface Web

<!-- [Descreva o projeto da interface Web da aplicação, incluindo o design visual, layout das páginas, interações do usuário e outros aspectos relevantes.]-->
&nbsp; &nbsp; &nbsp; A interface Web dessa aplicação foi desenvolvida para o sistema de coworking da Axis Work. O enfoque desta abordagem foi em proporcionar uma experiência moderna, que os usuários consigam usar no dia a dia, a qual também seja uma experiência visualmente agradável para os mesmos. O projeto foi inspirado em padrões atuais da indústria e de plataformas de reserva e aluguel de espaços. A ideia é utilizar um design minimalista, com um visual clean e componentes interativos que facilitam a navegação e o processo de reserva das salas, transformando o aluguel de salas em algo fácil e parte da rotina do cliente.

&nbsp; &nbsp; &nbsp; O site foi desenvolvido utilizando HTML, CSS e JavaScript, com separação da estrutura, estilização e funcionalidades em arquivos distintos, permitindo melhor organização e manutenção do projeto. A interface possui um layout que utiliza uma identidade visual baseada em tons claros, com os botões e informações principais na cor do logo da empresa para enfatizá-los, cartões com bordas arredondadas para um visual moderno, sombras suaves e tipografia versátil e neutra para criar uma aparência semelhante a aplicações profissionais de mercado.

&nbsp; &nbsp; &nbsp; O header é padronizado em todas as páginas da aplicação, contendo a logomarca da empresa, menu de navegação e botões de acesso rápido. O logo funciona como botão de retorno à página inicial, enquanto o menu permite acessar áreas como salas, planos e sobre nós. No canto direito, há dois botões para cadastro e login que direciona o usuário para se juntar a outros clientes se cadastrando no site e caso já seja usuário poder fazer seu login e usufruir dos serviços da empresa.

&nbsp; &nbsp; &nbsp; A aplicação possui quatro páginas principais para definição de layout e design. A página inicial foi desenvolvida com um design moderno e organizado, voltado para apresentar os serviços do coworking e facilitar a navegação dos usuários. Além do header padrão, a página possui também sessões com cards informativos destacando os principais benefícios do espaço, à exibição das salas disponíveis e dos planos de assinatura.

&nbsp; &nbsp; &nbsp; A página de salas exibe as salas disponíveis de acordo com a categoria selecionada pelo usuário. As informações são carregadas dinamicamente através da integração com a API da aplicação. Cada sala apresenta imagem, e informações sobre as salas e principais recursos disponíveis. Os elementos são exibidos em formato de grade visual utilizando cards interativos, permitindo que os usuários cliquem em uma sala específica para serem direcionados a página da mesma e completarem a reserva, sendo possível escolher dia e horários, ver as avaliações e serem direcionados depois da confirmação da reserva para a home.

&nbsp; &nbsp; &nbsp; Já a página administrativa da aplicação foi desenvolvida para permitir o gerenciamento do coworking de forma organizada e intuitiva, utilizando um layout moderno no estilo dashboard corporativo. Ela é diferente das outras páginas para enfatizar que o ambiente é diferente do usuário comum para ajudar os administradores em seu trabalho. A interface possui um menu lateral fixo com acesso às principais áreas do sistema, como dashboard, usuários, salas, planos, avaliações, configurações e logout. A interface utiliza cores neutras, tons de azul escuro, cartões com bordas arredondadas, ícones ilustrativos e organização em grid para proporcionar melhor experiência visual.

&nbsp; &nbsp; &nbsp; Já na página de usuário o mesmo tem acesso aos dados da sua conta. Ela foi desenvolvida com um design simples e organizado, permitindo ao usuário gerenciar suas informações pessoais de forma prática. O layout, assim como na página administrativa, utiliza uma barra lateral de navegação para acesso rápido às seções da conta. A área principal apresenta um formulário com os dados do usuário, incluindo nome, CPF, e-mail e telefone, além de um botão para salvar alterações. O visual segue uma identidade moderna, com cores neutras, elementos arredondados e boa distribuição dos espaços, proporcionando uma experiência confortável ao usuário.

&nbsp; &nbsp; &nbsp; Essas quatro páginas são a base do design da aplicação. A interface de todas as páginas do site foram integradas às APIs da aplicação, permitindo comunicação com os módulos. Dessa forma, os dados exibidos na interface são carregados diretamente do banco de dados através do backend da aplicação. O resultado final é uma interface moderna, organizada e funcional, capaz de oferecer uma experiência de navegação semelhante à de plataformas conhecidas de coworking e reserva de espaços.



### Wireframes

<!--[Inclua os wireframes das páginas principais da interface, mostrando a disposição dos elementos na página.]-->

&nbsp; &nbsp; &nbsp; Página inicial:

<img src="img/index.jpg" width="300" justify-self="center">

&nbsp; &nbsp; &nbsp; Páginas informativas:

<img src="img/planos.jpg" width="300" justify-self="center">
<img src="img/carrinho.jpg" width="300" justify-self="center">
<img src="img/sobrenos.jpg" width="300" justify-self="center">
<img src="img/salas.jpg" width="300" justify-self="center">
<img src="img/sala.jpg" width="300" justify-self="center">

&nbsp; &nbsp; &nbsp; Páginas de administrador:

<img src="img/admin-coworking.jpg" width="300" justify-self="center">
<img src="img/dashboard.jpg" width="300" justify-self="center">
<img src="img/users.jpg" width="300" justify-self="center">
<img src="img/rooms.jpg" width="300" justify-self="center">
<img src="img/plans.jpg" width="300" justify-self="center">
<img src="img/reviews.jpg" width="300" justify-self="center">



&nbsp; &nbsp; &nbsp; Páginas de usuário:

<img src="img/login.jpg" width="300" justify-self="center">
<img src="img/cadastro.jpg" width="300" justify-self="center">
<img src="img/gerenciamento-conta.jpg" width="300" justify-self="center">
<img src="img/confirmar-reserva.jpg" width="300" justify-self="center">
<img src="img/alterar-reserva.jpg" width="300" justify-self="center">




### Design Visual

<!--[Descreva o estilo visual da interface, incluindo paleta de cores, tipografia, ícones e outros elementos gráficos.] -->
&nbsp; &nbsp; &nbsp; A identidade visual e a interface do sistema da Axis Work foi pensada para possuir uma estética minimalista e mais clean, seguindo as tendências do mercado. Por ser uma ferramenta de uso diário a escolha da família tipográfica proporcional Arial se tornou a melhor escolha, por essa ter um fluxo de leitura mais natural e rápido. Essa escolha tipográfica foi aplicada em diversas escalas de tamanho no site do coworking, para estabelecer uma hierarquia visual clara, variando desde títulos até botões e textos informativos, garantindo uma leitura precisa dos dados.

&nbsp; &nbsp; &nbsp; Já a paleta de cores é composta por uma escala de tons frios e neutros, onde o azul escuro atua como a cor de destaque para reforço de marca, seguindo o padrão já proposto do logo da mesma. Essas cores interagem com uma base de cinzas e variações de branco, assegurando alto contraste e conforto visual, além de serem cores que remetem ao profissionalismo, compromisso e confiança da marca.
Os elementos gráficos seguem um padrão geométrico, com botões em formato de pílula e preenchimentos sólidos. A iconografia utiliza o estilo preenchido com formas simples e universais, facilitando o reconhecimento imediato do usuário. O logotipo, Axis Work, integra-se harmonicamente ao site através da manutenção da tipografia padrão.

&nbsp; &nbsp; &nbsp; A organização do layout é estruturada por meio de sistemas de colunas que orientam o alinhamento de componentes. O uso estratégico do espaço em branco entre os componentes de navegação com o fundo azul claro, fazem uma transição entre os itens das páginas de maneira natural  o que evita a sobrecarga cognitiva, resultando em uma interface funcional que prioriza a clareza da informação e deixando mais fácil a visualização por parte do usuário.


<img src="img/Styles.png" width="300" justify-self="center">


## Fluxo de Dados
<!--[Diagrama ou descrição do fluxo de dados na aplicação.]-->

&nbsp; &nbsp; &nbsp; No Userflow da Axis Work foi optada a utilização de uma padronização visual por cores e formas:

Dessa forma, os pontos de Entrada e Saída são: 

- Retângulo Verde: Simboliza a Entrada Inicial. Representa o ponto de partida do fluxo.

- Retângulo Roxo: Simboliza a Saída Final. Indica a conclusão do objetivo do usuário ou o encerramento do processo atual.

As cores e a forma que simbolizam a tomada de Decisão são:

- Losango Amarelo: Representa uma Decisão do Usuário. Indica um ponto onde a pessoa precisa escolher entre caminhos diferentes.

- Losango Laranja: Representa uma Decisão do Sistema. Indica uma verificação automática feita pela api.

Já na interação e interface é o:

- Retângulo Azul: Simboliza uma Ação do Usuário. Representa cliques em botões, preenchimento de campos de texto ou qualquer interação física com a interface.

- Retângulo Branco: Indica o Tipo de Painel e Acesso. Diferencia visualmente qual ambiente está sendo visualizado, separando as permissões entre o Administrador e o Usuário Comum.

<img src="img/userflow1.png" width="500" justify-self="center">
<img src="img/userflow2.png" width="500" justify-self="center">
<img src="img/userflow3.png" width="500" justify-self="center">
<img src="img/userflow4.png" width="500" justify-self="center">
<img src="img/userflow5.png" width="500" justify-self="center">
<img src="img/userflow6.png" width="500" justify-self="center">
<img src="img/userflow7.png" width="500" justify-self="center">
<img src="img/userflow8.png" width="500" justify-self="center">
<img src="img/userflow9.png" width="500" justify-self="center">
<img src="img/userflow11.png" width="500" justify-self="center">
<img src="img/userflow10.png" width="200" justify-self="center">

## Tecnologias Utilizadas
<!-- [Lista das tecnologias principais que serão utilizadas no projeto.] -->
- HTML – Estruturação das páginas e organização do conteúdo;
- CSS – Estilização e layoult da interface;
- JavaScript – Implementação de interatividade, validações e manipulação de elementos;
- Figma – Criação dos protótipos e definição da interface do usuário;
- Draw.io - Wireframes;
- Visual Studio – Editor de código;
- GitHub – Controle de versão e armazenamento do código-fonte do projeto.


## Considerações de Segurança

## Cenario da Aplicacao

A Axis Working e uma aplicacao distribuida composta por:

- Front-end estatico em HTML, CSS e JavaScript, localizado em `Pages/`, `css/` e `js/`.
- API REST no backend, exposta atualmente em `http://127.0.0.1:8001/api`.
- Banco PostgreSQL, usado para clientes, salas, reservas, planos, assinaturas, notificacoes e avaliacoes.

O front-end e considerado estatico porque os arquivos sao entregues diretamente ao navegador. Mesmo assim, as telas sao dinamicas, pois usam JavaScript para buscar e enviar dados para a API.

Os principais riscos da aplicacao estao nos fluxos de login, persistencia da sessao no navegador, acesso aos dados do cliente, operacoes de reserva, painel administrativo e dados pessoais como CPF, email e telefone.

## Autenticacao

O login da aplicacao usa CPF e senha. Quando o login e concluido, o front-end salva os dados da sessao no `localStorage`, principalmente no item `axisAuth`.

No cenario atual, isso permite manter o usuario logado entre paginas como:

- `index.html`
- `salas.html`
- `sala.html`
- `confirmar-reserva.html`
- `gerenciamento-conta.html`

Para producao, a autenticacao precisa garantir:

- Senhas armazenadas no banco com `bcrypt` ou `argon2`.
- Token de acesso assinado com uma `SECRET_KEY` forte.
- Tempo de expiracao do token.
- Validacao do token em toda rota sensivel da API.
- Mensagem generica para falha de login, sem informar se o CPF existe.
- Limite de tentativas de login para reduzir ataque de forca bruta.

Como o token fica no `localStorage`, a principal preocupacao e XSS. Se algum script malicioso for executado na pagina, ele pode ler o token. Por isso, a aplicacao deve evitar renderizar HTML vindo da API sem sanitizacao.

## Autorizacao

A autorizacao deve ser feita no backend. O front-end pode esconder botoes, mas isso nao protege a API.

Regras especificas deste sistema:

- Cliente comum so pode consultar e alterar seus proprios dados.
- Cliente comum so pode listar suas proprias notificacoes pela tabela `notificacoes`, filtrando por `id_cliente`.
- Cliente comum so pode listar suas proprias avaliacoes pela tabela `avaliacoes`, filtrando por `id_cliente`.
- Cliente comum so pode consultar suas proprias reservas.
- Cliente comum pode criar reserva para si mesmo.
- Cliente comum pode cancelar uma reserva, mas nao deve alterar para `Em Andamento` ou `Finalizada`.
- Reserva com status `Finalizada` nao deve poder ser alterada pelo cliente.
- Painel administrativo deve ser acessivel apenas para perfil administrador.
- Administrador pode gerenciar salas, clientes, planos, assinaturas, reservas, avaliacoes e notificacoes.

Qualquer `id_cliente` recebido por parametro deve ser comparado com o cliente identificado pelo token. O backend nao deve confiar apenas no `id_cliente` enviado pelo front-end.

## Dados Sensíveis

A aplicacao trata dados pessoais e operacionais:

- CPF.
- Nome.
- Email.
- Telefone.
- Plano assinado.
- Reservas realizadas.
- Avaliacoes.
- Notificacoes.

Medidas necessarias:

- Nao salvar senha em texto puro.
- Nao exibir CPF completo em logs.
- Nao registrar token em logs.
- Nao versionar `.env`, senhas, tokens ou dumps reais do banco.
- Usar variaveis de ambiente para `DATABASE_URL`, `SECRET_KEY` e configuracoes sensiveis.
- Restringir o acesso direto ao PostgreSQL.

## API e CORS

Durante o desenvolvimento, a API roda localmente na porta `8001`. Em producao, ela deve aceitar requisicoes somente do dominio oficial do front-end.

Configuracao recomendada:

- Remover `allow_origins=["*"]`.
- Liberar apenas o dominio real da aplicacao.
- Permitir apenas metodos usados pelo sistema, como `GET`, `POST`, `PUT`, `PATCH` e `DELETE`.
- Permitir apenas headers necessarios, como `Content-Type` e `Authorization`.

Isso reduz o risco de outros sites fazerem chamadas indevidas para a API.

## Reservas

O fluxo de reserva envolve:

1. Usuario escolhe uma sala em `sala.html`.
2. Front-end envia o usuario para `confirmar-reserva.html` com os dados da sala.
3. Confirmacao envia `POST /api/reservas`.
4. Minhas Reservas lista as reservas do cliente.
5. Alterar Reserva permite mudanca de data, sala, horario ou cancelamento.

Regras de seguranca:

- A API deve validar se a sala existe.
- A API deve validar conflito de horario.
- A API deve impedir reserva no passado.
- A API deve impedir que um cliente crie reserva em nome de outro cliente.
- A API deve impedir alteracao de reservas finalizadas.
- A API deve impedir que usuario comum defina status administrativo.

## Notificacoes

O sistema possui a tabela `notificacoes`, que contem `id_cliente`. Essa tabela deve ser usada para notificacoes do cliente.

Regras:

- O endpoint de notificacoes por cliente deve retornar apenas registros do cliente autenticado.
- A acao de marcar como lida deve validar que a notificacao pertence ao cliente.
- A acao de apagar notificacoes deve validar que pertencem ao cliente.
- O painel administrativo pode listar notificacoes de todos os clientes, desde que o usuario seja administrador.

## Avaliacoes

O sistema possui a tabela `avaliacoes`, que contem `id_cliente`, `id_sala` e `id_reserva`.

Regras:

- Cliente so pode ver suas proprias avaliacoes na area da conta.
- Cliente so pode editar suas proprias avaliacoes.
- Cliente nao deve editar resposta administrativa.
- Avaliacao deve estar vinculada a uma reserva do proprio cliente.
- O painel administrativo pode consultar e responder avaliacoes, desde que o usuario seja administrador.

## Painel Administrativo

As paginas administrativas, como `admin-coworking.html` e `dashboard.html`, nao devem depender apenas de esconder links no front-end.

Protecoes necessarias:

- Validar token e perfil administrativo no backend.
- Bloquear endpoints administrativos para usuarios comuns.
- Registrar acoes administrativas relevantes.
- Evitar expor operacoes de exclusao sem confirmacao.
- Validar todos os dados recebidos antes de criar ou atualizar registros.

## Protecao Contra Ataques

### SQL Injection

A API deve usar ORM ou queries parametrizadas. Quando usar SQL manual com `text()`, os valores devem ser enviados por parametros, nunca concatenados diretamente na string SQL.

### XSS

O front-end renderiza dados vindos da API, como nome da sala, descricao, notificacoes e avaliacoes.

Cuidados:

- Preferir `textContent` quando o conteudo vier da API.
- Evitar `innerHTML` com dados de usuario.
- Sanitizar texto caso seja necessario renderizar HTML.
- Configurar Content Security Policy em producao.
- Nao armazenar informacoes sensiveis desnecessarias no `localStorage`.

### CSRF

Como a sessao atual fica em `localStorage`, o maior risco e XSS. Se no futuro o token for movido para cookie, sera necessario usar protecao CSRF.

### Rate Limiting

Aplicar limite de requisicoes em:

- Login.
- Cadastro.
- Criacao de reserva.
- Edicao de avaliacao.
- Endpoints administrativos.

Ferramentas possiveis:

- Middleware no FastAPI.
- Nginx.
- Cloudflare.

## Logs e Auditoria

Eventos importantes para registrar:

- Login realizado.
- Falha de login.
- Cadastro de cliente.
- Atualizacao de dados pessoais.
- Criacao de reserva.
- Alteracao ou cancelamento de reserva.
- Edicao de avaliacao.
- Leitura ou exclusao de notificacoes.
- Acoes administrativas.

Os logs devem conter data, usuario, IP, rota e acao. Nao devem conter senha, token, CPF completo ou dados sensiveis desnecessarios.

## Banco de Dados

Recomendacoes para PostgreSQL:

- Usuario do banco com permissao minima necessaria.
- Senha forte em variavel de ambiente.
- Acesso ao banco restrito a API.
- Backups automaticos.
- Teste periodico de restauracao.
- Migracoes versionadas.
- Revisao das tabelas duplicadas antigas e novas, principalmente notificacoes e avaliacoes, para evitar endpoints usando a tabela errada.

## Implantação

## Visão Geral
Esta seção descreve como preparar, configurar e implantar a aplicação Axis Working em produção.

Arquitetura recomendada:

```text
Usuário -> HTTPS -> Frontend estático
Usuário -> HTTPS -> API FastAPI -> PostgreSQL
```

## Requisitos de Hardware

### Ambiente mínimo
Adequado para demonstração:

- 1 vCPU.
- 1 GB RAM.
- 10 GB de disco.
- PostgreSQL local ou gerenciado pequeno.

### Produção inicial

- 2 vCPU.
- 4 GB RAM.
- 30 GB SSD.
- PostgreSQL gerenciado com backup.
- Proxy reverso Nginx.

### Ambiente com crescimento

- Múltiplas instâncias da API.
- Load balancer.
- PostgreSQL gerenciado com réplica.
- Redis opcional para cache/fila.
- Monitoramento centralizado.

## Requisitos de Software

Backend:

- Python 3.12 ou superior.
- FastAPI.
- Uvicorn.
- SQLAlchemy.
- Pydantic.
- psycopg2.

Banco:

- PostgreSQL 14 ou superior.

Frontend:

- Servidor estático, como Nginx, Vercel ou Netlify.

Infraestrutura:

- Ubuntu Server LTS.
- Git.
- Nginx.
- Certbot ou certificado HTTPS da plataforma.

## Plataforma Recomendada

Para demonstração:

- VPS Ubuntu com Nginx, FastAPI e PostgreSQL.

Para produção:

- Frontend: Vercel, Netlify ou Nginx.
- Backend: Render, Railway, Fly.io, Azure App Service, AWS EC2, Google Cloud Run ou VPS.
- Banco: Supabase, Neon, AWS RDS, Azure Database for PostgreSQL ou equivalente.

## Variáveis de Ambiente

Configurar:

```env
APP_NAME="Coworking Reservas API"
APP_VERSION="1.0.0"
SECRET_KEY="troque-por-uma-chave-forte"
DATABASE_URL="postgresql+psycopg2://usuario:senha@host:5432/banco"
```

Recomendações:

- Usar uma `SECRET_KEY` longa e aleatória.
- Nunca versionar `DATABASE_URL`.
- Separar desenvolvimento, homologação e produção.

## Implantação do Backend

### 1. Preparar servidor

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nginx git
```

### 2. Clonar projeto

```bash
git clone <url-do-repositorio>
cd Front-end/backend/backend
```

### 3. Criar ambiente virtual

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Configurar variáveis

Criar `.env` no servidor ou configurar no painel da plataforma:

```env
SECRET_KEY="chave-segura"
DATABASE_URL="postgresql+psycopg2://usuario:senha@host:5432/eixo6"
```

### 5. Testar API

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

Validar:

```bash
curl http://127.0.0.1:8001/health
```

Resultado esperado:

```json
{"status":"ok"}
```

### 6. Criar serviço systemd

Criar `/etc/systemd/system/axis-api.service`:

```ini
[Unit]
Description=Axis Working API
After=network.target

[Service]
WorkingDirectory=/var/www/axis/backend/backend
Environment="DATABASE_URL=postgresql+psycopg2://usuario:senha@host:5432/eixo6"
Environment="SECRET_KEY=chave-segura"
ExecStart=/var/www/axis/backend/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

Ativar:

```bash
sudo systemctl daemon-reload
sudo systemctl enable axis-api
sudo systemctl start axis-api
sudo systemctl status axis-api
```

## Implantação do Frontend

### 1. Copiar arquivos

Copiar para:

```bash
/var/www/axis/frontend
```

Estrutura:

```text
/var/www/axis/frontend/Pages
/var/www/axis/frontend/css
/var/www/axis/frontend/js
/var/www/axis/frontend/img
```

### 2. Configurar Nginx

```nginx
server {
    listen 80;
    server_name axisworking.com www.axisworking.com;

    root /var/www/axis/frontend;
    index Pages/index.html;

    location / {
        try_files $uri $uri/ /Pages/index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:8001/health;
    }
}
```

Validar:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Habilitar HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d axisworking.com -d www.axisworking.com
```

## Banco de Dados

Criar banco:

```sql
CREATE DATABASE eixo6;
CREATE USER axis_user WITH PASSWORD 'senha-forte';
GRANT ALL PRIVILEGES ON DATABASE eixo6 TO axis_user;
```

Aplicar schema:

- Usar script SQL mais recente do projeto.
- Preferencialmente usar migrations versionadas.
- Testar restauração em homologação antes de produção.

## Configuração da URL da API

Em desenvolvimento:

```js
http://127.0.0.1:8001/api
```

Em produção, usar:

```js
https://api.axisworking.com/api
```

Ou, se o frontend e API estiverem no mesmo domínio com proxy:

```js
/api
```

Recomendação:

- Centralizar a URL da API em um único arquivo de configuração.
- Evitar URLs fixas espalhadas nos HTMLs.

## Testes Pós-Deploy

Saúde:

```bash
curl https://axisworking.com/health
```

Endpoints principais:

```bash
curl https://axisworking.com/api/salas
curl https://axisworking.com/api/planos
```

Testes automatizados:

```bash
python -m unittest discover -s backend/backend/tests -p "test_unit_*.py"
python -m unittest discover -s backend/backend/tests -p "test_integration_*.py"
python backend/backend/tests/load_test_api.py --base-url https://axisworking.com --users 20 --requests 200
```

Testes manuais:

- Abrir Home.
- Abrir Planos.
- Abrir Info Salas.
- Fazer cadastro.
- Fazer login.
- Abrir painel de conta.
- Abrir notificações.
- Criar ou alterar reserva.
- Editar avaliação.
- Validar painel administrativo.

## Monitoramento

Monitorar:

- CPU.
- Memória.
- Disco.
- Latência.
- Erros HTTP 4xx e 5xx.
- Disponibilidade da API.
- Falha de backups.

Ferramentas possíveis:

- UptimeRobot.
- Grafana + Prometheus.
- Sentry.
- Logs do Nginx.
- Logs do systemd.

## Backup e Recuperação

Recomendações:

- Backup diário do PostgreSQL.
- Retenção de 7 a 30 dias.
- Backup antes de deploy relevante.
- Teste periódico de restauração.

Exemplo:

```bash
pg_dump "$DATABASE_URL" > backup-axis-$(date +%F).sql
```

## Testes

## Objetivo
Garantir que o fluxo principal do sistema funcione de ponta a ponta: navegação pública, cadastro/login, gerenciamento de conta, salas, planos, reservas, avaliações, notificações e painel administrativo.

## Tipos de Teste

### Unitários
Validam unidades isoladas de código, sem depender da API em execução.

Ferramentas:
- `unittest` do Python
- `node --check` para validação sintática dos scripts JavaScript

Escopo:
- Hash e validação de senha.
- Geração e validação de token.
- Validações de schemas Pydantic.
- Normalização de campos como datas, status e tipos.

### Integração
Validam a interação entre front, API e banco, usando a API real na porta `8001`.

Ferramentas:
- `unittest` + `urllib.request`
- Chromium headless via Playwright para navegação front/back, quando disponível

Escopo:
- Cadastro e login.
- CRUD de clientes.
- CRUD de salas.
- CRUD de planos e assinaturas.
- CRUD de reservas.
- CRUD de avaliações.
- CRUD de notificações.
- Busca por ID do usuário em notificações e avaliações.

### Navegação e Funcionalidade
Validam o fluxo do usuário descrito no diagrama.

Ferramentas:
- Chromium headless via Playwright

Casos:
- Home -> Planos.
- Home -> Info Salas.
- Home -> Sobre Nós.
- Sem login, escolher plano deve ir para Login.
- Com login, escolher plano deve ir para Carrinho.
- Sem login, reservar sala deve ir para Login.
- Com login, reservar sala deve ir para Confirmar Reserva.
- Login válido deve ir para Painel Conta.
- Painel Conta deve abrir notificações, reservas, plano e avaliações.

### Carga
Avaliam comportamento sob tráfego simultâneo.

Ferramentas:
- Script `backend/backend/tests/load_test_api.py`
- `ThreadPoolExecutor` da biblioteca padrão

Métricas:
- Total de requisições.
- Sucessos e falhas.
- Tempo médio.
- P95.
- Requisições por segundo.

Endpoints iniciais:
- `/health`
- `/api/salas`
- `/api/planos`
- `/api/reservas?limit=10`
- `/api/avaliacoes`
- `/notificacoes/cliente/1`

## Casos de Teste Funcionais

| ID | Requisito | Caso | Resultado esperado |
| --- | --- | --- | --- |
| CT-001 | Cadastro | Criar cliente com nome, CPF, email, telefone e senha | Cliente criado com `id_cliente` |
| CT-002 | Login | Login com CPF e senha válidos | Token retornado |
| CT-003 | Login inválido | Login com senha errada | HTTP 401 |
| CT-004 | Conta | Atualizar nome/email/telefone | Dados atualizados, CPF preservado |
| CT-005 | Salas | Listar salas ativas | Lista retornada |
| CT-006 | Salas | Abrir detalhe de sala | Dados da sala carregados |
| CT-007 | Planos | Listar planos | Lista retornada |
| CT-008 | Carrinho | Escolher plano logado | Carrinho carrega dados do plano |
| CT-009 | Carrinho | Escolher plano sem login | Redireciona para Login |
| CT-010 | Reservas | Criar reserva futura | Reserva confirmada |
| CT-011 | Reservas | Alterar reserva | Dados atualizados |
| CT-012 | Reservas | Cancelar reserva | Status `Cancelada` |
| CT-013 | Reservas | Alterar reserva finalizada | Botão desabilitado no front |
| CT-014 | Avaliações | Buscar por cliente | Retorna apenas avaliações do cliente |
| CT-015 | Avaliações | Editar nota/texto | Avaliação atualizada |
| CT-016 | Notificações | Buscar por cliente | Retorna apenas notificações do cliente |
| CT-017 | Notificações | Marcar como lida | `lida=true` |
| CT-018 | Notificações | Apagar notificação | Notificação removida |
| CT-019 | Admin | Dashboard carrega dados da API | Cards e tabelas preenchidos |
| CT-020 | Navegação | Sobre Nós/Planos/Info Salas | Links funcionam |

## Casos de Teste Não Funcionais

| ID | Requisito | Caso | Resultado esperado |
| --- | --- | --- | --- |
| NFT-001 | Performance | 100 requisições concorrentes distribuídas | Sem erro 5xx recorrente |
| NFT-002 | Performance | P95 dos endpoints principais | P95 aceitável para ambiente local |
| NFT-003 | Confiabilidade | API fora do ar | Front exibe mensagem de erro |
| NFT-004 | Compatibilidade | Abrir páginas via `file://` | Scripts carregam sem erro de caminho |
| NFT-005 | Segurança | Token alterado manualmente | API rejeita token inválido |
| NFT-006 | Usabilidade | Usuário sem login tenta reservar | Redirecionamento claro para login |
| NFT-007 | Consistência visual | Fonte do sistema | Todas as páginas usam Arial |
| NFT-008 | Manutenibilidade | Scripts JS | `node --check` sem erro |

## Como Executar

Pré-requisito: API rodando em `http://127.0.0.1:8001`.

Unitários:

```powershell
python -m unittest discover -s backend\backend\tests -p "test_unit_*.py"
```

Integração:

```powershell
python -m unittest discover -s backend\backend\tests -p "test_integration_*.py"
```

Carga:

```powershell
python backend\backend\tests\load_test_api.py --users 20 --requests 200
```

Validação JS:

```powershell
node --check js\home.js
node --check js\salas.js
node --check js\admin-coworking.js
```

# Referências

Inclua todas as referências (livros, artigos, sites, etc) utilizados no desenvolvimento do trabalho.
