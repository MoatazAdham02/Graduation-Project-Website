import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './HeartIntro.css'

const HeartIntro = () => {
  const navigate = useNavigate()
  const [isAnimating, setIsAnimating] = useState(false)
  const [showContent, setShowContent] = useState(true)
  const heartRef = useRef(null)
  const containerRef = useRef(null)

  // Optional: Skip intro if already seen in this session
  // Comment out the useEffect below if you want to show intro every time
  // useEffect(() => {
  //   const hasSeenIntro = sessionStorage.getItem('hasSeenHeartIntro')
  //   if (hasSeenIntro === 'true') {
  //     navigate('/auth-landing', { replace: true })
  //   }
  // }, [navigate])

  const handleHeartClick = () => {
    if (isAnimating) return // Prevent multiple clicks
    
    setIsAnimating(true)
    
    // Mark as seen (optional - for session-based skipping)
    sessionStorage.setItem('hasSeenHeartIntro', 'true')
    
    // Start animation sequence
    setTimeout(() => {
      setShowContent(false)
      
      // Navigate after animation completes
      setTimeout(() => {
        navigate('/auth-landing', { replace: true })
      }, 1000) // Slightly longer for smooth transition
    }, 100)
  }


  return (
    <div 
      ref={containerRef}
      className={`heart-intro-container ${isAnimating ? 'animating' : ''} ${!showContent ? 'fade-out' : ''}`}
    >
      <div className="heart-intro-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="heart-intro-content">
        <div className="heart-intro-text">
          <h1 className="intro-title">Plaqio</h1>
          <p className="intro-tagline">Detect. Analyze. Monitor</p>
          <div className="intro-hint">
            <span className="hint-icon">👆</span>
            <span>Click to begin</span>
          </div>
        </div>

        <div 
          ref={heartRef}
          className={`heart-intro-button ${isAnimating ? 'heart-animate' : ''}`}
          onClick={handleHeartClick}
          role="button"
          tabIndex={0}
          aria-label="Click to enter Plaqio"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleHeartClick()
            }
          }}
        >
          <button className="enter-button">Enter</button>
        </div>

        {/* Animated particles effect */}
        {isAnimating && (
          <div className="particles-container">
            {[...Array(20)].map((_, i) => {
              const angle = (i * 18) * (Math.PI / 180) // Convert to radians
              const distance = 300
              const x = Math.cos(angle) * distance
              const y = Math.sin(angle) * distance
              
              return (
                <div
                  key={i}
                  className="particle"
                  style={{
                    '--delay': `${i * 0.05}s`,
                    '--x': `${x}px`,
                    '--y': `${y}px`,
                  }}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default HeartIntro

