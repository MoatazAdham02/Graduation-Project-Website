import React, { memo, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiHome, FiUsers, FiFileText, FiBarChart2, FiLogOut, FiMaximize2 } from 'react-icons/fi'
import './Navigation.css'

const Navigation = memo(() => {
  const location = useLocation()
  const { logout } = useAuth()
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

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
  ]

  return (
    <nav className="main-navigation">
      <div className="nav-brand">
        <div className="logo">
          <div className="logo-text">
            <span className="logo-name">CORO<span className="logo-net">net</span></span>
            <span className="logo-tagline">Detect. Analyze. Monitor</span>
          </div>
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
})

Navigation.displayName = 'Navigation'

export default Navigation

