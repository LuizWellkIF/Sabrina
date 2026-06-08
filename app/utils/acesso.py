from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt

def requer_nivel(nivel_minimo: int):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            if claims.get("nivel_acesso", 0) < nivel_minimo:
                return jsonify({"erro": "Acesso negado"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator