import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class TipoSala(str, enum.Enum):
    MESA_TRABALHO = "1 Mesa de Trabalho"
    SALA_INDIVIDUAL = "2 Sala Individual"
    SALA_ATENDIMENTO = "3 Sala de Atendimento"
    SALA_REUNIAO = "4 Sala de Reunião"


class StatusReserva(str, enum.Enum):
    FINALIZADA = "Finalizada"
    EM_ANDAMENTO = "Em Andamento"
    CANCELADA = "Cancelada"
    CONFIRMADA = "Confirmada"


class StatusAssinatura(str, enum.Enum):
    ATIVA = "Ativa"
    CANCELADA = "Cancelada"
    VENCIDA = "Vencida"


class TipoNotificacao(str, enum.Enum):
    CONFIRMACAO_RESERVA = "Confirmação de Reserva"
    LEMBRETE = "Lembrete"
    ALERTA = "Alerta"
    RENOVACAO_PLANO = "Renovação de Plano"


tipo_sala_enum = Enum(TipoSala, name="tipo_sala", values_callable=lambda enum_cls: [item.value for item in enum_cls])
status_reserva_enum = Enum(StatusReserva, name="status_reserva", values_callable=lambda enum_cls: [item.value for item in enum_cls])
status_assinatura_enum = Enum(StatusAssinatura, name="status_assinatura", values_callable=lambda enum_cls: [item.value for item in enum_cls])
tipo_notificacao_enum = Enum(TipoNotificacao, name="tipo_notificacao", values_callable=lambda enum_cls: [item.value for item in enum_cls])


class Cliente(Base):
    __tablename__ = "cliente"

    id_cliente: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String, nullable=False)
    cpf: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    telefone: Mapped[str | None] = mapped_column(String, nullable=True)
    senha: Mapped[str] = mapped_column(String, nullable=False)

    reservas: Mapped[list["Reserva"]] = relationship(back_populates="cliente")
    assinaturas: Mapped[list["Assinatura"]] = relationship(back_populates="cliente")


class UsuarioCliente(Base):
    __tablename__ = "usuario_cliente"

    id_cliente: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String, nullable=False)
    cpf: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    telefone: Mapped[str | None] = mapped_column(String, nullable=True)
    senha: Mapped[str] = mapped_column(String, nullable=False)


class Sala(Base):
    __tablename__ = "sala"

    id_sala: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String, nullable=False)
    capacidade: Mapped[int] = mapped_column(Integer, nullable=False)
    tipo: Mapped[TipoSala] = mapped_column(tipo_sala_enum, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    recursos: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    ativa: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    reservas: Mapped[list["Reserva"]] = relationship(back_populates="sala")


class Reserva(Base):
    __tablename__ = "reservas"

    id_reserva: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_cliente: Mapped[int | None] = mapped_column(ForeignKey("cliente.id_cliente", ondelete="SET NULL"), nullable=True)
    id_sala: Mapped[int | None] = mapped_column(ForeignKey("sala.id_sala", ondelete="RESTRICT"), nullable=True)
    status: Mapped[StatusReserva] = mapped_column(status_reserva_enum, nullable=False, default=StatusReserva.CONFIRMADA)
    feito_em: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    entrada: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    saida: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    cliente: Mapped[Cliente | None] = relationship(back_populates="reservas")
    sala: Mapped[Sala | None] = relationship(back_populates="reservas")
    avaliacao: Mapped["Avaliacao | None"] = relationship(back_populates="reserva")


class Avaliacao(Base):
    __tablename__ = "avaliacoes"

    id_avaliacao: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_cliente: Mapped[int] = mapped_column(ForeignKey("cliente.id_cliente"), nullable=False)
    id_sala: Mapped[int] = mapped_column(ForeignKey("sala.id_sala"), nullable=False)
    id_reserva: Mapped[int] = mapped_column(ForeignKey("reservas.id_reserva"), nullable=False)
    nota: Mapped[int] = mapped_column(Integer, nullable=False)
    corpo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    criado_em: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    resposta_admin: Mapped[str | None] = mapped_column(Text, nullable=True)
    respondido_em: Mapped[date | None] = mapped_column(Date, nullable=True)

    reserva: Mapped[Reserva | None] = relationship(back_populates="avaliacao")


class Plano(Base):
    __tablename__ = "planos"

    id_plano: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String, nullable=False)
    acesso: Mapped[TipoSala] = mapped_column(tipo_sala_enum, nullable=False)
    preco: Mapped[Decimal] = mapped_column(Numeric, nullable=False)

    assinaturas: Mapped[list["Assinatura"]] = relationship(back_populates="plano")


class Assinatura(Base):
    __tablename__ = "assinaturas"

    id_assinatura: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_cliente: Mapped[int | None] = mapped_column(ForeignKey("cliente.id_cliente", ondelete="SET NULL"), nullable=True)
    id_plano: Mapped[int | None] = mapped_column(ForeignKey("planos.id_plano", ondelete="RESTRICT"), nullable=True)
    status: Mapped[StatusAssinatura] = mapped_column(status_assinatura_enum, nullable=False, default=StatusAssinatura.ATIVA)
    validade: Mapped[date] = mapped_column(Date, nullable=False)
    feita_em: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)

    cliente: Mapped[Cliente | None] = relationship(back_populates="assinaturas")
    plano: Mapped[Plano | None] = relationship(back_populates="assinaturas")


class Notificacao(Base):
    __tablename__ = "notificacoes"

    id_notificacao: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_cliente: Mapped[int] = mapped_column(ForeignKey("usuario_cliente.id_cliente"), nullable=False)
    corpo: Mapped[str] = mapped_column(Text, nullable=False)
    tipo: Mapped[TipoNotificacao] = mapped_column(tipo_notificacao_enum, nullable=False)
    lida: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    criado_em: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
