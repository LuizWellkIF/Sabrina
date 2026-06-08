import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import RotaProtegida from './components/layout/RotaProtegida'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Documento from './pages/Documento'
import Gestao from './pages/Gestao'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/"
            element={
              <RotaProtegida>
                <Layout />
              </RotaProtegida>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="gestao" element={<Gestao />} />
            <Route path="documento/:id" element={<Documento />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
