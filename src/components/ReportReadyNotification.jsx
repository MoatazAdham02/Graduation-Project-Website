import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiFileText, FiCheckCircle, FiX, FiArrowRight } from 'react-icons/fi'
import './ReportReadyNotification.css'

const ReportReadyNotification = ({ closeToast, patientName, reportId }) => {
  const navigate = useNavigate()

  const handleViewReport = () => {
    closeToast()
    // Navigate to reports page
    navigate('/reports')
    // If reportId is provided, scroll to it after navigation
    if (reportId) {
      // Small delay to ensure page has loaded
      setTimeout(() => {
        const element = document.getElementById(reportId) || document.querySelector(`[data-report-id="${reportId}"]`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }

  return (
    <div className="report-ready-notification">
      <div className="notification-glow"></div>
      <div className="notification-content">
        <div className="notification-icon-wrapper">
          <div className="icon-pulse"></div>
          <FiFileText className="notification-icon" />
          <FiCheckCircle className="check-icon" />
        </div>
        
        <div className="notification-text">
          <h3 className="notification-title">Report Ready</h3>
          <p className="notification-message">
            Medical report for <span className="patient-name">{patientName || 'Patient'}</span> is ready for review
          </p>
        </div>
        
        <div className="notification-actions">
          <button 
            className="view-report-btn"
            onClick={handleViewReport}
          >
            View Report
            <FiArrowRight className="arrow-icon" />
          </button>
        </div>
        
        <button className="close-btn" onClick={closeToast}>
          <FiX />
        </button>
      </div>
      
      <div className="notification-progress-bar">
        <div className="progress-fill"></div>
      </div>
    </div>
  )
}

export default ReportReadyNotification

