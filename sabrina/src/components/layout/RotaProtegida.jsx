import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function RotaProtegida({ children }) {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f4ef]">
        <div className="w-6 h-6 border-2 border-[#7010C0] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return usuario ? children : <Navigate to="/login" replace />
}
