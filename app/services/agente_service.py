import requests
from app.config import Config
from app.models import documento as documento_model
from app.models import historico as historico_model

OLLAMA_URL = Config.OLLAMA_BASE_URL

def gerar_embedding(texto: str) -> list:
    """Gera embedding via Ollama (nomic-embed-text, 768 dims)."""
    try:
        res = requests.post(
            f"{OLLAMA_URL}/api/embeddings",
            json={"model": Config.OLLAMA_EMBED_MODEL, "prompt": texto},
            timeout=30,
        )
        res.raise_for_status()
        return res.json()["embedding"]
    except requests.RequestException:
        return None

def _gerar_resposta(prompt: str) -> str:
    """Chama o modelo LLM do Ollama para gerar a resposta final."""
    res = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json={
            "model": Config.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
        },
        timeout=120,
    )
    res.raise_for_status()
    return res.json()["response"]

def _montar_prompt(pergunta: str, documentos: list) -> str:
    """Monta o prompt RAG com os documentos recuperados como contexto."""
    if not documentos:
        contexto = "Nenhum documento relevante foi encontrado na base de conhecimento."
    else:
        partes = []
        for i, doc in enumerate(documentos, 1):
            partes.append(
                f"[Documento {i}] {doc['titulo']}\n{doc['conteudo']}"
            )
        contexto = "\n\n---\n\n".join(partes)

    return f"""Você é um assistente de gestão do conhecimento interno de uma empresa.
Responda à pergunta do usuário com base EXCLUSIVAMENTE nos documentos abaixo.
Se a resposta não estiver nos documentos, diga que não encontrou a informação na base de conhecimento.
Responda sempre em português.

DOCUMENTOS DA BASE DE CONHECIMENTO:
{contexto}

PERGUNTA DO USUÁRIO:
{pergunta}

RESPOSTA:"""

def perguntar(pergunta: str, id_setor: int, id_user: int):
    """
    Fluxo RAG completo:
    1. Gera embedding da pergunta
    2. Busca documentos similares no Supabase (filtrado por setor)
    3. Monta prompt com contexto
    4. Gera resposta via Ollama
    5. Salva no histórico
    """
    # 1. Embedding da pergunta
    embedding_pergunta = gerar_embedding(pergunta)
    if embedding_pergunta is None:
        return {
            "resposta": "Nao consegui acessar o servico de IA agora. Tente novamente quando o Ollama estiver em execucao.",
            "documentos_consultados": [],
        }

    # 2. Busca semântica — retorna os 5 docs mais relevantes do setor
    docs_relevantes = documento_model.buscar_por_similaridade(
        embedding=embedding_pergunta,
        id_setor=id_setor,
        limite=5,
    )

    # 3. Monta e envia o prompt
    prompt = _montar_prompt(pergunta, docs_relevantes)
    resposta = _gerar_resposta(prompt)

    # 4. Salva no histórico — referencia o doc mais relevante se houver
    id_doc_ref = docs_relevantes[0]["id_doc"] if docs_relevantes else None
    historico_model.registrar(
        id_user=id_user,
        pesquisa=pergunta,
        resposta=resposta,
        id_doc=id_doc_ref,
    )

    return {
        "resposta": resposta,
        "documentos_consultados": [
            {"id_doc": d["id_doc"], "titulo": d["titulo"], "similaridade": round(d["similaridade"], 4)}
            for d in docs_relevantes
        ],
    }
