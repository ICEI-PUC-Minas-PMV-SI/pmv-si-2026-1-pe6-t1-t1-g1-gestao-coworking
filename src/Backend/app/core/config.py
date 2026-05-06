from functools import lru_cache
from json import loads
from os import getenv
from pathlib import Path
from urllib.parse import quote_plus


BASE_DIR = Path(__file__).resolve().parents[2]
AVALIACAO_SETTINGS = BASE_DIR / "API Avaliacao" / "appsettings.json"


def _read_avaliacao_connection_string() -> str:
    data = loads(AVALIACAO_SETTINGS.read_text(encoding="utf-8"))
    return data["ConnectionStrings"]["DefaultConnection"]


def _aspnet_connection_to_sqlalchemy(value: str) -> str:
    parts = {}
    for item in value.split(";"):
        if not item.strip() or "=" not in item:
            continue
        key, raw = item.split("=", 1)
        parts[key.strip().lower()] = raw.strip()

    host = parts.get("host", "localhost")
    port = parts.get("port", "5432")
    database = parts.get("database")
    username = parts.get("username")
    password = parts.get("password", "")

    if not database or not username:
        raise ValueError("Connection string do appsettings.json esta incompleta.")

    return (
        f"postgresql+psycopg2://{quote_plus(username)}:{quote_plus(password)}"
        f"@{host}:{port}/{quote_plus(database)}"
    )


class Settings:
    def __init__(self) -> None:
        self.app_name = getenv("APP_NAME", "Coworking Reservas API")
        self.app_version = getenv("APP_VERSION", "1.0.0")
        self.database_url = getenv(
            "DATABASE_URL",
            _aspnet_connection_to_sqlalchemy(_read_avaliacao_connection_string()),
        )
        self.secret_key = getenv("SECRET_KEY", "segredo_super_secreto")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
