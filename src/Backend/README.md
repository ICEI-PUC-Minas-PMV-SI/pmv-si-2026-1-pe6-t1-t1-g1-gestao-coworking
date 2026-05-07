# Coworking Reservas API

API unica em Python/FastAPI para o sistema de reservas de salas de coworking.

## Estrutura

- `main.py`: entrada da aplicacao (`app.main:app`).
- `app/core/config.py`: configuracoes e leitura da conexao do antigo projeto `API Avaliacao`.
- `app/db.py`: engine e sessao SQLAlchemy.
- `app/models.py`: modelos alinhados ao PostgreSQL `coopEixo6`.
- `app/schemas.py`: contratos Pydantic.
- `app/routes/`: endpoints por dominio.

## Banco de dados

Por padrao, a API usa a string de conexao de:

```text
backend/API Avaliacao/appsettings.json
```

O valor atual convertido para SQLAlchemy aponta para:

```text
Host=54.198.111.239;Port=5432;Database=apiEixo6;Username=postgres
```

Tambem e possivel sobrescrever com `DATABASE_URL` no ambiente.

## Provisionar banco na AWS

O script abaixo cria o banco `apiEixo6`, cria as tabelas e popula dados genericos para desenvolvimento frontend:

```bash
python scripts/setup_aws_db.py
```

Antes de executar, defina `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` e `PGDATABASE`.

## Como executar

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

## Grupos de endpoints

- `GET /api/health`
- `/api/clientes` e `/api/login`
- `/api/salas`
- `/api/reservas` com alias legado `/api/reserva`
- `/api/avaliacao` e `/api/avaliacoes`
- `/api/planos`
- `/api/assinaturas`
- `/api/notificacoes`

Algumas rotas legadas sem `/api` foram mantidas temporariamente para clientes antigos: `/clientes`, `/login`, `/planos`, `/assinaturas` e `/notificacoes`.
