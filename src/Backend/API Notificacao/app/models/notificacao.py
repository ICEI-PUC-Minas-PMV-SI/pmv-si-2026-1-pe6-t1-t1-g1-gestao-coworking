import enum
from datetime import date

from sqlalchemy import Boolean, Date, Enum, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TipoNotificacao(str, enum.Enum):
    ALERTA = "Alerta"
    CONFIRMACAO_RESERVA = "Confirmação de Reserva"
    LEMBRETE = "Lembrete"
    RENOVACAO_PLANO = "Renovação de Plano"


class Notificacao(Base):
    __tablename__ = "notificacoes"

    id_notificacao: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    id_cliente: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    corpo: Mapped[str] = mapped_column(Text, nullable=False)
    tipo: Mapped[TipoNotificacao] = mapped_column(
        Enum(
            TipoNotificacao,
            name="tipo_notificacao",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=False,
    )
    lida: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    criado_em: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        default=date.today,
    )
