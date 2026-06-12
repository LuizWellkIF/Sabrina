from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app.services import auth_service
from app.extensions import get_supabase
from app.models import cargo as cargo_model
from app.models import setor as setor_model
from app.models import usuario as usuario_model
from app.utils.acesso import requer_nivel

usuarios_bp = Blueprint("usuarios", __name__)

NIVEIS_PERMITIDOS = {1, 5, 9, 15}
NIVEL_SUPER_ADMIN = 15

def _nivel_atual():
    user_id = get_jwt_identity()
    if user_id:
        usuario = usuario_model.buscar_por_id(int(user_id))
        if usuario:
            return int(usuario.get("nivel_acesso", 0))
    return int(get_jwt().get("nivel_acesso", 0))

def _validar_nivel_solicitado(nivel):
    try:
        nivel = int(nivel)
    except (TypeError, ValueError):
        return None, "Nivel de acesso invalido"

    if nivel not in NIVEIS_PERMITIDOS:
        return None, "Nivel de acesso invalido"

    if nivel >= NIVEL_SUPER_ADMIN and _nivel_atual() < NIVEL_SUPER_ADMIN:
        return None, "Apenas super administradores podem atribuir nivel 15"

    return nivel, None

def _pode_manipular_usuario(usuario):
    if _nivel_atual() >= NIVEL_SUPER_ADMIN:
        return True
    return int(usuario.get("nivel_acesso", 0)) < NIVEL_SUPER_ADMIN

@usuarios_bp.get("/")
@jwt_required()
@requer_nivel(9)
def listar():
    sb = get_supabase()
    res = (
        sb.table("USUARIO")
        .select("id, nome, email, id_cargo, nivel_acesso, id_setor, data_criacao")
        .execute()
    )
    cargos = {c["id_cargo"]: c["nome"] for c in cargo_model.listar_todos()}
    setores = {s["id_setor"]: s["nome"] for s in setor_model.listar()}
    nivel_atual = _nivel_atual()
    usuarios = []
    for usuario in res.data:
        if nivel_atual < NIVEL_SUPER_ADMIN and int(usuario.get("nivel_acesso", 0)) >= NIVEL_SUPER_ADMIN:
            continue
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
    nivel, erro_nivel = _validar_nivel_solicitado(dados.get("nivel_acesso", 1))
    if erro_nivel:
        return jsonify({"erro": erro_nivel}), 403 if "super" in erro_nivel else 400
    dados["nivel_acesso"] = nivel
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

    usuario_atual = usuario_model.buscar_por_id(id_usuario)
    if not usuario_atual:
        return jsonify({"erro": "Usuario nao encontrado ou sem permissao"}), 404
    if not _pode_manipular_usuario(usuario_atual):
        return jsonify({"erro": "Apenas super administradores podem alterar usuarios nivel 15"}), 403

    campos_permitidos = {"nome", "email", "id_setor", "id_cargo", "nivel_acesso"}
    atualizacao = {k: v for k, v in dados.items() if k in campos_permitidos}
    if not atualizacao:
        return jsonify({"erro": "Nenhum campo editÃ¡vel enviado"}), 400

    if "nivel_acesso" in atualizacao:
        nivel, erro_nivel = _validar_nivel_solicitado(atualizacao["nivel_acesso"])
        if erro_nivel:
            return jsonify({"erro": erro_nivel}), 403 if "super" in erro_nivel else 400
        atualizacao["nivel_acesso"] = nivel

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
    usuario = usuario_model.buscar_por_id(id_usuario)
    if not usuario:
        return jsonify({"erro": "Usuario nao encontrado ou sem permissao"}), 404
    if not _pode_manipular_usuario(usuario):
        return jsonify({"erro": "Apenas super administradores podem remover usuarios nivel 15"}), 403

    sb = get_supabase()
    sb.table("USUARIO").delete().eq("id", id_usuario).execute()
    return jsonify({"mensagem": "Usuário removido"}), 200
