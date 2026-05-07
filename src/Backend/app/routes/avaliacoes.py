from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Avaliacao, Cliente, Reserva, Sala
from app.schemas import AvaliacaoCreate, AvaliacaoRead, AvaliacaoUpdate, ReservaOptionRead


router = APIRouter(tags=["Avaliacoes"])


def _avaliacao_or_404(db: Session, id_avaliacao: int) -> Avaliacao:
    avaliacao = db.get(Avaliacao, id_avaliacao)
    if avaliacao is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avaliacao nao encontrada")
    return avaliacao


def _to_read(row) -> AvaliacaoRead:
    avaliacao, nome_usuario, nome_sala, tipo_sala = row
    tipo_sala_texto = tipo_sala.value if hasattr(tipo_sala, "value") else tipo_sala
    return AvaliacaoRead(
        id_avaliacao=avaliacao.id_avaliacao,
        id_reserva=avaliacao.id_reserva,
        nota=avaliacao.nota,
        corpo=avaliacao.corpo,
        criado_em=avaliacao.criado_em,
        nome_usuario=nome_usuario or "Usuario nao informado",
        nome_sala=nome_sala or "Sala nao informada",
        tipo_sala=str(tipo_sala_texto or "Tipo nao informado"),
    )


def _query_avaliacoes(id_avaliacao: int | None = None):
    query = (
        select(Avaliacao, Cliente.nome, Sala.nome, Sala.tipo)
        .join(Reserva, Reserva.id_reserva == Avaliacao.id_reserva, isouter=True)
        .join(Cliente, Cliente.id_cliente == Reserva.id_cliente, isouter=True)
        .join(Sala, Sala.id_sala == Reserva.id_sala, isouter=True)
        .order_by(desc(Avaliacao.criado_em), desc(Avaliacao.id_avaliacao))
    )
    if id_avaliacao is not None:
        query = query.where(Avaliacao.id_avaliacao == id_avaliacao)
    return query


@router.get("/avaliacao/opcoes/reservas", response_model=list[ReservaOptionRead])
@router.get("/avaliacoes/opcoes/reservas", response_model=list[ReservaOptionRead])
def listar_opcoes_reservas(db: Session = Depends(get_db)) -> list[ReservaOptionRead]:
    rows = db.execute(
        select(Reserva.id_reserva, Cliente.nome, Sala.nome, Sala.tipo)
        .join(Cliente, Cliente.id_cliente == Reserva.id_cliente, isouter=True)
        .join(Sala, Sala.id_sala == Reserva.id_sala, isouter=True)
        .order_by(Cliente.nome, Sala.nome, Reserva.id_reserva)
    ).all()
    return [
        ReservaOptionRead(
            id_reserva=id_reserva,
            nome_usuario=nome_usuario or "Usuario nao informado",
            nome_sala=nome_sala or "Sala nao informada",
            tipo_sala=str((tipo_sala.value if hasattr(tipo_sala, "value") else tipo_sala) or "Tipo nao informado"),
        )
        for id_reserva, nome_usuario, nome_sala, tipo_sala in rows
    ]


@router.get("/avaliacao", response_model=list[AvaliacaoRead])
@router.get("/avaliacoes", response_model=list[AvaliacaoRead])
def listar_avaliacoes(db: Session = Depends(get_db)) -> list[AvaliacaoRead]:
    return [_to_read(row) for row in db.execute(_query_avaliacoes()).all()]


@router.get("/avaliacao/{id_avaliacao}", response_model=AvaliacaoRead)
@router.get("/avaliacoes/{id_avaliacao}", response_model=AvaliacaoRead)
def buscar_avaliacao(id_avaliacao: int, db: Session = Depends(get_db)) -> AvaliacaoRead:
    row = db.execute(_query_avaliacoes(id_avaliacao)).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avaliacao nao encontrada")
    return _to_read(row)


@router.post("/avaliacao", response_model=AvaliacaoRead, status_code=status.HTTP_201_CREATED)
@router.post("/avaliacoes", response_model=AvaliacaoRead, status_code=status.HTTP_201_CREATED)
def criar_avaliacao(payload: AvaliacaoCreate, db: Session = Depends(get_db)) -> AvaliacaoRead:
    if db.get(Reserva, payload.id_reserva) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva nao encontrada")
    avaliacao = Avaliacao(**payload.model_dump())
    db.add(avaliacao)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Conflito ao salvar avaliacao") from exc
    db.refresh(avaliacao)
    return buscar_avaliacao(avaliacao.id_avaliacao, db)


@router.put("/avaliacao/{id_avaliacao}", response_model=AvaliacaoRead)
@router.put("/avaliacoes/{id_avaliacao}", response_model=AvaliacaoRead)
def atualizar_avaliacao(id_avaliacao: int, payload: AvaliacaoUpdate, db: Session = Depends(get_db)) -> AvaliacaoRead:
    avaliacao = _avaliacao_or_404(db, id_avaliacao)
    if db.get(Reserva, payload.id_reserva) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva nao encontrada")
    for field, value in payload.model_dump().items():
        setattr(avaliacao, field, value)
    db.commit()
    return buscar_avaliacao(id_avaliacao, db)


@router.delete("/avaliacao/{id_avaliacao}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/avaliacoes/{id_avaliacao}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_avaliacao(id_avaliacao: int, db: Session = Depends(get_db)) -> None:
    avaliacao = _avaliacao_or_404(db, id_avaliacao)
    db.delete(avaliacao)
    db.commit()
    return None
