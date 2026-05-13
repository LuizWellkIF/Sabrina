from app.extensions import get_supabase

TABLE = "HISTORICO"

def registrar(id_user: int, pesquisa: str, resposta: str, id_doc: int = None):
    sb = get_supabase()
    dados = {
        "id_user": id_user,
        "pesquisa": pesquisa,
        "resposta": resposta,
        "id_doc": id_doc,
    }
    res = sb.table(TABLE).insert(dados).execute()
    return res.data[0] if res.data else None

def listar_por_usuario(id_user: int, limite: int = 20):
    sb = get_supabase()
    res = (
        sb.table(TABLE)
        .select("id_consulta, pesquisa, resposta, id_doc, created_at")
        .eq("id_user", id_user)
        .order("created_at", desc=True)
        .limit(limite)
        .execute()
    )
    return res.data
