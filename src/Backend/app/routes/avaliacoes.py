from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Avaliacao, Cliente, Reserva, Sala
from app.schemas import AvaliacaoCreate, AvaliacaoRead, AvaliacaoUpdate, ReservaOptionRead


router = APIRouter(tags=["Avaliacoes"])


def _avaliacao_or_404(db: Session, id_avaliacao: int) -> None:
    avaliacao = db.execute(
        text("SELECT 1 FROM avaliacoes WHERE id_avaliacao = :id_avaliacao"),
        {"id_avaliacao": id_avaliacao},
    ).scalar_one_or_none()
    if avaliacao is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avaliacao nao encontrada")


def _to_read(row) -> AvaliacaoRead:
    avaliacao, nome_usuario, nome_sala, tipo_sala = row
    tipo_sala_texto = tipo_sala.value if hasattr(tipo_sala, "value") else tipo_sala
    return AvaliacaoRead(
        id_avaliacao=avaliacao.id_avaliacao,
        id_cliente=avaliacao.id_cliente,
        id_sala=avaliacao.id_sala,
        id_reserva=avaliacao.id_reserva,
        nota=avaliacao.nota,
        corpo=avaliacao.corpo,
        criado_em=avaliacao.criado_em,
        resposta_admin=avaliacao.resposta_admin,
        respondido_em=avaliacao.respondido_em,
        nome_usuario=nome_usuario or "Usuario nao informado",
        nome_sala=nome_sala or "Sala nao informada",
        tipo_sala=str(tipo_sala_texto or "Tipo nao informado"),
    )


def _query_avaliacoes(id_avaliacao: int | None = None):
    query = (
        select(Avaliacao, Cliente.nome, Sala.nome, Sala.tipo)
        .join(Cliente, Cliente.id_cliente == Avaliacao.id_cliente, isouter=True)
        .join(Sala, Sala.id_sala == Avaliacao.id_sala, isouter=True)
        .order_by(desc(Avaliacao.criado_em), desc(Avaliacao.id_avaliacao))
    )
    if id_avaliacao is not None:
        query = query.where(Avaliacao.id_avaliacao == id_avaliacao)
    return query


def _avaliacao_mapping_to_read(row) -> AvaliacaoRead:
    return AvaliacaoRead(
        id_avaliacao=row["id_avaliacao"],
        id_cliente=row["id_cliente"],
        id_sala=row["id_sala"],
        id_reserva=row["id_reserva"],
        nota=row["nota"],
        corpo=row["corpo"],
        criado_em=row["criado_em"],
        resposta_admin=row["resposta_admin"],
        respondido_em=row["respondido_em"],
        nome_usuario=row["nome_usuario"] or "Usuario nao informado",
        nome_sala=row["nome_sala"] or "Sala nao informada",
        tipo_sala=str(row["tipo_sala"] or "Tipo nao informado"),
    )


def _query_avaliacoes_sql(db: Session, id_cliente: int | None = None, id_avaliacao: int | None = None) -> list[AvaliacaoRead]:
    filters: list[str] = []
    params: dict[str, int] = {}
    if id_cliente is not None:
        filters.append("a.id_cliente = :id_cliente")
        params["id_cliente"] = id_cliente
    if id_avaliacao is not None:
        filters.append("a.id_avaliacao = :id_avaliacao")
        params["id_avaliacao"] = id_avaliacao

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
    rows = db.execute(
        text(
            f"""
            SELECT
                a.id_avaliacao,
                a.id_cliente,
                a.id_sala,
                a.id_reserva,
                a.nota,
                a.corpo,
                a.criado_em,
                NULL::text AS resposta_admin,
                NULL::date AS respondido_em,
                uc.nome AS nome_usuario,
                s.nome AS nome_sala,
                s.tipo AS tipo_sala
            FROM avaliacoes a
            LEFT JOIN usuario_cliente uc ON uc.id_cliente = a.id_cliente
            LEFT JOIN salas s ON s.id_sala = a.id_sala
            {where_clause}
            ORDER BY a.criado_em DESC, a.id_avaliacao DESC
            """
        ),
        params,
    ).mappings().all()
    return [_avaliacao_mapping_to_read(row) for row in rows]


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
    return _query_avaliacoes_sql(db)


