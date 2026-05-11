# Notificacoes API

Projeto Python gerado por engenharia reversa a partir da collection `Notificacoes API.postman_collection.json`.

## Stack

- FastAPI para a API REST e documentacao OpenAPI automatica
- SQLAlchemy 2 para acesso ao banco
- PostgreSQL como persistencia
- Uvicorn para execucao local

## Endpoints mapeados da collection

- `GET /notificacoes/tipos`
- `POST /notificacoes`
- `GET /notificacoes`
- `GET /notificacoes/{id_notificacao}`
- `PUT /notificacoes/{id_notificacao}`
- `PATCH /notificacoes/{id_notificacao}/lida`
- `DELETE /notificacoes/{id_notificacao}`

## Como executar

1. Suba o PostgreSQL:

```bash
docker compose up -d
```

2. Crie o arquivo `.env` a partir de `.env.example`.

3. Instale as dependencias:

```bash
pip install -r requirements.txt
```

4. Rode a API:

```bash
python -m uvicorn app.main:app --reload
```

## Migration inicial

Para aplicar a migration com Alembic:

```bash
python -m alembic upgrade head
```

## Documentacao OpenAPI

- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- OpenAPI JSON: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

## Observacoes da engenharia reversa

- A collection nao trazia exemplos completos de resposta, entao o contrato foi inferido a partir dos testes do Postman.
- O campo `tipo` foi tratado como enumeracao com os valores observados: `Alerta`, `Confirmacao de Reserva` e `Lembrete`.
- As mensagens de erro seguem o padrao `{ "erro": "..." }`, como indicado no teste de recurso removido.
