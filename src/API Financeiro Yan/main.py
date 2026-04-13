from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, services, schema

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def home():
    return {"msg": "API Financeiro rodando"}

@app.get("/planos")
def listar(db: Session = Depends(get_db)):
    return services.listar_planos(db)

@app.post("/planos")
def criar(plano: schema.PlanoCreate, db: Session = Depends(get_db)):
    return services.criar_plano(db, plano)

@app.post("/assinaturas/{plano_id}")
def assinar(plano_id: int, db: Session = Depends(get_db)):
    return services.assinar_plano(db, plano_id)

@app.get("/assinaturas")
def ver(db: Session = Depends(get_db)):
    return services.ver_assinatura(db)

@app.put("/assinaturas/{plano_id}")
def trocar(plano_id: int, db: Session = Depends(get_db)):
    return services.trocar_plano(db, plano_id)

@app.delete("/assinaturas")
def cancelar(db: Session = Depends(get_db)):
    return services.cancelar_assinatura(db)