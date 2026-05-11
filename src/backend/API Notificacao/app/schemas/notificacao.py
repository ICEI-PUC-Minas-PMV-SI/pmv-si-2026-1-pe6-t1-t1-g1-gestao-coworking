from datetime import date

import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.notificacao import TipoNotificacao


class NotificacaoBase(BaseModel):
    id_cliente: int = Field(..., ge=1)
    corpo: str = Field(..., examples=["Reserva confirmada"])
    tipo: TipoNotificacao
    lida: bool = False

    @field_validator("tipo", mode="before")
    @classmethod
    def normalize_tipo(cls, value: object) -> object:
        if not isinstance(value, str):
            return value

        direct_aliases = {
            "Confirmacao de Reserva": "Confirmação de Reserva",
            "ConfirmaÃ§Ã£o de Reserva": "Confirmação de Reserva",
            "Renovacao de Plano": "Renovação de Plano",
            "RenovaÃ§Ã£o de Plano": "Renovação de Plano",
        }
        if value in direct_aliases:
            return direct_aliases[value]

        canonical = re.sub(r"[^a-z]", "", value.lower())
        fuzzy_aliases = {
            "alerta": "Alerta",
            "lembrete": "Lembrete",
            "confirmaodereserva": "Confirmação de Reserva",
            "confirmacaodereserva": "Confirmação de Reserva",
            "confirmaoreserva": "Confirmação de Reserva",
            "renovaodeplano": "Renovação de Plano",
            "renovacaodeplano": "Renovação de Plano",
        }
        return fuzzy_aliases.get(canonical, value)


class NotificacaoCreate(NotificacaoBase):
    pass


class NotificacaoUpdate(NotificacaoBase):
    pass


class NotificacaoRead(NotificacaoBase):
    id_notificacao: int
    criado_em: date

    model_config = ConfigDict(from_attributes=True)


class NotificacaoTipoList(BaseModel):
    tipos: list[TipoNotificacao]


class MessageResponse(BaseModel):
    mensagem: str


class ErrorResponse(BaseModel):
    erro: str
