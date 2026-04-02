import { useState, useEffect, createContext, useContext } from 'react'

export type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
})

export function useThemeProvider(): ThemeContextValue {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    return saved ?? 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}

export function useTheme() {
  return useContext(ThemeContext)
}
