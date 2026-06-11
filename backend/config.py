from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    groq_api_key: str
    allowed_origins: str = "http://localhost:3000"
    chroma_path: str = "./chroma_data"
    chunk_size: int = 1500
    chunk_overlap: int = 150
    top_k: int = 5
    max_history: int = 8

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()