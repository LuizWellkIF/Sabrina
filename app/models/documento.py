from app.extensions import get_supabase

TABLE = "DOCUMENTOS"

def listar_por_setor(id_setor: int):
    sb = get_supabase()
    res = (
        sb.table(TABLE)
        .select("id_doc, titulo, resumo, id_cargo, id_categoria, criador, ultimo_editor, ultima_att, data_criacao")
        .eq("id_setor", id_setor)
        .order("data_criacao", desc=True)
        .execute()
    )
    return res.data

def buscar_por_id(id_doc: int, id_setor: int):
    sb = get_supabase()
    res = (
        sb.table(TABLE)
        .select("*")
        .eq("id_doc", id_doc)
        .eq("id_setor", id_setor)
        .single()
        .execute()
    )
    return res.data

def criar(dados: dict):
    sb = get_supabase()
    res = sb.table(TABLE).insert(dados).execute()
    return res.data[0] if res.data else None

def atualizar(id_doc: int, id_setor: int, dados: dict):
    sb = get_supabase()
    res = (
        sb.table(TABLE)
        .update(dados)
        .eq("id_doc", id_doc)
        .eq("id_setor", id_setor)
        .execute()
    )
    return res.data[0] if res.data else None

def deletar(id_doc: int, id_setor: int):
    sb = get_supabase()
    sb.table(TABLE).delete().eq("id_doc", id_doc).eq("id_setor", id_setor).execute()

def buscar_por_similaridade(embedding: list, id_setor: int, limite: int = 5):
    """
    Busca semântica via pgvector no Supabase.
    Requer uma função RPC criada no Supabase (ver comentário abaixo).

    SQL para criar a função no Supabase SQL Editor:

        CREATE OR REPLACE FUNCTION buscar_documentos_similares(
            query_embedding vector(768),
            setor_id bigint,
            match_count int DEFAULT 5
        )
        RETURNS TABLE (
            id_doc bigint,
            titulo varchar,
            resumo text,
            conteudo text,
            similaridade float
        )
        LANGUAGE sql STABLE AS $$
            SELECT
                id_doc, titulo, resumo, conteudo,
                1 - (embedding <=> query_embedding) AS similaridade
            FROM DOCUMENTOS
            WHERE id_setor = setor_id
              AND embedding IS NOT NULL
            ORDER BY embedding <=> query_embedding
            LIMIT match_count;
        $$;
    """
    sb = get_supabase()
    res = sb.rpc("buscar_documentos_similares", {
        "query_embedding": embedding,
        "setor_id": id_setor,
        "match_count": limite
    }).execute()
    return res.data
