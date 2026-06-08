from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.models import categoria as categoria_model
from app.utils.acesso import requer_nivel

categorias_bp = Blueprint("categorias", __name__)

def _setor_do_token():
    return get_jwt()["id_setor"]

@categorias_bp.get("/")
@jwt_required()
def listar():
    cats = categoria_model.listar_por_setor(_setor_do_token())
    return jsonify(cats), 200

@categorias_bp.post("/")
@jwt_required()
@requer_nivel(9)
def criar():
    dados = request.get_json()
    if not dados or not dados.get("nome"):
        return jsonify({"erro": "Nome é obrigatório"}), 400
    nova = categoria_model.criar({
        "nome": dados["nome"],
        "id_setor": _setor_do_token(),
    })
    return jsonify(nova), 201

@categorias_bp.put("/<int:id_categoria>")
@jwt_required()
@requer_nivel(9)
def atualizar(id_categoria):
    dados = request.get_json()
    if not dados or not dados.get("nome"):
        return jsonify({"erro": "Nome Ã© obrigatÃ³rio"}), 400
    cat = categoria_model.atualizar(
        id_categoria,
        _setor_do_token(),
        {"nome": dados["nome"]},
    )
    if not cat:
        return jsonify({"erro": "Categoria nÃ£o encontrada ou sem permissÃ£o"}), 404
    return jsonify(cat), 200

@categorias_bp.delete("/<int:id_categoria>")
@jwt_required()
@requer_nivel(9)
def desativar(id_categoria):
    cat = categoria_model.desativar(id_categoria, _setor_do_token())
    if not cat:
        return jsonify({"erro": "Categoria não encontrada ou sem permissão"}), 404
    return jsonify({"mensagem": "Categoria desativada"}), 200
