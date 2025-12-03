import React, { createContext, useContext, useState, useCallback } from 'react'
import { toast } from 'react-toastify'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((notification) => {
    const id = Date.now()
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date()
    }
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)) // Keep last 50
    
    // Show toast
    const toastType = notification.type || 'info'
    toast[toastType](notification.message, {
      position: 'top-right',
      autoClose: notification.duration || 3000,
    })

    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const notifyStudyComplete = useCallback((studyName) => {
    return addNotification({
      type: 'success',
      message: `Study "${studyName}" has been processed successfully`,
      title: 'Study Complete'
    })
  }, [addNotification])

  const notifyReportReady = useCallback((patientName) => {
    return addNotification({
      type: 'info',
      message: `Medical report for ${patientName} is ready`,
      title: 'Report Ready'
    })
  }, [addNotification])

  const notifySystemUpdate = useCallback((message) => {
    return addNotification({
      type: 'info',
      message,
      title: 'System Update',
      duration: 5000
    })
  }, [addNotification])

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll,
      notifyStudyComplete,
      notifyReportReady,
      notifySystemUpdate
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

