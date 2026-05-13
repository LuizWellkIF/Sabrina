from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services import agente_service
from app.models import historico as historico_model

agente_bp = Blueprint("agente", __name__)

@agente_bp.post("/perguntar")
@jwt_required()
def perguntar():
    dados = request.get_json()
    if not dados or not dados.get("pergunta"):
        return jsonify({"erro": "O campo 'pergunta' é obrigatório"}), 400

    id_user = int(get_jwt_identity())
    id_setor = get_jwt()["id_setor"]

    try:
        resultado = agente_service.perguntar(
            pergunta=dados["pergunta"],
            id_setor=id_setor,
            id_user=id_user,
        )
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"erro": f"Erro ao consultar o agente: {str(e)}"}), 500

@agente_bp.get("/historico")
@jwt_required()
def historico():
    id_user = int(get_jwt_identity())
    limite = request.args.get("limite", 20, type=int)
    registros = historico_model.listar_por_usuario(id_user, limite)
    return jsonify(registros), 200
