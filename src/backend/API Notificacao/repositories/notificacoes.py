from sqlalchemy import text
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
    filters: list[str] = []
    params: dict[str, object] = {}
    if lida is not None:
        filters.append("lida = :lida")
        params["lida"] = lida
    if tipo is not None:
        filters.append("tipo = :tipo")
        params["tipo"] = tipo.value
    if id_cliente is not None:
        filters.append("id_cliente = :id_cliente")
        params["id_cliente"] = id_cliente

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
    rows = db.execute(
        text(
            f"""
            SELECT id_notificacao, id_cliente, corpo, tipo, lida, criado_em
            FROM notificacoes
            {where_clause}
            ORDER BY id_notificacao DESC
            """
        ),
        params,
    ).mappings().all()
    return [dict(row) for row in rows]


def get_notificacao(db: Session, notificacao_id: int) -> Notificacao | None:
    row = db.execute(
        text(
            """
            SELECT id_notificacao, id_cliente, corpo, tipo, lida, criado_em
            FROM notificacoes
            WHERE id_notificacao = :notificacao_id
            """
        ),
        {"notificacao_id": notificacao_id},
    ).mappings().first()
    return dict(row) if row else None


def update_notificacao(
    db: Session, notificacao: Notificacao, payload: NotificacaoUpdate
) -> Notificacao:
    values = payload.model_dump()
    db.execute(
        text(
            """
            UPDATE notificacoes
            SET id_cliente = :id_cliente,
                corpo = :corpo,
                tipo = :tipo,
                lida = :lida
            WHERE id_notificacao = :id_notificacao
            """
        ),
        {**values, "tipo": values["tipo"].value, "id_notificacao": notificacao["id_notificacao"]},
    )
    db.commit()
    return get_notificacao(db, notificacao["id_notificacao"])


def mark_as_read(db: Session, notificacao: Notificacao) -> Notificacao:
    db.execute(
        text("UPDATE notificacoes SET lida = true WHERE id_notificacao = :id_notificacao"),
        {"id_notificacao": notificacao["id_notificacao"]},
    )
    db.commit()
    return get_notificacao(db, notificacao["id_notificacao"])


def delete_notificacao(db: Session, notificacao: Notificacao) -> None:
    db.execute(
        text("DELETE FROM notificacoes WHERE id_notificacao = :id_notificacao"),
        {"id_notificacao": notificacao["id_notificacao"]},
    )
    db.commit()
