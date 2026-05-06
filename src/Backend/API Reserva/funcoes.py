from sqlmodel import Session
from fastapi import HTTPException, status

def verificar(tabela, id: int, sessao: Session):
    existe = sessao.get(tabela, id)

    if not existe:
        nome = tabela.__name__
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"O id {id} de {nome} enviado não existe.")
    
    return existe