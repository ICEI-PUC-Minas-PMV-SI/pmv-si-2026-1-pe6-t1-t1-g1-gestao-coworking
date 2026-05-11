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

[Inclua os wireframes das páginas principais da interface, mostrando a disposição dos elementos na página.]

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

[Discuta as considerações de segurança relevantes para a aplicação distribuída, como autenticação, autorização, proteção contra ataques, etc.]

## Implantação

[Instruções para implantar a aplicação distribuída em um ambiente de produção.]

1. Defina os requisitos de hardware e software necessários para implantar a aplicação em um ambiente de produção.
2. Escolha uma plataforma de hospedagem adequada, como um provedor de nuvem ou um servidor dedicado.
3. Configure o ambiente de implantação, incluindo a instalação de dependências e configuração de variáveis de ambiente.
4. Faça o deploy da aplicação no ambiente escolhido, seguindo as instruções específicas da plataforma de hospedagem.
5. Realize testes para garantir que a aplicação esteja funcionando corretamente no ambiente de produção.

## Testes

[Descreva a estratégia de teste, incluindo os tipos de teste a serem realizados (unitários, integração, carga, etc.) e as ferramentas a serem utilizadas.]

1. Crie casos de teste para cobrir todos os requisitos funcionais e não funcionais da aplicação.
2. Implemente testes unitários para testar unidades individuais de código, como funções e classes.
3. Realize testes de integração para verificar a interação correta entre os componentes da aplicação.
4. Execute testes de carga para avaliar o desempenho da aplicação sob carga significativa.
5. Utilize ferramentas de teste adequadas, como frameworks de teste e ferramentas de automação de teste, para agilizar o processo de teste.

# Referências

Inclua todas as referências (livros, artigos, sites, etc) utilizados no desenvolvimento do trabalho.
