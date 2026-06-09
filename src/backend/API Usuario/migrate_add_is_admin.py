"""
Script de migração: adiciona coluna is_admin à tabela clientes.

Execute uma vez se o banco (clientes.db) já existia antes desta alteração:

    python migrate_add_is_admin.py

Após a migração, a API cria automaticamente o usuário admin ao iniciar
(veja seed_admin() em main.py).
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "clientes.db")

if not os.path.exists(DB_PATH):
    print("Banco não encontrado — será criado pelo FastAPI na próxima inicialização.")
else:
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    # Verifica se a coluna já existe
    cols = [row[1] for row in cur.execute("PRAGMA table_info(clientes)").fetchall()]
    if "is_admin" not in cols:
        cur.execute("ALTER TABLE clientes ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")
        con.commit()
        print("✅ Coluna is_admin adicionada com sucesso.")
    else:
        print("ℹ️  Coluna is_admin já existe — nenhuma alteração necessária.")

    con.close()
