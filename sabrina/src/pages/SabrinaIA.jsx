import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUp,
  Bot,
  Clock,
  FileText,
  History,
  Loader2,
  Sparkles,
  User,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const sugestoesBase = [
  'Quais documentos explicam os processos mais importantes do meu setor?',
  'Resuma os documentos de políticas internas do meu setor.',
  'Quais informações da base podem me ajudar no meu cargo?',
]

function formatarData(data) {
  if (!data) return ''
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function renderizarInlineMarkdown(texto) {
  const partes = []
  const regex = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\))/g
  let ultimoIndice = 0
  let match

  while ((match = regex.exec(texto)) !== null) {
    if (match.index > ultimoIndice) {
      partes.push(texto.slice(ultimoIndice, match.index))
    }

    if (match[2]) {
      partes.push(<strong key={partes.length} className="font-semibold">{match[2]}</strong>)
    } else if (match[3] && match[4]) {
      const destino = match[4]
      if (destino.startsWith('/documento/')) {
        partes.push(
          <Link key={partes.length} to={destino} className="font-medium text-[#7010C0] underline underline-offset-2">
            {match[3]}
          </Link>
        )
      } else {
        partes.push(match[3])
      }
    }

    ultimoIndice = regex.lastIndex
  }

  if (ultimoIndice < texto.length) {
    partes.push(texto.slice(ultimoIndice))
  }

  return partes
}

function TextoMensagem({ texto }) {
  const linhas = (texto || '').split('\n')

  return (
    <div className="space-y-1">
      {linhas.map((linha, indice) => {
        if (!linha.trim()) return <div key={indice} className="h-1" />

        if (linha.match(/^[-*]\s+/)) {
          return (
            <div key={indice} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-current opacity-50 flex-shrink-0" />
              <span>{renderizarInlineMarkdown(linha.replace(/^[-*]\s+/, ''))}</span>
            </div>
          )
        }

        return <p key={indice}>{renderizarInlineMarkdown(linha)}</p>
      })}
    </div>
  )
}

