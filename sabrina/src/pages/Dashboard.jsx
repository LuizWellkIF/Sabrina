import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { Search, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

function CardDocumento({ doc, onClick, agora }) {
  const formatarData = (data) => {
    if (!data) return 'Hoje'

    const dataDoc = new Date(data)
    if (Number.isNaN(dataDoc.getTime())) return 'Hoje'

    const hoje = new Date(agora)
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    const inicioDataDoc = new Date(dataDoc.getFullYear(), dataDoc.getMonth(), dataDoc.getDate())
    const diff = Math.floor((inicioHoje - inicioDataDoc) / 86400000)

    if (diff <= 0) return 'Hoje'
    if (diff === 1) return 'há 1 dia'
    return `há ${diff} dias`
  }

  return (
    <div
      onClick={() => onClick(doc.id_doc)}
      className="bg-white rounded-xl border border-gray-100 p-5 cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all group"
    >
      <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-teal-50 transition-colors">
        <Search size={16} className="text-gray-400 group-hover:text-[#0f4c5c] transition-colors" />
      </div>
      {doc.categoria_nome && (
        <span className="inline-block text-xs font-medium text-[#1a8a6e] mb-2">
          {doc.categoria_nome}
        </span>
      )}
      <h3 className="text-sm font-semibold text-gray-900 mb-1.5 leading-snug">{doc.titulo}</h3>
      {doc.resumo && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{doc.resumo}</p>
      )}
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Clock size={11} />
        <span>Atualizado {formatarData(doc.ultima_att || doc.data_criacao)}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const { categorias } = useOutletContext()
  const [searchParams] = useSearchParams()
  const [documentos, setDocumentos] = useState([])
  const [busca, setBusca] = useState(searchParams.get('busca') || '')
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [agora] = useState(() => Date.now())
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/documentos/')
      .then(res => setDocumentos(res.data))
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [])

  const primeiroNome = usuario?.nome?.split(' ')[0] || 'você'

  const docsFiltrados = documentos.filter(doc => {
    const matchBusca = busca === '' ||
      doc.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
      doc.resumo?.toLowerCase().includes(busca.toLowerCase())
    const matchCategoria = !categoriaSelecionada || doc.id_categoria === categoriaSelecionada
    return matchBusca && matchCategoria
  })

  return (
    <div className="px-10 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-2 text-sm text-gray-500">
        {usuario?.cargo_nome}
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-1">
        Olá, <em className="italic font-bold">{primeiroNome}.</em>
      </h1>
      <p className="text-sm text-gray-500 mb-7">
        Sua base de conhecimento está disponível. Explore os conteúdos do seu setor.
      </p>

      {/* Busca */}
      <div className="relative mb-8 max-w-xl">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="O que você precisa saber agora?"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/10 transition-all shadow-sm"
        />
      </div>

      {/* Filtro de categorias */}
      {categorias.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Categorias</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoriaSelecionada(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                !categoriaSelecionada
                  ? 'bg-[#0f4c5c] text-white border-[#0f4c5c]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              Todos
            </button>
            {categorias.map(cat => (
              <button
                key={cat.id_categoria}
                onClick={() => setCategoriaSelecionada(
                  categoriaSelecionada === cat.id_categoria ? null : cat.id_categoria
                )}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  categoriaSelecionada === cat.id_categoria
                    ? 'bg-[#0f4c5c] text-white border-[#0f4c5c]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {cat.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid de documentos */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Minha base de conhecimento</h2>
        <span className="text-sm text-gray-400">{docsFiltrados.length} conteúdos</span>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#0f4c5c] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : docsFiltrados.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">Nenhum documento encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docsFiltrados.map(doc => (
            <CardDocumento
              key={doc.id_doc}
              doc={doc}
              agora={agora}
              onClick={(id) => navigate(`/documento/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
