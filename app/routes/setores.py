from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models import setor as setor_model
from app.utils.acesso import requer_nivel

setores_bp = Blueprint("setores", __name__)

@setores_bp.get("/")
@jwt_required()
@requer_nivel(9)
def listar():
    setores = setor_model.listar()
    return jsonify(setores), 200

@setores_bp.post("/")
@jwt_required()
@requer_nivel(9)
def criar():
    dados = request.get_json()
    if not dados or not dados.get("nome"):
        return jsonify({"erro": "Nome e obrigatorio"}), 400
    setor = setor_model.criar({
        "nome": dados["nome"].strip(),
        "descricao": (dados.get("descricao") or "").strip(),
    })
    return jsonify(setor), 201

@setores_bp.put("/<int:id_setor>")
@jwt_required()
@requer_nivel(9)
def atualizar(id_setor):
    dados = request.get_json()
    if not dados or not dados.get("nome"):
        return jsonify({"erro": "Nome e obrigatorio"}), 400
    setor = setor_model.atualizar(id_setor, {
        "nome": dados["nome"].strip(),
        "descricao": (dados.get("descricao") or "").strip(),
    })
    if not setor:
        return jsonify({"erro": "Setor nao encontrado"}), 404
    return jsonify(setor), 200

@setores_bp.delete("/<int:id_setor>")
@jwt_required()
@requer_nivel(9)
def deletar(id_setor):
    setor = setor_model.deletar(id_setor)
    if not setor:
        return jsonify({"erro": "Setor nao encontrado"}), 404
    return jsonify({"mensagem": "Setor removido"}), 200
