import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

function temaInicial() {
  const temaSalvo = localStorage.getItem('sabrina-tema')
  if (temaSalvo === 'dark' || temaSalvo === 'light') return temaSalvo
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(temaInicial)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark')
    localStorage.setItem('sabrina-tema', tema)
  }, [tema])

  const valor = useMemo(() => ({
    tema,
    modoEscuro: tema === 'dark',
    alternarTema: () => setTema((atual) => (atual === 'dark' ? 'light' : 'dark')),
  }), [tema])

  return (
    <ThemeContext.Provider value={valor}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const contexto = useContext(ThemeContext)
  if (!contexto) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  }
  return contexto
}