@router.get("/avaliacao/cliente/{id_cliente}", response_model=list[AvaliacaoRead])
@router.get("/avaliacoes/cliente/{id_cliente}", response_model=list[AvaliacaoRead])
def listar_avaliacoes_por_cliente(id_cliente: int, db: Session = Depends(get_db)) -> list[AvaliacaoRead]:
    return _query_avaliacoes_sql(db, id_cliente=id_cliente)


@router.get("/avaliacao/{id_avaliacao}", response_model=AvaliacaoRead)
@router.get("/avaliacoes/{id_avaliacao}", response_model=AvaliacaoRead)
def buscar_avaliacao(id_avaliacao: int, db: Session = Depends(get_db)) -> AvaliacaoRead:
    avaliacoes = _query_avaliacoes_sql(db, id_avaliacao=id_avaliacao)
    if not avaliacoes:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avaliacao nao encontrada")
    return avaliacoes[0]


@router.post("/avaliacao", response_model=AvaliacaoRead, status_code=status.HTTP_201_CREATED)
@router.post("/avaliacoes", response_model=AvaliacaoRead, status_code=status.HTTP_201_CREATED)
def criar_avaliacao(payload: AvaliacaoCreate, db: Session = Depends(get_db)) -> AvaliacaoRead:
    reserva = db.get(Reserva, payload.id_reserva)
    if reserva is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva nao encontrada")
    if reserva.id_cliente is None or reserva.id_sala is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reserva sem cliente ou sala vinculados")
    try:
        id_avaliacao = db.execute(
            text(
                """
                INSERT INTO avaliacoes (id_cliente, id_sala, id_reserva, nota, corpo, criado_em)
                VALUES (:id_cliente, :id_sala, :id_reserva, :nota, :corpo, :criado_em)
                RETURNING id_avaliacao
                """
            ),
            {
                "id_cliente": reserva.id_cliente,
                "id_sala": reserva.id_sala,
                "id_reserva": payload.id_reserva,
                "nota": payload.nota,
                "corpo": payload.corpo,
                "criado_em": payload.criado_em,
            },
        ).scalar_one()
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Conflito ao salvar avaliacao") from exc
    return buscar_avaliacao(id_avaliacao, db)


@router.put("/avaliacao/{id_avaliacao}", response_model=AvaliacaoRead)
@router.put("/avaliacoes/{id_avaliacao}", response_model=AvaliacaoRead)
def atualizar_avaliacao(id_avaliacao: int, payload: AvaliacaoUpdate, db: Session = Depends(get_db)) -> AvaliacaoRead:
    _avaliacao_or_404(db, id_avaliacao)
    reserva = db.get(Reserva, payload.id_reserva)
    if reserva is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva nao encontrada")
    if reserva.id_cliente is None or reserva.id_sala is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reserva sem cliente ou sala vinculados")
    db.execute(
        text(
            """
            UPDATE avaliacoes
            SET id_cliente = :id_cliente,
                id_sala = :id_sala,
                id_reserva = :id_reserva,
                nota = :nota,
                corpo = :corpo,
                criado_em = :criado_em
            WHERE id_avaliacao = :id_avaliacao
            """
        ),
        {
            "id_cliente": reserva.id_cliente,
            "id_sala": reserva.id_sala,
            "id_reserva": payload.id_reserva,
            "nota": payload.nota,
            "corpo": payload.corpo,
            "criado_em": payload.criado_em,
            "id_avaliacao": id_avaliacao,
        },
    )
    db.commit()
    return buscar_avaliacao(id_avaliacao, db)


@router.delete("/avaliacao/{id_avaliacao}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/avaliacoes/{id_avaliacao}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_avaliacao(id_avaliacao: int, db: Session = Depends(get_db)) -> None:
    _avaliacao_or_404(db, id_avaliacao)
    db.execute(
        text("DELETE FROM avaliacoes WHERE id_avaliacao = :id_avaliacao"),
        {"id_avaliacao": id_avaliacao},
    )
    db.commit()
    return None
