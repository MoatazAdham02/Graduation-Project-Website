import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// First, let's test if React is working at all
console.log('Main.jsx is loading...')

try {
  
  const ErrorBoundary = ({ children }) => {
    const [hasError, setHasError] = React.useState(false)
    const [error, setError] = React.useState(null)

    React.useEffect(() => {
      const errorHandler = (event) => {
        setHasError(true)
        setError(event.error)
        console.error('Error caught:', event.error)
      }

      window.addEventListener('error', errorHandler)
      window.addEventListener('unhandledrejection', (event) => {
        setHasError(true)
        setError(event.reason)
        console.error('Unhandled promise rejection:', event.reason)
      })

      return () => {
        window.removeEventListener('error', errorHandler)
        window.removeEventListener('unhandledrejection', errorHandler)
      }
    }, [])

    if (hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            {error?.toString() || 'An unexpected error occurred'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reload Page
          </button>
          <details style={{ marginTop: '20px', textAlign: 'left', maxWidth: '600px' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Error Details</summary>
            <pre style={{ 
              background: '#fff', 
              padding: '16px', 
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {error?.stack || JSON.stringify(error, null, 2)}
            </pre>
          </details>
        </div>
      )
    }

    return children
  }

  const root = ReactDOM.createRoot(document.getElementById('root'))
  
  console.log('Rendering app...')
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  )
  
  console.log('App rendered!')
} catch (error) {
  console.error('Fatal error in main.jsx:', error)
  const root = ReactDOM.createRoot(document.getElementById('root'))
  root.render(
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#dc3545' }}>Fatal Error</h1>
      <p style={{ color: '#666' }}>{error.toString()}</p>
      <pre style={{ background: '#fff', padding: '16px', borderRadius: '8px', textAlign: 'left' }}>
        {error.stack}
      </pre>
    </div>
  )
}

