from enum import Enum
from sqlmodel import SQLModel, Field, Column, DateTime
from sqlalchemy.dialects.postgresql import ENUM
from typing import Optional
from datetime import date, datetime
from zoneinfo import ZoneInfo

# cria o enum pra validar o dado de status
class status_reserva(str, Enum):
    Finalizada = "Finalizada"
    Em_Andamento = "Em andamento"
    Cancelada = "Cancelada"
    Confirmada = "Confirmada"

# cria as tabelas de sala e cliente com o minimo pra funcionar
class sala(SQLModel, table=True):
    id_sala: Optional[int] = Field(default= None, primary_key= True)

class cliente(SQLModel, table=True):
    id_cliente: Optional[int] = Field(default= None, primary_key= True)

# cria o modelo do objeto do banco de dados
class reservas(SQLModel, table=True):
    id_reserva: Optional[int] = Field(default= None, primary_key= True)
    id_cliente: Optional[int] = Field(foreign_key="cliente.id_cliente", ondelete="SET NULL")
    id_sala: Optional[int] = Field(foreign_key="sala.id_sala", ondelete="SET NULL")
    status: status_reserva = Field(default=status_reserva.Confirmada, sa_column=Column(ENUM(status_reserva, name="status_reserva"), nullable=False))
    feito_em: date = Field(default_factory=lambda: datetime.now(ZoneInfo("America/Sao_Paulo")).date())
    entrada: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    saida: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))