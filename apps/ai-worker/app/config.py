from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    ai_worker_port: int = 8000
    redis_url: str = "redis://localhost:6379"


settings = Settings()
