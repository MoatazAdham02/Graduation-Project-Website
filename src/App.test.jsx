// Temporary test file to verify React is working
import React from 'react'

function TestApp() {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <h1>React is Working!</h1>
      <p>If you see this, React is rendering correctly.</p>
    </div>
  )
}

export default TestApp

