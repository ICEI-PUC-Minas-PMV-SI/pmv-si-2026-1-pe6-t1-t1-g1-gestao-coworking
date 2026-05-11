# Documentacao do Endpoint Avaliacao

Este projeto expoe uma API ASP.NET Core para manipular os dados da tabela `public.avaliacao` em um banco PostgreSQL.

## Objetivo

O endpoint `Avaliacao` permite:

- listar todas as avaliacoes cadastradas;
- buscar uma avaliacao pelo ID;
- criar uma nova avaliacao;
- atualizar uma avaliacao existente;
- remover uma avaliacao.

## Estrutura da Tabela

O recurso principal da API e baseado nesta estrutura:

```sql
CREATE TABLE public.avaliacao (
    id_avaliacao SERIAL PRIMARY KEY,
    id_reserva INTEGER,
    nota INTEGER NOT NULL CHECK (nota >= 0 AND nota <= 10),
    corpo VARCHAR(255),
    criado_em DATE NOT NULL
);
```

Relacionamento:

- `id_reserva` referencia `public.reservas(id_reserva)`.

## Arquivos Principais

- `Program.cs`: configuracao da API, Swagger e pipeline HTTP.
- `Data/AppDbContext.cs`: contexto do Entity Framework Core.
- `Models/Avaliacao.cs`: modelo mapeado para a tabela `public.avaliacao`.
- `Controllers/AvaliacaoController.cs`: regras do endpoint e retornos HTTP.
- `DTOs/CreateAvaliacaoDto.cs`: payload de criacao.
- `DTOs/UpdateAvaliacaoDto.cs`: payload de atualizacao.
- `AvaliacaoApi.http`: requisicoes prontas para testes manuais.

## Configuracao

A string de conexao com o PostgreSQL fica em `appsettings.json`.

