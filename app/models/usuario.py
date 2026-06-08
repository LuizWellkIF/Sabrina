from app.extensions import get_supabase

TABLE = "USUARIO"

def buscar_por_email(email: str):
    sb = get_supabase()
    res = sb.table(TABLE).select("*").eq("email", email).execute()

    if not res.data:
        return None

    return res.data[0]

def buscar_por_id(user_id: int):
    sb = get_supabase()
    res = sb.table(TABLE).select("id, nome, email, cargo, nivel_acesso, id_setor, data_criacao").eq("id", user_id).single().execute()
    return res.data

def criar(dados: dict):
    sb = get_supabase()
    res = sb.table(TABLE).insert(dados).execute()
    return res.data[0] if res.data else None

def atualizar(user_id: int, id_setor: int, dados: dict):
    sb = get_supabase()
    res = (
        sb.table(TABLE)
        .update(dados)
        .eq("id", user_id)
        .eq("id_setor", id_setor)
        .execute()
    )
    return res.data[0] if res.data else None
