# APIs e Web Services

- O projeto tem como objetivo o desenvolvimento de um sistema de gestão para ambientes de coworking, com foco na automação de processos que, em muitos casos, ainda são realizados de forma manual ou por meio de ferramentas genéricas. Observa-se que diversos espaços enfrentam dificuldades na gestão de reservas, clientes e, principalmente, na administração financeira, o que contribui para a ocorrência de erros operacionais, retrabalho e desorganização das informações, impactando diretamente na eficiência dos processos e no controle do negócio.

- Nesse contexto, a solução proposta, denominada Axis Work, foi estruturada como uma aplicação web modular, na qual cada componente do sistema é responsável por uma funcionalidade específica, como gerenciamento de clientes, reservas, salas e financeiro. Essa abordagem favorece a organização do sistema, além de facilitar sua manutenção e evolução.
  
- Dessa forma, o projeto busca promover maior eficiência e controle na gestão de coworkings, reduzindo falhas operacionais e otimizando o gerenciamento das informações. Além disso, a arquitetura adotada possibilita futuras expansões, como integração com banco de dados mais robusto e desenvolvimento de interfaces mais completas, tornando a solução mais preparada para aplicação em cenários reais.


## Objetivos da API

<!-- O primeiro passo é definir os objetivos da sua API. O que você espera alcançar com ela? Você quer que ela seja usada por clientes externos ou apenas por aplicações internas? Quais são os recursos que a API deve fornecer? -->

- O principal objetivo da API é fornecer uma estrutura organizada, escalável e centralizada para gerenciamento do sistema de coworking da Axis Work, permitindo que aplicações possam acessar, manipular e integrar dados de forma segura e eficiente. Facilitando a comunicação entre frontend e backend e assegurando a integridade e consistência das informações, evitando erros e conflitos no armazenamento dos dados. Ela também é projetada para atender uso interno e externo.

-  O objetivo principal da API de reservas é ser utilizada pelo front-end para criar reservas tratando limpeza dos dados e regras de negócio, ler reservas específicas ou várias reservas utilizando filtros diversos, como cliente, sala e data. Além de editar uma reserva escolhida, tendo a possibilidade de editar apenas o necessário da reserva. E por fim, excluir uma reserva específica do registro.

- <!-- Laura - Usuários -->

- O objetivo do módulo de Salas da API é gerenciar o cadastro de salas, permitindo operações de criação, leitura, atualização e exclusão, além de manter a integridade e organização das informações relacionadas a elas.

- <!-- Lucas - Notificação -->

- <!-- Victor - Notificação -->

- <!-- Yan - Notificação -->

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

- Geral - PostgreSQL 18, PgAdmin4, GitHub, AWS EC2, AWS API Gateway, AWS RDS;

- API Reservas - Python 3.14.3, FastAPI, SQLModel, SQLAlchemy, Pydantic, SwaggerUI;

- API Usuário - Python 3.14.3, FastAPI, SQLite, SQLAlchemy, Swagger UI, Postman

- API Salas - C#, ASP.NET Core, Entity Framework Core, JSON, DTOs, HATEOAS, SQL Server, SwaggerUI, Insomnia;

- API Notificações - PostgreSQL 18, PgAdmin4;

- API Avaliação - .NET 8, ASP.NET Core Web API, Entity Framework Core, Npgsql, Swagger;

- API Financeiro - 

<!-- ## API Reservas

No desenvolvimento específico da API de Reservas, serão utilizadas as tecnologias Python 3.14.3 como linguagem principal, FastAPI como framework para construção da API, SQLModel e SQLAlchemy para modelagem e manipulação dos dados no banco, Pydantic para validação e serialização dos dados recebidos e retornados, e Swagger UI para documentação e testes interativos dos endpoints. -->

## API Endpoints

<!-- [Liste os principais endpoints da API, incluindo as operações disponíveis, os parâmetros esperados e as respostas retornadas.] -->

### API Reservas - Carlos

### API Usuário - Laura

### API Sala - Luana

### API Notificação - Lucas

### API Avaliação - Victor

#### 1. Listar todas as avaliacoes

**Metodo:** `GET`

**Rota:**

```text
/api/avaliacao
```

**Comportamento:**

- retorna todas as avaliacoes;
- ordena do maior `idAvaliacao` para o menor;
- usa `AsNoTracking()` para leitura mais leve no Entity Framework.

**Resposta de sucesso:** `200 OK`

**Exemplo de resposta:**

```json
[
  {
    "idAvaliacao": 2,
    "idReserva": 15,
    "nota": 10,
    "corpo": "Excelente atendimento.",
    "criadoEm": "2026-04-09"
  },
  {
    "idAvaliacao": 1,
    "idReserva": 10,
    "nota": 8,
    "corpo": "Boa experiencia.",
    "criadoEm": "2026-04-08"
  }
]
```

#### 2. Buscar avaliacao por ID

**Metodo:** `GET`

**Rota:**

```text
/api/avaliacao/{id}
```

**Exemplo:**

```text
/api/avaliacao/1
```

**Resposta de sucesso:** `200 OK`

```json
{
  "idAvaliacao": 1,
  "idReserva": 10,
  "nota": 9,
  "corpo": "Ambiente muito bom e organizado.",
  "criadoEm": "2026-04-09"
}
```

**Se nao encontrar o registro:** `404 Not Found`

