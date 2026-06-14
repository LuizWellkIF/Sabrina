import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { BookOpen, ChevronRight, Clock, FileText, Search } from 'lucide-react'
import api from '../services/api'

function formatarDataRelativa(data, agora) {
  if (!data) return 'Hoje'

  const dataDoc = new Date(data)
  if (Number.isNaN(dataDoc.getTime())) return 'Hoje'

  const hoje = new Date(agora)
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const inicioDataDoc = new Date(dataDoc.getFullYear(), dataDoc.getMonth(), dataDoc.getDate())
  const diff = Math.floor((inicioHoje - inicioDataDoc) / 86400000)

  if (diff <= 0) return 'Hoje'
  if (diff === 1) return 'ha 1 dia'
  return `ha ${diff} dias`
}

function CardDocumento({ doc, onClick, agora }) {
  return (
    <article
      onClick={() => onClick(doc.id_doc)}
      className="group cursor-pointer rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-gray-200 hover:shadow-sm"
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-[#7010C0] transition-colors group-hover:bg-[#7010C0] group-hover:text-white">
        <FileText size={17} />
      </div>
      <h2 className="mb-2 text-sm font-semibold leading-snug text-gray-900">
        {doc.titulo}
      </h2>
      {doc.resumo && (
        <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-gray-500">
          {doc.resumo}
        </p>
      )}
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Clock size={11} />
        <span>Atualizado {formatarDataRelativa(doc.ultima_att || doc.data_criacao, agora)}</span>
      </div>
    </article>
  )
}

export default function Categoria() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { categorias = [] } = useOutletContext()
  const [documentos, setDocumentos] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [agora] = useState(() => Date.now())

  const idCategoria = Number(id)

  const categoria = useMemo(() => (
    categorias.find((cat) => Number(cat.id_categoria) === idCategoria)
  ), [categorias, idCategoria])

  useEffect(() => {
    api.get('/documentos/')
      .then((res) => setDocumentos(res.data || []))
      .catch(() => setDocumentos([]))
      .finally(() => setCarregando(false))
  }, [])

  const documentosDaCategoria = documentos.filter((doc) => Number(doc.id_categoria) === idCategoria)
  const docsFiltrados = documentosDaCategoria.filter((doc) => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return true
    return doc.titulo?.toLowerCase().includes(termo) || doc.resumo?.toLowerCase().includes(termo)
  })

  return (
    <div className="px-10 py-8 max-w-5xl">
      <div className="mb-7 flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
        <Link to="/dashboard" className="transition-colors hover:text-[#7010C0]">Base</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-gray-900">{categoria?.nome || 'Categoria'}</span>
      </div>

      <header className="mb-8">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-[#7010C0]">
          <BookOpen size={13} />
          Categoria
        </span>
        <h1 className="mb-2 text-4xl font-bold text-gray-900">
          {categoria?.nome || 'Categoria'}
        </h1>
        <p className="text-sm text-gray-500">
          Documentos registrados nesta categoria para consulta rapida.
        </p>
      </header>

      <div className="relative mb-8 max-w-xl">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar documentos nesta categoria"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#7010C0] focus:ring-2 focus:ring-[#7010C0]/10"
        />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Documentos da categoria</h2>
        <span className="text-sm text-gray-400">{docsFiltrados.length} conteudos</span>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7010C0] border-t-transparent" />
        </div>
      ) : docsFiltrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-gray-600">Nenhum documento encontrado.</p>
          <p className="mt-1 text-xs text-gray-400">
            Quando houver documentos vinculados a esta categoria, eles aparecerao aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docsFiltrados.map((doc) => (
            <CardDocumento
              key={doc.id_doc}
              doc={doc}
              agora={agora}
              onClick={(idDoc) => navigate(`/documento/${idDoc}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
