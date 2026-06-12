from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services import auth_service
from app.models import cargo as cargo_model
from app.models import usuario as usuario_model

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/login")
def login():
    dados = request.get_json()
    if not dados or not dados.get("email") or not dados.get("senha"):
        return jsonify({"erro": "E-mail e senha são obrigatórios"}), 400

    token, erro = auth_service.login(dados["email"], dados["senha"])
    if erro:
        return jsonify({"erro": erro}), 401

    return jsonify({"token": token}), 200

@auth_bp.post("/registrar")
def registrar():
    dados = request.get_json()
    campos = ["nome", "email", "senha", "id_setor"]
    for campo in campos:
        if not dados or not dados.get(campo):
            return jsonify({"erro": f"Campo obrigatório ausente: {campo}"}), 400

    dados["nivel_acesso"] = 1
    usuario, erro = auth_service.registrar(dados)
    if erro:
        return jsonify({"erro": erro}), 409

    return jsonify(usuario), 201

@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    usuario = usuario_model.buscar_por_id(user_id)
    if not usuario:
        return jsonify({"erro": "Usuário não encontrado"}), 404
    if usuario.get("id_cargo"):
        claims = get_jwt()
        cargo = cargo_model.buscar_por_id(usuario["id_cargo"], claims["id_setor"])
        usuario["cargo_nome"] = cargo.get("nome") if cargo else None
    return jsonify(usuario), 200
