from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import DbSession
from app.models.notificacao import TipoNotificacao
from app.repositories.notificacoes import (
    create_notificacao,
    delete_notificacao,
    get_notificacao,
    list_notificacoes,
    mark_as_read,
    update_notificacao,
)
from app.schemas.notificacao import (
    ErrorResponse,
    MessageResponse,
    NotificacaoCreate,
    NotificacaoRead,
    NotificacaoTipoList,
    NotificacaoUpdate,
)


router = APIRouter(prefix="/notificacoes", tags=["Notificacoes"])


def _get_or_404(db: DbSession, notificacao_id: int):
    notificacao = get_notificacao(db, notificacao_id)
    if notificacao is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificacao nao encontrada")
    return notificacao


@router.get("/tipos", response_model=NotificacaoTipoList)
def get_tipos() -> NotificacaoTipoList:
    return NotificacaoTipoList(tipos=list(TipoNotificacao))


@router.post(
    "",
    response_model=NotificacaoRead,
    status_code=status.HTTP_201_CREATED,
)
def post_notificacao(payload: NotificacaoCreate, db: DbSession) -> NotificacaoRead:
    return create_notificacao(db, payload)


@router.get("", response_model=list[NotificacaoRead])
def get_notificacoes(
    db: DbSession,
    lida: bool | None = Query(default=None),
    tipo: TipoNotificacao | None = Query(default=None),
    id_cliente: int | None = Query(default=None, ge=1),
) -> list[NotificacaoRead]:
    return list_notificacoes(
        db,
        lida=lida,
        tipo=tipo,
        id_cliente=id_cliente,
    )


@router.get("/cliente/{id_cliente}", response_model=list[NotificacaoRead])
def get_notificacoes_by_cliente(id_cliente: int, db: DbSession) -> list[NotificacaoRead]:
    return list_notificacoes(db, id_cliente=id_cliente)


@router.get(
    "/{notificacao_id}",
    response_model=NotificacaoRead,
    responses={404: {"model": ErrorResponse}},
)
def get_notificacao_by_id(notificacao_id: int, db: DbSession) -> NotificacaoRead:
    return _get_or_404(db, notificacao_id)


@router.put(
    "/{notificacao_id}",
    response_model=NotificacaoRead,
    responses={404: {"model": ErrorResponse}},
)
def put_notificacao(
    notificacao_id: int,
    payload: NotificacaoUpdate,
    db: DbSession,
) -> NotificacaoRead:
    notificacao = _get_or_404(db, notificacao_id)
    return update_notificacao(db, notificacao, payload)


@router.patch(
    "/{notificacao_id}/lida",
    response_model=NotificacaoRead,
    responses={404: {"model": ErrorResponse}},
)
def patch_notificacao_lida(notificacao_id: int, db: DbSession) -> NotificacaoRead:
    notificacao = _get_or_404(db, notificacao_id)
    return mark_as_read(db, notificacao)


@router.delete(
    "/{notificacao_id}",
    response_model=MessageResponse,
    responses={404: {"model": ErrorResponse}},
)
def delete_notificacao_by_id(notificacao_id: int, db: DbSession) -> MessageResponse:
    notificacao = _get_or_404(db, notificacao_id)
    delete_notificacao(db, notificacao)
    return MessageResponse(mensagem="Notificacao removida com sucesso")
