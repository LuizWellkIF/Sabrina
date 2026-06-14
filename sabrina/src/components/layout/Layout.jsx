import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Moon, Sun } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import api from '../../services/api'

export default function Layout() {
  const { usuario, logout } = useAuth()
  const { modoEscuro, alternarTema } = useTheme()
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState([])
  const [cargos, setCargos] = useState([])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    api.get('/categorias/').then(res => setCategorias(res.data)).catch(() => {})
    api.get('/cargos/').then(res => setCargos(res.data)).catch(() => {})
  }, [])

  return (
    <div className="flex min-h-screen bg-[#f5f4ef]">
      <Sidebar categorias={categorias} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-end px-6 gap-3 flex-shrink-0">
          <span className="text-sm text-gray-600 font-medium">
            {usuario?.cargo_nome}
          </span>
          <button
            type="button"
            onClick={alternarTema}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-[#7010C0] transition-colors hover:bg-[#7010C0] hover:text-white"
            title={modoEscuro ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {modoEscuro ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 overflow-auto">
          <Outlet context={{ categorias, setCategorias, cargos, setCargos }} />
        </main>
      </div>
    </div>
  )
}
