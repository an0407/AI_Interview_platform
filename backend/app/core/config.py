from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str
    DB_NAME: str
    EMAIL_USER: str
    EMAIL_PASSWORD: str
    EMAIL_HOST: str
    EMAIL_PORT: int

    class Config:
        env_file = ".env"

settings = Settings()
