import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Bell } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'

export default function Layout() {
  const { usuario } = useAuth()
  const [categorias, setCategorias] = useState([])

  useEffect(() => {
    api.get('/categorias/').then(res => setCategorias(res.data)).catch(() => {})
  }, [])

  return (
    <div className="flex min-h-screen bg-[#f5f4ef]">
      <Sidebar categorias={categorias} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-end px-6 gap-4 flex-shrink-0">
          <button className="text-gray-400 hover:text-gray-700 transition-colors">
            <Bell size={18} />
          </button>
          <span className="text-sm text-gray-600 font-medium">
            {usuario?.cargo}
          </span>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 overflow-auto">
          <Outlet context={{ categorias, setCategorias }} />
        </main>
      </div>
    </div>
  )
}
