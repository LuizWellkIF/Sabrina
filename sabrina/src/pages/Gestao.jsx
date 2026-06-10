import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  BookOpen,
  Briefcase,
  Check,
  FileText,
  Folder,
  Building2,
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
  { id: 'setores', label: 'Setores', icon: Building2 },
  { id: 'cargos', label: 'Cargos', icon: Briefcase },
  { id: 'usuarios', label: 'Usuarios', icon: Users },
]

const documentoInicial = {
  titulo: '',
  resumo: '',
  conteudo: '',
  id_cargo: '',
  id_categoria: '',
}

const categoriaInicial = { nome: '' }
const cargoInicial = { nome: '', id_setor: '' }
const setorInicial = { nome: '', descricao: '' }

const usuarioInicial = {
  nome: '',
  email: '',
  senha: '',
  id_setor: '',
  id_cargo: '',
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
  const { categorias, setCategorias, cargos, setCargos } = useOutletContext()
  const [abaAtiva, setAbaAtiva] = useState('documentos')
  const [documentos, setDocumentos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [setores, setSetores] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [docEditando, setDocEditando] = useState(null)
  const [catEditando, setCatEditando] = useState(null)
  const [cargoEditando, setCargoEditando] = useState(null)
  const [setorEditando, setSetorEditando] = useState(null)
  const [userEditando, setUserEditando] = useState(null)
  const [formDoc, setFormDoc] = useState(documentoInicial)
  const [formCat, setFormCat] = useState(categoriaInicial)
  const [formCargo, setFormCargo] = useState(cargoInicial)
  const [formSetor, setFormSetor] = useState(setorInicial)
  const [formUser, setFormUser] = useState(usuarioInicial)

  const podeGerenciarConteudo = Number(usuario?.nivel_acesso || 0) >= 5
  const podeGerenciarTudo = Number(usuario?.nivel_acesso || 0) >= 9

  const carregarDados = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const requisicoes = [
        api.get('/documentos/'),
        api.get('/categorias/'),
        api.get(podeGerenciarTudo ? '/cargos/?todos=1' : '/cargos/'),
      ]
      if (podeGerenciarTudo) {
        requisicoes.push(api.get('/usuarios/'))
        requisicoes.push(api.get('/setores/'))
      }
      const [docsRes, catsRes, cargosRes, usersRes, setoresRes] = await Promise.all(requisicoes)
      setDocumentos(docsRes.data || [])
      setCategorias(catsRes.data || [])
      setCargos(cargosRes.data || [])
      if (usersRes) setUsuarios(usersRes.data || [])
      if (setoresRes) setSetores(setoresRes.data || [])
    } catch (err) {
      setErro(err.response?.data?.erro || 'Nao foi possivel carregar os dados de gestao.')
    } finally {
      setCarregando(false)
    }
  }, [podeGerenciarTudo, setCategorias, setCargos])

  useEffect(() => {
    Promise.resolve().then(() => carregarDados())
  }, [carregarDados])

  const categoriasPorId = useMemo(() => {
    return categorias.reduce((acc, cat) => {
      acc[cat.id_categoria] = cat.nome
      return acc
    }, {})
  }, [categorias])

  const cargosPorId = useMemo(() => {
    return cargos.reduce((acc, cargo) => {
      acc[cargo.id_cargo] = cargo.nome
      return acc
    }, {})
  }, [cargos])

  const setoresPorId = useMemo(() => {
    return setores.reduce((acc, setor) => {
      acc[setor.id_setor] = setor.nome
      return acc
    }, {})
  }, [setores])

  const cargosDoSetorAtual = useMemo(() => {
    return cargos.filter((cargo) => Number(cargo.id_setor) === Number(usuario?.id_setor))
  }, [cargos, usuario?.id_setor])

  const cargosDoSetorDoUsuario = useMemo(() => {
    return cargos.filter((cargo) => Number(cargo.id_setor) === Number(formUser.id_setor))
  }, [cargos, formUser.id_setor])

  const textoBusca = busca.trim().toLowerCase()
  const documentosFiltrados = documentos.filter((doc) => {
    if (!textoBusca) return true
    return [doc.titulo, doc.resumo, categoriasPorId[doc.id_categoria], cargosPorId[doc.id_cargo]]
      .filter(Boolean)
      .some((valor) => valor.toLowerCase().includes(textoBusca))
  })

  const categoriasFiltradas = categorias.filter((cat) => (
    !textoBusca || cat.nome.toLowerCase().includes(textoBusca)
  ))

  const cargosFiltrados = cargos.filter((cargo) => (
    !textoBusca ||
    cargo.nome.toLowerCase().includes(textoBusca) ||
    cargo.setor_nome?.toLowerCase().includes(textoBusca) ||
    setoresPorId[cargo.id_setor]?.toLowerCase().includes(textoBusca)
  ))

  const setoresFiltrados = setores.filter((setor) => (
    !textoBusca ||
    setor.nome.toLowerCase().includes(textoBusca) ||
    setor.descricao?.toLowerCase().includes(textoBusca)
  ))

  const usuariosFiltrados = usuarios.filter((item) => {
    if (!textoBusca) return true
    return [item.nome, item.email, item.cargo_nome, item.setor_nome]
      .filter(Boolean)
      .some((valor) => valor.toLowerCase().includes(textoBusca))
  })

  const limparFormularios = () => {
    setDocEditando(null)
    setCatEditando(null)
    setCargoEditando(null)
    setSetorEditando(null)
    setUserEditando(null)
    setFormDoc(documentoInicial)
    setFormCat(categoriaInicial)
    setFormCargo(cargoInicial)
    setFormSetor(setorInicial)
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
      id_cargo: doc.id_cargo || '',
      id_categoria: doc.id_categoria || '',
    })

    if (!doc.conteudo) {
      api.get(`/documentos/${doc.id_doc}`).then((res) => {
        setFormDoc({
          titulo: res.data.titulo || '',
          resumo: res.data.resumo || '',
          conteudo: res.data.conteudo || '',
          id_cargo: res.data.id_cargo || '',
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
      id_cargo: formDoc.id_cargo ? Number(formDoc.id_cargo) : null,
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

  const removerDocumento = async (doc) => {
    if (!window.confirm(`Remover o documento "${doc.titulo}"?`)) return
    try {
      await api.delete(`/documentos/${doc.id_doc}`)
      avisarSucesso('Documento removido.')
      if (docEditando === doc.id_doc) limparFormularios()
      await carregarDados()
    } catch (err) {
      tratarErro(err, 'Nao foi possivel remover o documento.')
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

  const editarCargo = (cargo) => {
    setCargoEditando(cargo.id_cargo)
    setFormCargo({
      nome: cargo.nome || '',
      id_setor: cargo.id_setor || '',
    })
  }

  const salvarCargo = async (event) => {
    event.preventDefault()
    setSalvando(true)
    const payload = {
      nome: formCargo.nome.trim(),
      id_setor: formCargo.id_setor ? Number(formCargo.id_setor) : null,
    }

    try {
      if (cargoEditando) {
        await api.put(`/cargos/${cargoEditando}`, payload)
        avisarSucesso('Cargo atualizado.')
      } else {
        await api.post('/cargos/', payload)
        avisarSucesso('Cargo criado.')
      }
      limparFormularios()
      await carregarDados()
    } catch (err) {
      tratarErro(err, 'Nao foi possivel salvar o cargo.')
    } finally {
      setSalvando(false)
    }
  }

  const removerCargo = async (cargo) => {
    if (!window.confirm(`Remover o cargo "${cargo.nome}"?`)) return
    try {
      await api.delete(`/cargos/${cargo.id_cargo}`)
      avisarSucesso('Cargo removido.')
      await carregarDados()
    } catch (err) {
      tratarErro(err, 'Nao foi possivel remover o cargo.')
    }
  }

  const editarSetor = (setor) => {
    setSetorEditando(setor.id_setor)
    setFormSetor({
      nome: setor.nome || '',
      descricao: setor.descricao || '',
    })
  }

  const salvarSetor = async (event) => {
    event.preventDefault()
    setSalvando(true)
    const payload = {
      nome: formSetor.nome.trim(),
      descricao: (formSetor.descricao || '').trim(),
    }

    try {
      if (setorEditando) {
        await api.put(`/setores/${setorEditando}`, payload)
        avisarSucesso('Setor atualizado.')
      } else {
        await api.post('/setores/', payload)
        avisarSucesso('Setor criado.')
      }
      limparFormularios()
      await carregarDados()
    } catch (err) {
      tratarErro(err, 'Nao foi possivel salvar o setor.')
    } finally {
      setSalvando(false)
    }
  }

  const removerSetor = async (setor) => {
    if (!window.confirm(`Remover o setor "${setor.nome}"?`)) return
    try {
      await api.delete(`/setores/${setor.id_setor}`)
      avisarSucesso('Setor removido.')
      await carregarDados()
    } catch (err) {
      tratarErro(err, 'Nao foi possivel remover o setor. Verifique se existem usuarios, cargos, categorias ou documentos vinculados.')
    }
  }

  const editarUsuario = (item) => {
    setUserEditando(item.id)
    setFormUser({
      nome: item.nome || '',
      email: item.email || '',
      senha: '',
      id_setor: item.id_setor || '',
      id_cargo: item.id_cargo || '',
      nivel_acesso: item.nivel_acesso || 1,
    })
  }

  const salvarUsuario = async (event) => {
    event.preventDefault()
    setSalvando(true)

    const payload = {
      nome: formUser.nome.trim(),
      email: formUser.email.trim(),
      id_setor: formUser.id_setor ? Number(formUser.id_setor) : null,
      id_cargo: formUser.id_cargo ? Number(formUser.id_cargo) : null,
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">Gestão</h1>
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
                          {(doc.cargo_alvo_nome || cargosPorId[doc.id_cargo]) && (
                            <p className="text-xs text-gray-400 mt-2">
                              Cargo-alvo: {doc.cargo_alvo_nome || cargosPorId[doc.id_cargo]}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <BotaoIcone title="Editar documento" onClick={() => editarDocumento(doc)}>
                            <Pencil size={15} />
                          </BotaoIcone>
                          <BotaoIcone title="Remover documento" onClick={() => removerDocumento(doc)}>
                            <Trash2 size={15} />
                          </BotaoIcone>
                        </div>
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
                  <Campo label="Cargo-alvo">
                    <select
                      value={formDoc.id_cargo}
                      onChange={(event) => setFormDoc({ ...formDoc, id_cargo: event.target.value })}
                      className={inputClasses()}
                    >
                      <option value="">Sem cargo-alvo</option>
                      {cargosDoSetorAtual.map((cargo) => (
                        <option key={cargo.id_cargo} value={cargo.id_cargo}>{cargo.nome}</option>
                      ))}
                    </select>
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

          {abaAtiva === 'cargos' && podeGerenciarTudo && (
            <>
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Cargos</h2>
                  <span className="text-sm text-gray-400">{cargosFiltrados.length} itens</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cargosFiltrados.map((cargo) => (
                    <article key={cargo.id_cargo} className="rounded-lg border border-gray-100 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-lg bg-teal-50 text-[#0f4c5c] flex items-center justify-center">
                            <Briefcase size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{cargo.nome}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {cargo.setor_nome || setoresPorId[cargo.id_setor] || `Setor ${cargo.id_setor}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <BotaoIcone title="Editar cargo" onClick={() => editarCargo(cargo)}>
                            <Pencil size={15} />
                          </BotaoIcone>
                          <BotaoIcone title="Remover cargo" onClick={() => removerCargo(cargo)}>
                            <Trash2 size={15} />
                          </BotaoIcone>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <form onSubmit={salvarCargo} className="rounded-lg border border-gray-100 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {cargoEditando ? 'Editar cargo' : 'Novo cargo'}
                  </h2>
                  {cargoEditando && (
                    <BotaoIcone title="Cancelar edicao" onClick={limparFormularios}>
                      <X size={15} />
                    </BotaoIcone>
                  )}
                </div>
                <div className="space-y-4">
                  <Campo label="Nome">
                    <input
                      required
                      value={formCargo.nome}
                      onChange={(event) => setFormCargo({ ...formCargo, nome: event.target.value })}
                      className={inputClasses()}
                      placeholder="Ex: Vendedor Senior"
                    />
                  </Campo>
                  <Campo label="Setor">
                    <select
                      required
                      value={formCargo.id_setor}
                      onChange={(event) => setFormCargo({ ...formCargo, id_setor: event.target.value })}
                      className={inputClasses()}
                    >
                      <option value="">Selecione um setor</option>
                      {setores.map((setor) => (
                        <option key={setor.id_setor} value={setor.id_setor}>{setor.nome}</option>
                      ))}
                    </select>
                  </Campo>
                  <button
                    disabled={salvando}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f4c5c] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0d3f4d] disabled:opacity-60"
                  >
                    <Plus size={15} />
                    {salvando ? 'Salvando...' : 'Salvar cargo'}
                  </button>
                </div>
              </form>
            </>
          )}

          {abaAtiva === 'setores' && podeGerenciarTudo && (
            <>
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Setores</h2>
                  <span className="text-sm text-gray-400">{setoresFiltrados.length} itens</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {setoresFiltrados.map((setor) => (
                    <article key={setor.id_setor} className="rounded-lg border border-gray-100 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-lg bg-teal-50 text-[#0f4c5c] flex items-center justify-center">
                            <Building2 size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{setor.nome}</p>
                            <p className="text-xs text-gray-400">ID {setor.id_setor}</p>
                            {setor.descricao && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{setor.descricao}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <BotaoIcone title="Editar setor" onClick={() => editarSetor(setor)}>
                            <Pencil size={15} />
                          </BotaoIcone>
                          <BotaoIcone title="Remover setor" onClick={() => removerSetor(setor)}>
                            <Trash2 size={15} />
                          </BotaoIcone>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <form onSubmit={salvarSetor} className="rounded-lg border border-gray-100 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {setorEditando ? 'Editar setor' : 'Novo setor'}
                  </h2>
                  {setorEditando && (
                    <BotaoIcone title="Cancelar edicao" onClick={limparFormularios}>
                      <X size={15} />
                    </BotaoIcone>
                  )}
                </div>
                <div className="space-y-4">
                  <Campo label="Nome">
                    <input
                      required
                      value={formSetor.nome}
                      onChange={(event) => setFormSetor({ ...formSetor, nome: event.target.value })}
                      className={inputClasses()}
                      placeholder="Ex: Recursos Humanos"
                    />
                  </Campo>
                  <Campo label="Descricao">
                    <textarea
                      value={formSetor.descricao}
                      onChange={(event) => setFormSetor({ ...formSetor, descricao: event.target.value })}
                      className={textareaClasses('min-h-24')}
                      placeholder="Descreva o escopo e responsabilidades do setor"
                    />
                  </Campo>
                  <button
                    disabled={salvando}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f4c5c] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0d3f4d] disabled:opacity-60"
                  >
                    <Plus size={15} />
                    {salvando ? 'Salvando...' : 'Salvar setor'}
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
                            {item.cargo_nome || cargosPorId[item.id_cargo] || 'Sem cargo'} - nivel {item.nivel_acesso}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Setor: {item.setor_nome || setoresPorId[item.id_setor] || 'Sem setor'}
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
                  <Campo label="Setor">
                    <select
                      required
                      value={formUser.id_setor}
                      onChange={(event) => setFormUser({
                        ...formUser,
                        id_setor: event.target.value,
                        id_cargo: '',
                      })}
                      className={inputClasses()}
                    >
                      <option value="">Selecione um setor</option>
                      {setores.map((setor) => (
                        <option key={setor.id_setor} value={setor.id_setor}>{setor.nome}</option>
                      ))}
                    </select>
                  </Campo>
                  <Campo label="Cargo">
                    <select
                      value={formUser.id_cargo}
                      onChange={(event) => setFormUser({ ...formUser, id_cargo: event.target.value })}
                      className={inputClasses()}
                      disabled={!formUser.id_setor}
                    >
                      <option value="">
                        {formUser.id_setor ? 'Sem cargo' : 'Selecione um setor primeiro'}
                      </option>
                      {cargosDoSetorDoUsuario.map((cargo) => (
                        <option key={cargo.id_cargo} value={cargo.id_cargo}>{cargo.nome}</option>
                      ))}
                    </select>
                    {formUser.id_setor && cargosDoSetorDoUsuario.length === 0 && (
                      <span className="block text-xs text-amber-600 mt-1.5">
                        Este setor ainda nao tem cargos cadastrados.
                      </span>
                    )}
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