Exemplo:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=coopEixo6;Username=Senai;Password=Senai4.0"
  }
}
```

## Como Executar

Na pasta do projeto:

```bash
dotnet run
```

Em desenvolvimento, a API usa:

```text
http://localhost:5158
```

Swagger:

```text
http://localhost:5158/swagger
```

## Endpoint Base

Rota base do controller:

```text
/api/avaliacao
```

## Modelo de Resposta

Exemplo de avaliacao retornada pela API:

```json
{
  "idAvaliacao": 1,
  "idReserva": 10,
  "nota": 9,
  "corpo": "Ambiente muito bom e organizado.",
  "criadoEm": "2026-04-09"
}
```

Campos:

- `idAvaliacao`: identificador da avaliacao.
- `idReserva`: identificador da reserva relacionada. Pode ser nulo.
- `nota`: nota atribuida de `0` a `10`.
- `corpo`: comentario textual da avaliacao. Pode ser nulo.
- `criadoEm`: data de criacao da avaliacao.

## Validacoes

As validacoes aplicadas atualmente sao:

- `nota` deve estar entre `0` e `10`;
- `corpo` aceita no maximo `255` caracteres;
- `criadoEm` e obrigatorio;
- o `id` informado na rota deve ser maior que zero;
- `id_reserva`, quando informado, deve existir no banco para nao violar chave estrangeira.

## Formato dos Erros

Os erros padronizados usam `ProblemDetails` nos cenarios tratados pelo controller.

Exemplo:

```json
{
  "type": "about:blank",
  "title": "Dados invalidos.",
  "status": 400,
  "detail": "Os dados enviados violam uma regra de validacao do banco."
}
```

Quando o recurso nao e encontrado, a API retorna:

```json
{
  "message": "Avaliacao nao encontrada."
}
```

## Operacoes Disponiveis

## 1. Listar todas as avaliacoes

**Metodo:** `GET`

**Rota:**

```text
/api/avaliacao
```

**Comportamento:**

- retorna todas as avaliacoes;
- ordena do maior `idAvaliacao` para o menor;
- usa `AsNoTracking()` para leitura mais leve.

**Retornos possiveis:**

- `200 OK`: lista retornada com sucesso.
- `408 Request Timeout`: a consulta demorou mais do que o esperado.
- `503 Service Unavailable`: falha transitoria ao acessar o PostgreSQL.
- `500 Internal Server Error`: erro inesperado durante a consulta.

**Exemplo de sucesso:**

```json
[
  {
    "idAvaliacao": 2,
    "idReserva": 2,
    "nota": 8,
    "corpo": "Boa experiencia e atendimento rapido.",
    "criadoEm": "2026-04-13"
  },
  {
    "idAvaliacao": 1,
    "idReserva": 1,
    "nota": 9,
    "corpo": "Ambiente muito bom e organizado.",
    "criadoEm": "2026-04-12"
  }
]
```

## 2. Buscar avaliacao por ID

**Metodo:** `GET`

**Rota:**

```text
/api/avaliacao/{id}
```

**Exemplo:**

```text
/api/avaliacao/1
```

**Retornos possiveis:**

- `200 OK`: avaliacao encontrada.
- `400 Bad Request`: ID menor ou igual a zero.
- `404 Not Found`: avaliacao nao encontrada.
- `408 Request Timeout`: a consulta demorou mais do que o esperado.
- `503 Service Unavailable`: falha transitoria ao acessar o PostgreSQL.
- `500 Internal Server Error`: erro inesperado durante a consulta.

**Exemplo de sucesso:**

```json
{
  "idAvaliacao": 1,
  "idReserva": 1,
  "nota": 9,
  "corpo": "Ambiente muito bom e organizado.",
  "criadoEm": "2026-04-12"
}
```

**Exemplo de `400 Bad Request`:**

```json
{
  "type": "about:blank",
  "title": "Identificador invalido.",
  "status": 400,
  "detail": "O ID da avaliacao deve ser maior que zero."
}
```

**Exemplo de `404 Not Found`:**

```json
{
  "message": "Avaliacao nao encontrada."
}
```

## 3. Criar nova avaliacao

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
- retorna o recurso criado com localizacao para consulta posterior.

**Retornos possiveis:**

- `201 Created`: avaliacao criada com sucesso.
- `400 Bad Request`: dados invalidos, como nota fora do intervalo permitido.
- `409 Conflict`: conflito ao salvar, como chave estrangeira invalida ou conflito de concorrencia.
- `408 Request Timeout`: a gravacao demorou mais do que o esperado.
- `503 Service Unavailable`: falha transitoria ao gravar no PostgreSQL.
- `500 Internal Server Error`: erro inesperado durante a criacao.

**Exemplo de sucesso:**

```json
{
  "idAvaliacao": 3,
  "idReserva": 1,
  "nota": 9,
  "corpo": "Ambiente muito bom e organizado.",
  "criadoEm": "2026-04-09"
}
```

**Exemplo de `400 Bad Request`:**

```json
{
  "type": "about:blank",
  "title": "Dados invalidos.",
  "status": 400,
  "detail": "Os dados enviados violam uma regra de validacao do banco."
}
```

**Exemplo de `409 Conflict`:**

```json
{
  "type": "about:blank",
  "title": "Conflito ao salvar.",
  "status": 409,
  "detail": "O recurso informado referencia uma reserva inexistente ou invalida."
}
```

## 4. Atualizar avaliacao

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
- se existir, substitui os campos pelos valores enviados;
- persiste as alteracoes no banco.

**Retornos possiveis:**

- `200 OK`: avaliacao atualizada com sucesso.
- `400 Bad Request`: ID invalido ou dados inconsistentes.
- `404 Not Found`: avaliacao nao encontrada.
- `409 Conflict`: conflito ao salvar ou concorrencia.
- `408 Request Timeout`: a gravacao demorou mais do que o esperado.
- `503 Service Unavailable`: falha transitoria ao atualizar no PostgreSQL.
- `500 Internal Server Error`: erro inesperado durante a atualizacao.

**Exemplo de sucesso:**

```json
{
  "idAvaliacao": 1,
  "idReserva": 1,
  "nota": 10,
  "corpo": "Atendimento excelente.",
  "criadoEm": "2026-04-09"
}
```

**Exemplo de `409 Conflict`:**

```json
{
  "type": "about:blank",
  "title": "Conflito ao salvar.",
  "status": 409,
  "detail": "O recurso informado referencia uma reserva inexistente ou invalida."
}
```

## 5. Remover avaliacao

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

**Retornos possiveis:**

- `204 No Content`: avaliacao removida com sucesso.
- `400 Bad Request`: ID invalido.
- `404 Not Found`: avaliacao nao encontrada.
- `409 Conflict`: conflito ao excluir.
- `408 Request Timeout`: a exclusao demorou mais do que o esperado.
- `503 Service Unavailable`: falha transitoria ao excluir no PostgreSQL.
- `500 Internal Server Error`: erro inesperado durante a exclusao.

**Exemplo de `408 Request Timeout`:**

```json
{
  "type": "about:blank",
  "title": "Tempo limite excedido.",
  "status": 408,
  "detail": "A operacao de exclusao demorou mais do que o esperado."
}
```

## Funcionamento Interno

O fluxo geral da API e este:

1. A requisicao chega ao `AvaliacaoController`.
2. O ASP.NET Core faz o bind do JSON para um DTO.
3. O Entity Framework Core usa o `AppDbContext` para acessar a tabela `public.avaliacao`.
4. O controller traduz os cenarios esperados em codigos HTTP apropriados.
5. O resultado e retornado em JSON.

## Tecnologias Utilizadas

- .NET 8
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL
- Npgsql
- Swagger / OpenAPI
- xUnit

## Testes Realizados

Os seguintes testes foram executados durante a validacao do endpoint:

- `dotnet build` da API com sucesso.
- `dotnet test` com 6 testes automatizados aprovados.
- validacao manual do endpoint `GET /api/avaliacao` contra PostgreSQL real, retornando 2 registros seedados.
- criacao do schema e carga de dados de teste no banco `coopEixo6`.

### Testes automatizados cobertos

- busca por ID com retorno `200 OK`;
- criacao com retorno `201 Created`;
- exclusao com retorno `204 No Content`;
- busca com ID invalido retornando `400 Bad Request`;
- falha de persistencia retornando `409 Conflict`;
- cancelamento de operacao retornando `408 Request Timeout`.

## Testes Manuais

Existe um arquivo pronto para disparar requisicoes HTTP:

- `AvaliacaoApi.http`

Ele pode ser usado em IDEs como Visual Studio Code ou JetBrains Rider para testes manuais do endpoint.

## Observacoes Importantes

- o endpoint nao implementa autenticacao neste momento;
- os erros mais comuns agora sao tratados explicitamente no controller;
- conflitos com `id_reserva` invalido dependem das constraints reais do banco;
- o projeto de testes ainda pode exibir um aviso de vulnerabilidade transitiva de pacote (`NU1903`), sem impedir a execucao do endpoint.
