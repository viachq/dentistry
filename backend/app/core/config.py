from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    project_name: str = "Dentistry API"
    api_v1_str: str = "/api/v1"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 1440
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5433/dentistry"
    frontend_url: str = "http://localhost:3180"
    frontend_urls: str = "http://localhost:3180,http://localhost:3181"
    backend_public_url: str = "http://localhost:8870"
    upload_dir: str = str(Path(__file__).resolve().parents[3] / "uploads")
    first_superuser_username: str = "admin"
    first_superuser_password: str = "admin12345"

    @property
    def cors_origins(self) -> list[str]:
        raw_value = self.frontend_urls or self.frontend_url
        return [origin.strip() for origin in raw_value.split(",") if origin.strip()]


settings = Settings()
