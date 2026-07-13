from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=False,
    )

    ai_worker_port: int = 8000
    redis_url: str = "redis://localhost:6379"

    openai_api_key: SecretStr | None = None
    openai_summary_model: str = "gpt-5.6-luna"
    openai_supervision_model: str = "gpt-5.6-terra"
    openai_timeout_seconds: float = Field(default=45.0, gt=0)
    openai_max_retries: int = Field(default=2, ge=0, le=5)

    counseling_summary_max_characters: int = Field(
        default=100_000,
        ge=1_000,
    )
    counseling_supervision_max_characters: int = Field(
        default=100_000,
        ge=1_000,
    )


settings = Settings()
