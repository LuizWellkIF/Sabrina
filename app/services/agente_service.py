import logging
import math
import unicodedata

from google import genai
from google.genai import types

from app.config import Config
from app.models import cargo as cargo_model
from app.models import categoria as categoria_model
from app.models import documento as documento_model
from app.models import historico as historico_model
from app.models import usuario as usuario_model

logger = logging.getLogger(__name__)


def _cliente_gemini():
    if not Config.GEMINI_API_KEY:
        return None
    return genai.Client(api_key=Config.GEMINI_API_KEY)


def _normalizar_embedding(valores: list) -> list:
    norma = math.sqrt(sum(valor * valor for valor in valores))
    if not norma:
        return valores
    return [valor / norma for valor in valores]


def _texto_para_embedding(texto: str, task_type: str) -> str:
    if Config.GEMINI_EMBED_MODEL != "gemini-embedding-2":
        return texto
    if task_type == "RETRIEVAL_QUERY":
        return f"task: question answering | query: {texto}"
    return f"title: none | text: {texto}"


def gerar_embedding(texto: str, task_type: str = "RETRIEVAL_DOCUMENT") -> list:
    """Gera embedding via Gemini com dimensao compativel com o pgvector atual."""
    cliente = _cliente_gemini()
    if not cliente:
        return None

    try:
        config_kwargs = {"output_dimensionality": Config.GEMINI_EMBED_DIMENSIONS}
        if Config.GEMINI_EMBED_MODEL != "gemini-embedding-2":
            config_kwargs["task_type"] = task_type

        resultado = cliente.models.embed_content(
            model=Config.GEMINI_EMBED_MODEL,
            contents=_texto_para_embedding(texto, task_type),
            config=types.EmbedContentConfig(**config_kwargs),
        )
        if not resultado.embeddings:
            return None
        return _normalizar_embedding(resultado.embeddings[0].values)
    except Exception:
        return None


def _gerar_resposta(prompt: str) -> str:
    """Chama o Gemini para gerar a resposta final."""
    cliente = _cliente_gemini()
    if not cliente:
        raise RuntimeError("GEMINI_API_KEY nao configurada")

    modelos = [Config.GEMINI_MODEL, *Config.GEMINI_FALLBACK_MODELS]
    ultimo_erro = None

    for modelo in dict.fromkeys(modelos):
        try:
            resposta = cliente.models.generate_content(
                model=modelo,
                contents=prompt,
            )
            return resposta.text or "Nao encontrei uma resposta para essa pergunta."
        except Exception as exc:
            ultimo_erro = exc
            logger.warning("Falha ao gerar resposta com Gemini model=%s: %s", modelo, exc)

    raise ultimo_erro or RuntimeError("Nenhum modelo Gemini disponivel")


def _normalizar_texto(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto or "")
    texto = "".join(char for char in texto if not unicodedata.combining(char))
    return " ".join(texto.lower().split())


def _detectar_intencao(pergunta: str) -> str:
    texto = _normalizar_texto(pergunta)
    if "politicas internas" in texto or "politica interna" in texto:
        return "politicas_internas"
    if "processos mais importantes" in texto or ("documentos" in texto and "processos" in texto):
        return "processos_importantes"
    return "geral"


def _categoria_por_nome(id_setor: int, nome_alvo: str):
    nome_normalizado = _normalizar_texto(nome_alvo)
    for categoria in categoria_model.listar_por_setor(id_setor):
        if _normalizar_texto(categoria.get("nome")) == nome_normalizado:
            return categoria
    return None


def _buscar_documentos_guiados(pergunta: str, id_setor: int, embedding: list) -> list:
    intencao = _detectar_intencao(pergunta)

    if intencao == "politicas_internas":
        categoria = _categoria_por_nome(id_setor, "Politicas Internas")
        if categoria:
            docs = documento_model.listar_por_categoria(
                id_setor=id_setor,
                id_categoria=categoria["id_categoria"],
                limite=8,
            )
            if docs:
                return docs

    if intencao == "processos_importantes":
        docs = documento_model.listar_conteudos_por_setor(id_setor=id_setor, limite=8)
        if docs:
            return docs

    return documento_model.buscar_por_similaridade(
        embedding=embedding,
        id_setor=id_setor,
        limite=5,
    )


def _contexto_usuario(id_setor: int, id_user: int) -> dict:
    usuario = usuario_model.buscar_por_id(id_user) or {}
    cargo = None
    if usuario.get("id_cargo"):
        cargo = cargo_model.buscar_por_id(usuario["id_cargo"], id_setor)
    return {
        "nome": usuario.get("nome"),
        "id_cargo": usuario.get("id_cargo"),
        "cargo_nome": cargo.get("nome") if cargo else None,
    }


