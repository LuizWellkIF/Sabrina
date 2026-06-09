from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.models import cargo as cargo_model
from app.models import setor as setor_model
from app.utils.acesso import requer_nivel

cargos_bp = Blueprint("cargos", __name__)

def _setor_do_token():
    return get_jwt()["id_setor"]

@cargos_bp.get("/")
@jwt_required()
def listar():
    claims = get_jwt()
    if request.args.get("todos") == "1" and claims.get("nivel_acesso", 0) >= 9:
        setores = {s["id_setor"]: s["nome"] for s in setor_model.listar()}
        cargos = cargo_model.listar_todos()
        for cargo in cargos:
            cargo["setor_nome"] = setores.get(cargo.get("id_setor"))
        return jsonify(cargos), 200

    cargos = cargo_model.listar_por_setor(_setor_do_token())
    return jsonify(cargos), 200

@cargos_bp.post("/")
@jwt_required()
@requer_nivel(9)
def criar():
    dados = request.get_json()
    if not dados or not dados.get("nome") or not dados.get("id_setor"):
        return jsonify({"erro": "Nome e setor sao obrigatorios"}), 400
    cargo = cargo_model.criar({
        "nome": dados["nome"],
        "id_setor": dados["id_setor"],
    })
    return jsonify(cargo), 201

@cargos_bp.put("/<int:id_cargo>")
@jwt_required()
@requer_nivel(9)
def atualizar(id_cargo):
    dados = request.get_json()
    if not dados or not dados.get("nome") or not dados.get("id_setor"):
        return jsonify({"erro": "Nome e setor sao obrigatorios"}), 400
    cargo = cargo_model.atualizar_por_id(id_cargo, {
        "nome": dados["nome"],
        "id_setor": dados["id_setor"],
    })
    if not cargo:
        return jsonify({"erro": "Cargo nao encontrado ou sem permissao"}), 404
    return jsonify(cargo), 200

@cargos_bp.delete("/<int:id_cargo>")
@jwt_required()
@requer_nivel(9)
def deletar(id_cargo):
    cargo = cargo_model.deletar_por_id(id_cargo)
    if not cargo:
        return jsonify({"erro": "Cargo nao encontrado ou sem permissao"}), 404
    return jsonify({"mensagem": "Cargo removido"}), 200
