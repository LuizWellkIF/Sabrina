import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES_MINUTES = 60 * 8  # 8 horas

    # Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

    # Ollama
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
    OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
    OLLAMA_EMBED_DIMENSIONS = 768  # nomic-embed-text

    # CORS — origens permitidas (ajuste conforme URL do React)
    CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000"]
