import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('isAuthenticated') === 'true'
      } catch (e) {
        return false
      }
    }
    return false
  })

  const register = (userData) => {
    if (typeof window !== 'undefined') {
      try {
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]')
        const newUser = {
          id: Date.now().toString(),
          ...userData,
          createdAt: new Date().toISOString()
        }
        users.push(newUser)
        localStorage.setItem('registeredUsers', JSON.stringify(users))
        return newUser
      } catch (e) {
        console.warn('Failed to save user to localStorage:', e)
        throw e
      }
    }
  }

  const login = (email, rememberMe = false) => {
    setIsAuthenticated(true)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('isAuthenticated', 'true')
        
        if (rememberMe && email) {
          localStorage.setItem('rememberedUser', JSON.stringify({ email }))
        } else {
          localStorage.removeItem('rememberedUser')
        }
      } catch (e) {
        console.warn('Failed to save auth state to localStorage:', e)
      }
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
    setIsAuthenticated(false)
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('isAuthenticated')
        localStorage.removeItem('rememberedUser')
      } catch (e) {
        console.warn('Failed to remove auth state from localStorage:', e)
      }
    }
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      register,
      getRememberedUser 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

