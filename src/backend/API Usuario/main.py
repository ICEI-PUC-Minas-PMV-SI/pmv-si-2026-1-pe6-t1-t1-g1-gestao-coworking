from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from jose import jwt
from database import SessionLocal, engine
from security import hash_senha, verificar_senha, criar_token, SECRET_KEY, ALGORITHM
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

security = HTTPBearer()

# ── Helpers ────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verificar_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")


# ── Seed: cria usuário admin na primeira inicialização ─────

def seed_admin():
    db = SessionLocal()
    try:
        existe = db.query(models.Cliente).filter(models.Cliente.cpf == "00000000000").first()
        if not existe:
            admin = models.Cliente(
                nome="Admin",
                cpf="00000000000",
                email="admin@axiswork.com",
                telefone="(31) 9999-0000",
                senha=hash_senha("admin"),
                is_admin=True,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


seed_admin()

# ── Endpoints ──────────────────────────────────────────────

@app.post("/clientes")
def cadastrar_cliente(cliente: dict, db: Session = Depends(get_db)):
    try:
        novo_cliente = models.Cliente(
            nome=cliente["nome"],
            cpf=cliente["cpf"],
            email=cliente["email"],
            telefone=cliente["telefone"],
            senha=hash_senha(cliente["senha"]),
            is_admin=cliente.get("is_admin", False),
        )
        db.add(novo_cliente)
        db.commit()
        db.refresh(novo_cliente)
        return novo_cliente

    except IntegrityError:
        db.rollback()
        return {"erro": "CPF já cadastrado"}


@app.get("/clientes")
def listar_clientes(token=Depends(security), db: Session = Depends(get_db)):
    verificar_token(token.credentials)
    return db.query(models.Cliente).all()


@app.get("/clientes/{id}")
def buscar_cliente(id: int, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente


@app.put("/clientes/{id}")
def atualizar_cliente(id: int, dados: dict, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == id).first()
    if not cliente:
        return {"erro": "Cliente não encontrado"}

    cliente.nome = dados["nome"]
    cliente.cpf = dados["cpf"]
    cliente.email = dados["email"]
    cliente.telefone = dados["telefone"]
    if dados.get("senha"):
        cliente.senha = hash_senha(dados["senha"])
    if "is_admin" in dados:
        cliente.is_admin = dados["is_admin"]

    db.commit()
    return cliente


@app.delete("/clientes/{id}")
def excluir_cliente(id: int, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == id).first()
    if not cliente:
        return {"erro": "Cliente não encontrado"}

    db.delete(cliente)
    db.commit()
    return {"mensagem": "Cliente removido"}


@app.post("/login")
def login(dados: dict, db: Session = Depends(get_db)):
    # Aceita login por CPF ou por campo "username" (para compatibilidade mobile)
    cpf = dados.get("cpf") or dados.get("username")
    senha = dados.get("senha") or dados.get("password")

    if not cpf or not senha:
        return {"erro": "CPF e senha são obrigatórios"}

    cliente = db.query(models.Cliente).filter(models.Cliente.cpf == cpf).first()

    if not cliente:
        return {"erro": "Cliente não encontrado"}

    if not verificar_senha(senha, cliente.senha):
        return {"erro": "Senha incorreta"}

    token = criar_token({"sub": cliente.cpf})

    return {
        "mensagem": "Login realizado",
        "access_token": token,
        "token_type": "bearer",
        "cliente": {
            "id": cliente.id,
            "nome": cliente.nome,
            "cpf": cliente.cpf,
            "email": cliente.email,
            "telefone": cliente.telefone,
            "is_admin": cliente.is_admin,
        },
    }