function Mensagem({ mensagem }) {
  const propria = mensagem.autor === 'usuario'

  return (
    <div className={`flex gap-3 ${propria ? 'justify-end' : 'justify-start'}`}>
      {!propria && (
        <div className="h-8 w-8 rounded-lg bg-[#7010C0] text-white flex items-center justify-center flex-shrink-0">
          <Sparkles size={15} />
        </div>
      )}

      <div className={`max-w-[78%] ${propria ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            propria
              ? 'bg-[#7010C0] text-white rounded-br-md'
              : 'bg-[#f0ece5] text-gray-900 rounded-bl-md'
          }`}
        >
          <TextoMensagem texto={mensagem.texto} />
        </div>

        {mensagem.documentos?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mensagem.documentos.map((doc) => (
              <Link
                key={doc.id_doc}
                to={`/documento/${doc.id_doc}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#ded6ca] bg-white px-2.5 py-1 text-xs text-gray-600 hover:border-[#7010C0] hover:text-[#7010C0] transition-colors"
              >
                <FileText size={12} />
                {doc.titulo}
              </Link>
            ))}
          </div>
        )}
      </div>

      {propria && (
        <div className="h-8 w-8 rounded-lg bg-white border border-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0">
          <User size={15} />
        </div>
      )}
    </div>
  )
}

export default function SabrinaIA() {
  const { usuario } = useAuth()
  const [mensagens, setMensagens] = useState([])
  const [historico, setHistorico] = useState([])
  const [pergunta, setPergunta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const fimRef = useRef(null)

  const primeiroNome = usuario?.nome?.split(' ')[0] || 'usuario'
  const cargo = usuario?.cargo_nome || 'seu cargo'

  const mensagemInicial = useMemo(() => ({
    id: 'inicio',
    autor: 'sabrina',
    texto: `Olá, ${primeiroNome}. Sou a Sabrina, sua agente de conhecimento para ${cargo}. Posso responder com base nos documentos do seu setor. O que você deseja saber?`,
  }), [cargo, primeiroNome])

  useEffect(() => {
    setMensagens([mensagemInicial])
  }, [mensagemInicial])

  useEffect(() => {
    api.get('/agente/historico?limite=8')
      .then((res) => setHistorico(res.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, enviando])

  const carregarHistorico = async () => {
    const res = await api.get('/agente/historico?limite=8')
    setHistorico(res.data || [])
  }

  const enviarPergunta = async (texto = pergunta) => {
    const conteudo = texto.trim()
    if (!conteudo || enviando) return

    setErro('')
    setPergunta('')
    setMensagens((atuais) => [
      ...atuais,
      { id: crypto.randomUUID(), autor: 'usuario', texto: conteudo },
    ])
    setEnviando(true)

    try {
      const res = await api.post('/agente/perguntar', { pergunta: conteudo })
      setMensagens((atuais) => [
        ...atuais,
        {
          id: crypto.randomUUID(),
          autor: 'sabrina',
          texto: res.data?.resposta || 'Não encontrei uma resposta para essa pergunta.',
          documentos: res.data?.documentos_consultados || [],
        },
      ])
      await carregarHistorico()
    } catch (err) {
      const textoErro = err.response?.data?.erro || 'Não foi possivel consultar a Sabrina agora.'
      setErro(textoErro)
      setMensagens((atuais) => [
        ...atuais,
        { id: crypto.randomUUID(), autor: 'sabrina', texto: textoErro },
      ])
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="px-10 py-8 max-w-7xl">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-[#7010C0] mb-4">
          <Sparkles size={13} />
          IA personalizada - {cargo}
        </span>
        <h1 className="font-serif text-4xl font-bold text-[#07182c] leading-tight">
          Pergunte a <em className="text-[#7010C0]">Sabrina</em>
        </h1>
        <p className="mt-2 max-w-2xl text-sm sm:text-base text-gray-600 leading-relaxed">
          Ela responde usando os documentos do seu setor e registra as consultas para manter rastreabilidade do conhecimento consumido.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
        <section className="rounded-xl border border-[#ded6ca] bg-white shadow-sm min-h-[620px] flex flex-col overflow-hidden">
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto">
            <div className="space-y-5">
              {mensagens.map((mensagem) => (
                <Mensagem key={mensagem.id} mensagem={mensagem} />
              ))}

              {enviando && (
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <div className="h-8 w-8 rounded-lg bg-[#7010C0] text-white flex items-center justify-center">
                    <Loader2 size={15} className="animate-spin" />
                  </div>
                  Sabrina esta consultando a base do seu setor...
                </div>
              )}
              <div ref={fimRef} />
            </div>
          </div>

          <div className="border-t border-[#ded6ca] bg-[#fbfaf7] p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {sugestoesBase.map((sugestao) => (
                <button
                  key={sugestao}
                  type="button"
                  onClick={() => enviarPergunta(sugestao)}
                  disabled={enviando}
                  className="rounded-full border border-[#ded6ca] bg-white px-3 py-1.5 text-xs text-gray-600 hover:border-[#7010C0] hover:text-[#7010C0] disabled:opacity-60 transition-colors"
                >
                  {sugestao}
                </button>
              ))}
            </div>

            {erro && (
              <p className="mb-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                {erro}
              </p>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault()
                enviarPergunta()
              }}
              className="flex items-center gap-2"
            >
              <input
                value={pergunta}
                onChange={(event) => setPergunta(event.target.value)}
                placeholder="Pergunte sobre um processo, script ou politica..."
                className="min-w-0 flex-1 rounded-xl border border-[#ded6ca] bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#7010C0] focus:ring-2 focus:ring-[#7010C0]/10"
              />
              <button
                type="submit"
                disabled={enviando || !pergunta.trim()}
                title="Enviar pergunta"
                className="h-11 w-11 rounded-xl bg-[#7010C0] text-white inline-flex items-center justify-center hover:bg-[#C060F8] disabled:opacity-50 disabled:hover:bg-[#7010C0] transition-colors"
              >
                <ArrowUp size={18} />
              </button>
            </form>
          </div>
        </section>

        <aside className="rounded-xl border border-[#ded6ca] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-purple-50 text-[#7010C0] flex items-center justify-center">
                <History size={15} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Historico</h2>
                <p className="text-xs text-gray-400">Ultimas consultas</p>
              </div>
            </div>
            <Bot size={16} className="text-gray-300" />
          </div>

          {historico.length === 0 ? (
            <p className="text-sm text-gray-500 leading-relaxed">
              As perguntas feitas para a Sabrina aparecem aqui depois da primeira consulta.
            </p>
          ) : (
            <div className="space-y-3">
              {historico.map((item) => (
                <article key={item.id_consulta} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1.5">
                    <Clock size={11} />
                    {formatarData(item.created_at)}
                  </div>
                  <p className="text-xs font-semibold text-gray-900 line-clamp-2">{item.pesquisa}</p>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-3">{item.resposta}</p>
                  {item.id_doc && (
                    <Link
                      to={`/documento/${item.id_doc}`}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#7010C0] hover:underline"
                    >
                      <FileText size={12} />
                      Documento referenciado
                    </Link>
                  )}
                </article>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
