from app.extensions import get_supabase

TABLE = "CARGO"

def listar_por_setor(id_setor: int):
    sb = get_supabase()
    res = (
        sb.table(TABLE)
        .select("id_cargo, nome, id_setor")
        .eq("id_setor", id_setor)
        .order("nome")
        .execute()
    )
    return res.data

def listar_todos():
    sb = get_supabase()
    res = (
        sb.table(TABLE)
        .select("id_cargo, nome, id_setor")
        .order("nome")
        .execute()
    )
    return res.data

def buscar_por_id(id_cargo: int, id_setor: int):
    sb = get_supabase()
    res = (
        sb.table(TABLE)
        .select("id_cargo, nome, id_setor")
        .eq("id_cargo", id_cargo)
        .eq("id_setor", id_setor)
        .single()
        .execute()
    )
    return res.data

def criar(dados: dict):
    sb = get_supabase()
    res = sb.table(TABLE).insert(dados).execute()
    return res.data[0] if res.data else None

def atualizar(id_cargo: int, id_setor: int, dados: dict):
    sb = get_supabase()
    res = (
        sb.table(TABLE)
        .update(dados)
        .eq("id_cargo", id_cargo)
        .eq("id_setor", id_setor)
        .execute()
    )
    return res.data[0] if res.data else None

def atualizar_por_id(id_cargo: int, dados: dict):
    sb = get_supabase()
    res = (
        sb.table(TABLE)
        .update(dados)
        .eq("id_cargo", id_cargo)
        .execute()
    )
    return res.data[0] if res.data else None

def deletar(id_cargo: int, id_setor: int):
    sb = get_supabase()
    res = (
        sb.table(TABLE)
        .delete()
        .eq("id_cargo", id_cargo)
        .eq("id_setor", id_setor)
        .execute()
    )
    return res.data[0] if res.data else None

def deletar_por_id(id_cargo: int):
    sb = get_supabase()
    res = sb.table(TABLE).delete().eq("id_cargo", id_cargo).execute()
    return res.data[0] if res.data else None
