from datetime import date, datetime
from decimal import Decimal
import re
from zoneinfo import ZoneInfo

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import StatusAssinatura, StatusReserva, TipoNotificacao, TipoSala


SAO_PAULO = ZoneInfo("America/Sao_Paulo")


def normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value
    return value.astimezone(SAO_PAULO).replace(tzinfo=None)


class ClienteCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=50)
    cpf: str = Field(min_length=11, max_length=11)
    email: str = Field(min_length=1, max_length=100)
    telefone: str | None = Field(default=None, max_length=11)
    senha: str = Field(min_length=1, max_length=50)


class ClienteUpdate(ClienteCreate):
    pass


class ClientePatch(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=50)
    email: str | None = Field(default=None, min_length=1, max_length=100)
    telefone: str | None = Field(default=None, max_length=11)


class ClienteRead(BaseModel):
    id_cliente: int
    nome: str
    cpf: str
    email: str
    telefone: str | None

    model_config = ConfigDict(from_attributes=True)


class LoginInput(BaseModel):
    cpf: str
    senha: str


class TokenRead(BaseModel):
    mensagem: str
    access_token: str
    token_type: str = "bearer"


class SalaBase(BaseModel):
    nome: str = Field(min_length=1, max_length=50)
    capacidade: int = Field(gt=0)
    tipo: TipoSala = Field(alias="tipoSala")
    descricao: str | None = None
    recursos: str | None = None
    criado_em: date = Field(default_factory=date.today)
    ativa: bool = True

    model_config = ConfigDict(populate_by_name=True)


class SalaCreate(SalaBase):
    pass


class SalaUpdate(SalaBase):
    pass


class SalaRead(BaseModel):
    id_sala: int
    nome: str
    capacidade: int
    tipo: TipoSala
    descricao: str | None
    recursos: str | None
    criado_em: date
    ativa: bool

    model_config = ConfigDict(from_attributes=True)


class ReservaCreate(BaseModel):
    id_cliente: int
    id_sala: int
    entrada: datetime
    saida: datetime

    @field_validator("entrada", "saida")
    @classmethod
    def garantir_fuso(cls, value: datetime) -> datetime:
        return normalize_datetime(value)


class ReservaUpdate(BaseModel):
    id_cliente: int | None = None
    id_sala: int | None = None
    status: StatusReserva | None = None
    entrada: datetime | None = None
    saida: datetime | None = None

    @field_validator("entrada", "saida")
    @classmethod
    def garantir_fuso(cls, value: datetime | None) -> datetime | None:
        return normalize_datetime(value) if value else value


class ReservaRead(BaseModel):
    id_reserva: int
    id_cliente: int | None
    id_sala: int | None
    status: StatusReserva
    feito_em: date
    entrada: datetime
    saida: datetime

    model_config = ConfigDict(from_attributes=True)


class AvaliacaoCreate(BaseModel):
    id_reserva: int
    nota: int = Field(ge=0, le=5)
    corpo: str | None = Field(default=None, max_length=255)
    criado_em: date = Field(default_factory=date.today)


class AvaliacaoUpdate(AvaliacaoCreate):
    pass


class AvaliacaoRead(BaseModel):
    id_avaliacao: int
    id_cliente: int
    id_sala: int
    id_reserva: int
    nota: int
    corpo: str | None
    criado_em: date
    resposta_admin: str | None = None
    respondido_em: date | None = None
    nome_usuario: str = "Usuario nao informado"
    nome_sala: str = "Sala nao informada"
    tipo_sala: str = "Tipo nao informado"


class ReservaOptionRead(BaseModel):
    id_reserva: int
    nome_usuario: str = "Usuario nao informado"
    nome_sala: str = "Sala nao informada"
    tipo_sala: str = "Tipo nao informado"


class PlanoCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=50)
    acesso: TipoSala
    preco: Decimal = Field(gt=0)


class PlanoUpdate(PlanoCreate):
    pass


class PlanoRead(PlanoCreate):
    id_plano: int

    model_config = ConfigDict(from_attributes=True)


class AssinaturaCreate(BaseModel):
    id_cliente: int
    id_plano: int
    validade: date | None = None


class AssinaturaUpdate(BaseModel):
    id_plano: int | None = None
    status: StatusAssinatura | None = None
    validade: date | None = None


class AssinaturaRead(BaseModel):
    id_assinatura: int
    id_cliente: int | None
    id_plano: int | None
    status: StatusAssinatura
    validade: date
    feita_em: date

    model_config = ConfigDict(from_attributes=True)


class NotificacaoBase(BaseModel):
    id_cliente: int = Field(ge=1)
    corpo: str = Field(min_length=1)
    tipo: TipoNotificacao
    lida: bool = False
    criado_em: date = Field(default_factory=date.today)

    @field_validator("tipo", mode="before")
    @classmethod
    def normalize_tipo(cls, value: object) -> object:
        if not isinstance(value, str):
            return value

        direct_aliases = {
            "Confirmacao de Reserva": "Confirmação de Reserva",
            "Renovacao de Plano": "Renovação de Plano",
        }
        if value in direct_aliases:
            return direct_aliases[value]

        canonical = re.sub(r"[^a-z]", "", value.lower())
        fuzzy_aliases = {
            "alerta": "Alerta",
            "lembrete": "Lembrete",
            "confirmacaodereserva": "Confirmação de Reserva",
            "renovacaodeplano": "Renovação de Plano",
        }
        return fuzzy_aliases.get(canonical, value)


class NotificacaoCreate(NotificacaoBase):
    pass


class NotificacaoUpdate(NotificacaoBase):
    pass


class NotificacaoRead(NotificacaoBase):
    id_notificacao: int

    model_config = ConfigDict(from_attributes=True)


class MessageRead(BaseModel):
    mensagem: str
