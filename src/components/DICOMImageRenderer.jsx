import React, { useEffect, useRef, useState } from 'react'
import './DICOMImageRenderer.css'

// Cornerstone setup - will work with fallback if not available
let cornerstone, cornerstoneWebImageLoader
try {
  cornerstone = require('cornerstone-core')
  cornerstoneWebImageLoader = require('cornerstone-web-image-loader')
  if (cornerstone && cornerstoneWebImageLoader) {
    cornerstoneWebImageLoader.external.cornerstone = cornerstone
  }
} catch (e) {
  console.warn('Cornerstone not available, using fallback rendering')
}

const DICOMImageRenderer = ({ imageId, onImageLoad }) => {
  const canvasRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!imageId || !canvasRef.current) return

    setIsLoading(true)
    setError(null)

    // Fallback if cornerstone is not available
    if (!cornerstone) {
      setIsLoading(false)
      return
    }

    const element = canvasRef.current
    const enabledElement = cornerstone.enable(element)

    cornerstone.loadImage(imageId)
      .then((image) => {
        cornerstone.displayImage(enabledElement, image)
        setIsLoading(false)
        if (onImageLoad) onImageLoad(image)
      })
      .catch((err) => {
        console.error('Error loading DICOM image:', err)
        setError('Failed to load DICOM image')
        setIsLoading(false)
      })

    return () => {
      if (cornerstone) {
        cornerstone.disable(element)
      }
    }
  }, [imageId, onImageLoad])

  return (
    <div className="dicom-image-renderer">
      {isLoading && (
        <div className="renderer-loading">
          <div className="spinner"></div>
          <p>Loading DICOM image...</p>
        </div>
      )}
      {error && (
        <div className="renderer-error">
          <p>{error}</p>
        </div>
      )}
      <canvas ref={canvasRef} className="dicom-canvas" />
    </div>
  )
}

export default DICOMImageRenderer

