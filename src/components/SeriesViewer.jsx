import React, { useState, useEffect } from 'react'
import './SeriesViewer.css'

const SeriesViewer = ({ series, currentIndex, onIndexChange, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(currentIndex || 0)

  useEffect(() => {
    if (currentIndex !== undefined) {
      setSelectedIndex(currentIndex)
    }
  }, [currentIndex])

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1
      setSelectedIndex(newIndex)
      if (onIndexChange) onIndexChange(newIndex)
    }
  }

  const handleNext = () => {
    if (selectedIndex < series.length - 1) {
      const newIndex = selectedIndex + 1
      setSelectedIndex(newIndex)
      if (onIndexChange) onIndexChange(newIndex)
    }
  }

  const handleThumbnailClick = (index) => {
    setSelectedIndex(index)
    if (onIndexChange) onIndexChange(index)
  }

  return (
    <div className="series-viewer">
      <div className="series-header">
        <h3>Series Viewer ({selectedIndex + 1} / {series.length})</h3>
        {onClose && (
          <button className="close-button" onClick={onClose}>×</button>
        )}
      </div>
      
      <div className="series-controls">
        <button 
          className="nav-button" 
          onClick={handlePrevious}
          disabled={selectedIndex === 0}
        >
          ← Previous
        </button>
        <input
          type="range"
          min="0"
          max={series.length - 1}
          value={selectedIndex}
          onChange={(e) => {
            const newIndex = parseInt(e.target.value)
            setSelectedIndex(newIndex)
            if (onIndexChange) onIndexChange(newIndex)
          }}
          className="series-slider"
        />
        <button 
          className="nav-button" 
          onClick={handleNext}
          disabled={selectedIndex === series.length - 1}
        >
          Next →
        </button>
      </div>

      <div className="thumbnails-container">
        <div className="thumbnails-scroll">
          {series.map((item, index) => (
            <div
              key={index}
              className={`thumbnail ${index === selectedIndex ? 'active' : ''}`}
              onClick={() => handleThumbnailClick(index)}
            >
              <div className="thumbnail-number">{index + 1}</div>
              {item.thumbnail && (
                <img src={item.thumbnail} alt={`Slice ${index + 1}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SeriesViewer

