"""create notificacoes table"""

from alembic import op
import sqlalchemy as sa


revision = "20260411_0001"
down_revision = None
branch_labels = None
depends_on = None


tipo_notificacao = sa.Enum(
    "Alerta",
    "Confirmacao de Reserva",
    "Lembrete",
    name="tipo_notificacao",
)


def upgrade() -> None:
    tipo_notificacao.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "notificacoes",
        sa.Column("id_notificacao", sa.Integer(), primary_key=True),
        sa.Column("corpo", sa.String(length=255), nullable=False),
        sa.Column("tipo", tipo_notificacao, nullable=False),
        sa.Column("lida", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("id_assinatura", sa.Integer(), nullable=False),
        sa.Column("id_reserva", sa.Integer(), nullable=False),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("ix_notificacoes_id_assinatura", "notificacoes", ["id_assinatura"])
    op.create_index("ix_notificacoes_id_reserva", "notificacoes", ["id_reserva"])
    op.create_index("ix_notificacoes_id_notificacao", "notificacoes", ["id_notificacao"])


def downgrade() -> None:
    op.drop_index("ix_notificacoes_id_notificacao", table_name="notificacoes")
    op.drop_index("ix_notificacoes_id_reserva", table_name="notificacoes")
    op.drop_index("ix_notificacoes_id_assinatura", table_name="notificacoes")
    op.drop_table("notificacoes")
    tipo_notificacao.drop(op.get_bind(), checkfirst=True)
