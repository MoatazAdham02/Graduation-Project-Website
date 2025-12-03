import React, { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Navigation from '../components/Navigation'
import { format } from 'date-fns'
import { PDFDocument, rgb } from 'pdf-lib'
import './Reports.css'
import { FiEdit, FiDownload, FiPrinter, FiFileText, FiClock, FiSave } from 'react-icons/fi'

const Reports = () => {
  const { reports, studies, updateReport } = useData()
  const { user } = useAuth()
  const [selectedReport, setSelectedReport] = useState(null)
  const [editingReport, setEditingReport] = useState(null)
  const [showHistory, setShowHistory] = useState(false)

  // Helper function to extract patient ID (handles both string and populated object)
  const getPatientId = (patientId) => {
    if (!patientId) return 'N/A'
    if (typeof patientId === 'object' && patientId !== null) {
      return patientId.patientId || patientId._id || 'N/A'
    }
    return patientId
  }

  // Helper function to extract patient name
  const getPatientName = (report) => {
    if (report.patientName) return report.patientName
    if (typeof report.patientId === 'object' && report.patientId?.name) {
      return report.patientId.name
    }
    return 'Unknown Patient'
  }

  const handleEdit = (report) => {
    // Normalize report data - handle populated patientId
    const normalizedReport = {
      ...report,
      patientName: report.patientName || (typeof report.patientId === 'object' && report.patientId?.name) || '',
      patientId: typeof report.patientId === 'object' && report.patientId !== null
        ? (report.patientId.patientId || report.patientId._id)
        : report.patientId
    }
    setEditingReport(normalizedReport)
    setSelectedReport(report)
  }

  const handleSave = () => {
    if (editingReport) {
      updateReport(editingReport.id, editingReport)
      setEditingReport(null)
    }
  }

  const handleExportPDF = async (report) => {
    try {
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([612, 792])
      const { width, height } = page.getSize()
      const font = await pdfDoc.embedFont('Helvetica')
      const boldFont = await pdfDoc.embedFont('Helvetica-Bold')

      let y = height - 50

      // Title
      page.drawText('Medical Report', {
        x: 50,
        y,
        size: 24,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
      y -= 40

      // Patient Info
      const patientName = getPatientName(report)
      const patientId = getPatientId(report.patientId)
      
      page.drawText(`Patient: ${patientName}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      })
      y -= 20

      page.drawText(`Patient ID: ${patientId}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      })
      y -= 20

      page.drawText(`Study Date: ${report.studyDate}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      })
      y -= 30

      // Findings
      page.drawText('Findings:', {
        x: 50,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
      y -= 20

      report.findings?.forEach(finding => {
        page.drawText(`${finding.title}: ${finding.value}`, {
          x: 70,
          y,
          size: 11,
          font,
          color: rgb(0, 0, 0),
        })
        y -= 18
      })

      y -= 20

      // Recommendations
      page.drawText('Recommendations:', {
        x: 50,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
      y -= 20

      report.recommendations?.forEach(rec => {
        page.drawText(`• ${rec}`, {
          x: 70,
          y,
          size: 11,
          font,
          color: rgb(0, 0, 0),
        })
        y -= 18
      })

      y -= 20

      // Physician
      page.drawText(`Physician: ${report.physicianName || report.physician || 'N/A'}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      })
      y -= 20

      page.drawText(`Report Date: ${report.reportDate}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Report_${patientName}_${report.reportDate || new Date().toISOString().split('T')[0]}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF')
    }
  }

  const handlePrint = (report) => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head><title>Medical Report</title></head>
        <body>
          <h1>Medical Report</h1>
          <h2>Patient: ${getPatientName(report)}</h2>
          <p>Patient ID: ${getPatientId(report.patientId)}</p>
          <p>Study Date: ${report.studyDate}</p>
          <h3>Findings:</h3>
          <ul>
            ${report.findings?.map(f => `<li>${f.title}: ${f.value}</li>`).join('')}
          </ul>
          <h3>Recommendations:</h3>
          <ul>
            ${report.recommendations?.map(r => `<li>${r}</li>`).join('')}
          </ul>
          <p>Physician: ${report.physicianName || report.physician || 'N/A'}</p>
          <p>Report Date: ${report.reportDate || 'N/A'}</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="page-container">
      <Navigation />
      <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>Medical Reports</h1>
          {user && (
            <p className="doctor-name">
              Dr. {user.firstName} {user.lastName}
            </p>
          )}
        </div>
        <div className="header-actions">
          <button onClick={() => setShowHistory(!showHistory)}>
            <FiClock /> View History
          </button>
        </div>
      </div>

      <div className="reports-list">
        {reports.length === 0 ? (
          <div className="empty-state">
            <FiFileText size={48} />
            <p>No reports available</p>
          </div>
        ) : (
          reports.map(report => (
            <div key={report._id || report.id || report.reportId} className="report-card">
              <div className="report-header">
                <div>
                  <h3>{getPatientName(report)}</h3>
                  <p className="report-meta">
                    {report.modality || 'N/A'} • {format(new Date(report.createdAt || report.reportDate || new Date()), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="report-actions">
                  <button onClick={() => handleEdit(report)} title="Edit">
                    <FiEdit />
                  </button>
                  <button onClick={() => handleExportPDF(report)} title="Export PDF">
                    <FiDownload />
                  </button>
                  <button onClick={() => handlePrint(report)} title="Print">
                    <FiPrinter />
                  </button>
                </div>
              </div>

              <div className="report-content">
                <div className="report-section">
                  <h4>Patient Information</h4>
                  <div className="info-grid">
                    <div><strong>Patient ID:</strong> {getPatientId(report.patientId)}</div>
                    <div><strong>Study Date:</strong> {
                      report.studyDate 
                        ? (typeof report.studyDate === 'string' 
                            ? report.studyDate 
                            : format(new Date(report.studyDate), 'MMM dd, yyyy'))
                        : 'N/A'
                    }</div>
                    <div><strong>Modality:</strong> {report.modality || 'N/A'}</div>
                  </div>
                </div>

                <div className="report-section">
                  <h4>Findings</h4>
                  <div className="findings-list">
                    {report.findings?.map((finding, idx) => (
                      <div key={idx} className={`finding-item ${finding.status}`}>
                        <span className="finding-title">{finding.title}</span>
                        <span className="finding-value">{finding.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="report-section">
                  <h4>Recommendations</h4>
                  <ul className="recommendations-list">
                    {report.recommendations?.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="report-footer">
                  <div>
                    <strong>Physician:</strong> {report.physicianName || report.physician || 'N/A'}
                  </div>
                  <div>
                    <strong>Version:</strong> {report.version || 1}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {editingReport && (
        <div className="modal-overlay" onClick={() => setEditingReport(null)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Report</h2>
            <div className="edit-form">
              <div className="form-group">
                <label>Patient Name</label>
                <input
                  type="text"
                  value={getPatientName(editingReport)}
                  onChange={(e) => setEditingReport({ ...editingReport, patientName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Findings</label>
                {editingReport.findings?.map((finding, idx) => (
                  <div key={idx} className="finding-edit">
                    <input
                      type="text"
                      value={finding.title}
                      onChange={(e) => {
                        const newFindings = [...editingReport.findings]
                        newFindings[idx].title = e.target.value
                        setEditingReport({ ...editingReport, findings: newFindings })
                      }}
                      placeholder="Finding title"
                    />
                    <input
                      type="text"
                      value={finding.value}
                      onChange={(e) => {
                        const newFindings = [...editingReport.findings]
                        newFindings[idx].value = e.target.value
                        setEditingReport({ ...editingReport, findings: newFindings })
                      }}
                      placeholder="Value"
                    />
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label>Recommendations</label>
                {editingReport.recommendations?.map((rec, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={rec}
                    onChange={(e) => {
                      const newRecs = [...editingReport.recommendations]
                      newRecs[idx] = e.target.value
                      setEditingReport({ ...editingReport, recommendations: newRecs })
                    }}
                  />
                ))}
              </div>
              <div className="modal-actions">
                <button onClick={() => setEditingReport(null)}>Cancel</button>
                <button onClick={handleSave} className="save-button">
                  <FiSave /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHistory && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Report History</h2>
            <div className="history-list">
              {selectedReport.history?.map((entry, idx) => (
                <div key={idx} className="history-item">
                  <div className="history-version">Version {entry.version}</div>
                  <div className="history-date">
                    {format(new Date(entry.updatedAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowHistory(false)}>Close</button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default Reports

