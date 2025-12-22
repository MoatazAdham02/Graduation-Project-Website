import React, { useEffect, useState, memo } from 'react'
import { useLocation } from 'react-router-dom'
import './PageTransition.css'

const PageTransition = memo(({ children }) => {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('entering')

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('exiting')
    }
  }, [location, displayLocation])

  useEffect(() => {
    if (transitionStage === 'exiting') {
      // Scroll to top on page change for smooth experience
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      const timer = setTimeout(() => {
        setDisplayLocation(location)
        setTransitionStage('entering')
      }, 300) // Match the exit animation duration
      return () => clearTimeout(timer)
    }
  }, [transitionStage, location])

  return (
    <div className={`page-transition page-transition-${transitionStage}`}>
      {children}
    </div>
  )
})

PageTransition.displayName = 'PageTransition'

export default PageTransition