def _nomes_por_id(id_setor: int) -> dict:
    categorias = {
        c["id_categoria"]: c["nome"]
        for c in categoria_model.listar_por_setor(id_setor)
    }
    cargos = {
        c["id_cargo"]: c["nome"]
        for c in cargo_model.listar_por_setor(id_setor)
    }
    return {"categorias": categorias, "cargos": cargos}


def _montar_prompt(pergunta: str, documentos: list, usuario: dict, nomes: dict) -> str:
    """Monta o prompt RAG com os documentos recuperados como contexto."""
    if not documentos:
        contexto = (
            "Nenhum documento relacionado a pergunta foi encontrado na base de conhecimento. "
            "Oriente o usuario a falar com um administrador caso o documento exista."
        )
    else:
        partes = []
        for i, doc in enumerate(documentos, 1):
            cargo_nome = nomes["cargos"].get(doc.get("id_cargo"))
            categoria_nome = nomes["categorias"].get(doc.get("id_categoria"))
            escopo = cargo_nome or "Todos os funcionarios do setor"
            partes.append(
                f"[Documento {i}] ID: {doc['id_doc']}\n"
                f"Titulo: {doc['titulo']}\n"
                f"Categoria: {categoria_nome or 'Sem categoria'}\n"
                f"Escopo: {escopo}\n"
                f"Resumo: {doc.get('resumo') or 'Sem resumo'}\n"
                f"Conteudo:\n{doc['conteudo']}"
            )
        contexto = "\n\n---\n\n".join(partes)

    cargo_usuario = usuario.get("cargo_nome") or "Cargo nao informado"

    return f"""Voce e a Sabrina, uma assistente de gestao do conhecimento interno de uma empresa.
Usuario atual: {usuario.get('nome') or 'Usuario'}.
Cargo do usuario: {cargo_usuario}.

Responda a pergunta do usuario com base EXCLUSIVAMENTE nos documentos abaixo. Seja breve, claro e objetivo. Se a resposta nao estiver nos documentos, diga que nao encontrou a informacao na base de conhecimento. Nao invente procedimentos, politicas, cargos, regras ou prazos que nao estejam no contexto. Responda sempre em portugues.

Regras de acesso e escopo:
- Documentos com escopo "Todos os funcionarios do setor" podem ser usados para qualquer cargo do setor.
- Documentos com cargo especifico devem ser usados apenas quando forem relevantes para o cargo do usuario ou quando a pergunta pedir uma visao geral permitida.
- Se o usuario pedir uma informacao de outro cargo que nao esteja disponivel para ele no contexto, diga apenas que ele nao tem acesso a essa informacao e pode entrar em contato com o administrador para solicitar acesso.

Formato:
- Pode usar Markdown simples para melhorar a leitura, como **negrito**, listas curtas e links.
- Ao citar um documento, use o formato [Titulo do documento] (coloque um link que aponte para o documento).
- Para perguntas sobre "politicas internas", priorize documentos da categoria Politicas Internas.
- Para perguntas sobre "processos importantes", liste os documentos mais relevantes recebidos e explique em uma frase o que cada um cobre.

DOCUMENTOS DA BASE DE CONHECIMENTO:
{contexto}

PERGUNTA DO USUARIO:
{pergunta}

RESPOSTA:"""


def perguntar(pergunta: str, id_setor: int, id_user: int):
    """
    Fluxo RAG completo:
    1. Gera embedding da pergunta
    2. Busca documentos similares ou guiados por intencao
    3. Monta prompt com contexto
    4. Gera resposta via Gemini
    5. Salva no historico
    """
    embedding_pergunta = gerar_embedding(pergunta, task_type="RETRIEVAL_QUERY")
    if embedding_pergunta is None:
        resposta = "Nao consegui acessar o servico de IA no momento. Contate um administrador para tratar o caso."
        historico_model.registrar(
            id_user=id_user,
            pesquisa=pergunta,
            resposta=resposta,
            id_doc=None,
        )
        return {
            "resposta": resposta,
            "documentos_consultados": [],
        }

    docs_relevantes = _buscar_documentos_guiados(pergunta, id_setor, embedding_pergunta)
    usuario = _contexto_usuario(id_setor, id_user)
    nomes = _nomes_por_id(id_setor)

    prompt = _montar_prompt(pergunta, docs_relevantes, usuario, nomes)
    try:
        resposta = _gerar_resposta(prompt)
    except Exception:
        resposta = "Nao consegui gerar a resposta agora. Verifique com um administrador se o servico esta disponivel e tente novamente."

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
            {
                "id_doc": d["id_doc"],
                "titulo": d["titulo"],
                "similaridade": round(d.get("similaridade", 1), 4),
            }
            for d in docs_relevantes
        ],
    }
