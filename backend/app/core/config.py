from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # MongoDB
    MONGO_URI: str = Field(..., env="MONGODB_URL")
    DATABASE_NAME: str = Field(..., env="DATABASE_NAME")

    # OpenAI
    OPENAI_API_KEY: str = Field(..., env="OPENAI_API_KEY")
    OPENAI_MODEL: str = Field(..., env="OPENAI_MODEL")

    # LiveKit
    LIVEKIT_URL: str = Field(default="http://localhost:7880", env="LIVEKIT_URL")
    LIVEKIT_API_KEY: str = Field(..., env="LIVEKIT_API_KEY")
    LIVEKIT_API_SECRET: str = Field(..., env="LIVEKIT_API_SECRET")

    # Optional email configs
    EMAIL_USER: str | None = Field(default=None, env="EMAIL_USER")
    EMAIL_PASSWORD: str | None = Field(default=None, env="EMAIL_PASSWORD")
    EMAIL_HOST: str | None = Field(default=None, env="EMAIL_HOST")
    EMAIL_PORT: int | None = Field(default=None, env="EMAIL_PORT")

    class Config:
        env_file = ".env"
        extra = "ignore"  # ✅ ignore unused vars like MONGO_URI, DB_NAME, MAIL_FROM, etc.


settings = Settings()