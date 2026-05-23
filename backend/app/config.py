from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """Configuration de l'application chargee depuis les variables d'environnement."""

    APP_NAME: str = "Systeme de BDD Federees - Banque du Togo"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    POSTGRES_HOST: str = "postgres-hub"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "banque_hub"
    POSTGRES_USER: str = "banque_admin"
    POSTGRES_PASSWORD: str = "T0g0B4nque2025!"

    MYSQL_HOST: str = "mysql-credit"
    MYSQL_PORT: int = 3306
    MYSQL_DB: str = "banque_credit"
    MYSQL_USER: str = "credit_user"
    MYSQL_PASSWORD: str = "Cr3ditT0g0!"

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://react-frontend:3000"]

    @property
    def DATABASE_URL_POSTGRES(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def DATABASE_URL_MYSQL(self) -> str:
        return f"mysql+aiomysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
