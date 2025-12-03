import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { FiHome, FiUsers, FiFileText, FiBarChart2, FiMoon, FiSun, FiLogOut, FiMaximize2, FiInfo } from 'react-icons/fi'
import './Navigation.css'

const Navigation = () => {
  const location = useLocation()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const { logout } = useAuth()
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const navItems = [
    { path: '/viewer', icon: FiHome, label: 'DICOM Viewer' },
    { path: '/patients', icon: FiUsers, label: 'Patients' },
    { path: '/reports', icon: FiFileText, label: 'Reports' },
    { path: '/analytics', icon: FiBarChart2, label: 'Analytics' },
    { path: '/about', icon: FiInfo, label: 'About' },
  ]

  return (
    <nav className="main-navigation">
      <div className="nav-brand">
        <div className="logo">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>Medical DICOM</span>
        </div>
      </div>

      <div className="nav-links">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      <div className="nav-actions">
        <button 
          className="nav-action-btn" 
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {isDarkMode ? <FiSun /> : <FiMoon />}
        </button>
        <button 
          className="nav-action-btn" 
          onClick={handleFullscreen}
          title="Fullscreen"
        >
          <FiMaximize2 />
        </button>
        <button 
          className="nav-action-btn" 
          onClick={logout}
          title="Logout"
        >
          <FiLogOut />
        </button>
      </div>
    </nav>
  )
}

export default Navigation

