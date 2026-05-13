from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services import documento_service

documentos_bp = Blueprint("documentos", __name__)

def _setor_do_token():
    return get_jwt()["id_setor"]

@documentos_bp.get("/")
@jwt_required()
def listar():
    docs = documento_service.listar(_setor_do_token())
    return jsonify(docs), 200

@documentos_bp.get("/<int:id_doc>")
@jwt_required()
def buscar(id_doc):
    doc, erro = documento_service.buscar(id_doc, _setor_do_token())
    if erro:
        return jsonify({"erro": erro}), 404
    return jsonify(doc), 200

@documentos_bp.post("/")
@jwt_required()
def criar():
    dados = request.get_json()
    if not dados or not dados.get("titulo") or not dados.get("conteudo"):
        return jsonify({"erro": "Título e conteúdo são obrigatórios"}), 400

    criador_id = int(get_jwt_identity())
    doc, erro = documento_service.criar(dados, criador_id, _setor_do_token())
    if erro:
        return jsonify({"erro": erro}), 400

    return jsonify(doc), 201

@documentos_bp.put("/<int:id_doc>")
@jwt_required()
def atualizar(id_doc):
    dados = request.get_json()
    if not dados:
        return jsonify({"erro": "Nenhum dado enviado"}), 400

    doc, erro = documento_service.atualizar(id_doc, _setor_do_token(), dados)
    if erro:
        return jsonify({"erro": erro}), 404

    return jsonify(doc), 200

@documentos_bp.delete("/<int:id_doc>")
@jwt_required()
def deletar(id_doc):
    documento_service.deletar(id_doc, _setor_do_token())
    return jsonify({"mensagem": "Documento removido"}), 200
