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

- Geral - PostgreSQL 18, PgAdmin4, GitHub, AWS EC2, AWS API Gateway, AWS RDS;

- API Reservas - Python 3.14.3, FastAPI, SQLModel, SQLAlchemy, Pydantic, SwaggerUI;

- API Usuário - 

- API Salas - C#, ASP.NET Core, Entity Framework, SQL Server, SwaggerUI, Insomnia;

- API Notificações - PostgreSQL 18, PgAdmin4;

- API Avaliação - C#, PostgreSQL 18, PgAdmin4;

- API Financeiro - 

## API Reservas

No desenvolvimento específico da API de Reservas, serão utilizadas as tecnologias Python 3.14.3 como linguagem principal, FastAPI como framework para construção da API, SQLModel e SQLAlchemy para modelagem e manipulação dos dados no banco, Pydantic para validação e serialização dos dados recebidos e retornados, e Swagger UI para documentação e testes interativos dos endpoints.

## API Endpoints

[Liste os principais endpoints da API, incluindo as operações disponíveis, os parâmetros esperados e as respostas retornadas.]

## Endpoint 1: Criar reserva

**Método:** POST  
**URL:** `/reservas`

### Parâmetros no corpo da requisição:
- `id_usuario`: identificador do usuário que realiza a reserva  
- `id_sala`: identificador da sala reservada  
- `data_reserva`: data da reserva  
- `hora_inicio`: horário de início  
- `hora_fim`: horário de término  

### Resposta:

**Sucesso (201 Created)**
```json
{
  "mensagem": "Reserva criada com sucesso",
  "reserva": {
    "id_reserva": 1,
    "id_usuario": 3,
    "id_sala": 2,
    "data_reserva": "2026-04-11",
    "hora_inicio": "14:00",
    "hora_fim": "16:00"
  }
}
```
**Erro (400 Bad Request, 409 Conflict)**
```json
{
  "mensagem": "Erro ao criar reserva",
  "erro": "A sala ja esta reservada para este horario"
}
```
---

## Endpoint 2: Listar reservas

**Método:** GET  
**URL:** `/reservas`

### Parâmetros de consulta:
- `id_usuario`: filtra por usuário  
- `id_sala`: filtra por sala  
- `data_reserva`: filtra por data  

### Resposta:

**Sucesso (200 OK)**
```json
[
  {
    "id_reserva": 1,
    "id_usuario": 3,
    "id_sala": 2,
    "data_reserva": "2026-04-11",
    "hora_inicio": "14:00",
    "hora_fim": "16:00"
  }
]
```
---

## Endpoint 3: Buscar reserva por ID

**Método:** GET  
**URL:** `/reservas/{id}`

### Parâmetros:
- `id`: identificador da reserva  

### Resposta:
- **Sucesso (200 OK)**  
- **Erro (404 Not Found)**

---

## Endpoint 4: Atualizar reserva

**Método:** PUT ou PATCH  
**URL:** `/reservas/{id}`

### Parâmetros:
- `id`: identificador da reserva  
- Campos da reserva a serem alterados  

### Resposta:
- **Sucesso (200 OK)**  
- **Erro (400 Bad Request, 404 Not Found)**

---

## Endpoint 5: Excluir reserva

**Método:** DELETE  
**URL:** `/reservas/{id}`

### Parâmetros:
- `id`: identificador da reserva  

### Resposta:
- **Sucesso (200 OK ou 204 No Content)**  
- **Erro (404 Not Found)**  

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

## Teste API reservas

A estratégia de testes da API de Reservas foi focada em verificar se os endpoints funcionam corretamente nas operações principais do sistema, como criar, listar, buscar, editar e excluir reservas. Também foram testados os filtros disponíveis, como busca por cliente, sala e data, além da validação de respostas em casos de erro.

Os testes foram realizados principalmente com o Postman, utilizando uma collection com requisições para cada endpoint e scripts de validação para conferir os códigos de status HTTP e os dados retornados pela API. Dessa forma, foi possível validar na prática se a comunicação entre a API, as regras de negócio e o banco de dados estava funcionando corretamente.

O Swagger UI também foi usado como apoio para visualizar e conferir os endpoints implementados. Já os testes unitários e de carga não foram desenvolvidos nesta etapa, mas podem ser adicionados futuramente para aumentar a cobertura e avaliar melhor o desempenho da aplicação.

---

## Teste
### Resultado da execução dos testes da API de Notificações no Postman
<img width="1916" height="851" alt="Image" src="https://github.com/user-attachments/assets/0ada3d23-0524-4aab-b4f3-52244e975b48" />

A imagem apresenta a execução da collection de testes da API de Notificações no Postman, utilizando o ambiente local da aplicação. Observa-se que todos os 16 testes foram aprovados, sem falhas ou erros, com tempo médio de resposta de 68 ms. Entre os cenários validados estão a listagem de tipos de notificação, criação de notificação, listagem de notificações e busca por ID, demonstrando que os endpoints implementados estão respondendo corretamente de acordo com o comportamento esperado.

---

### Continuação da execução dos testes da API de Notificações no Postman
<img width="1919" height="640" alt="Image" src="https://github.com/user-attachments/assets/bab93684-90f9-412c-9991-3bd41c866a20" />

A imagem complementa os resultados dos testes da API de Notificações, apresentando a validação das operações de atualização, marcação como lida, exclusão e verificação da remoção de uma notificação. Os resultados mostram respostas esperadas para cada etapa, incluindo 200 OK nas operações de alteração e exclusão, e 404 Not Found ao buscar uma notificação já removida, confirmando o comportamento correto do endpoint e o tratamento padronizado de erros pela API.

---

### Resultado da execução dos testes negativos da API de Notificações no Postman
<img width="1895" height="983" alt="Image" src="https://github.com/user-attachments/assets/4a563da3-dc5b-4761-a2ff-00b7eef851ce" />

A imagem apresenta a execução da collection de testes negativos da API de Notificações no Postman, utilizando o ambiente local da aplicação. Observa-se que todos os 18 testes foram aprovados, sem falhas ou erros, com tempo médio de resposta de 22 ms. Os cenários executados incluíram validações de requisições inválidas, como envio de dados obrigatórios ausentes, uso de tipo inválido e busca por recurso inexistente, confirmando que a API trata corretamente situações de erro e retorna os códigos HTTP esperados, como 422 Unprocessable Entity e 404 Not Found.

# Referências

Inclua todas as referências (livros, artigos, sites, etc) utilizados no desenvolvimento do trabalho.
