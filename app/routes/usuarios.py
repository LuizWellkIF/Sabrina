from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.services import auth_service
from app.extensions import get_supabase
from app.models import cargo as cargo_model
from app.models import setor as setor_model
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
        .select("id, nome, email, id_cargo, nivel_acesso, id_setor, data_criacao")
        .execute()
    )
    cargos = {c["id_cargo"]: c["nome"] for c in cargo_model.listar_todos()}
    setores = {s["id_setor"]: s["nome"] for s in setor_model.listar()}
    usuarios = []
    for usuario in res.data:
        usuario["cargo_nome"] = cargos.get(usuario.get("id_cargo"))
        usuario["setor_nome"] = setores.get(usuario.get("id_setor"))
        usuarios.append(usuario)
    return jsonify(usuarios), 200

@usuarios_bp.post("/")
@jwt_required()
@requer_nivel(9)
def criar():
    dados = request.get_json()
    if not dados:
        return jsonify({"erro": "Nenhum dado enviado"}), 400
    if not dados.get("id_setor"):
        return jsonify({"erro": "Setor e obrigatorio"}), 400
    if dados.get("id_cargo") and not cargo_model.buscar_por_id(dados["id_cargo"], dados["id_setor"]):
        return jsonify({"erro": "Cargo nao pertence ao setor selecionado"}), 400
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

    campos_permitidos = {"nome", "email", "id_setor", "id_cargo", "nivel_acesso"}
    atualizacao = {k: v for k, v in dados.items() if k in campos_permitidos}
    if not atualizacao:
        return jsonify({"erro": "Nenhum campo editÃ¡vel enviado"}), 400

    if atualizacao.get("id_cargo") and atualizacao.get("id_setor"):
        cargo = cargo_model.buscar_por_id(atualizacao["id_cargo"], atualizacao["id_setor"])
        if not cargo:
            return jsonify({"erro": "Cargo nao pertence ao setor selecionado"}), 400

    usuario = usuario_model.atualizar_por_id(id_usuario, atualizacao)
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
