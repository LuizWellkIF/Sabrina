from app.extensions import get_supabase

TABLE = "CATEGORIA"

def listar_por_setor(id_setor: int):
    sb = get_supabase()
    res = (
        sb.table(TABLE)
        .select("id_categoria, nome")
        .eq("id_setor", id_setor)
        .eq("ativo", True)
        .order("nome")
        .execute()
    )
    return res.data

def criar(dados: dict):
    sb = get_supabase()
    res = sb.table(TABLE).insert(dados).execute()
    return res.data[0] if res.data else None

def atualizar(id_categoria: int, id_setor: int, dados: dict):
    sb = get_supabase()
    res = (
        sb.table(TABLE)
        .update(dados)
        .eq("id_categoria", id_categoria)
        .eq("id_setor", id_setor)
        .execute()
    )
    return res.data[0] if res.data else None

def desativar(id_categoria: int, id_setor: int):
    sb = get_supabase()
    res = (
        sb.table(TABLE)
        .update({"ativo": False})
        .eq("id_categoria", id_categoria)
        .eq("id_setor", id_setor)
        .execute()
    )
    return res.data[0] if res.data else None
