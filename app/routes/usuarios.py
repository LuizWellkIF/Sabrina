from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.services import auth_service
from app.extensions import get_supabase
from app.models import usuario as usuario_model
from app.utils.acesso import requer_nivel

usuarios_bp = Blueprint("usuarios", __name__)

@usuarios_bp.get("/")
@jwt_required()
@requer_nivel(9)
def listar():
    claims = get_jwt()
    sb = get_supabase()
    res = (
        sb.table("USUARIO")
        .select("id, nome, email, cargo, nivel_acesso, id_setor, data_criacao")
        .eq("id_setor", claims["id_setor"])
        .execute()
    )
    return jsonify(res.data), 200

@usuarios_bp.post("/")
@jwt_required()
@requer_nivel(9)
def criar():
    dados = request.get_json()
    if not dados:
        return jsonify({"erro": "Nenhum dado enviado"}), 400
    claims = get_jwt()
    dados["id_setor"] = claims["id_setor"]
    usuario, erro = auth_service.registrar(dados)
    if erro:
        return jsonify({"erro": erro}), 409
    return jsonify(usuario), 201

@usuarios_bp.put("/<int:id_usuario>")
@jwt_required()
@requer_nivel(9)
def atualizar(id_usuario):
    dados = request.get_json()
    if not dados:
        return jsonify({"erro": "Nenhum dado enviado"}), 400

    campos_permitidos = {"nome", "email", "cargo", "nivel_acesso"}
    atualizacao = {k: v for k, v in dados.items() if k in campos_permitidos}
    if not atualizacao:
        return jsonify({"erro": "Nenhum campo editÃ¡vel enviado"}), 400

    claims = get_jwt()
    usuario = usuario_model.atualizar(id_usuario, claims["id_setor"], atualizacao)
    if not usuario:
        return jsonify({"erro": "UsuÃ¡rio nÃ£o encontrado ou sem permissÃ£o"}), 404
    usuario.pop("senha_hash", None)
    return jsonify(usuario), 200

@usuarios_bp.delete("/<int:id_usuario>")
@jwt_required()
@requer_nivel(9)
def deletar(id_usuario):
    sb = get_supabase()
    sb.table("USUARIO").delete().eq("id", id_usuario).execute()
    return jsonify({"mensagem": "Usuário removido"}), 200
