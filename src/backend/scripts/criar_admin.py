"""
Cria (ou promove) um usuário administrador no banco de dados.

O painel administrativo do app mobile só é liberado para clientes com
`is_admin = true`. Este script garante a coluna `is_admin` na tabela `cliente`
(em bancos já existentes) e cria/atualiza um usuário admin com senha conhecida.

Uso (a partir da pasta backend, com as dependências instaladas):

    python scripts/criar_admin.py
    python scripts/criar_admin.py --cpf 12345678900 --senha minhaSenha --nome "Maria Admin" --email maria@axis.com

Sem argumentos, cria o admin padrão:
    CPF:   00000000000
    Senha: admin
"""

import argparse
import sys
from pathlib import Path

# Garante saída UTF-8 (consoles Windows usam cp1252 por padrão).
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

# Permite importar o pacote `app` (backend é a raiz)
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import select, text  # noqa: E402

from app.db import SessionLocal, engine  # noqa: E402
from app.models import Cliente  # noqa: E402
from app.security import hash_senha  # noqa: E402


def garantir_coluna_is_admin() -> None:
    """Adiciona a coluna is_admin caso o banco tenha sido criado antes desta feature."""
    with engine.begin() as conn:
        conn.execute(
            text("ALTER TABLE cliente ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false")
        )


def criar_ou_promover_admin(cpf: str, senha: str, nome: str, email: str, telefone: str | None) -> None:
    db = SessionLocal()
    try:
        cliente = db.scalar(select(Cliente).where(Cliente.cpf == cpf))

        if cliente is not None:
            cliente.is_admin = True
            cliente.senha = hash_senha(senha)  # garante senha conhecida
            db.commit()
            print(f"[OK] Cliente existente (id={cliente.id_cliente}, CPF={cpf}) promovido a administrador.")
        else:
            cliente = Cliente(
                nome=nome,
                cpf=cpf,
                email=email,
                telefone=telefone,
                senha=hash_senha(senha),
                is_admin=True,
            )
            db.add(cliente)
            db.commit()
            db.refresh(cliente)
            print(f"[OK] Administrador criado (id={cliente.id_cliente}, CPF={cpf}).")

        print("\nCredenciais de acesso ao painel administrativo:")
        print(f"  CPF:   {cpf}")
        print(f"  Senha: {senha}")
    except Exception as exc:  # pragma: no cover
        db.rollback()
        print(f"[ERRO] Não foi possível criar/promover o admin: {exc}")
        print("  Dica: verifique se o e-mail/CPF já não está em uso por outro cliente.")
        sys.exit(1)
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Cria ou promove um usuário administrador.")
    parser.add_argument("--cpf", default="00000000000", help="CPF do admin (11 dígitos).")
    parser.add_argument("--senha", default="admin", help="Senha do admin.")
    parser.add_argument("--nome", default="Administrador", help="Nome do admin.")
    parser.add_argument("--email", default="admin@axiswork.com", help="E-mail do admin.")
    parser.add_argument("--telefone", default=None, help="Telefone (opcional).")
    args = parser.parse_args()

    cpf = "".join(filter(str.isdigit, args.cpf))
    if len(cpf) != 11:
        print("[ERRO] CPF inválido: informe 11 dígitos.")
        sys.exit(1)

    garantir_coluna_is_admin()
    criar_ou_promover_admin(cpf, args.senha, args.nome, args.email, args.telefone)


if __name__ == "__main__":
    main()
