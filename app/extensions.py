from flask_jwt_extended import JWTManager
from flask_cors import CORS
from supabase import create_client, Client
from app.config import Config

jwt = JWTManager()
cors = CORS()

def get_supabase() -> Client:
    return create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
