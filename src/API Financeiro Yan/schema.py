from pydantic import BaseModel

class PlanoCreate(BaseModel):
    nome: str
    preco: int