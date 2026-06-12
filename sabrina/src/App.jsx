import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import RotaProtegida from './components/layout/RotaProtegida'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Documento from './pages/Documento'
import Gestao from './pages/Gestao'
import SabrinaIA from './pages/SabrinaIA'

export default function App() {
  return (
    <ThemeProvider>
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
              <Route path="sabrina" element={<SabrinaIA />} />
              <Route path="gestao" element={<Gestao />} />
              <Route path="documento/:id" element={<Documento />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
