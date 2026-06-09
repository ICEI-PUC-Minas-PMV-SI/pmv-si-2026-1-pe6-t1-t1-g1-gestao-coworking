from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Cliente
from app.schemas import ClienteCreate, ClientePatch, ClienteRead, ClienteSenhaPatch, ClienteUpdate, LoginInput, MessageRead, TokenRead
from app.security import criar_token, hash_senha, verificar_senha, verificar_token


router = APIRouter(tags=["Clientes"])
security = HTTPBearer(auto_error=False)


def _cliente_or_404(db: Session, id_cliente: int) -> Cliente:
    cliente = db.get(Cliente, id_cliente)
    if cliente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente nao encontrado")
    return cliente


@router.post("/clientes", response_model=ClienteRead, status_code=status.HTTP_201_CREATED)
def cadastrar_cliente(payload: ClienteCreate, db: Session = Depends(get_db)) -> Cliente:
    cliente = Cliente(**payload.model_dump(exclude={"senha"}), senha=hash_senha(payload.senha))
    db.add(cliente)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CPF ou email ja cadastrado") from exc
    db.refresh(cliente)
    return cliente


@router.post("/login", response_model=TokenRead)
def login(payload: LoginInput, db: Session = Depends(get_db)) -> TokenRead:
    cliente = db.scalar(select(Cliente).where(Cliente.cpf == payload.cpf))
    if cliente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente nao encontrado")
    if not verificar_senha(payload.senha, cliente.senha):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Senha incorreta")
    return TokenRead(mensagem="Login realizado", access_token=criar_token(cliente.cpf))


@router.get("/clientes", response_model=list[ClienteRead])
def listar_clientes(
    token: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> list[Cliente]:
    if token is not None:
        verificar_token(token.credentials)
    return list(db.scalars(select(Cliente).order_by(Cliente.id_cliente)).all())


@router.get("/clientes/{id_cliente}", response_model=ClienteRead)
def buscar_cliente(id_cliente: int, db: Session = Depends(get_db)) -> Cliente:
    return _cliente_or_404(db, id_cliente)


@router.put("/clientes/{id_cliente}", response_model=ClienteRead)
def atualizar_cliente(id_cliente: int, payload: ClienteUpdate, db: Session = Depends(get_db)) -> Cliente:
    cliente = _cliente_or_404(db, id_cliente)
    for field, value in payload.model_dump(exclude={"senha"}).items():
        setattr(cliente, field, value)
    cliente.senha = hash_senha(payload.senha)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CPF ou email ja cadastrado") from exc
    db.refresh(cliente)
    return cliente


@router.patch("/clientes/{id_cliente}", response_model=ClienteRead)
def atualizar_dados_cliente(id_cliente: int, payload: ClientePatch, db: Session = Depends(get_db)) -> Cliente:
    cliente = _cliente_or_404(db, id_cliente)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(cliente, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email ja cadastrado") from exc
    db.refresh(cliente)
    return cliente


@router.patch("/clientes/{id_cliente}/senha", response_model=MessageRead)
def atualizar_senha_cliente(id_cliente: int, payload: ClienteSenhaPatch, db: Session = Depends(get_db)) -> MessageRead:
    cliente = _cliente_or_404(db, id_cliente)
    if not verificar_senha(payload.senha_atual, cliente.senha):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Senha atual incorreta")
    cliente.senha = hash_senha(payload.nova_senha)
    db.commit()
    return MessageRead(mensagem="Senha atualizada")


@router.delete("/clientes/{id_cliente}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_cliente(id_cliente: int, db: Session = Depends(get_db)) -> None:
    cliente = _cliente_or_404(db, id_cliente)
    db.delete(cliente)
    db.commit()
    return None
