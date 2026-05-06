from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.routes import avaliacoes, clientes, financeiro, notificacoes, reservas, salas


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API unica em Python para reservas de salas de coworking.",
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.get("/")
def home() -> dict[str, str]:
    return {"message": "API de coworking rodando"}


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


for router in (
    clientes.router,
    salas.router,
    reservas.router,
    avaliacoes.router,
    financeiro.planos_router,
    financeiro.assinaturas_router,
    notificacoes.router,
):
    app.include_router(router, prefix="/api")

# Aliases temporarios para clientes que ainda chamam as rotas antigas sem /api.
app.include_router(clientes.router)
app.include_router(financeiro.planos_router)
app.include_router(financeiro.assinaturas_router)
app.include_router(notificacoes.router)

