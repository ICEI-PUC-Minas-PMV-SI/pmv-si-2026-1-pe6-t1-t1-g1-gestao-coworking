from __future__ import annotations

import os
from pathlib import Path

import psycopg2


HOST = os.environ.get("PGHOST", "localhost")
PORT = int(os.environ.get("PGPORT", "5432"))
USER = os.environ.get("PGUSER", "postgres")
PASSWORD = os.environ.get("PGPASSWORD", "admin")
DB_NAME = os.environ.get("PGDATABASE", "coopEixo6")


BASE_DIR = Path(__file__).resolve().parent
SQL_FILE = BASE_DIR / "../database/seed_admin_coworking.sql"


def connect(database: str):
    return psycopg2.connect(
        host=HOST,
        port=PORT,
        user=USER,
        password=PASSWORD,
        dbname=database,
    )


def ensure_database():
    conn = connect("postgres")
    conn.autocommit = True

    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (DB_NAME,),
            )

            exists = cur.fetchone()

            if not exists:
                cur.execute(f'CREATE DATABASE "{DB_NAME}"')
                print(f"Banco '{DB_NAME}' criado.")
            else:
                print(f"Banco '{DB_NAME}' já existe.")

    finally:
        conn.close()


def run_seed():
    with open(SQL_FILE, "r", encoding="utf-8") as file:
        sql = file.read()

    with connect(DB_NAME) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)

        conn.commit()

    print("Seed executada com sucesso.")


def print_counts():
    tables = [
        "cliente",
        "sala",
        "planos",
        "assinaturas",
        "reservas",
        "avaliacao",
        "notificacao",
    ]

    with connect(DB_NAME) as conn:
        with conn.cursor() as cur:
            print("\nResumo do banco:\n")

            for table in tables:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                total = cur.fetchone()[0]
                print(f"{table}: {total}")


if __name__ == "__main__":
    ensure_database()
    run_seed()
    print_counts()