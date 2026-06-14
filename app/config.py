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

    # Gemini
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    GEMINI_FALLBACK_MODELS = [
        model.strip()
        for model in os.getenv(
            "GEMINI_FALLBACK_MODELS",
            "gemini-2.5-flash,gemini-2.0-flash,gemini-flash-latest,gemini-flash-lite-latest",
        ).split(",")
        if model.strip()
    ]
    GEMINI_EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001")
    GEMINI_EMBED_DIMENSIONS = 768

    # CORS — origens permitidas (ajuste conforme URL do React)
    CORS_ORIGINS = [
        origem.strip()
        for origem in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000",
        ).split(",")
        if origem.strip()
    ]
