from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Assinatura, Cliente, Plano, StatusAssinatura
from app.schemas import AssinaturaCreate, AssinaturaRead, AssinaturaUpdate, PlanoCreate, PlanoRead, PlanoUpdate


planos_router = APIRouter(prefix="/planos", tags=["Planos"])
assinaturas_router = APIRouter(prefix="/assinaturas", tags=["Assinaturas"])


def _plano_or_404(db: Session, id_plano: int) -> Plano:
    plano = db.get(Plano, id_plano)
    if plano is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plano nao encontrado")
    return plano


def _assinatura_or_404(db: Session, id_assinatura: int) -> Assinatura:
    assinatura = db.get(Assinatura, id_assinatura)
    if assinatura is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assinatura nao encontrada")
    return assinatura


@planos_router.get("", response_model=list[PlanoRead])
def listar_planos(db: Session = Depends(get_db)) -> list[Plano]:
    return list(db.scalars(select(Plano).order_by(Plano.id_plano)).all())


@planos_router.post("", response_model=PlanoRead, status_code=status.HTTP_201_CREATED)
def criar_plano(payload: PlanoCreate, db: Session = Depends(get_db)) -> Plano:
    plano = Plano(**payload.model_dump())
    db.add(plano)
    db.commit()
    db.refresh(plano)
    return plano


@planos_router.get("/{id_plano}", response_model=PlanoRead)
def buscar_plano(id_plano: int, db: Session = Depends(get_db)) -> Plano:
    return _plano_or_404(db, id_plano)


@planos_router.put("/{id_plano}", response_model=PlanoRead)
def atualizar_plano(id_plano: int, payload: PlanoUpdate, db: Session = Depends(get_db)) -> Plano:
    plano = _plano_or_404(db, id_plano)
    for field, value in payload.model_dump().items():
        setattr(plano, field, value)
    db.commit()
    db.refresh(plano)
    return plano


@planos_router.delete("/{id_plano}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_plano(id_plano: int, db: Session = Depends(get_db)) -> None:
    plano = _plano_or_404(db, id_plano)
    assinaturas = db.scalars(select(Assinatura).where(Assinatura.id_plano == id_plano)).all()
    for assinatura in assinaturas:
        assinatura.id_plano = None
    db.delete(plano)
    db.commit()
    return None


@assinaturas_router.get("", response_model=list[AssinaturaRead])
def listar_assinaturas(id_cliente: int | None = None, db: Session = Depends(get_db)) -> list[Assinatura]:
    query = select(Assinatura).order_by(Assinatura.id_assinatura.desc())
    if id_cliente is not None:
        query = query.where(Assinatura.id_cliente == id_cliente)
    return list(db.scalars(query).all())


@assinaturas_router.post("", response_model=AssinaturaRead, status_code=status.HTTP_201_CREATED)
def criar_assinatura(payload: AssinaturaCreate, db: Session = Depends(get_db)) -> Assinatura:
    if db.get(Cliente, payload.id_cliente) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente nao encontrado")
    _plano_or_404(db, payload.id_plano)

    ativa = None
    if payload.status == StatusAssinatura.ATIVA:
        ativa = db.scalar(
            select(Assinatura).where(
                Assinatura.id_cliente == payload.id_cliente,
                Assinatura.status == StatusAssinatura.ATIVA,
            )
        )
    if ativa is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cliente ja possui assinatura ativa")

    hoje = date.today()
    assinatura = Assinatura(
        id_cliente=payload.id_cliente,
        id_plano=payload.id_plano,
        status=payload.status,
        validade=payload.validade or hoje + timedelta(days=30),
        feita_em=hoje,
    )
    db.add(assinatura)
    db.commit()
    db.refresh(assinatura)
    return assinatura


@assinaturas_router.post("/{id_plano}", response_model=AssinaturaRead, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def assinar_plano_compat(id_plano: int, id_cliente: int = 1, db: Session = Depends(get_db)) -> Assinatura:
    return criar_assinatura(AssinaturaCreate(id_cliente=id_cliente, id_plano=id_plano), db)


@assinaturas_router.get("/{id_assinatura}", response_model=AssinaturaRead)
def buscar_assinatura(id_assinatura: int, db: Session = Depends(get_db)) -> Assinatura:
    return _assinatura_or_404(db, id_assinatura)


@assinaturas_router.put("/{id_assinatura}", response_model=AssinaturaRead)
def atualizar_assinatura(id_assinatura: int, payload: AssinaturaUpdate, db: Session = Depends(get_db)) -> Assinatura:
    assinatura = _assinatura_or_404(db, id_assinatura)
    dados = payload.model_dump(exclude_unset=True)
    if "id_plano" in dados and dados["id_plano"] is not None:
        _plano_or_404(db, dados["id_plano"])
    for field, value in dados.items():
        setattr(assinatura, field, value)
    db.commit()
    db.refresh(assinatura)
    return assinatura


@assinaturas_router.delete("/{id_assinatura}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_assinatura(id_assinatura: int, db: Session = Depends(get_db)) -> None:
    assinatura = _assinatura_or_404(db, id_assinatura)
    db.delete(assinatura)
    db.commit()
    return None
