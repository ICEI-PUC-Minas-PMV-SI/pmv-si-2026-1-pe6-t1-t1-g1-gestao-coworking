from sqlalchemy import Column, Integer, String
from database import Base

class Plano(Base):
    __tablename__ = "planos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    preco = Column(Integer)

class Assinatura(Base):
    __tablename__ = "assinaturas"

    id = Column(Integer, primary_key=True, index=True)
    usuario = Column(Integer)
    plano_id = Column(Integer)