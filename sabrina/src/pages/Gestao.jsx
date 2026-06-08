import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  BookOpen,
  Check,
  FileText,
  Folder,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const abas = [
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'categorias', label: 'Categorias', icon: Folder },
  { id: 'usuarios', label: 'Usuarios', icon: Users },
]

const documentoInicial = {
  titulo: '',
  resumo: '',
  conteudo: '',
  id_categoria: '',
}

const categoriaInicial = { nome: '' }

const usuarioInicial = {
  nome: '',
  email: '',
  senha: '',
  cargo: '',
  nivel_acesso: 1,
}

function BotaoIcone({ title, children, className = '', ...props }) {
  return (
    <button
      type="button"
      title={title}
      className={`h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 bg-white transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

function Campo({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function inputClasses() {
  return 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/10'
}

function textareaClasses(extra = '') {
  return `${inputClasses()} resize-y ${extra}`
}

export default function Gestao() {
  const { usuario } = useAuth()
  const { categorias, setCategorias } = useOutletContext()
  const [abaAtiva, setAbaAtiva] = useState('documentos')
  const [documentos, setDocumentos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [docEditando, setDocEditando] = useState(null)
  const [catEditando, setCatEditando] = useState(null)
  const [userEditando, setUserEditando] = useState(null)
  const [formDoc, setFormDoc] = useState(documentoInicial)
  const [formCat, setFormCat] = useState(categoriaInicial)
  const [formUser, setFormUser] = useState(usuarioInicial)

  const podeGerenciarConteudo = Number(usuario?.nivel_acesso || 0) >= 5
  const podeGerenciarTudo = Number(usuario?.nivel_acesso || 0) >= 9

  const carregarDados = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const requisicoes = [api.get('/documentos/'), api.get('/categorias/')]
      if (podeGerenciarTudo) requisicoes.push(api.get('/usuarios/'))
      const [docsRes, catsRes, usersRes] = await Promise.all(requisicoes)
      setDocumentos(docsRes.data || [])
      setCategorias(catsRes.data || [])
      if (usersRes) setUsuarios(usersRes.data || [])
    } catch (err) {
      setErro(err.response?.data?.erro || 'Nao foi possivel carregar os dados de gestao.')
    } finally {
      setCarregando(false)
    }
  }, [podeGerenciarTudo, setCategorias])

  useEffect(() => {
    Promise.resolve().then(() => carregarDados())
  }, [carregarDados])

  const categoriasPorId = useMemo(() => {
    return categorias.reduce((acc, cat) => {
      acc[cat.id_categoria] = cat.nome
      return acc
    }, {})
  }, [categorias])

  const textoBusca = busca.trim().toLowerCase()
  const documentosFiltrados = documentos.filter((doc) => {
    if (!textoBusca) return true
    return [doc.titulo, doc.resumo, categoriasPorId[doc.id_categoria]]
      .filter(Boolean)
      .some((valor) => valor.toLowerCase().includes(textoBusca))
  })

  const categoriasFiltradas = categorias.filter((cat) => (
    !textoBusca || cat.nome.toLowerCase().includes(textoBusca)
  ))

  const usuariosFiltrados = usuarios.filter((item) => {
    if (!textoBusca) return true
    return [item.nome, item.email, item.cargo]
      .filter(Boolean)
      .some((valor) => valor.toLowerCase().includes(textoBusca))
  })

  const limparFormularios = () => {
    setDocEditando(null)
    setCatEditando(null)
    setUserEditando(null)
    setFormDoc(documentoInicial)
    setFormCat(categoriaInicial)
    setFormUser(usuarioInicial)
  }

  const avisarSucesso = (texto) => {
    setMensagem(texto)
    setErro('')
  }

  const tratarErro = (err, fallback) => {
    setErro(err.response?.data?.erro || fallback)
    setMensagem('')
  }

  const editarDocumento = (doc) => {
    setDocEditando(doc.id_doc)
    setFormDoc({
      titulo: doc.titulo || '',
      resumo: doc.resumo || '',
      conteudo: doc.conteudo || '',
      id_categoria: doc.id_categoria || '',
    })

    if (!doc.conteudo) {
      api.get(`/documentos/${doc.id_doc}`).then((res) => {
        setFormDoc({
          titulo: res.data.titulo || '',
          resumo: res.data.resumo || '',
          conteudo: res.data.conteudo || '',
          id_categoria: res.data.id_categoria || '',
        })
      }).catch((err) => tratarErro(err, 'Nao foi possivel abrir o documento.'))
    }
  }

  const salvarDocumento = async (event) => {
    event.preventDefault()
    setSalvando(true)
    const payload = {
      titulo: formDoc.titulo.trim(),
      resumo: formDoc.resumo.trim(),
      conteudo: formDoc.conteudo.trim(),
      id_categoria: formDoc.id_categoria ? Number(formDoc.id_categoria) : null,
    }

    try {
      if (docEditando) {
        await api.put(`/documentos/${docEditando}`, payload)
        avisarSucesso('Documento atualizado.')
      } else {
        await api.post('/documentos/', payload)
        avisarSucesso('Documento criado.')
      }
      limparFormularios()
      await carregarDados()
    } catch (err) {
      tratarErro(err, 'Nao foi possivel salvar o documento.')
    } finally {
      setSalvando(false)
    }
  }

  const editarCategoria = (cat) => {
    setCatEditando(cat.id_categoria)
    setFormCat({ nome: cat.nome || '' })
  }

  const salvarCategoria = async (event) => {
    event.preventDefault()
    setSalvando(true)
    const payload = { nome: formCat.nome.trim() }

    try {
      if (catEditando) {
        await api.put(`/categorias/${catEditando}`, payload)
        avisarSucesso('Categoria atualizada.')
      } else {
        await api.post('/categorias/', payload)
        avisarSucesso('Categoria criada.')
      }
      limparFormularios()
      await carregarDados()
    } catch (err) {
      tratarErro(err, 'Nao foi possivel salvar a categoria.')
    } finally {
      setSalvando(false)
    }
  }

  const removerCategoria = async (cat) => {
    if (!window.confirm(`Desativar a categoria "${cat.nome}"?`)) return
    try {
      await api.delete(`/categorias/${cat.id_categoria}`)
      avisarSucesso('Categoria desativada.')
      await carregarDados()
    } catch (err) {
      tratarErro(err, 'Nao foi possivel desativar a categoria.')
    }
  }

  const editarUsuario = (item) => {
    setUserEditando(item.id)
    setFormUser({
      nome: item.nome || '',
      email: item.email || '',
      senha: '',
      cargo: item.cargo || '',
      nivel_acesso: item.nivel_acesso || 1,
    })
  }

  const salvarUsuario = async (event) => {
    event.preventDefault()
    setSalvando(true)

    const payload = {
      nome: formUser.nome.trim(),
      email: formUser.email.trim(),
      cargo: formUser.cargo.trim(),
      nivel_acesso: Number(formUser.nivel_acesso),
    }
    if (!userEditando) payload.senha = formUser.senha

    try {
      if (userEditando) {
        await api.put(`/usuarios/${userEditando}`, payload)
        avisarSucesso('Usuario atualizado.')
      } else {
        await api.post('/usuarios/', payload)
        avisarSucesso('Usuario criado.')
      }
      limparFormularios()
      await carregarDados()
    } catch (err) {
      tratarErro(err, 'Nao foi possivel salvar o usuario.')
    } finally {
      setSalvando(false)
    }
  }

  const removerUsuario = async (item) => {
    if (!window.confirm(`Remover o usuario "${item.nome}"?`)) return
    try {
      await api.delete(`/usuarios/${item.id}`)
      avisarSucesso('Usuario removido.')
      await carregarDados()
    } catch (err) {
      tratarErro(err, 'Nao foi possivel remover o usuario.')
    }
  }

  if (!podeGerenciarConteudo) {
    return (
      <div className="px-10 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestao</h1>
        <p className="text-sm text-gray-500">Seu perfil ainda nao tem permissao para criar ou editar conteudos.</p>
      </div>
    )
  }

  return (
    <div className="px-10 py-8 max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <BookOpen size={15} />
            <span>Base de conhecimento do setor</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Gestao</h1>
          <p className="text-sm text-gray-500 mt-1">
            Crie e refine documentos, categorias e acessos para manter o conhecimento explicito.
          </p>
        </div>

        <button
          type="button"
          onClick={carregarDados}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
        >
          <RefreshCcw size={15} />
          Atualizar
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {abas.map((aba) => {
          if (aba.id !== 'documentos' && !podeGerenciarTudo) return null
          const Icone = aba.icon
          const ativa = abaAtiva === aba.id
          return (
            <button
              key={aba.id}
              type="button"
              onClick={() => {
                setAbaAtiva(aba.id)
                setMensagem('')
                setErro('')
                limparFormularios()
              }}
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                ativa
                  ? 'bg-[#0f4c5c] text-white border-[#0f4c5c]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              <Icone size={15} />
              {aba.label}
            </button>
          )
        })}
      </div>

      <div className="relative mb-5 max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar na gestao"
          className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/10"
        />
      </div>

      {(mensagem || erro) && (
        <div className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
          erro
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-teal-200 bg-teal-50 text-[#0f4c5c]'
        }`}>
          {erro || mensagem}
        </div>
      )}

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#0f4c5c] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
          {abaAtiva === 'documentos' && (
            <>
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Documentos</h2>
                  <span className="text-sm text-gray-400">{documentosFiltrados.length} itens</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {documentosFiltrados.map((doc) => (
                    <article key={doc.id_doc} className="rounded-lg border border-gray-100 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1a8a6e] mb-1">
                            {categoriasPorId[doc.id_categoria] || 'Sem categoria'}
                          </p>
                          <h3 className="text-sm font-semibold text-gray-900 leading-snug">{doc.titulo}</h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{doc.resumo || 'Sem resumo cadastrado.'}</p>
                        </div>
                        <BotaoIcone title="Editar documento" onClick={() => editarDocumento(doc)}>
                          <Pencil size={15} />
                        </BotaoIcone>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <form onSubmit={salvarDocumento} className="rounded-lg border border-gray-100 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {docEditando ? 'Editar documento' : 'Novo documento'}
                  </h2>
                  {docEditando && (
                    <BotaoIcone title="Cancelar edicao" onClick={limparFormularios}>
                      <X size={15} />
                    </BotaoIcone>
                  )}
                </div>
                <div className="space-y-4">
                  <Campo label="Titulo">
                    <input
                      required
                      value={formDoc.titulo}
                      onChange={(event) => setFormDoc({ ...formDoc, titulo: event.target.value })}
                      className={inputClasses()}
                      placeholder="Ex: Como abrir chamado de TI"
                    />
                  </Campo>
                  <Campo label="Categoria">
                    <select
                      value={formDoc.id_categoria}
                      onChange={(event) => setFormDoc({ ...formDoc, id_categoria: event.target.value })}
                      className={inputClasses()}
                    >
                      <option value="">Sem categoria</option>
                      {categorias.map((cat) => (
                        <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nome}</option>
                      ))}
                    </select>
                  </Campo>
                  <Campo label="Resumo">
                    <textarea
                      value={formDoc.resumo}
                      onChange={(event) => setFormDoc({ ...formDoc, resumo: event.target.value })}
                      className={textareaClasses('min-h-20')}
                      placeholder="Sintese curta para facilitar a busca"
                    />
                  </Campo>
                  <Campo label="Conteudo">
                    <textarea
                      required
                      value={formDoc.conteudo}
                      onChange={(event) => setFormDoc({ ...formDoc, conteudo: event.target.value })}
                      className={textareaClasses('min-h-56')}
                      placeholder="Documente passos, regras, excecoes e exemplos"
                    />
                  </Campo>
                  <button
                    disabled={salvando}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f4c5c] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0d3f4d] disabled:opacity-60"
                  >
                    <Check size={15} />
                    {salvando ? 'Salvando...' : 'Salvar documento'}
                  </button>
                </div>
              </form>
            </>
          )}

          {abaAtiva === 'categorias' && podeGerenciarTudo && (
            <>
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Categorias</h2>
                  <span className="text-sm text-gray-400">{categoriasFiltradas.length} itens</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoriasFiltradas.map((cat) => (
                    <article key={cat.id_categoria} className="rounded-lg border border-gray-100 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-lg bg-teal-50 text-[#0f4c5c] flex items-center justify-center">
                            <Folder size={16} />
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate">{cat.nome}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <BotaoIcone title="Editar categoria" onClick={() => editarCategoria(cat)}>
                            <Pencil size={15} />
                          </BotaoIcone>
                          <BotaoIcone title="Desativar categoria" onClick={() => removerCategoria(cat)}>
                            <Trash2 size={15} />
                          </BotaoIcone>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <form onSubmit={salvarCategoria} className="rounded-lg border border-gray-100 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {catEditando ? 'Editar categoria' : 'Nova categoria'}
                  </h2>
                  {catEditando && (
                    <BotaoIcone title="Cancelar edicao" onClick={limparFormularios}>
                      <X size={15} />
                    </BotaoIcone>
                  )}
                </div>
                <div className="space-y-4">
                  <Campo label="Nome">
                    <input
                      required
                      value={formCat.nome}
                      onChange={(event) => setFormCat({ nome: event.target.value })}
                      className={inputClasses()}
                      placeholder="Ex: Politicas internas"
                    />
                  </Campo>
                  <button
                    disabled={salvando}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f4c5c] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0d3f4d] disabled:opacity-60"
                  >
                    <Plus size={15} />
                    {salvando ? 'Salvando...' : 'Salvar categoria'}
                  </button>
                </div>
              </form>
            </>
          )}

          {abaAtiva === 'usuarios' && podeGerenciarTudo && (
            <>
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Usuarios</h2>
                  <span className="text-sm text-gray-400">{usuariosFiltrados.length} itens</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {usuariosFiltrados.map((item) => (
                    <article key={item.id} className="rounded-lg border border-gray-100 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{item.nome}</h3>
                          <p className="text-xs text-gray-500 truncate">{item.email}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {item.cargo || 'Sem cargo'} - nivel {item.nivel_acesso}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <BotaoIcone title="Editar usuario" onClick={() => editarUsuario(item)}>
                            <Pencil size={15} />
                          </BotaoIcone>
                          <BotaoIcone title="Remover usuario" onClick={() => removerUsuario(item)}>
                            <Trash2 size={15} />
                          </BotaoIcone>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <form onSubmit={salvarUsuario} className="rounded-lg border border-gray-100 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {userEditando ? 'Editar usuario' : 'Novo usuario'}
                  </h2>
                  {userEditando && (
                    <BotaoIcone title="Cancelar edicao" onClick={limparFormularios}>
                      <X size={15} />
                    </BotaoIcone>
                  )}
                </div>
                <div className="space-y-4">
                  <Campo label="Nome">
                    <input
                      required
                      value={formUser.nome}
                      onChange={(event) => setFormUser({ ...formUser, nome: event.target.value })}
                      className={inputClasses()}
                      placeholder="Nome completo"
                    />
                  </Campo>
                  <Campo label="E-mail">
                    <input
                      required
                      type="email"
                      value={formUser.email}
                      onChange={(event) => setFormUser({ ...formUser, email: event.target.value })}
                      className={inputClasses()}
                      placeholder="pessoa@empresa.com"
                    />
                  </Campo>
                  {!userEditando && (
                    <Campo label="Senha inicial">
                      <input
                        required
                        type="password"
                        value={formUser.senha}
                        onChange={(event) => setFormUser({ ...formUser, senha: event.target.value })}
                        className={inputClasses()}
                        placeholder="Defina uma senha temporaria"
                      />
                    </Campo>
                  )}
                  <Campo label="Cargo">
                    <input
                      value={formUser.cargo}
                      onChange={(event) => setFormUser({ ...formUser, cargo: event.target.value })}
                      className={inputClasses()}
                      placeholder="Ex: Analista de RH"
                    />
                  </Campo>
                  <Campo label="Nivel de acesso">
                    <select
                      value={formUser.nivel_acesso}
                      onChange={(event) => setFormUser({ ...formUser, nivel_acesso: event.target.value })}
                      className={inputClasses()}
                    >
                      <option value={1}>1 - Leitura</option>
                      <option value={5}>5 - Conteudo</option>
                      <option value={9}>9 - Administracao</option>
                    </select>
                  </Campo>
                  <button
                    disabled={salvando}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f4c5c] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0d3f4d] disabled:opacity-60"
                  >
                    <Check size={15} />
                    {salvando ? 'Salvando...' : 'Salvar usuario'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}
