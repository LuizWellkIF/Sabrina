import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Calendar, User, Briefcase, ChevronRight, CheckCircle, MessageSquare } from 'lucide-react'
import api from '../services/api'

function extrairSecoes(conteudo) {
  if (!conteudo) return []
  const linhas = conteudo.split('\n')
  return linhas
    .filter(l => l.match(/^#{1,3} /))
    .map((l, i) => ({
      id: `secao-${i}`,
      texto: l.replace(/^#{1,3} /, ''),
      nivel: l.match(/^(#{1,3})/)[1].length,
    }))
}

function renderizarConteudo(conteudo) {
  if (!conteudo) return null
  const partes = conteudo.split('\n')
  return partes.map((linha, i) => {
    if (linha.match(/^### /)) return <h3 key={i} id={`secao-${i}`} className="text-lg font-semibold text-gray-900 mt-8 mb-3">{linha.replace(/^### /, '')}</h3>
    if (linha.match(/^## /)) return <h2 key={i} id={`secao-${i}`} className="text-xl font-bold text-gray-900 mt-10 mb-3">{linha.replace(/^## /, '')}</h2>
    if (linha.match(/^# /)) return <h2 key={i} id={`secao-${i}`} className="text-2xl font-bold text-gray-900 mt-10 mb-4">{linha.replace(/^# /, '')}</h2>
    if (linha.match(/^```/)) return null
    if (linha.match(/^\d+\.\s/)) return <p key={i} className="text-sm text-gray-700 leading-relaxed my-1 ml-4">{linha}</p>
    if (linha.match(/^[-*] /)) return (
      <div key={i} className="flex items-start gap-2 my-1 ml-4">
        <span className="w-1.5 h-1.5 rounded-full bg-[#1a8a6e] mt-2 flex-shrink-0" />
        <p className="text-sm text-gray-700 leading-relaxed">{linha.replace(/^[-*] /, '')}</p>
      </div>
    )
    if (linha.match(/^>/)) return (
      <div key={i} className="bg-amber-50 border-l-4 border-amber-300 px-4 py-3 my-4 rounded-r-lg">
        <p className="text-sm text-amber-900">{linha.replace(/^> ?/, '')}</p>
      </div>
    )
    if (linha.trim() === '') return <div key={i} className="h-2" />
    return <p key={i} className="text-sm text-gray-700 leading-relaxed my-1.5">{linha}</p>
  })
}

export default function Documento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [marcadoLido, setMarcadoLido] = useState(false)
  const secoes = doc ? extrairSecoes(doc.conteudo) : []

  useEffect(() => {
    api.get(`/documentos/${id}`)
      .then(res => setDoc(res.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setCarregando(false))
  }, [id])

  const formatarData = (data) => {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (carregando) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-[#0f4c5c] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!doc) return null

  return (
    <div className="flex gap-8 px-10 py-8">
      {/* Conteúdo principal */}
      <div className="flex-1 max-w-3xl min-w-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
          <Link to="/dashboard" className="hover:text-gray-700 transition-colors">Início</Link>
          <ChevronRight size={12} />
          <span className="text-gray-600">{doc.titulo}</span>
        </div>

        {/* Categoria badge */}
        {doc.categoria_nome && (
          <span className="inline-block text-xs font-medium text-[#1a8a6e] bg-teal-50 px-2.5 py-1 rounded-full mb-4">
            {doc.categoria_nome}
          </span>
        )}

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{doc.titulo}</h1>
        {doc.resumo && (
          <p className="text-base text-gray-500 mb-5 leading-relaxed">{doc.resumo}</p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-5 text-xs text-gray-500 pb-5 mb-6 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-gray-400" />
            <span>Atualizado: <strong className="text-gray-700">{formatarData(doc.ultima_att)}</strong></span>
          </div>
          {doc.criador_nome && (
            <div className="flex items-center gap-1.5">
              <User size={13} className="text-gray-400" />
              <span>Responsável: <strong className="text-gray-700">{doc.criador_nome}</strong></span>
            </div>
          )}
          {doc.cargo_alvo && (
            <div className="flex items-center gap-1.5">
              <Briefcase size={13} className="text-gray-400" />
              <span>Cargo-alvo: <strong className="text-gray-700">{doc.cargo_alvo}</strong></span>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="prose-sm max-w-none">
          {renderizarConteudo(doc.conteudo)}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3 mt-10 pt-6 border-t border-gray-100">
          <button
            onClick={() => setMarcadoLido(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              marcadoLido
                ? 'bg-teal-50 text-[#0f4c5c] border border-teal-200'
                : 'bg-[#0f4c5c] text-white hover:bg-[#0d3f4d]'
            }`}
          >
            <CheckCircle size={15} />
            {marcadoLido ? 'Marcado como lido' : 'Marcar como lido'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:border-gray-300 transition-colors">
            <MessageSquare size={15} />
            Deixar feedback
          </button>
        </div>
      </div>

      {/* Índice lateral */}
      {secoes.length > 0 && (
        <aside className="w-52 flex-shrink-0 hidden lg:block">
          <div className="sticky top-8">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Nesta página</p>
            <nav className="space-y-1">
              {secoes.map((secao, i) => (
                <a
                  key={secao.id}
                  href={`#${secao.id}`}
                  className="block text-xs text-gray-500 hover:text-[#0f4c5c] transition-colors py-0.5 leading-relaxed"
                  style={{ paddingLeft: secao.nivel > 1 ? `${(secao.nivel - 1) * 12}px` : '0' }}
                >
                  {i + 1}. {secao.texto}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}
    </div>
  )
}
