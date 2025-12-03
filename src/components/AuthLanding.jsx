import React from 'react'
import { useNavigate } from 'react-router-dom'
import HeartScene from './3D/HeartScene'
import './AuthLanding.css'

const AuthLanding = () => {
  const navigate = useNavigate()

  return (
    <div className="auth-landing">
      <div className="landing-content">
        <div className="landing-header">
          <div className="heart-icon heart-3d-wrapper">
            <HeartScene 
              className="heart-3d-auth"
              autoRotate={true}
              enableZoom={false}
              scale={1.5}
              position={[0, 0, 0]}
            />
          </div>
          <h1>Medical DICOM Viewer</h1>
          <p>Heart Analysis System</p>
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

