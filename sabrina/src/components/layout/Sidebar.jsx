import { NavLink } from 'react-router-dom'
import {
  Book,
  BookOpen,
  Cog,
  HeartHandshake,
  LayoutDashboard,
  Phone,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'

const iconeCategoria = {
  'Fluxo de vendas': TrendingUp,
  'Gatilhos de conversao': Zap,
  'Scripts de abordagem': Phone,
  'Politicas internas': Shield,
  'Sucesso do cliente': HeartHandshake,
  'Processos operacionais': Cog,
}

const IconeDefault = BookOpen

export default function Sidebar({ categorias = [] }) {
  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <a href="/dashboard" className="block">
        <div className="h-14 flex items-center px-4 border-b border-gray-100">
          <div className="w-7 h-7 rounded-lg bg-[#7010C0] flex items-center justify-center mr-2">
            <Book size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900">Sabrina</span>
        </div>
      </a>

      <nav className="px-3 pt-4 pb-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
              ? 'bg-[#7010C0] text-white'
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
              ? 'bg-[#7010C0] text-white'
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
              ? 'bg-[#7010C0] text-white'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <Settings size={16} />
          Gestão
        </NavLink>
      </nav>

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
                      ? 'text-[#7010C0] font-medium bg-purple-50'
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

      <div className="mt-auto" />
    </aside>
  )
}
