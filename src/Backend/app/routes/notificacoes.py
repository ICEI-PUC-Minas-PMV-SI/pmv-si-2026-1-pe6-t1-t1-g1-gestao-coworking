from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Assinatura, Notificacao, Reserva, TipoNotificacao
from app.schemas import MessageRead, NotificacaoCreate, NotificacaoRead, NotificacaoUpdate


router = APIRouter(prefix="/notificacoes", tags=["Notificacoes"])


def _notificacao_or_404(db: Session, id_notificacao: int) -> Notificacao:
    notificacao = db.get(Notificacao, id_notificacao)
    if notificacao is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificacao nao encontrada")
    return notificacao


def _validar_relacoes(db: Session, id_assinatura: int | None, id_reserva: int | None) -> None:
    if id_assinatura is not None and db.get(Assinatura, id_assinatura) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assinatura nao encontrada")
    if id_reserva is not None and db.get(Reserva, id_reserva) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva nao encontrada")


@router.get("/tipos", response_model=list[TipoNotificacao])
def listar_tipos_notificacao() -> list[TipoNotificacao]:
    return list(TipoNotificacao)


@router.post("", response_model=NotificacaoRead, status_code=status.HTTP_201_CREATED)
def criar_notificacao(payload: NotificacaoCreate, db: Session = Depends(get_db)) -> Notificacao:
    _validar_relacoes(db, payload.id_assinatura, payload.id_reserva)
    notificacao = Notificacao(**payload.model_dump())
    db.add(notificacao)
    db.commit()
    db.refresh(notificacao)
    return notificacao


@router.get("", response_model=list[NotificacaoRead])
def listar_notificacoes(
    lida: bool | None = Query(default=None),
    tipo: TipoNotificacao | None = Query(default=None),
    id_assinatura: int | None = Query(default=None, ge=1),
    id_reserva: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
) -> list[Notificacao]:
    query = select(Notificacao).order_by(Notificacao.id_notificacao.desc())
    if lida is not None:
        query = query.where(Notificacao.lida == lida)
    if tipo is not None:
        query = query.where(Notificacao.tipo == tipo)
    if id_assinatura is not None:
        query = query.where(Notificacao.id_assinatura == id_assinatura)
    if id_reserva is not None:
        query = query.where(Notificacao.id_reserva == id_reserva)
    return list(db.scalars(query).all())


@router.get("/{id_notificacao}", response_model=NotificacaoRead)
def buscar_notificacao(id_notificacao: int, db: Session = Depends(get_db)) -> Notificacao:
    return _notificacao_or_404(db, id_notificacao)


@router.put("/{id_notificacao}", response_model=NotificacaoRead)
def atualizar_notificacao(id_notificacao: int, payload: NotificacaoUpdate, db: Session = Depends(get_db)) -> Notificacao:
    notificacao = _notificacao_or_404(db, id_notificacao)
    _validar_relacoes(db, payload.id_assinatura, payload.id_reserva)
    for field, value in payload.model_dump().items():
        setattr(notificacao, field, value)
    db.commit()
    db.refresh(notificacao)
    return notificacao


@router.patch("/{id_notificacao}/lida", response_model=NotificacaoRead)
def marcar_como_lida(id_notificacao: int, db: Session = Depends(get_db)) -> Notificacao:
    notificacao = _notificacao_or_404(db, id_notificacao)
    notificacao.lida = True
    db.commit()
    db.refresh(notificacao)
    return notificacao


@router.delete("/{id_notificacao}", response_model=MessageRead)
def excluir_notificacao(id_notificacao: int, db: Session = Depends(get_db)) -> MessageRead:
    notificacao = _notificacao_or_404(db, id_notificacao)
    db.delete(notificacao)
    db.commit()
    return MessageRead(mensagem="Notificacao removida com sucesso")