```json
{
  "message": "Avaliacao nao encontrada."
}
```

#### 3. Criar nova avaliacao

**Metodo:** `POST`

**Rota:**

```text
/api/avaliacao
```

**Body esperado:**

```json
{
  "idReserva": 1,
  "nota": 9,
  "corpo": "Ambiente muito bom e organizado.",
  "criadoEm": "2026-04-09"
}
```

**Comportamento:**

- cria um novo registro na tabela `avaliacao`;
- o `idAvaliacao` e gerado automaticamente pelo banco;
- retorna o recurso criado com a localizacao do endpoint de consulta individual.

**Resposta de sucesso:** `201 Created`

```json
{
  "idAvaliacao": 3,
  "idReserva": 1,
  "nota": 9,
  "corpo": "Ambiente muito bom e organizado.",
  "criadoEm": "2026-04-09"
}
```

#### 4. Atualizar avaliacao

**Metodo:** `PUT`

**Rota:**

```text
/api/avaliacao/{id}
```

**Exemplo:**

```text
/api/avaliacao/1
```

**Body esperado:**

```json
{
  "idReserva": 1,
  "nota": 10,
  "corpo": "Atendimento excelente.",
  "criadoEm": "2026-04-09"
}
```

**Comportamento:**

- busca a avaliacao pelo ID;
- se existir, substitui os valores atuais pelos enviados no body;
- salva as alteracoes no banco.

**Resposta de sucesso:** `200 OK`

```json
{
  "idAvaliacao": 1,
  "idReserva": 1,
  "nota": 10,
  "corpo": "Atendimento excelente.",
  "criadoEm": "2026-04-09"
}
```

**Se nao encontrar o registro:** `404 Not Found`

```json
{
  "message": "Avaliacao nao encontrada."
}
```

#### 5. Remover avaliacao

**Metodo:** `DELETE`

**Rota:**

```text
/api/avaliacao/{id}
```

**Exemplo:**

```text
/api/avaliacao/1
```

**Comportamento:**

- busca a avaliacao pelo ID;
- se existir, remove o registro;
- retorna sucesso sem corpo.

**Resposta de sucesso:** `204 No Content`

**Se nao encontrar o registro:** `404 Not Found`

```json
{
  "message": "Avaliacao nao encontrada."
}
```

---

---

### API Financeiro - Yan

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

---



----

## Considerações de Segurança

&nbsp; &nbsp; &nbsp; Durante o desenvolvimento da aplicação distribuída para a Axis Work, a segurança se tornou um aspecto essencial e crítico, pois envolve múltiplos serviços, comunicação em rede e acesso a dados sensíveis. Principalmente quando a aplicação envolve uma empresa que faz reserva de salas para coworking, onde os dados financeiros e sensíveis tanto de clientes quanto da própria instituição são manipulados com frequência.

&nbsp; &nbsp; &nbsp; Dessa forma, a autenticação foi implementada com o objetivo de garantir que apenas usuários devidamente autorizados tenham acesso ao sistema. Para isso, foram utilizados tokens seguros, como o JWT (JSON Web Token), assegurando uma validação confiável das requisições. Além disso, a autorização foi aplicada nas rotas protegidas da aplicação, restringindo o acesso a determinados recursos apenas a usuários autenticados e com permissão adequada. Também foram adotadas medidas de proteção no armazenamento de dados sensíveis, como o uso de hash para senhas, evitando que informações sigilosas sejam armazenadas em formato legível no banco de dados.

&nbsp; &nbsp; &nbsp; Adicionalmente, a aplicação utiliza o ORM SQLAlchemy, o que contribui diretamente para a segurança ao prevenir ataques de SQL Injection, uma vez que as interações com o banco de dados são realizadas por meio de consultas parametrizadas, reduzindo significativamente riscos de manipulação maliciosa das queries. Por fim, também é essencial proteger a aplicação contra ataques comuns, como SQL Injection, sendo mitigado pelo uso de ORM e consultas parametrizadas, reforçando ainda mais a integridade e segurança do sistema.


## Implantação

<!-- [Instruções para implantar a aplicação distribuída em um ambiente de produção.]

1. Defina os requisitos de hardware e software necessários para implantar a aplicação em um ambiente de produção.
2. Escolha uma plataforma de hospedagem adequada, como um provedor de nuvem ou um servidor dedicado.
3. Configure o ambiente de implantação, incluindo a instalação de dependências e configuração de variáveis de ambiente.
4. Faça o deploy da aplicação no ambiente escolhido, seguindo as instruções específicas da plataforma de hospedagem.
5. Realize testes para garantir que a aplicação esteja funcionando corretamente no ambiente de produção. -->

## Testes

<!-- [Descreva a estratégia de teste, incluindo os tipos de teste a serem realizados (unitários, integração, carga, etc.) e as ferramentas a serem utilizadas.]

1. Crie casos de teste para cobrir todos os requisitos funcionais e não funcionais da aplicação.
2. Implemente testes unitários para testar unidades individuais de código, como funções e classes.
3. Realize testes de integração para verificar a interação correta entre os componentes da aplicação.
4. Execute testes de carga para avaliar o desempenho da aplicação sob carga significativa.
5. Utilize ferramentas de teste adequadas, como frameworks de teste e ferramentas de automação de teste, para agilizar o processo de teste. -->

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
