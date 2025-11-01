# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # MongoDB
    MONGODB_URL: str
    DATABASE_NAME: str

    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Storage
    STORAGE_PATH: str = "./storage"

    class Config:
        env_file = ".env" 

settings = Settings()
