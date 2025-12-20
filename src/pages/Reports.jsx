import React, { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Navigation from '../components/Navigation'
import { format } from 'date-fns'
import { PDFDocument, rgb } from 'pdf-lib'
import './Reports.css'
import { FiEdit, FiDownload, FiPrinter, FiFileText, FiSearch, FiFilter, FiSave, FiTrash2 } from 'react-icons/fi'

const Reports = () => {
  const { reports, studies, updateReport, deleteReport } = useData()
  const { user } = useAuth()
  const [selectedReport, setSelectedReport] = useState(null)
  const [editingReport, setEditingReport] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterModality, setFilterModality] = useState('all')

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

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const patientName = getPatientName(report).toLowerCase()
      const patientId = getPatientId(report.patientId).toString().toLowerCase()
      const matchesSearch = 
        patientName.includes(searchTerm.toLowerCase()) ||
        patientId.includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterModality === 'all' || report.modality === filterModality
      
      return matchesSearch && matchesFilter
    })
  }, [reports, searchTerm, filterModality])

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
    // Don't set selectedReport - go directly to edit mode
  }

  const handleSave = async () => {
    if (!editingReport) return
    
    try {
      // Get the correct ID field (_id is used by MongoDB, but we also support id)
      const reportId = editingReport._id || editingReport.id
      
      if (!reportId) {
        throw new Error('Cannot save: Report ID is missing')
      }
      
      // Prepare the update data - only send fields that are editable
      const updateData = {
        patientName: editingReport.patientName,
        findings: editingReport.findings || [],
        recommendations: editingReport.recommendations || []
      }
      
      await updateReport(reportId, updateData)
      
      // Only close the modal on successful save
      setEditingReport(null)
    } catch (error) {
      console.error('Error saving report:', error)
      // Show error to user
      const errorMessage = error.message || error.toString() || 'Unknown error occurred'
      alert(`Failed to save report: ${errorMessage}`)
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
      const patientDOB = report.patientDateOfBirth || (typeof report.patientId === 'object' && report.patientId?.dateOfBirth) || 'N/A'
      const patientGender = report.patientGender || (typeof report.patientId === 'object' && report.patientId?.gender) || 'N/A'
      const patientAge = report.patientAge || (typeof report.patientId === 'object' && report.patientId?.age) || 'N/A'
      const studyDate = report.studyDate || (typeof report.studyId === 'object' && report.studyId?.studyDate) || 'N/A'
      const modality = report.modality || (typeof report.studyId === 'object' && report.studyId?.modality) || 'N/A'
      const studyDescription = report.studyDescription || (typeof report.studyId === 'object' && report.studyId?.description) || 'N/A'
      const bodyPart = report.bodyPartExamined || (typeof report.studyId === 'object' && report.studyId?.bodyPart) || 'N/A'
      const institution = report.institutionName || (typeof report.studyId === 'object' && report.studyId?.institutionName) || 'N/A'
      
      page.drawText('Patient Information', {
        x: 50,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
      y -= 25

      page.drawText(`Patient Name: ${patientName}`, {
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

      page.drawText(`Date of Birth: ${patientDOB}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      })
      y -= 20

      page.drawText(`Gender: ${patientGender}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      })
      y -= 20

      if (patientAge !== 'N/A') {
        page.drawText(`Age: ${patientAge}`, {
          x: 50,
          y,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        })
        y -= 20
      }

      y -= 10

      page.drawText('Study Information', {
        x: 50,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
      y -= 25

      page.drawText(`Study Date: ${studyDate}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      })
      y -= 20

      page.drawText(`Modality: ${modality}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      })
      y -= 20

      if (studyDescription !== 'N/A') {
        page.drawText(`Study Description: ${studyDescription}`, {
          x: 50,
          y,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        })
        y -= 20
      }

      if (bodyPart !== 'N/A') {
        page.drawText(`Body Part Examined: ${bodyPart}`, {
          x: 50,
          y,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        })
        y -= 20
      }

      if (institution !== 'N/A') {
        page.drawText(`Institution: ${institution}`, {
          x: 50,
          y,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        })
        y -= 20
      }

      y -= 10

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
      const physicianName = report.physicianName || report.physician || (user ? `Dr. ${user.firstName} ${user.lastName}, MD` : 'N/A')
      page.drawText(`Physician: ${physicianName}`, {
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

  const handleDelete = async (report) => {
    const patientName = getPatientName(report)
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the report for ${patientName}? This action cannot be undone.`
    )
    
    if (confirmDelete) {
      try {
        const reportId = report._id || report.id
        if (reportId) {
          await deleteReport(reportId)
          // Close any open modals if the deleted report was selected
          if (selectedReport && (selectedReport._id === reportId || selectedReport.id === reportId)) {
            setSelectedReport(null)
          }
          if (editingReport && (editingReport._id === reportId || editingReport.id === reportId)) {
            setEditingReport(null)
          }
        } else {
          alert('Unable to delete report: Report ID not found')
        }
      } catch (error) {
        console.error('Error deleting report:', error)
        alert('Failed to delete report. Please try again.')
      }
    }
  }

  const handlePrint = (report) => {
    const patientName = getPatientName(report)
    const patientId = getPatientId(report.patientId)
    const printWindow = window.open('', '_blank')
    const patientDOB = report.patientDateOfBirth || (typeof report.patientId === 'object' && report.patientId?.dateOfBirth) || 'N/A'
    const patientGender = report.patientGender || (typeof report.patientId === 'object' && report.patientId?.gender) || 'N/A'
    const patientAge = report.patientAge || (typeof report.patientId === 'object' && report.patientId?.age) || 'N/A'
    const studyDate = report.studyDate || (typeof report.studyId === 'object' && report.studyId?.studyDate) || 'N/A'
    const modality = report.modality || (typeof report.studyId === 'object' && report.studyId?.modality) || 'N/A'
    const studyDescription = report.studyDescription || (typeof report.studyId === 'object' && report.studyId?.description) || 'N/A'
    const bodyPart = report.bodyPartExamined || (typeof report.studyId === 'object' && report.studyId?.bodyPart) || 'N/A'
    const institution = report.institutionName || (typeof report.studyId === 'object' && report.studyId?.institutionName) || 'N/A'

    printWindow.document.write(`
      <html>
        <head><title>Medical Report</title></head>
        <body>
          <h1>Medical Report</h1>
          <h2>Patient Information</h2>
          <p><strong>Patient Name:</strong> ${patientName}</p>
          <p><strong>Patient ID:</strong> ${patientId}</p>
          <p><strong>Date of Birth:</strong> ${patientDOB}</p>
          <p><strong>Gender:</strong> ${patientGender}</p>
          ${patientAge !== 'N/A' ? `<p><strong>Age:</strong> ${patientAge}</p>` : ''}
          <h2>Study Information</h2>
          <p><strong>Study Date:</strong> ${studyDate}</p>
          <p><strong>Modality:</strong> ${modality}</p>
          ${studyDescription !== 'N/A' ? `<p><strong>Study Description:</strong> ${studyDescription}</p>` : ''}
          ${bodyPart !== 'N/A' ? `<p><strong>Body Part Examined:</strong> ${bodyPart}</p>` : ''}
          ${institution !== 'N/A' ? `<p><strong>Institution:</strong> ${institution}</p>` : ''}
          <h3>Findings:</h3>
          <ul>
            ${report.findings?.map(f => `<li>${f.title}: ${f.value}</li>`).join('') || '<li>No findings</li>'}
          </ul>
          <h3>Recommendations:</h3>
          <ul>
            ${report.recommendations?.map(r => `<li>${r}</li>`).join('') || '<li>No recommendations</li>'}
          </ul>
          <p><strong>Physician:</strong> ${report.physicianName || report.physician || (user ? `Dr. ${user.firstName} ${user.lastName}, MD` : 'N/A')}</p>
          <p><strong>Report Date:</strong> ${report.reportDate || 'N/A'}</p>
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
        </div>

        <div className="filters-section">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search reports by patient name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-box">
            <FiFilter />
            <select value={filterModality} onChange={(e) => setFilterModality(e.target.value)}>
              <option value="all">All Modalities</option>
              <option value="CT">CT</option>
              <option value="MRI">MRI</option>
              <option value="X-Ray">X-Ray</option>
              <option value="Ultrasound">Ultrasound</option>
              <option value="PET">PET</option>
            </select>
          </div>
        </div>

        <div className="reports-grid">
          {filteredReports.length === 0 ? (
            <div className="empty-state">
              <FiFileText size={48} />
              <p>No reports available</p>
            </div>
          ) : (
            filteredReports.map(report => (
              <div 
                key={report._id || report.id || report.reportId} 
                className="report-card"
                onClick={() => setSelectedReport(report)}
              >
                <div className="report-card-header">
                  <div className="report-avatar">
                    <FiFileText />
                  </div>
                  <div className="report-info">
                    <h3>{getPatientName(report)}</h3>
                    <p className="report-id">ID: {getPatientId(report.patientId)}</p>
                  </div>
                  <div className="report-actions">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(report)
                      }} 
                      title="Edit"
                    >
                      <FiEdit />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExportPDF(report)
                      }} 
                      title="Export PDF"
                    >
                      <FiDownload />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePrint(report)
                      }} 
                      title="Print"
                    >
                      <FiPrinter />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(report)
                      }} 
                      title="Delete"
                      className="delete-button"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                <div className="report-card-details">
                  <div className="detail-item">
                    <span className="label">Modality:</span>
                    <span className="value">{report.modality || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Study Date:</span>
                    <span className="value">{
                      report.studyDate 
                        ? (typeof report.studyDate === 'string' 
                            ? report.studyDate 
                            : format(new Date(report.studyDate), 'MMM dd, yyyy'))
                        : 'N/A'
                    }</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Report Date:</span>
                    <span className="value">{format(new Date(report.createdAt || report.reportDate || new Date()), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Findings:</span>
                    <span className="value">{report.findings?.length || 0}</span>
                  </div>
                </div>
                {report.findings && report.findings.length > 0 && (
                  <div className="report-summary">
                    <div className="summary-item">
                      {report.findings.slice(0, 2).map((finding, idx) => (
                        <span key={idx} className={`finding-badge ${finding.status || 'normal'}`}>
                          {finding.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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

        {selectedReport && (
          <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
            <div className="report-detail-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Report Details: {getPatientName(selectedReport)}</h2>
              <div className="report-detail-content">
                <div className="report-section">
                  <h4>Patient Information</h4>
                  <div className="info-grid">
                    <div><strong>Patient Name:</strong> {getPatientName(selectedReport)}</div>
                    <div><strong>Patient ID:</strong> {getPatientId(selectedReport.patientId)}</div>
                    <div><strong>Date of Birth:</strong> {
                      (() => {
                        try {
                          if (selectedReport.patientDateOfBirth) {
                            const dob = selectedReport.patientDateOfBirth
                            return typeof dob === 'string' ? dob : format(new Date(dob), 'MMM dd, yyyy')
                          }
                          if (typeof selectedReport.patientId === 'object' && selectedReport.patientId?.dateOfBirth) {
                            const dob = selectedReport.patientId.dateOfBirth
                            return typeof dob === 'string' ? dob : format(new Date(dob), 'MMM dd, yyyy')
                          }
                          return 'N/A'
                        } catch (e) {
                          return 'N/A'
                        }
                      })()
                    }</div>
                    <div><strong>Gender:</strong> {
                      selectedReport.patientGender || 
                      (typeof selectedReport.patientId === 'object' && selectedReport.patientId?.gender) || 
                      'N/A'
                    }</div>
                    <div><strong>Age:</strong> {
                      selectedReport.patientAge || 
                      (typeof selectedReport.patientId === 'object' && selectedReport.patientId?.age) || 
                      'N/A'
                    }</div>
                  </div>
                </div>

                <div className="report-section">
                  <h4>Study Information</h4>
                  <div className="info-grid">
                    <div><strong>Study Date:</strong> {
                      (() => {
                        try {
                          if (selectedReport.studyDate) {
                            const sd = selectedReport.studyDate
                            return typeof sd === 'string' ? sd : format(new Date(sd), 'MMM dd, yyyy')
                          }
                          if (typeof selectedReport.studyId === 'object' && selectedReport.studyId?.studyDate) {
                            const sd = selectedReport.studyId.studyDate
                            return typeof sd === 'string' ? sd : format(new Date(sd), 'MMM dd, yyyy')
                          }
                          return 'N/A'
                        } catch (e) {
                          return 'N/A'
                        }
                      })()
                    }</div>
                    <div><strong>Study Time:</strong> {
                      selectedReport.studyTime || 
                      (typeof selectedReport.studyId === 'object' && selectedReport.studyId?.studyTime) || 
                      'N/A'
                    }</div>
                    <div><strong>Modality:</strong> {
                      selectedReport.modality || 
                      (typeof selectedReport.studyId === 'object' && selectedReport.studyId?.modality) || 
                      'N/A'
                    }</div>
                    <div><strong>Study Description:</strong> {
                      selectedReport.studyDescription || 
                      (typeof selectedReport.studyId === 'object' && selectedReport.studyId?.description) || 
                      (typeof selectedReport.studyId === 'object' && selectedReport.studyId?.seriesDescription) || 
                      'N/A'
                    }</div>
                    <div><strong>Body Part Examined:</strong> {
                      selectedReport.bodyPartExamined || 
                      (typeof selectedReport.studyId === 'object' && selectedReport.studyId?.bodyPart) || 
                      'N/A'
                    }</div>
                    <div><strong>Institution:</strong> {
                      selectedReport.institutionName || 
                      (typeof selectedReport.studyId === 'object' && selectedReport.studyId?.institutionName) || 
                      'N/A'
                    }</div>
                    <div><strong>Study Instance UID:</strong> {
                      selectedReport.studyInstanceUID || 
                      (typeof selectedReport.studyId === 'object' && selectedReport.studyId?.studyInstanceUID) || 
                      (typeof selectedReport.studyId === 'object' && selectedReport.studyId?.studyId) || 
                      'N/A'
                    }</div>
                  </div>
                </div>

                <div className="report-section">
                  <h4>Findings</h4>
                  <div className="findings-list">
                    {selectedReport.findings?.map((finding, idx) => (
                      <div key={idx} className={`finding-item ${finding.status || 'normal'}`}>
                        <span className="finding-title">{finding.title}</span>
                        <span className="finding-value">{finding.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="report-section">
                  <h4>Recommendations</h4>
                  <ul className="recommendations-list">
                    {selectedReport.recommendations?.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="report-footer">
                  <div>
                    <strong>Physician:</strong> {
                      selectedReport.physicianName || 
                      selectedReport.physician || 
                      (user ? `Dr. ${user.firstName} ${user.lastName}, MD` : 'N/A')
                    }
                  </div>
                  <div>
                    <strong>Report Date:</strong> {format(new Date(selectedReport.createdAt || selectedReport.reportDate || new Date()), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>
              <button className="close-modal" onClick={() => setSelectedReport(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports
