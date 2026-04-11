# APIs e Web Services

O planejamento de uma aplicação de APIS Web é uma etapa fundamental para o sucesso do projeto. Ao planejar adequadamente, você pode evitar muitos problemas e garantir que a sua API seja segura, escalável e eficiente.

Aqui estão algumas etapas importantes que devem ser consideradas no planejamento de uma aplicação de APIS Web.

[Inclua uma breve descrição do projeto.]

## Objetivos da API

O primeiro passo é definir os objetivos da sua API. O que você espera alcançar com ela? Você quer que ela seja usada por clientes externos ou apenas por aplicações internas? Quais são os recursos que a API deve fornecer?

[Inclua os objetivos da sua api.]

&nbsp; &nbsp; &nbsp; O objetivo principal da API de reservas é ser utilizada pelo front-end para criar reservas tratando limpeza dos dados e regras de negócio, ler reservas específicas ou várias reservas utilizando filtros diversos, como cliente, sala e data. Além de editar uma reserva escolhida, tendo a possibilidade de editar apenas o necessário da reserva. E por fim, excluir uma reserva específica do registro.


## Modelagem da Aplicação

&nbsp; &nbsp; &nbsp; Os dados do nosso projeto serão estruturados em um banco de dados relacional, PostgreSQL, que será acessado por todas as API, priorizando assim a consistência e integridade dos dados, além de uma forma de comunicação entre as APIs.

### Estrutura de Dados

&nbsp; &nbsp; &nbsp; A modelagem foi divida em 7 principais tabelas, que geraram as nossas 6 APIs.

- Usuário: Armazena credenciais e informações dos nossos clientes.
- Planos e Assinaturas: Gerencia os pacotes de serviço fornecidos e os vínculos dos clientes à eles.
- Sala: Define as propriedades físicas dos nossos espaços.
- Reservas: Registra a ocupação dos nossos espaços pelos clientes.
- Avaliação: Armazena o feedback do nosso cliente sobre sua experiência.
- Notificação: Permite a comunicação do sistema com o usuário.

&nbsp; &nbsp; &nbsp; Nossa integridade dos dados é garantida pelo uso rigoroso de Foreing Keys nas tabelas que se relacionam. E como forma de garantir a consistência dos dados e melhor a performance do banco utilizamos Enumerates em atributos como tipo da sala e status da assinatura.

### Diagrama de Entidade Relacionamento ( DER )

&nbsp; &nbsp; &nbsp; O diagrama abaixo apresenta visualmente a estrutura lógica das tabelas, juntamente com os tipos dos atributos e cardinalidades dos relacionamentos existentes:

![DER](img/DER-AW.png)

## Tecnologias Utilizadas

Existem muitas tecnologias diferentes que podem ser usadas para desenvolver APIs Web. A tecnologia certa para o seu projeto dependerá dos seus objetivos, dos seus clientes e dos recursos que a API deve fornecer.

[Lista das tecnologias principais que serão utilizadas no projeto.]

Geral - PostgreSQL 18, PgAdmin4, GitHub, AWS EC2, AWS API Gateway, AWS RDS
API Reservas - Python 3.14.3, FastAPI, SQLModel, SQLAlchemy, Pydantic, SwaggerUI

## API Endpoints

[Liste os principais endpoints da API, incluindo as operações disponíveis, os parâmetros esperados e as respostas retornadas.]

### Endpoint 1
- Método: GET
- URL: /endpoint1
- Parâmetros:
  - param1: [descrição]
- Resposta:
  - Sucesso (200 OK)
    ```
    {
      "message": "Success",
      "data": {
        ...
      }
    }
    ```
  - Erro (4XX, 5XX)
    ```
    {
      "message": "Error",
      "error": {
        ...
      }
    }
    ```

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
