import React from 'react'
import { useNavigate } from 'react-router-dom'
import './AuthLanding.css'

const AuthLanding = () => {
  const navigate = useNavigate()

  return (
    <div className="auth-landing">
      <div className="landing-content">
        <div className="landing-header">
          <img src="/coronet-logo.svg" alt="COROnet Logo" className="landing-logo" />
          <h1>CORO<span className="brand-net">net</span></h1>
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

