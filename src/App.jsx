import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import HeartIntro from './components/HeartIntro'
import AuthLanding from './components/AuthLanding'
import Login from './components/Login'
import Register from './components/Register'
import DICOMViewer from './components/DICOMViewer'
import PatientManagement from './pages/PatientManagement'
import Reports from './pages/Reports'
import Analytics from './pages/Analytics'
import HomePage from './pages/HomePage'
import PageTransition from './components/PageTransition'
import CustomNotificationContainer from './components/CustomNotificationContainer'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationProvider } from './context/NotificationContext'
import { DataProvider } from './context/DataContext'
import './App.css'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  // Wait for auth check to complete before redirecting
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'var(--text-primary)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(13, 115, 119, 0.2)',
            borderTopColor: '#0D7377',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Loading...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

const AppRoutes = () => {
  const location = useLocation()
  
  return (
    <PageTransition>
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/intro" element={<HeartIntro />} />
        <Route path="/auth-landing" element={<AuthLanding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/viewer"
          element={
            <ProtectedRoute>
              <DICOMViewer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <PatientManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
      </Routes>
    </PageTransition>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <NotificationProvider>
            <Router>
              <AppRoutes />
              <ToastContainer 
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                transition={undefined}
              />
              <CustomNotificationContainer />
            </Router>
          </NotificationProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

