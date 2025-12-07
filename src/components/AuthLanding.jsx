import React from 'react'
import { useNavigate } from 'react-router-dom'
import './AuthLanding.css'

const AuthLanding = () => {
  const navigate = useNavigate()

  return (
    <div className="auth-landing">
      <div className="landing-content">
        <div className="landing-header">
          <h1>Plaqio</h1>
          <p className="tagline">Detect. Analyze. Monitor</p>
        </div>

        <div className="auth-buttons">
          <button 
            className="auth-btn login-btn"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button 
            className="auth-btn signup-btn"
            onClick={() => navigate('/register')}
          >
            Sign Up
          </button>
        </div>

        <div className="landing-footer">
          <p>Secure medical imaging platform</p>
        </div>
      </div>
    </div>
  )
}

export default AuthLanding

