from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database import SessionLocal, engine
from security import hash_senha, verificar_senha, criar_token
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# função pra conectar no banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/clientes")
def cadastrar_cliente(cliente: dict, db: Session = Depends(get_db)):
    try:
        novo_cliente = models.Cliente(
            nome=cliente["nome"],
            cpf=cliente["cpf"],
            email=cliente["email"],
            telefone=cliente["telefone"],
            senha=hash_senha(cliente["senha"])
        )

        db.add(novo_cliente)
        db.commit()
        db.refresh(novo_cliente)

        return novo_cliente

    except IntegrityError:
        db.rollback()
        return {"erro": "CPF já cadastrado"}
    
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from jose import jwt
from database import SessionLocal, engine
from security import hash_senha, verificar_senha, criar_token, SECRET_KEY, ALGORITHM
import models

security = HTTPBearer()

def verificar_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]
    except:
        raise HTTPException(status_code=401, detail="Token inválido")


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

    if cliente:
        cliente.nome = dados["nome"]
        cliente.cpf = dados["cpf"]
        cliente.email = dados["email"]
        cliente.telefone = dados["telefone"]
        cliente.senha = hash_senha(dados["senha"])

        db.commit()
        return cliente

    return {"erro": "Cliente não encontrado"}


@app.delete("/clientes/{id}")
def excluir_cliente(id: int, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == id).first()

    if cliente:
        db.delete(cliente)
        db.commit()
        return {"mensagem": "Cliente removido"}

    return {"erro": "Cliente não encontrado"}

@app.post("/login")
def login(dados: dict, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.cpf == dados["cpf"]).first()

    if not cliente:
        return {"erro": "Cliente não encontrado"}

    if not verificar_senha(dados["senha"], cliente.senha):
        return {"erro": "Senha incorreta"}

    token = criar_token({"sub": cliente.cpf})

    return {
        "mensagem": "Login realizado",
        "access_token": token,
        "token_type": "bearer"
    }
