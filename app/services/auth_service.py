import bcrypt
from datetime import timedelta
from flask_jwt_extended import create_access_token
from app.models import usuario as usuario_model
from app.config import Config

def login(email: str, senha: str):
    user = usuario_model.buscar_por_email(email)
    if not user:
        return None, "Usuário não encontrado"

    senha_correta = bcrypt.checkpw(senha.encode("utf-8"), user["senha_hash"].encode("utf-8"))
    if not senha_correta:
        return None, "Senha incorreta"

    expires = timedelta(minutes=Config.JWT_ACCESS_TOKEN_EXPIRES_MINUTES)
    token = create_access_token(
        identity=str(user["id"]),
        expires_delta=expires,
        additional_claims={
            "id_setor": user["id_setor"],
            "nivel_acesso": user["nivel_acesso"],
            "nome": user["nome"],
        }
    )
    return token, None

def registrar(dados: dict):
    existente = usuario_model.buscar_por_email(dados["email"])
    if existente:
        return None, "E-mail já cadastrado"

    senha_hash = bcrypt.hashpw(dados["senha"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    novo_usuario = {
        "nome": dados["nome"],
        "email": dados["email"],
        "senha_hash": senha_hash,
        "cargo": dados.get("cargo"),
        "nivel_acesso": dados.get("nivel_acesso", 1),
        "id_setor": dados["id_setor"],
    }
    criado = usuario_model.criar(novo_usuario)
    return criado, None
