from fastapi import FastAPI

app = FastAPI()

# pagina inicial
@app.get("/")
def home():
    return {"message": "API Financeiro rodando"}

# (simulação)
planos = [
    {"id": 1, "nome": "Básico", "preco": 100},
    {"id": 2, "nome": "Intermediário", "preco": 200},
    {"id": 3, "nome": "Premium", "preco": 300}
]

assinaturas = []

# listar planos (página comercial)
@app.get("/planos")
def listar_planos():
    return planos

# assinar plano
@app.post("/assinar/{plano_id}")
def assinar(plano_id: int):
    assinatura = {"usuario": 1, "plano_id": plano_id}
    assinaturas.append(assinatura)
    return {"msg": "Plano assinado"}

# ver assinatura atual
@app.get("/assinatura")
def ver_assinatura():
    if assinaturas:
        return assinaturas[-1]
    return {"msg": "Sem assinatura"}

# trocar plano
@app.put("/assinatura/{plano_id}")
def trocar(plano_id: int):
    if assinaturas:
        assinaturas[-1]["plano_id"] = plano_id
        return {"msg": "Plano alterado"}
    return {"erro": "Sem assinatura"}

# cancelar assinatura
@app.delete("/assinatura")
def cancelar():
    assinaturas.clear()
    return {"msg": "Cancelado"}