import React, { useState, useRef, useEffect } from 'react'
import { useData } from '../context/DataContext'
import { useNotifications } from '../context/NotificationContext'
import Navigation from './Navigation'
import ProgressIndicator from './ProgressIndicator'
import SeriesViewer from './SeriesViewer'
import ComparisonViewer from './ComparisonViewer'
import Volume3DViewer from './Volume3DViewer'
import { parseDICOMFile, renderDICOMToCanvas } from '../utils/dicomParser'
import { FiUpload, FiX, FiLayers, FiRotateCw, FiZoomIn, FiZoomOut } from 'react-icons/fi'
import './DICOMViewer.css'

const DICOMViewer = () => {
  const { addStudy, addReport, addPatient } = useData()
  const { notifyStudyComplete, notifyReportReady } = useNotifications()
  
  const [selectedFiles, setSelectedFiles] = useState([])
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [filePreviews, setFilePreviews] = useState([])
  const [dicomData, setDicomData] = useState([])
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [showSeriesViewer, setShowSeriesViewer] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [show3DViewer, setShow3DViewer] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [windowLevel, setWindowLevel] = useState({ window: 400, level: 50 })
  
  const fileInputRef = useRef(null)
  const imageContainerRef = useRef(null)
  const canvasRef = useRef(null)

  // Load persisted DICOM data on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('dicomViewerData')
      if (savedData) {
        const parsed = JSON.parse(savedData)
        if (parsed.filePreviews && parsed.filePreviews.length > 0) {
          setFilePreviews(parsed.filePreviews)
          // Restore metadata only (pixelData is not saved to avoid lag)
          const restoredDicomData = (parsed.dicomData || []).map(d => {
            if (!d) return null
            // Return metadata only - pixelData will need to be re-parsed if needed
            return {
              ...d,
              pixelData: null // Will be null since we don't save it
            }
          })
          setDicomData(restoredDicomData)
          setReport(parsed.report)
          setCurrentFileIndex(parsed.currentFileIndex || 0)
          setWindowLevel(parsed.windowLevel || { window: 400, level: 50 })
          // Set a placeholder for selectedFiles so the UI knows files are loaded
          setSelectedFiles(parsed.filePreviews.map((_, idx) => ({ name: `File ${idx + 1}`, size: 0 })))
        }
      }
    } catch (error) {
      console.error('Error loading persisted DICOM data:', error)
    }
  }, [])

  // Save DICOM data to localStorage whenever it changes (without pixelData to avoid lag)
  useEffect(() => {
    if (filePreviews.length > 0) {
      try {
        const dataToSave = {
          filePreviews,
          // Only save metadata, not pixelData (too large and causes lag)
          dicomData: dicomData.map(d => {
            if (!d) return null
            return {
              width: d.width,
              height: d.height,
              // Don't save pixelData - it's too large and causes performance issues
              windowWidth: d.windowWidth,
              windowCenter: d.windowCenter,
              modality: d.modality,
              patient: d.patient,
              study: d.study,
              pixelSpacing: d.pixelSpacing
            }
          }),
          report,
          currentFileIndex,
          windowLevel
        }
        localStorage.setItem('dicomViewerData', JSON.stringify(dataToSave))
      } catch (error) {
        console.error('Error saving DICOM data:', error)
        // If data is too large, try saving without dicomData
        try {
          const minimalData = {
            filePreviews,
            report,
            currentFileIndex,
            windowLevel
          }
          localStorage.setItem('dicomViewerData', JSON.stringify(minimalData))
        } catch (e) {
          console.error('Error saving minimal DICOM data:', e)
        }
      }
    }
  }, [filePreviews, report, currentFileIndex, windowLevel])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      
      switch(e.key) {
        case 'ArrowLeft':
          if (currentFileIndex > 0) {
            setCurrentFileIndex(prev => prev - 1)
          }
          break
        case 'ArrowRight':
          if (currentFileIndex < selectedFiles.length - 1) {
            setCurrentFileIndex(prev => prev + 1)
          }
          break
        case '+':
        case '=':
          setZoom(prev => Math.min(prev + 0.1, 5))
          break
        case '-':
          setZoom(prev => Math.max(prev - 0.1, 0.5))
          break
        case 'r':
        case 'R':
          setZoom(1)
          setPan({ x: 0, y: 0 })
          setRotation(0)
          break
        case 'f':
        case 'F':
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
          } else {
            document.exitFullscreen()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentFileIndex, selectedFiles.length])

  const simulateUpload = (file) => {
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setUploadProgress(progress)
        if (progress >= 100) {
          clearInterval(interval)
          resolve()
        }
      }, 100)
    })
  }

  const loadDICOMFiles = async (files) => {
    setIsLoading(true)
    setUploadProgress(0)
    
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop()
      return ext === 'dcm' || file.type === 'application/dicom' || 
             ['dcm', 'dicom', 'ct', 'mri', 'xray'].includes(ext)
    })

    if (validFiles.length === 0) {
      alert('Please upload valid DICOM files (.dcm) or medical imaging files')
      setIsLoading(false)
      return
    }

    setSelectedFiles(validFiles)
    const previews = []
    const parsedData = []

    for (let i = 0; i < validFiles.length; i++) {
      await simulateUpload(validFiles[i])
      
      try {
        // Parse DICOM file
        const parsed = await parseDICOMFile(validFiles[i])
        parsedData.push(parsed)
        
        // Create a canvas preview thumbnail
        const canvas = document.createElement('canvas')
        canvas.width = parsed.width || 512
        canvas.height = parsed.height || 512
        
        // Render the actual DICOM image to canvas
        renderDICOMToCanvas(canvas, parsed, {
          window: parsed.windowWidth || 400,
          level: parsed.windowCenter || 50
        })
        
        const previewUrl = canvas.toDataURL()
        previews.push(previewUrl)
        setFilePreviews([...previews])
        setDicomData([...parsedData])
        
        // Note: Saving to localStorage is handled by the useEffect hook above
        // We don't save here to avoid blocking the UI during upload
      } catch (error) {
        console.error('Error parsing DICOM file:', error)
        // Fallback: create a simple placeholder
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 512
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#fff'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Error loading DICOM file', canvas.width / 2, canvas.height / 2 - 10)
        ctx.fillText(error.message.substring(0, 40), canvas.width / 2, canvas.height / 2 + 10)
        const previewUrl = canvas.toDataURL()
        previews.push(previewUrl)
        setFilePreviews([...previews])
        parsedData.push(null)
        setDicomData([...parsedData])
        
        // Note: Saving to localStorage is handled by the useEffect hook above
      }
    }

    setUploadProgress(100)
    
    // Generate series data
    const series = validFiles.map((file, idx) => ({
      id: idx,
      file,
      thumbnail: previews[idx],
      imageId: `dicom://${file.name}`
    }))

    // Extract patient and study data from first DICOM file
    const firstDicomData = parsedData[0]
    
    // Generate report
    setTimeout(async () => {
      try {
        setIsLoading(false)
        setUploadProgress(0)
        notifyStudyComplete(validFiles[0].name)
        
        // Extract patient information from DICOM
        const patientInfo = firstDicomData?.patient || {}
        const studyInfo = firstDicomData?.study || {}
        
        // Create or find patient from DICOM data
        let patient
        if (patientInfo.patientId && patientInfo.name) {
          try {
            // Try to create patient with DICOM data
            patient = await addPatient({
              name: patientInfo.name,
              patientId: patientInfo.patientId,
              dateOfBirth: patientInfo.dateOfBirth || new Date('1900-01-01'), // Default if missing
              gender: patientInfo.gender || 'other', // Default if missing
              status: 'active'
            })
          } catch (error) {
            // Patient might already exist, try to find by patientId
            console.log('Patient creation error (might already exist):', error)
            // For now, create with a unique ID if patientId exists but patient creation fails
            const uniqueId = `${patientInfo.patientId}-${Date.now()}`
            patient = await addPatient({
              name: patientInfo.name,
              patientId: uniqueId,
              dateOfBirth: patientInfo.dateOfBirth || new Date('1900-01-01'),
              gender: patientInfo.gender || 'other',
              status: 'active'
            })
          }
        } else {
          // Fallback if DICOM doesn't have patient info
          const fallbackId = `PAT-${Date.now()}`
          patient = await addPatient({
            name: patientInfo.name || 'Unknown Patient',
            patientId: patientInfo.patientId || fallbackId,
            dateOfBirth: patientInfo.dateOfBirth || new Date('1900-01-01'),
            gender: patientInfo.gender || 'other',
            status: 'active'
          })
        }
        
        // Create study from DICOM data
        const study = await addStudy({
          patientId: patient._id || patient.id,
          studyId: studyInfo.studyInstanceUID || `STUDY-${Date.now()}`,
          modality: firstDicomData?.modality || 'CT',
          studyDate: studyInfo.studyDate || new Date(),
          description: studyInfo.studyDescription || studyInfo.seriesDescription || 'DICOM Study',
          bodyPart: studyInfo.bodyPartExamined || '',
          files: validFiles.map(f => ({
            fileName: f.name,
            fileSize: f.size,
            uploadedAt: new Date()
          })),
          dicomData: {
            width: firstDicomData?.width,
            height: firstDicomData?.height,
            pixelSpacing: firstDicomData?.pixelSpacing,
            sliceThickness: null // Can be extracted if available
          }
        })
        
        // Generate report data
        const reportData = generateReport(validFiles[0], patientInfo, studyInfo)
        
        // Create report in database
        const generatedReport = await addReport({
          studyId: study._id || study.id,
          patientId: patient._id || patient.id,
          reportId: `RPT-${Date.now()}`,
          findings: reportData.findings || [],
          recommendations: reportData.recommendations || [],
          physicianName: reportData.physician || '',
          physicianTitle: 'MD',
          reportDate: new Date()
        })
        
        notifyReportReady(patient.name || 'Patient')
      } catch (error) {
        console.error('Error saving patient/study data:', error)
        setIsLoading(false)
        // Still show the images even if saving fails
      }
    }, 500)
  }

  const generateReport = (file, patientInfo = {}, studyInfo = {}) => {
    const simulatedReport = {
      patientName: patientInfo.name || 'Unknown Patient',
      patientId: patientInfo.patientId || 'N/A',
      studyDate: studyInfo.studyDate ? new Date(studyInfo.studyDate).toLocaleDateString() : new Date().toLocaleDateString(),
      modality: dicomData[0]?.modality || 'CT',
      studyDescription: studyInfo.studyDescription || studyInfo.seriesDescription || 'DICOM Study - Cardiac Analysis',
      findings: [
        { title: 'Heart Structure', value: 'Normal', status: 'normal' },
        { title: 'Left Ventricle Ejection Fraction', value: '65%', status: 'normal' },
        { title: 'Coronary Artery Disease', value: 'Mild', status: 'warning' },
        { title: 'Aortic Valve', value: 'Normal', status: 'normal' },
        { title: 'Pulmonary Artery', value: 'Normal', status: 'normal' }
      ],
      recommendations: [
        'Continue current medication regimen',
        'Follow-up in 6 months',
        'Maintain low-sodium diet'
      ],
      physician: 'Dr. Sarah Johnson, MD',
      reportDate: new Date().toLocaleDateString()
    }
    setReport(simulatedReport)
    
    // Save report to localStorage
    try {
      const savedData = localStorage.getItem('dicomViewerData')
      if (savedData) {
        const parsed = JSON.parse(savedData)
        parsed.report = simulatedReport
        localStorage.setItem('dicomViewerData', JSON.stringify(parsed))
      }
    } catch (error) {
      console.error('Error saving report:', error)
    }
    
    return simulatedReport // Return for database storage
  }

  const handleFileChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      loadDICOMFiles(files)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      loadDICOMFiles(files)
    }
  }

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(5, prev + delta)))
  }

  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setRotation(0)
    setWindowLevel({ window: 400, level: 50 })
  }

  const handleWindowLevelChange = (type, value) => {
    setWindowLevel(prev => ({ ...prev, [type]: value }))
  }

  // Render DICOM to canvas when file is loaded or window/level changes
  useEffect(() => {
    if (canvasRef.current && filePreviews.length > 0) {
      const canvas = canvasRef.current
      const currentPreview = filePreviews[currentFileIndex]
      const currentDicom = dicomData[currentFileIndex]
      
      if (currentDicom && currentDicom.pixelData) {
        // Render the actual DICOM image if pixelData is available
        try {
          renderDICOMToCanvas(canvas, currentDicom, windowLevel)
        } catch (error) {
          console.error('Error rendering DICOM:', error)
          // Fallback to preview image
          if (currentPreview) {
            const img = new Image()
            img.onload = () => {
              const ctx = canvas.getContext('2d')
              canvas.width = img.width
              canvas.height = img.height
              ctx.drawImage(img, 0, 0)
            }
            img.src = currentPreview
          }
        }
      } else if (currentPreview) {
        // Use the saved preview image (faster, no lag)
        const img = new Image()
        img.onload = () => {
          const ctx = canvas.getContext('2d')
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
        }
        img.onerror = () => {
          const ctx = canvas.getContext('2d')
          canvas.width = 512
          canvas.height = 512
          ctx.fillStyle = '#000'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = '#fff'
          ctx.font = '14px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('Error loading preview', canvas.width / 2, canvas.height / 2)
        }
        img.src = currentPreview
      } else {
        // Show placeholder
        const ctx = canvas.getContext('2d')
        canvas.width = 512
        canvas.height = 512
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#fff'
        ctx.font = '16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('DICOM File Loaded', canvas.width / 2, canvas.height / 2 - 20)
        ctx.font = '12px Arial'
        ctx.fillText('Parsing...', canvas.width / 2, canvas.height / 2 + 20)
      }
    }
  }, [currentFileIndex, windowLevel, dicomData, filePreviews])

  const currentFile = selectedFiles[currentFileIndex]
  const currentPreview = filePreviews[currentFileIndex]
  const currentDicomData = dicomData[currentFileIndex]

  return (
    <div className="viewer-container">
      <Navigation />
      
      <main className="viewer-main">
        <div className="viewer-content">
          {/* Upload Section */}
          <section className="upload-section">
            <h2>Upload DICOM Files (CT Scan Focus)</h2>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <ProgressIndicator 
                progress={uploadProgress} 
                fileName={currentFile?.name || 'Uploading...'}
              />
            )}
            <div
              className={`upload-area ${dragActive ? 'drag-active' : ''} ${filePreviews.length > 0 ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".dcm,.dicom,application/dicom"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {filePreviews.length === 0 ? (
                <div className="upload-placeholder">
                  <FiUpload size={48} />
                  <p className="upload-text">
                    <strong>Click to upload</strong> or drag and drop
                  </p>
                  <p className="upload-hint">DICOM files (.dcm) - Multiple files supported</p>
                </div>
              ) : (
                <div className="file-info">
                  <div className="file-icon">
                    <FiLayers />
                  </div>
                  <div className="file-details">
                    <p className="file-name">{filePreviews.length} file(s) loaded</p>
                    <p className="file-size">
                      {filePreviews.length} DICOM file(s) loaded
                    </p>
                  </div>
                  <button
                    className="change-file-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFiles([])
                      setFilePreviews([])
                      setDicomData([])
                      setReport(null)
                      setCurrentFileIndex(0)
                      // Clear persisted data
                      localStorage.removeItem('dicomViewerData')
                      // Clear persisted data
                      localStorage.removeItem('dicomViewerData')
                      setReport(null)
                      setCurrentFileIndex(0)
                    }}
                  >
                    <FiX /> Change Files
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Multi-image Controls */}
          {filePreviews.length > 1 && (
            <div className="multi-image-controls">
              <button 
                onClick={() => setShowSeriesViewer(!showSeriesViewer)}
                className="control-button"
              >
                <FiLayers /> Series Viewer
              </button>
              <button 
                onClick={() => setShowComparison(!showComparison)}
                className="control-button"
              >
                Compare Images
              </button>
            </div>
          )}

          {/* Series Viewer */}
          {showSeriesViewer && selectedFiles.length > 1 && (
            <SeriesViewer
              series={selectedFiles.map((file, idx) => ({
                id: idx,
                file,
                thumbnail: filePreviews[idx]
              }))}
              currentIndex={currentFileIndex}
              onIndexChange={setCurrentFileIndex}
              onClose={() => setShowSeriesViewer(false)}
            />
          )}

          {/* Comparison Viewer */}
          {showComparison && selectedFiles.length >= 2 && (
            <ComparisonViewer
              images={[filePreviews[0], filePreviews[1] || filePreviews[0]]}
              onClose={() => setShowComparison(false)}
            />
          )}

          {/* DICOM Image Display */}
          {currentFile && (
            <section className="image-section">
              <div className="image-section-header">
                <h2>DICOM Image Viewer</h2>
                <div className="image-actions">
                  <button onClick={() => setShow3DViewer(!show3DViewer)} className="action-btn">
                    3D Volume
                  </button>
                  <button onClick={handleReset} className="action-btn">
                    <FiRotateCw /> Reset
                  </button>
                </div>
              </div>

              <div className="image-controls-panel">
                <div className="control-group">
                  <label>Zoom: {Math.round(zoom * 100)}%</label>
                  <div className="zoom-controls">
                    <button onClick={() => handleZoom(-0.1)}><FiZoomOut /></button>
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                    />
                    <button onClick={() => handleZoom(0.1)}><FiZoomIn /></button>
                  </div>
                </div>

                <div className="control-group">
                  <label>Window: {windowLevel.window}</label>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    value={windowLevel.window}
                    onChange={(e) => handleWindowLevelChange('window', parseInt(e.target.value))}
                  />
                </div>

                <div className="control-group">
                  <label>Level: {windowLevel.level}</label>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={windowLevel.level}
                    onChange={(e) => handleWindowLevelChange('level', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="image-container" ref={imageContainerRef}>
                {isLoading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading DICOM file...</p>
                  </div>
                ) : (
                  <div className="dicom-display">
                    {currentFile ? (
                      <div 
                        className="image-wrapper"
                        style={{
                          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg)`,
                          transformOrigin: 'center center'
                        }}
                      >
                        <canvas
                          ref={canvasRef}
                          className="dicom-canvas"
                          width={currentDicomData?.width || 512}
                          height={currentDicomData?.height || 512}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '600px',
                            display: 'block',
                            cursor: 'move'
                          }}
                        />
                        {currentDicomData && (
                          <div className="dicom-info-overlay">
                            <p>Modality: {currentDicomData.modality || 'Unknown'}</p>
                            <p>Size: {currentDicomData.width} × {currentDicomData.height}</p>
                            {currentDicomData.pixelSpacing && (
                              <p>Pixel Spacing: {currentDicomData.pixelSpacing}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="no-preview">
                        <p>No file selected</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {filePreviews.length > 1 && (
                <div className="file-navigation">
                  <button 
                    onClick={() => setCurrentFileIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentFileIndex === 0}
                  >
                    ← Previous
                  </button>
                  <span>
                    Image {currentFileIndex + 1} of {selectedFiles.length}
                  </span>
                  <button 
                    onClick={() => setCurrentFileIndex(prev => Math.min(selectedFiles.length - 1, prev + 1))}
                    disabled={currentFileIndex === selectedFiles.length - 1}
                  >
                    Next →
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Report Section - Now appears right after DICOM Image Viewer */}
          {report && (
            <section className="report-section">
              <h2>Medical Report</h2>
              <div className="report-container">
                <div className="report-header">
                  <div className="report-header-info">
                    <h3>CT Scan Analysis Report</h3>
                    <p className="report-date">Date: {report.reportDate}</p>
                  </div>
                  <div className="report-status-badge">
                    <span className="status-dot"></span>
                    Completed
                  </div>
                </div>

                <div className="report-patient-info">
                  <div className="info-item">
                    <span className="info-label">Patient Name:</span>
                    <span className="info-value">{report.patientName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Patient ID:</span>
                    <span className="info-value">{report.patientId}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Study Date:</span>
                    <span className="info-value">{report.studyDate}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Modality:</span>
                    <span className="info-value">{report.modality}</span>
                  </div>
                </div>

                <div className="report-findings">
                  <h4>Findings</h4>
                  <div className="findings-list">
                    {report.findings.map((finding, index) => (
                      <div key={index} className={`finding-item ${finding.status}`}>
                        <div className="finding-header">
                          <span className="finding-title">{finding.title}</span>
                          <span className={`finding-status ${finding.status}`}>
                            {finding.status === 'normal' ? '✓' : '⚠'}
                          </span>
                        </div>
                        <div className="finding-value">{finding.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="report-recommendations">
                  <h4>Recommendations</h4>
                  <ul className="recommendations-list">
                    {report.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="report-footer">
                  <div className="physician-info">
                    <p className="physician-name">{report.physician}</p>
                    <p className="physician-title">Radiologist</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 3D Volume Viewer */}
          {show3DViewer && currentFile && (
            <Volume3DViewer
              imageData={null} // Would need actual DICOM volume data
              onClose={() => setShow3DViewer(false)}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default DICOMViewer
