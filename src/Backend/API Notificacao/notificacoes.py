from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.notificacao import Notificacao, TipoNotificacao
from app.schemas.notificacao import NotificacaoCreate, NotificacaoUpdate


def create_notificacao(db: Session, payload: NotificacaoCreate) -> Notificacao:
    notificacao = Notificacao(**payload.model_dump())
    db.add(notificacao)
    db.commit()
    db.refresh(notificacao)
    return notificacao


def list_notificacoes(
    db: Session,
    *,
    lida: bool | None = None,
    tipo: TipoNotificacao | None = None,
    id_cliente: int | None = None,
) -> list[Notificacao]:
    query: Select[tuple[Notificacao]] = select(Notificacao)

    if lida is not None:
        query = query.where(Notificacao.lida == lida)
    if tipo is not None:
        query = query.where(Notificacao.tipo == tipo)
    if id_cliente is not None:
        query = query.where(Notificacao.id_cliente == id_cliente)

    query = query.order_by(Notificacao.id_notificacao.desc())
    return list(db.scalars(query).all())


def get_notificacao(db: Session, notificacao_id: int) -> Notificacao | None:
    return db.get(Notificacao, notificacao_id)


def update_notificacao(
    db: Session, notificacao: Notificacao, payload: NotificacaoUpdate
) -> Notificacao:
    for field, value in payload.model_dump().items():
        setattr(notificacao, field, value)

    db.add(notificacao)
    db.commit()
    db.refresh(notificacao)
    return notificacao


def mark_as_read(db: Session, notificacao: Notificacao) -> Notificacao:
    notificacao.lida = True
    db.add(notificacao)
    db.commit()
    db.refresh(notificacao)
    return notificacao


def delete_notificacao(db: Session, notificacao: Notificacao) -> None:
    db.delete(notificacao)
    db.commit()
