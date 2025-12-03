import React from 'react'
import './ProgressIndicator.css'

const ProgressIndicator = ({ progress, fileName, onCancel }) => {
  return (
    <div className="progress-indicator">
      <div className="progress-header">
        <h3>Uploading DICOM File</h3>
        {onCancel && (
          <button className="cancel-button" onClick={onCancel}>Cancel</button>
        )}
      </div>
      <div className="progress-file-name">{fileName}</div>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="progress-percentage">{Math.round(progress)}%</div>
    </div>
  )
}

export default ProgressIndicator

