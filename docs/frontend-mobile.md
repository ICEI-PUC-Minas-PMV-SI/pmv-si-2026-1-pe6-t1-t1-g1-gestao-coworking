# Front-end Móvel

<!--[Inclua uma breve descrição do projeto e seus objetivos.]-->
No desenvolvimento do front-end mobile do projeto do Axis Work Coworking, será feito utilizado o React Native em conjunto com o Expo. A proposta é criar um aplicativo moderno, minimalista e com bom desempenho, o qual permita aos usuários o acesso fácil a informações sobre os serviços oferecidos, salas disponíveis e planos de contratação. Além disso, o aplicativo possibilitará a realização de reservas, alterações e cancelamentos de forma rápida e prática, proporcionando uma experiência de uso fluida e acessível em dispositivos móveis. O foco está na usabilidade, organização das informações e aproveitamento dos recursos nativos dos smartphones para oferecer uma navegação eficiente.

Objetivos:

- Desenvolver uma aplicação mobile compatível com dispositivos Android;
- Utilizar React Native para construção da interface de usuário;
- Empregar o Expo para facilitar o desenvolvimento, testes e implantação do aplicativo;
- Proporcionar uma navegação simples e eficiente;
- Integrar o aplicativo à API do sistema para consulta de salas, planos e gerenciamento de reservas;
- Simular funcionalidades reais de um aplicativo de coworking, como visualização de espaços, reservas e gerenciamento de agendamentos.

## Projeto da Interface
<!-- [Descreva o projeto da interface móvel da aplicação, incluindo o design visual, layout das páginas, interações do usuário e outros aspectos relevantes.] -->

A interface móvel da aplicação Axis Working foi desenvolvida usando o React Native e o Expo Snack, com o objetivo de oferecer uma experiência moderna para os usuários do app. O design visual segue uma identidade minimalista, utilizando cores sóbrias, uma interface mais simples e componentes organizados de forma clara para facilitar a navegação e o acesso às funcionalidades do sistema.
A navegação principal da aplicação é realizada por meio de um menu lateral que permite aos usuários o acesso rápido às principais funções do aplicativo, como página inicial, busca de espaços, planos, perfil e reservas. O layout foi organizado em seções bem definidas, utilizando cartões para destacar informações importantes e melhorar a legibilidade.

A funcionalidade de busca de espaços permite ao usuário visualizar e filtrar diferentes categorias de ambientes disponíveis, como salas de reunião, espaços privativos, mesas compartilhadas e estações fixas. Cada espaço é apresentado em um card contendo imagem, nome, capacidade e botão para visualizar mais detalhes e disponibilidade. A tela de detalhes da sala reúne todas as informações necessárias para a realização de uma reserva. Nela, o usuário pode visualizar fotos do ambiente, consultar a disponibilidade através de um calendário interativo, selecionar horários disponíveis, além de ter acesso a avaliações de outros usuários e poder registrar sua própria avaliação. O botão de reserva realiza a conclusão da reserva ou em caso de usuário não logado direciona o mesmo para a autenticação.

O sistema de autenticação é composto pelas telas de login e cadastro, desenvolvidas com formulários simples e objetivos. Após a autenticação, o usuário passa a ter acesso às funcionalidades que exigem identificação, como a realização e gerenciamento de reservas. A página "Minhas Reservas" foi desenvolvida para exibir todas as reservas realizadas pelo usuário, apresentando informações como nome do espaço reservado, data e horário selecionados. Essa funcionalidade facilita o acompanhamento e a organização das reservas efetuadas.

A aplicação também possui uma seção dedicada aos planos oferecidos pelo coworking. Nessa página, os planos Day Pass, Flex, Dedicated e Office são apresentados em cartões individuais contendo informações sobre período de contratação, benefícios e valores, permitindo que os usuários conheçam facilmente as opções disponíveis.
De modo geral, a interface móvel foi projetada com foco na usabilidade, acessibilidade e experiência do usuário, proporcionando uma navegação fluida, organização eficiente das informações e uma interação simples para consulta de espaços, contratação de planos e realização de reservas.


### Wireframes

[Inclua os wireframes das páginas principais da interface, mostrando a disposição dos elementos na página.]

### Design Visual

[Descreva o estilo visual da interface, incluindo paleta de cores, tipografia, ícones e outros elementos gráficos.]

## Fluxo de Dados

[Diagrama ou descrição do fluxo de dados na aplicação.]

## Tecnologias Utilizadas

- React Native – Framework para a construção da aplicação mobile;
- Expo – Conjunto de ferramentas para facilitar a inicialização, testes e execução do aplicativo;
- React Native Paper – Biblioteca de componentes visuais prontos para a interface do usuário;
- React Navigation – Gerenciamento de rotas e fluxos de navegação entre telas (abas e pilhas);
- JavaScript – Implementação da lógica do aplicativo, requisições à API e gerenciamento de estados;
- Local Tunnel – Ferramenta para expor o servidor backend local e permitir o consumo da API pelo aplicativo mobile;
- Visual Studio Code – Editor de código utilizado para o desenvolvimento do projeto.
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
