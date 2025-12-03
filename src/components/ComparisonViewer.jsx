import React, { useState } from 'react'
import './ComparisonViewer.css'

const ComparisonViewer = ({ images, onClose }) => {
  const [syncScroll, setSyncScroll] = useState(true)
  const [windowLevel, setWindowLevel] = useState({ window: 400, level: 50 })

  const handleWindowLevelChange = (side, type, value) => {
    setWindowLevel(prev => ({
      ...prev,
      [type]: value
    }))
  }

  return (
    <div className="comparison-viewer">
      <div className="comparison-header">
        <h3>Side-by-Side Comparison</h3>
        <div className="comparison-controls-top">
          <label className="sync-toggle">
            <input
              type="checkbox"
              checked={syncScroll}
              onChange={(e) => setSyncScroll(e.target.checked)}
            />
            <span>Synchronized Scrolling</span>
          </label>
          {onClose && (
            <button className="close-button" onClick={onClose}>×</button>
          )}
        </div>
      </div>

      <div className="comparison-content">
        <div className="comparison-panel">
          <div className="panel-header">
            <h4>Image A</h4>
            <div className="window-level-controls">
              <label>
                Window:
                <input
                  type="range"
                  min="0"
                  max="2000"
                  value={windowLevel.window}
                  onChange={(e) => handleWindowLevelChange('left', 'window', parseInt(e.target.value))}
                />
                <span>{windowLevel.window}</span>
              </label>
              <label>
                Level:
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={windowLevel.level}
                  onChange={(e) => handleWindowLevelChange('left', 'level', parseInt(e.target.value))}
                />
                <span>{windowLevel.level}</span>
              </label>
            </div>
          </div>
          <div className="panel-image">
            {images[0] ? (
              <img src={images[0]} alt="Comparison A" />
            ) : (
              <div className="no-image">No image loaded</div>
            )}
          </div>
        </div>

        <div className="comparison-divider"></div>

        <div className="comparison-panel">
          <div className="panel-header">
            <h4>Image B</h4>
            <div className="window-level-controls">
              <label>
                Window:
                <input
                  type="range"
                  min="0"
                  max="2000"
                  value={windowLevel.window}
                  onChange={(e) => handleWindowLevelChange('right', 'window', parseInt(e.target.value))}
                />
                <span>{windowLevel.window}</span>
              </label>
              <label>
                Level:
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={windowLevel.level}
                  onChange={(e) => handleWindowLevelChange('right', 'level', parseInt(e.target.value))}
                />
                <span>{windowLevel.level}</span>
              </label>
            </div>
          </div>
          <div className="panel-image">
            {images[1] ? (
              <img src={images[1]} alt="Comparison B" />
            ) : (
              <div className="no-image">No image loaded</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComparisonViewer

