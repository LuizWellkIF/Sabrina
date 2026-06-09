from app.extensions import get_supabase

TABLE = "SETOR"

def listar():
    sb = get_supabase()
    res = (
        sb.table(TABLE)
        .select("id_setor, nome, descricao")
        .order("id_setor", desc=True)
        .execute()
    )
    return res.data

def criar(dados: dict):
    sb = get_supabase()
    res = sb.table(TABLE).insert(dados).execute()
    return res.data[0] if res.data else None

def atualizar(id_setor: int, dados: dict):
    sb = get_supabase()
    res = (
        sb.table(TABLE)
        .update(dados)
        .eq("id_setor", id_setor)
        .execute()
    )
    return res.data[0] if res.data else None

def deletar(id_setor: int):
    sb = get_supabase()
    res = sb.table(TABLE).delete().eq("id_setor", id_setor).execute()
    return res.data[0] if res.data else None
