from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Reserva, Sala, TipoSala
from app.schemas import SalaCreate, SalaRead, SalaUpdate


router = APIRouter(prefix="/salas", tags=["Salas"])


def _sala_or_404(db: Session, id_sala: int) -> Sala:
    sala = db.get(Sala, id_sala)
    if sala is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala nao encontrada")
    return sala


@router.get("/tipos", response_model=list[TipoSala])
def listar_tipos_sala() -> list[TipoSala]:
    return list(TipoSala)


@router.get("", response_model=list[SalaRead])
def listar_salas(ativas: bool | None = None, db: Session = Depends(get_db)) -> list[Sala]:
    query = select(Sala).order_by(Sala.id_sala)
    if ativas is not None:
        query = query.where(Sala.ativa == ativas)
    return list(db.scalars(query).all())


@router.post("", response_model=SalaRead, status_code=status.HTTP_201_CREATED)
def criar_sala(payload: SalaCreate, db: Session = Depends(get_db)) -> Sala:
    sala = Sala(**payload.model_dump(by_alias=False))
    db.add(sala)
    db.commit()
    db.refresh(sala)
    return sala


@router.get("/{id_sala}", response_model=SalaRead)
def buscar_sala(id_sala: int, db: Session = Depends(get_db)) -> Sala:
    return _sala_or_404(db, id_sala)


@router.put("/{id_sala}", response_model=SalaRead)
def atualizar_sala(id_sala: int, payload: SalaUpdate, db: Session = Depends(get_db)) -> Sala:
    sala = _sala_or_404(db, id_sala)
    for field, value in payload.model_dump(by_alias=False).items():
        setattr(sala, field, value)
    db.commit()
    db.refresh(sala)
    return sala


@router.delete("/{id_sala}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_sala(id_sala: int, db: Session = Depends(get_db)) -> None:
    sala = _sala_or_404(db, id_sala)
    reservas = db.scalars(select(Reserva).where(Reserva.id_sala == id_sala)).all()
    for reserva in reservas:
        reserva.id_sala = None
    db.delete(sala)
    db.commit()
    return None
