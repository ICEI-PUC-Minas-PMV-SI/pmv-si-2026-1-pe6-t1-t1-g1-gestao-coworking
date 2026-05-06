from sqlalchemy import Column, Integer, String
from database import Base

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    cpf = Column(String, unique=True)
    email = Column(String)
    telefone = Column(String)
    senha = Column(String)
