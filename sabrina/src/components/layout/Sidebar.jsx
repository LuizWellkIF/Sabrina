import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, Settings, TrendingUp, Zap, Phone,
  Shield, HeartHandshake, Cog, LogOut, BookOpen, Sparkles
} from 'lucide-react'

const iconeCategoria = {
  'Fluxo de vendas': TrendingUp,
  'Gatilhos de conversão': Zap,
  'Scripts de abordagem': Phone,
  'Políticas internas': Shield,
  'Sucesso do cliente': HeartHandshake,
  'Processos operacionais': Cog,
}

const IconeDefault = BookOpen

export default function Sidebar({ categorias = [] }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const iniciais = usuario?.nome
    ? usuario.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-gray-100">
        <div className="w-7 h-7 rounded-lg bg-[#0f4c5c] flex items-center justify-center mr-2">
          <BookOpen size={14} className="text-white" />
        </div>
        <a href="/dashboard">
          <span className="text-sm font-bold text-gray-900">Sabrina</span>
        </a>
      </div>

      {/* Nav principal */}
      <nav className="px-3 pt-4 pb-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
              ? 'bg-[#0f4c5c] text-white'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <LayoutDashboard size={16} />
          Meu painel
        </NavLink>
        <NavLink
          to="/sabrina"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
              ? 'bg-[#0f4c5c] text-white'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <Sparkles size={16} />
          Sabrina
        </NavLink>
        <NavLink
          to="/gestao"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mt-0.5 ${isActive
              ? 'bg-[#0f4c5c] text-white'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <Settings size={16} />
          Gestão
        </NavLink>
      </nav>

      {/* Categorias */}
      {categorias.length > 0 && (
        <div className="px-3 pt-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">
            Categorias
          </p>
          <div className="space-y-0.5">
            {categorias.map((cat) => {
              const Icone = iconeCategoria[cat.nome] || IconeDefault
              return (
                <NavLink
                  key={cat.id_categoria}
                  to={`/categoria/${cat.id_categoria}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                      ? 'text-[#0f4c5c] font-medium bg-teal-50'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icone size={15} />
                  {cat.nome}
                </NavLink>
              )
            })}
          </div>
        </div>
      )}

      {/* Usuário */}
      <div className="mt-auto border-t border-gray-100 p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-[#0f4c5c] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {iniciais}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{usuario?.nome}</p>
            <p className="text-xs text-gray-500 truncate">{usuario?.cargo_nome}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            title="Sair"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
