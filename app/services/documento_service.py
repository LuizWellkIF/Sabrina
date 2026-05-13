from datetime import datetime, timezone
from app.models import documento as documento_model
from app.services.agente_service import gerar_embedding

def listar(id_setor: int):
    return documento_model.listar_por_setor(id_setor)

def buscar(id_doc: int, id_setor: int):
    doc = documento_model.buscar_por_id(id_doc, id_setor)
    if not doc:
        return None, "Documento não encontrado ou sem permissão"
    return doc, None

def criar(dados: dict, criador_id: int, id_setor: int):
    # Gera embedding do conteúdo para busca semântica
    texto_para_embed = f"{dados.get('titulo', '')} {dados.get('conteudo', '')}"
    embedding = gerar_embedding(texto_para_embed)

    novo = {
        "titulo": dados["titulo"],
        "conteudo": dados["conteudo"],
        "resumo": dados.get("resumo"),
        "id_categoria": dados.get("id_categoria"),
        "id_setor": id_setor,
        "criador": criador_id,
        "embedding": embedding,
    }
    doc = documento_model.criar(novo)
    return doc, None

def atualizar(id_doc: int, id_setor: int, dados: dict):
    atualizacao = {**dados, "ultima_att": datetime.now(timezone.utc).isoformat()}

    # Regenera embedding se o conteúdo foi alterado
    if "conteudo" in dados or "titulo" in dados:
        doc_atual, _ = buscar(id_doc, id_setor)
        if doc_atual:
            titulo = dados.get("titulo", doc_atual["titulo"])
            conteudo = dados.get("conteudo", doc_atual["conteudo"])
            atualizacao["embedding"] = gerar_embedding(f"{titulo} {conteudo}")

    doc = documento_model.atualizar(id_doc, id_setor, atualizacao)
    if not doc:
        return None, "Documento não encontrado ou sem permissão"
    return doc, None

def deletar(id_doc: int, id_setor: int):
    documento_model.deletar(id_doc, id_setor)
