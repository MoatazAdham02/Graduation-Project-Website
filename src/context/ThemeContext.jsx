import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('darkMode')
        return saved ? JSON.parse(saved) : false
      } catch (e) {
        return false
      }
    }
    return false
  })

  const [layout, setLayout] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('layout')
        return saved || 'default'
      } catch (e) {
        return 'default'
      }
    }
    return 'default'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
    }
  }, [isDarkMode])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('layout', layout)
      } catch (e) {
        console.warn('Failed to save layout to localStorage:', e)
      }
    }
  }, [layout])

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev)
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, layout, setLayout }}>
      {children}
    </ThemeContext.Provider>
  )
}

