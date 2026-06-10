import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await login(email, senha)
      navigate('/dashboard')
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao entrar. Verifique suas credenciais.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f4ef] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#7010C0] flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900 tracking-tight">Sabrina</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Bem-vindo de volta</h1>
          <p className="text-sm text-gray-500 mb-6">Entre com sua conta para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#7010C0] focus:ring-2 focus:ring-[#7010C0]/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#7010C0] focus:ring-2 focus:ring-[#7010C0]/10 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {erro && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-[#7010C0] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#0d3f4d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Base de conhecimento corporativo
        </p>
      </div>
    </div>
  )
}
