from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from zoneinfo import ZoneInfo
from model import status_reserva

# Criando um schema que vai ser o de entrada
class reservaEntrada(BaseModel):
    id_cliente: int
    id_sala: int
    entrada: datetime
    saida: datetime

    @field_validator("entrada", "saida", mode="after")
    @classmethod
    def garantirFuso(cls, data: datetime) -> datetime:
        if data.tzinfo is None: # se vem sem, poe o -03
            return data.replace(tzinfo=ZoneInfo("America/Sao_Paulo"))
        # se tem passa direto e calcula a conversão
        return data.astimezone(ZoneInfo("America/Sao_Paulo"))

# Criando um schema que vai ser o de edição pontual
class reservaEdicao(BaseModel):
    id_cliente: Optional[int] = None
    id_sala: Optional[int] = None
    status: Optional[status_reserva] = None
    entrada: Optional[datetime] = None
    saida: Optional[datetime] = None
    
    @field_validator("entrada", "saida", mode="after")
    @classmethod
    def garantirFuso(cls, data: datetime) -> datetime:
        if data.tzinfo is None: # se vem sem, poe o -03
            return data.replace(tzinfo=ZoneInfo("America/Sao_Paulo"))
        # se tem passa direto e calcula a conversão
        return data.astimezone(ZoneInfo("America/Sao_Paulo"))