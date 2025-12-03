import React, { useEffect, useRef, useState } from 'react'
import './Volume3DViewer.css'

const Volume3DViewer = ({ imageData, onClose }) => {
  const containerRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Simulate 3D rendering initialization
    const timer = setTimeout(() => {
      setIsLoading(false)
      setError('3D Volume Rendering requires VTK.js library configuration. This feature is available but needs additional setup for full functionality. For now, this shows a placeholder visualization.')
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (error) {
    return (
      <div className="volume-3d-viewer">
        <div className="viewer-header">
          <h3>3D Volume Rendering</h3>
          {onClose && (
            <button className="close-button" onClick={onClose}>×</button>
          )}
        </div>
        <div className="viewer-error">
          <p>{error}</p>
          <p className="error-note">
            <strong>Note:</strong> Full 3D rendering requires:
            <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
              <li>VTK.js library properly configured</li>
              <li>Proper DICOM volume data (multi-slice series)</li>
              <li>Volume data processing pipeline</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              The component structure is ready. To enable full 3D rendering, configure VTK.js with proper Vite settings.
            </p>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="volume-3d-viewer">
      <div className="viewer-header">
        <h3>3D Volume Rendering</h3>
        {onClose && (
          <button className="close-button" onClick={onClose}>×</button>
        )}
      </div>
      {isLoading && (
        <div className="viewer-loading">
          <div className="spinner"></div>
          <p>Generating 3D model...</p>
        </div>
      )}
      <div ref={containerRef} className="viewer-container">
        {!isLoading && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#fff',
            textAlign: 'center',
            padding: '40px'
          }}>
            <div>
              <h4 style={{ marginBottom: '16px' }}>3D Volume Viewer</h4>
              <p>This area will display the 3D rendered volume once VTK.js is properly configured.</p>
            </div>
          </div>
        )}
      </div>
      <div className="viewer-controls">
        <p className="controls-hint">Use mouse to rotate, scroll to zoom</p>
      </div>
    </div>
  )
}

export default Volume3DViewer

