from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import cast, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.types import Date

from app.db import get_db
from app.models import Cliente, Reserva, Sala, StatusReserva
from app.schemas import ReservaCreate, ReservaRead, ReservaUpdate


router = APIRouter(tags=["Reservas"])
SAO_PAULO = ZoneInfo("America/Sao_Paulo")


def _reserva_or_404(db: Session, id_reserva: int) -> Reserva:
    reserva = db.get(Reserva, id_reserva)
    if reserva is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva nao encontrada")
    return reserva


def _exists_or_404(db: Session, model: type, item_id: int, label: str) -> None:
    if db.get(model, item_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label} nao encontrado")


def _validar_horario(entrada: datetime, saida: datetime) -> None:
    agora = datetime.now(SAO_PAULO).replace(tzinfo=None)
    if entrada >= saida:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A entrada fornecida e igual ou apos a saida.")
    if entrada <= agora:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A reserva nao pode ser criada no passado.")
    if entrada.minute != 0 or saida.minute != 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A hora de entrada e saida devem ser horas inteiras.")
    if entrada.date() != saida.date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A data de entrada difere da data de saida.")


def _validar_conflito(db: Session, id_sala: int, entrada: datetime, saida: datetime, ignorar_id: int | None = None) -> None:
    query = select(Reserva).where(
        Reserva.id_sala == id_sala,
        Reserva.entrada < saida,
        Reserva.saida > entrada,
        Reserva.status != StatusReserva.CANCELADA,
    )
    if ignorar_id is not None:
        query = query.where(Reserva.id_reserva != ignorar_id)
    if db.scalar(query) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A sala ja esta ocupada neste horario")


@router.post("/reservas", response_model=ReservaRead, status_code=status.HTTP_201_CREATED)
@router.post("/reserva", response_model=ReservaRead, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def criar_reserva(payload: ReservaCreate, db: Session = Depends(get_db)) -> Reserva:
    _exists_or_404(db, Cliente, payload.id_cliente, "Cliente")
    _exists_or_404(db, Sala, payload.id_sala, "Sala")
    _validar_horario(payload.entrada, payload.saida)
    _validar_conflito(db, payload.id_sala, payload.entrada, payload.saida)

    reserva = Reserva(**payload.model_dump(), status=StatusReserva.CONFIRMADA, feito_em=date.today())
    db.add(reserva)
    db.commit()
    db.refresh(reserva)
    return reserva


@router.get("/reservas", response_model=list[ReservaRead])
@router.get("/reserva", response_model=list[ReservaRead], include_in_schema=False)
def listar_reservas(
    id_cliente: int | None = None,
    id_sala: int | None = None,
    inicio: date | None = None,
    fim: date | None = None,
    offset: int = 0,
    limit: int = Query(default=10, le=100),
    db: Session = Depends(get_db),
) -> list[Reserva]:
    if bool(inicio) ^ bool(fim):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Se fornecer inicio ou fim, deve fornecer o outro.")

    query = select(Reserva).order_by(Reserva.entrada.desc(), Reserva.id_reserva.desc())
    if id_cliente is not None:
        _exists_or_404(db, Cliente, id_cliente, "Cliente")
        query = query.where(Reserva.id_cliente == id_cliente)
    if id_sala is not None:
        _exists_or_404(db, Sala, id_sala, "Sala")
        query = query.where(Reserva.id_sala == id_sala)
    if inicio and fim:
        query = query.where(cast(Reserva.entrada, Date) >= inicio, cast(Reserva.entrada, Date) <= fim)

    return list(db.scalars(query.offset(offset).limit(limit)).all())


@router.get("/reservas/{id_reserva}", response_model=ReservaRead)
@router.get("/reserva/{id_reserva}", response_model=ReservaRead, include_in_schema=False)
def buscar_reserva(id_reserva: int, db: Session = Depends(get_db)) -> Reserva:
    return _reserva_or_404(db, id_reserva)


@router.patch("/reservas/{id_reserva}", response_model=ReservaRead)
@router.patch("/reserva/{id_reserva}", response_model=ReservaRead, include_in_schema=False)
def editar_reserva(id_reserva: int, payload: ReservaUpdate, db: Session = Depends(get_db)) -> Reserva:
    reserva = _reserva_or_404(db, id_reserva)
    dados = payload.model_dump(exclude_unset=True)

    if "id_cliente" in dados and dados["id_cliente"] is not None:
        _exists_or_404(db, Cliente, dados["id_cliente"], "Cliente")
    if "id_sala" in dados and dados["id_sala"] is not None:
        _exists_or_404(db, Sala, dados["id_sala"], "Sala")

    entrada = dados.get("entrada", reserva.entrada)
    saida = dados.get("saida", reserva.saida)
    id_sala = dados.get("id_sala", reserva.id_sala)

    if "entrada" in dados or "saida" in dados or "id_sala" in dados:
        if id_sala is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reserva sem sala associada.")
        _validar_horario(entrada, saida)
        _validar_conflito(db, id_sala, entrada, saida, ignorar_id=id_reserva)

    for field, value in dados.items():
        setattr(reserva, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dados invalidos para reserva") from exc
    db.refresh(reserva)
    return reserva


@router.delete("/reservas/{id_reserva}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/reserva/{id_reserva}", status_code=status.HTTP_204_NO_CONTENT, include_in_schema=False)
def deletar_reserva(id_reserva: int, db: Session = Depends(get_db)) -> None:
    _reserva_or_404(db, id_reserva)
    try:
        db.execute(
            text("DELETE FROM reservas WHERE id_reserva = :id_reserva"),
            {"id_reserva": id_reserva},
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Reserva possui registros relacionados") from exc
    return None
