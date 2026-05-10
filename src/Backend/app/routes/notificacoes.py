from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Notificacao, TipoNotificacao, UsuarioCliente
from app.schemas import MessageRead, NotificacaoCreate, NotificacaoRead, NotificacaoUpdate


router = APIRouter(prefix="/notificacoes", tags=["Notificacoes"])


def _notificacao_or_404(db: Session, id_notificacao: int) -> dict:
    notificacao = db.execute(
        text(
            """
            SELECT id_notificacao, id_cliente, corpo, tipo, lida, criado_em
            FROM notificacoes
            WHERE id_notificacao = :id_notificacao
            """
        ),
        {"id_notificacao": id_notificacao},
    ).mappings().first()
    if notificacao is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificacao nao encontrada")
    return dict(notificacao)


def _validar_cliente(db: Session, id_cliente: int) -> None:
    if db.get(UsuarioCliente, id_cliente) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente nao encontrado")


@router.get("/tipos", response_model=list[TipoNotificacao])
def listar_tipos_notificacao() -> list[TipoNotificacao]:
    return list(TipoNotificacao)


@router.post("", response_model=NotificacaoRead, status_code=status.HTTP_201_CREATED)
def criar_notificacao(payload: NotificacaoCreate, db: Session = Depends(get_db)) -> Notificacao:
    _validar_cliente(db, payload.id_cliente)
    notificacao = Notificacao(**payload.model_dump())
    db.add(notificacao)
    db.commit()
    db.refresh(notificacao)
    return notificacao


@router.get("", response_model=list[NotificacaoRead])
def listar_notificacoes(
    lida: bool | None = Query(default=None),
    tipo: TipoNotificacao | None = Query(default=None),
    id_cliente: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
) -> list[dict]:
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


@router.get("/cliente/{id_cliente}", response_model=list[NotificacaoRead])
def listar_notificacoes_por_cliente(
    id_cliente: int,
    db: Session = Depends(get_db),
) -> list[dict]:
    rows = db.execute(
        text(
            """
            SELECT id_notificacao, id_cliente, corpo, tipo, lida, criado_em
            FROM notificacoes
            WHERE id_cliente = :id_cliente
            ORDER BY id_notificacao DESC
            """
        ),
        {"id_cliente": id_cliente},
    ).mappings().all()
    return [dict(row) for row in rows]


@router.get("/{id_notificacao}", response_model=NotificacaoRead)
def buscar_notificacao(id_notificacao: int, db: Session = Depends(get_db)) -> dict:
    return _notificacao_or_404(db, id_notificacao)


@router.put("/{id_notificacao}", response_model=NotificacaoRead)
def atualizar_notificacao(id_notificacao: int, payload: NotificacaoUpdate, db: Session = Depends(get_db)) -> dict:
    _notificacao_or_404(db, id_notificacao)
    _validar_cliente(db, payload.id_cliente)
    values = payload.model_dump()
    db.execute(
        text(
            """
            UPDATE notificacoes
            SET id_cliente = :id_cliente,
                corpo = :corpo,
                tipo = :tipo,
                lida = :lida,
                criado_em = :criado_em
            WHERE id_notificacao = :id_notificacao
            """
        ),
        {**values, "tipo": values["tipo"].value, "id_notificacao": id_notificacao},
    )
    db.commit()
    return _notificacao_or_404(db, id_notificacao)


@router.patch("/{id_notificacao}/lida", response_model=NotificacaoRead)
def marcar_como_lida(id_notificacao: int, db: Session = Depends(get_db)) -> dict:
    _notificacao_or_404(db, id_notificacao)
    db.execute(
        text("UPDATE notificacoes SET lida = true WHERE id_notificacao = :id_notificacao"),
        {"id_notificacao": id_notificacao},
    )
    db.commit()
    return _notificacao_or_404(db, id_notificacao)


@router.delete("/{id_notificacao}", response_model=MessageRead)
def excluir_notificacao(id_notificacao: int, db: Session = Depends(get_db)) -> MessageRead:
    _notificacao_or_404(db, id_notificacao)
    db.execute(
        text("DELETE FROM notificacoes WHERE id_notificacao = :id_notificacao"),
        {"id_notificacao": id_notificacao},
    )
    db.commit()
    return MessageRead(mensagem="Notificacao removida com sucesso")
