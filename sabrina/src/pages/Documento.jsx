import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import {
  Briefcase,
  Calendar,
  CheckCircle,
  ChevronRight,
  MessageSquare,
  PencilLine,
  Search,
  User,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

function extrairSecoes(conteudo) {
  if (!conteudo) return []
  const linhas = conteudo.split('\n')
  return linhas
    .map((linha, indice) => ({ linha, indice }))
    .filter(({ linha }) => linha.match(/^#{1,3} /))
    .map(({ linha, indice }) => ({
      id: `secao-${indice}`,
      texto: linha.replace(/^#{1,3} /, ''),
      nivel: linha.match(/^(#{1,3})/)[1].length,
    }))
}

function renderizarConteudo(conteudo) {
  if (!conteudo) return null
  const partes = conteudo.split('\n')

  return partes.map((linha, i) => {
    if (linha.match(/^### /)) {
      return <h3 key={i} id={`secao-${i}`} className="text-lg font-semibold text-gray-900 mt-8 mb-3">{linha.replace(/^### /, '')}</h3>
    }
    if (linha.match(/^## /)) {
      return <h2 key={i} id={`secao-${i}`} className="text-xl font-bold text-gray-900 mt-10 mb-3">{linha.replace(/^## /, '')}</h2>
    }
    if (linha.match(/^# /)) {
      return <h2 key={i} id={`secao-${i}`} className="text-2xl font-bold text-gray-900 mt-10 mb-4">{linha.replace(/^# /, '')}</h2>
    }
    if (linha.match(/^```/)) return null
    if (linha.match(/^\d+\.\s/)) {
      return <p key={i} className="text-sm text-gray-700 leading-relaxed my-1 ml-4">{linha}</p>
    }
    if (linha.match(/^[-*] /)) {
      return (
        <div key={i} className="flex items-start gap-2 my-1 ml-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1a8a6e] mt-2 flex-shrink-0" />
          <p className="text-sm text-gray-700 leading-relaxed">{linha.replace(/^[-*] /, '')}</p>
        </div>
      )
    }
    if (linha.match(/^>/)) {
      return (
        <div key={i} className="bg-amber-50 border-l-4 border-amber-300 px-4 py-3 my-4 rounded-r-lg">
          <p className="text-sm text-amber-900">{linha.replace(/^> ?/, '')}</p>
        </div>
      )
    }
    if (linha.trim() === '') return <div key={i} className="h-2" />
    return <p key={i} className="text-sm text-gray-700 leading-relaxed my-1.5">{linha}</p>
  })
}

export default function Documento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { categorias = [] } = useOutletContext()
  const [doc, setDoc] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [marcadoLido, setMarcadoLido] = useState(false)

  const categoriasPorId = useMemo(() => {
    return categorias.reduce((acc, cat) => {
      acc[cat.id_categoria] = cat.nome
      return acc
    }, {})
  }, [categorias])

  useEffect(() => {
    api.get(`/documentos/${id}`)
      .then((res) => setDoc(res.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setCarregando(false))
  }, [id, navigate])

  const formatarData = (data) => {
    if (!data) return '-'
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#0f4c5c] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!doc) return null

  const secoes = extrairSecoes(doc.conteudo)
  const categoriaNome = doc.categoria_nome || categoriasPorId[doc.id_categoria]
  const responsavel = doc.criador_nome || doc.autor_nome || (
    Number(doc.criador) === Number(usuario?.id) ? usuario?.nome : null
  )
  const ultimoEditor = doc.ultimo_editor_nome || (
    Number(doc.ultimo_editor) === Number(usuario?.id) ? usuario?.nome : null
  )

  return (
    <div className="flex gap-8 px-10 py-7">
      <div className="flex-1 max-w-4xl min-w-0">
        <div className="relative mb-10 max-w-2xl">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && event.currentTarget.value.trim()) {
                navigate(`/dashboard?busca=${encodeURIComponent(event.currentTarget.value.trim())}`)
              }
            }}
            placeholder="Buscar processos, scripts, politicas..."
            className="w-full rounded-xl border border-[#e8e0d6] bg-[#faf7f2] py-3.5 pl-11 pr-4 text-sm text-gray-700 shadow-sm outline-none transition-all placeholder:text-gray-500 focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/10"
          />
        </div>

        <header className="border-b border-[#ded6ca] pb-8 mb-7">
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500 mb-7">
            <Link to="/dashboard" className="hover:text-[#0f4c5c] transition-colors">Base</Link>
            {categoriaNome && (
              <>
                <ChevronRight size={14} />
                <Link to="/dashboard" className="hover:text-[#0f4c5c] transition-colors">{categoriaNome}</Link>
              </>
            )}
            <ChevronRight size={14} />
            <span className="font-medium text-gray-900">{doc.titulo}</span>
          </div>

          {categoriaNome && (
            <span className="inline-flex rounded-full bg-[#dff5e9] px-3 py-1 text-xs font-semibold text-[#009b73] mb-5">
              {categoriaNome}
            </span>
          )}

          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#07182c] leading-tight mb-4">
            {doc.titulo}
          </h1>
          {doc.resumo && (
            <p className="text-lg text-gray-600 leading-relaxed mb-7">{doc.resumo}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-gray-500" />
              <span>Atualizado: <strong className="font-semibold text-gray-950">{formatarData(doc.ultima_att || doc.data_criacao)}</strong></span>
            </div>
            {responsavel && (
              <div className="flex items-center gap-2">
                <User size={15} className="text-gray-500" />
                <span>Responsavel: <strong className="font-semibold text-gray-950">{responsavel}</strong></span>
              </div>
            )}
            {ultimoEditor && (
              <div className="flex items-center gap-2">
                <PencilLine size={15} className="text-gray-500" />
                <span>Ultima edicao: <strong className="font-semibold text-gray-950">{ultimoEditor}</strong></span>
              </div>
            )}
            {doc.cargo_alvo_nome && (
              <div className="flex items-center gap-2">
                <Briefcase size={15} className="text-gray-500" />
                <span>Cargo-alvo: <strong className="font-semibold text-gray-950">{doc.cargo_alvo_nome}</strong></span>
              </div>
            )}
          </div>
        </header>

        <div className="prose-sm max-w-none">
          {renderizarConteudo(doc.conteudo)}
        </div>

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

      {secoes.length > 0 && (
        <aside className="w-52 flex-shrink-0 hidden lg:block">
          <div className="sticky top-8">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Nesta pagina</p>
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
