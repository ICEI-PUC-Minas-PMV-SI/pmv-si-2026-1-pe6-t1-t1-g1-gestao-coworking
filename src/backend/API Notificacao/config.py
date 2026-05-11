from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Notificacoes API"
    app_version: str = "0.1.0"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/notificacoes"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
