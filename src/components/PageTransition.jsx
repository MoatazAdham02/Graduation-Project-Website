import React, { useEffect, useState, memo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import './PageTransition.css'

// Define route order for determining swipe direction
const routeOrder = [
  '/viewer',
  '/patients',
  '/reports',
  '/analytics'
]

const getRouteIndex = (pathname) => {
  const index = routeOrder.findIndex(route => pathname === route)
  return index !== -1 ? index : 999 // Default to high number for unknown routes
}

const PageTransition = memo(({ children }) => {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('entering')
  const [direction, setDirection] = useState('forward')
  const prevLocationRef = useRef(location)

  useEffect(() => {
    if (location !== displayLocation) {
      // Determine swipe direction
      const currentIndex = getRouteIndex(location.pathname)
      const prevIndex = getRouteIndex(prevLocationRef.current.pathname)
      
      // If both routes are in the order list, use their indices
      // Otherwise default to forward (swipe left)
      let isForward = true
      if (currentIndex !== 999 && prevIndex !== 999) {
        isForward = currentIndex > prevIndex
      } else if (currentIndex === 999 && prevIndex !== 999) {
        // Going from known route to unknown (like login) - default forward
        isForward = true
      } else if (currentIndex !== 999 && prevIndex === 999) {
        // Coming from unknown route to known - default forward
        isForward = true
      }
      
      setDirection(isForward ? 'forward' : 'backward')
      setTransitionStage('exiting')
      prevLocationRef.current = location
    }
  }, [location, displayLocation])

  useEffect(() => {
    if (transitionStage === 'exiting') {
      // Scroll to top on page change for smooth experience
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      const timer = setTimeout(() => {
        setDisplayLocation(location)
        setTransitionStage('entering')
      }, 550) // Match the exit animation duration
      return () => clearTimeout(timer)
    }
  }, [transitionStage, location])

  return (
    <div className={`page-transition page-transition-${transitionStage} page-transition-${direction}`}>
      {children}
    </div>
  )
})

PageTransition.displayName = 'PageTransition'

export default PageTransition

