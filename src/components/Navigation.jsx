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
          <span className="logo-name">Plaqio</span>
          <span className="logo-tagline">Detect. Analyze. Monitor</span>
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

