import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is logged in on mount (runs on page refresh)
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken')
      if (token) {
        try {
          const data = await authAPI.getCurrentUser()
          if (data && data.user) {
            setUser(data.user)
            setIsAuthenticated(true)
          } else {
            // Invalid response, clear token
            localStorage.removeItem('authToken')
            localStorage.removeItem('rememberedUser')
            setIsAuthenticated(false)
          }
        } catch (error) {
          // Token is invalid or expired, but don't clear it if it's a network error
          // Only clear if it's an authentication error
          if (error.message && !error.message.includes('Network error')) {
            localStorage.removeItem('authToken')
            localStorage.removeItem('rememberedUser')
          }
          setIsAuthenticated(false)
          setUser(null)
        }
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const register = async (userData) => {
    try {
      const data = await authAPI.register(userData)
      localStorage.setItem('authToken', data.token)
      setUser(data.user)
      setIsAuthenticated(true)
      
      // Store remembered user if needed
      if (userData.email) {
        localStorage.setItem('rememberedUser', JSON.stringify({ email: userData.email }))
      }
      
      return data
    } catch (error) {
      throw error
    }
  }

  const login = async (email, password, rememberMe = false) => {
    try {
      const data = await authAPI.login(email, password)
      localStorage.setItem('authToken', data.token)
      setUser(data.user)
      setIsAuthenticated(true)
      
      // Store remembered user
      if (rememberMe && email) {
        localStorage.setItem('rememberedUser', JSON.stringify({ email }))
      } else {
        localStorage.removeItem('rememberedUser')
      }
      
      return data
    } catch (error) {
      throw error
    }
  }

  const getRememberedUser = () => {
    if (typeof window !== 'undefined') {
      try {
        const remembered = localStorage.getItem('rememberedUser')
        return remembered ? JSON.parse(remembered) : null
      } catch (e) {
        return null
      }
    }
    return null
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('rememberedUser')
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user,
      login, 
      logout, 
      register,
      getRememberedUser,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

