import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNotifications } from '../context/NotificationContext'
import ReportReadyNotification from './ReportReadyNotification'
import './CustomNotificationContainer.css'

const CustomNotificationContainer = () => {
  const { reportReadyNotifications, removeReportReadyNotification } = useNotifications()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted || reportReadyNotifications.length === 0) return null

  return createPortal(
    <div className="custom-notification-container">
      {reportReadyNotifications.map((notification) => (
        <div key={notification.id} className="notification-wrapper">
          <ReportReadyNotification
            closeToast={() => removeReportReadyNotification(notification.id)}
            patientName={notification.patientName}
            reportId={notification.reportId}
          />
        </div>
      ))}
    </div>,
    document.body
  )
}

export default CustomNotificationContainer

