import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useData } from '../context/DataContext'
import { useNotifications } from '../context/NotificationContext'
import Navigation from './Navigation'
import ProgressIndicator from './ProgressIndicator'
import SeriesViewer from './SeriesViewer'
import ComparisonViewer from './ComparisonViewer'
import Volume3DViewer from './Volume3DViewer'
import { parseDICOMFile, renderDICOMToCanvas } from '../utils/dicomParser'
import { 
  FiUpload, FiX, FiLayers, FiRotateCw, FiZoomIn, FiZoomOut, 
  FiMaximize2, FiMinimize2, FiMove, FiEdit3, FiMinus, FiFilter, 
  FiInfo, FiGrid, FiChevronLeft, FiChevronRight, FiPlay, FiPause, 
  FiMaximize, FiActivity
} from 'react-icons/fi'
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
  
  // New state for enhancements
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [activeTool, setActiveTool] = useState('pan') // 'pan', 'measure', 'annotate'
  const [measurements, setMeasurements] = useState([])
  const [currentMeasurement, setCurrentMeasurement] = useState(null)
  const [annotations, setAnnotations] = useState([])
  const [annotationType, setAnnotationType] = useState('arrow') // 'arrow', 'text', 'rectangle', 'circle', 'line'
  const [imageFilters, setImageFilters] = useState({
    invert: false,
    sharpen: false,
    contrast: 1,
    brightness: 0
  })
  const [showMetadata, setShowMetadata] = useState(false)
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(2) // frames per second
  const [showShortcuts, setShowShortcuts] = useState(false)
  
  const fileInputRef = useRef(null)
  const imageContainerRef = useRef(null)
  const canvasRef = useRef(null)
  const annotationCanvasRef = useRef(null)
  const playbackIntervalRef = useRef(null)

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

  // Window/Level Presets
  const windowLevelPresets = {
    softTissue: { window: 400, level: 50 },
    bone: { window: 2000, level: 400 },
    lung: { window: 1500, level: -600 },
    brain: { window: 80, level: 40 },
    abdomen: { window: 400, level: 50 },
    mediastinum: { window: 350, level: 50 }
  }

  const applyPreset = useCallback((preset) => {
    setWindowLevel(windowLevelPresets[preset])
  }, [])

  // Fit to window and zoom controls
  const handleFitToWindow = useCallback(() => {
    if (imageContainerRef.current && canvasRef.current) {
      const container = imageContainerRef.current
      const canvas = canvasRef.current
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      const imageWidth = canvas.width
      const imageHeight = canvas.height
      
      const scaleX = containerWidth / imageWidth
      const scaleY = containerHeight / imageHeight
      const newZoom = Math.min(scaleX, scaleY) * 0.9 // 90% to add some padding
      
      setZoom(newZoom)
      setPan({ x: 0, y: 0 })
    }
  }, [])

  const handleReset = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setRotation(0)
    setWindowLevel({ window: 400, level: 50 })
  }, [])

  // Playback controls
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      playbackIntervalRef.current = setInterval(() => {
        setCurrentFileIndex(prev => {
          if (prev >= selectedFiles.length - 1) {
            setIsPlaying(false)
            return 0
          }
          return prev + 1
        })
      }, 1000 / playbackSpeed)
    }
  }, [isPlaying, selectedFiles.length, playbackSpeed])

  // Enhanced Keyboard shortcuts
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
        case 'ArrowUp':
          setWindowLevel(prev => ({ ...prev, level: Math.min(1000, prev.level + 10) }))
          break
        case 'ArrowDown':
          setWindowLevel(prev => ({ ...prev, level: Math.max(0, prev.level - 10) }))
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
          handleReset()
          break
        case 'f':
        case 'F':
          handleFitToWindow()
          break
        case '1':
          applyPreset('softTissue')
          break
        case '2':
          applyPreset('bone')
          break
        case '3':
          applyPreset('lung')
          break
        case '4':
          applyPreset('brain')
          break
        case 'i':
        case 'I':
          setImageFilters(prev => ({ ...prev, invert: !prev.invert }))
          break
        case 'm':
        case 'M':
          setActiveTool(activeTool === 'measure' ? 'pan' : 'measure')
          break
        case 'a':
        case 'A':
          setActiveTool(activeTool === 'annotate' ? 'pan' : 'annotate')
          break
        case ' ':
          e.preventDefault()
          if (filePreviews.length > 1) {
            handlePlayPause()
          }
          break
        case '?':
          setShowShortcuts(prev => !prev)
          break
        case 'Escape':
          setActiveTool('pan')
          setCurrentMeasurement(null)
          setShowShortcuts(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentFileIndex, selectedFiles.length, activeTool, filePreviews.length, handleReset, handleFitToWindow, applyPreset, handlePlayPause])

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


  const handleWindowLevelChange = (type, value) => {
    setWindowLevel(prev => ({ ...prev, [type]: value }))
  }

  const handleZoomToActual = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    if (!canvasRef.current) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setZoom(prevZoom => {
      const newZoom = Math.max(0.5, Math.min(5, prevZoom + delta))
      const zoomFactor = newZoom / prevZoom
      
      setPan(prevPan => ({
        x: prevPan.x - (x - rect.width / 2) * (zoomFactor - 1),
        y: prevPan.y - (y - rect.height / 2) * (zoomFactor - 1)
      }))
      
      return newZoom
    })
  }, [])

  // Pan with mouse drag
  const handleMouseDown = useCallback((e) => {
    if (!canvasRef.current) return
    
    if (activeTool === 'pan' && e.button === 0) {
      setIsPanning(true)
      setPan(prevPan => {
        setPanStart({ x: e.clientX - prevPan.x, y: e.clientY - prevPan.y })
        return prevPan
      })
    } else if (activeTool === 'measure') {
      const rect = canvasRef.current.getBoundingClientRect()
      
      // Calculate click position relative to canvas center, accounting for zoom and pan
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      const canvasCenterX = rect.width / 2
      const canvasCenterY = rect.height / 2
      
      // Convert screen coordinates to image coordinates using current state values
      const x = (clickX - canvasCenterX - pan.x) / zoom
      const y = (clickY - canvasCenterY - pan.y) / zoom
      
      // Access currentDicomData from the state array using current index
      const currentDicomData = dicomData[currentFileIndex]
      
      if (!currentMeasurement) {
        setCurrentMeasurement({ points: [{ x, y }], id: Date.now() })
      } else {
        const newMeasurement = {
          ...currentMeasurement,
          points: [...currentMeasurement.points, { x, y }]
        }
        if (newMeasurement.points.length === 2) {
          // Calculate distance
          const p1 = newMeasurement.points[0]
          const p2 = newMeasurement.points[1]
          const pixelSpacing = currentDicomData?.pixelSpacing?.split('\\') || ['1', '1']
          const spacingX = parseFloat(pixelSpacing[0]) || 1
          const spacingY = parseFloat(pixelSpacing[1]) || spacingX
          const dx = (p2.x - p1.x) * spacingX
          const dy = (p2.y - p1.y) * spacingY
          const distance = Math.sqrt(dx * dx + dy * dy)
          newMeasurement.distance = distance.toFixed(2)
          newMeasurement.unit = 'mm'
          setMeasurements([...measurements, newMeasurement])
          setCurrentMeasurement(null)
        } else {
          setCurrentMeasurement(newMeasurement)
        }
      }
    }
  }, [activeTool, zoom, pan, currentMeasurement, measurements, dicomData, currentFileIndex])

  const handleMouseMove = useCallback((e) => {
    if (isPanning && activeTool === 'pan') {
      setPanStart(prevPanStart => {
        setPan({
          x: e.clientX - prevPanStart.x,
          y: e.clientY - prevPanStart.y
        })
        return prevPanStart
      })
    }
  }, [isPanning, activeTool])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Image filters - use useCallback to avoid dependency issues
  const applyFilters = useCallback((imageData) => {
    const data = imageData.data
    const length = data.length
    
    for (let i = 0; i < length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]
      
      // Invert
      if (imageFilters.invert) {
        r = 255 - r
        g = 255 - g
        b = 255 - b
      }
      
      // Brightness
      r = Math.max(0, Math.min(255, r + imageFilters.brightness))
      g = Math.max(0, Math.min(255, g + imageFilters.brightness))
      b = Math.max(0, Math.min(255, b + imageFilters.brightness))
      
      // Contrast
      const factor = (259 * (imageFilters.contrast * 255 + 255)) / (255 * (259 - imageFilters.contrast * 255))
      r = Math.max(0, Math.min(255, factor * (r - 128) + 128))
      g = Math.max(0, Math.min(255, factor * (g - 128) + 128))
      b = Math.max(0, Math.min(255, factor * (b - 128) + 128))
      
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }
    
    return imageData
  }, [imageFilters])

  // Playback controls - useEffect to handle interval
  useEffect(() => {
    if (isPlaying && filePreviews.length > 1) {
      playbackIntervalRef.current = setInterval(() => {
        setCurrentFileIndex(prev => {
          if (prev >= selectedFiles.length - 1) {
            setIsPlaying(false)
            return 0
          }
          return prev + 1
        })
      }, 1000 / playbackSpeed)
      
      return () => {
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current)
        }
      }
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
    }
  }, [isPlaying, filePreviews.length, selectedFiles.length, playbackSpeed])

  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
    }
  }, [])

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
          
          // Apply filters if any are active
          if (imageFilters.invert || imageFilters.contrast !== 1 || imageFilters.brightness !== 0) {
            const ctx = canvas.getContext('2d')
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const filteredData = applyFilters(imageData)
            ctx.putImageData(filteredData, 0, 0)
          }
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
              
              // Apply filters
              if (imageFilters.invert || imageFilters.contrast !== 1 || imageFilters.brightness !== 0) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const filteredData = applyFilters(imageData)
                ctx.putImageData(filteredData, 0, 0)
              }
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
          
          // Apply filters
          if (imageFilters.invert || imageFilters.contrast !== 1 || imageFilters.brightness !== 0) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const filteredData = applyFilters(imageData)
            ctx.putImageData(filteredData, 0, 0)
          }
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
      
      // Measurements are drawn via overlay div (handled separately)
    }
  }, [currentFileIndex, windowLevel, dicomData, filePreviews, imageFilters, applyFilters])

  const currentFile = selectedFiles[currentFileIndex]
  const currentPreview = filePreviews[currentFileIndex]
  const currentDicomData = dicomData[currentFileIndex]

  // Measurements Overlay Component
  const MeasurementsOverlay = ({ measurements, currentMeasurement, zoom, pan, canvasRef, activeTool }) => {
    const overlayRef = useRef(null)
    
    useEffect(() => {
      if (!overlayRef.current || !canvasRef.current) return
      
      const overlay = overlayRef.current
      overlay.innerHTML = ''
      
      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const displayWidth = rect.width
      const displayHeight = rect.height
      const scaleX = displayWidth / canvasWidth
      const scaleY = displayHeight / canvasHeight
      const scale = Math.min(scaleX, scaleY)
      
      // Draw measurements
      measurements.forEach(measurement => {
        if (measurement.points.length === 2) {
          const p1 = {
            x: (measurement.points[0].x * scale * zoom) + (displayWidth / 2) + pan.x,
            y: (measurement.points[0].y * scale * zoom) + (displayHeight / 2) + pan.y
          }
          const p2 = {
            x: (measurement.points[1].x * scale * zoom) + (displayWidth / 2) + pan.x,
            y: (measurement.points[1].y * scale * zoom) + (displayHeight / 2) + pan.y
          }
          
          const line = document.createElement('div')
          line.className = 'measurement-line'
          const dx = p2.x - p1.x
          const dy = p2.y - p1.y
          const length = Math.sqrt(dx * dx + dy * dy)
          const angle = Math.atan2(dy, dx) * 180 / Math.PI
          
          line.style.left = `${p1.x}px`
          line.style.top = `${p1.y}px`
          line.style.width = `${length}px`
          line.style.transform = `rotate(${angle}deg)`
          line.style.transformOrigin = '0 50%'
          
          const label = document.createElement('div')
          label.className = 'measurement-label'
          label.textContent = `${measurement.distance} ${measurement.unit}`
          label.style.left = `${(p1.x + p2.x) / 2}px`
          label.style.top = `${(p1.y + p2.y) / 2 - 15}px`
          
          overlay.appendChild(line)
          overlay.appendChild(label)
        }
      })
      
      // Draw current measurement point
      if (currentMeasurement && currentMeasurement.points.length === 1) {
        const point = currentMeasurement.points[0]
        const dot = document.createElement('div')
        dot.className = 'measurement-dot'
        dot.style.left = `${(point.x * scale * zoom) + (displayWidth / 2) + pan.x}px`
        dot.style.top = `${(point.y * scale * zoom) + (displayHeight / 2) + pan.y}px`
        overlay.appendChild(dot)
      }
    }, [measurements, currentMeasurement, zoom, pan, canvasRef])
    
    return (
      <div 
        ref={overlayRef}
        className="measurements-overlay" 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: activeTool === 'measure' ? 'auto' : 'none'
        }}
      />
    )
  }

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
                    3D View
                  </button>
                  <button onClick={handleReset} className="action-btn">
                    <FiRotateCw /> Reset
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="toolbar">
                <div className="toolbar-group">
                  <button 
                    className={`tool-btn ${activeTool === 'pan' ? 'active' : ''}`}
                    onClick={() => setActiveTool('pan')}
                    title="Pan (P)"
                  >
                    <FiMove /> Pan
                  </button>
                  <button 
                    className={`tool-btn ${activeTool === 'measure' ? 'active' : ''}`}
                    onClick={() => setActiveTool('measure')}
                    title="Measure (M)"
                  >
                    <FiActivity /> Measure
                  </button>
                  <button 
                    className={`tool-btn ${activeTool === 'annotate' ? 'active' : ''}`}
                    onClick={() => setActiveTool('annotate')}
                    title="Annotate (A)"
                  >
                    <FiEdit3 /> Annotate
                  </button>
                </div>
                <div className="toolbar-group">
                  <button onClick={handleFitToWindow} title="Fit to Window (F)">
                    <FiMaximize2 /> Fit
                  </button>
                  <button onClick={handleZoomToActual} title="Actual Size">
                    <FiMinimize2 /> 1:1
                  </button>
                  <button 
                    onClick={() => setImageFilters(prev => ({ ...prev, invert: !prev.invert }))}
                    className={imageFilters.invert ? 'active' : ''}
                    title="Invert (I)"
                  >
                    <FiFilter /> Invert
                  </button>
                  <button 
                    onClick={() => setShowMetadata(!showMetadata)}
                    className={showMetadata ? 'active' : ''}
                    title="Metadata (Ctrl+M)"
                  >
                    <FiInfo /> Info
                  </button>
                  <button 
                    onClick={() => setShowShortcuts(!showShortcuts)}
                    title="Keyboard Shortcuts (?)"
                  >
                    ? Shortcuts
                  </button>
                </div>
              </div>

              {/* Keyboard Shortcuts Help */}
              {showShortcuts && (
                <div className="shortcuts-modal">
                  <div className="shortcuts-content">
                    <div className="shortcuts-header">
                      <h3>Keyboard Shortcuts</h3>
                      <button onClick={() => setShowShortcuts(false)}><FiX /></button>
                    </div>
                    <div className="shortcuts-list">
                      <div className="shortcut-category">
                        <h4>Navigation</h4>
                        <div className="shortcut-item">
                          <kbd>←</kbd> <span>Previous image</span>
                        </div>
                        <div className="shortcut-item">
                          <kbd>→</kbd> <span>Next image</span>
                        </div>
                        <div className="shortcut-item">
                          <kbd>↑</kbd> <span>Increase level</span>
                        </div>
                        <div className="shortcut-item">
                          <kbd>↓</kbd> <span>Decrease level</span>
                        </div>
                        <div className="shortcut-item">
                          <kbd>Space</kbd> <span>Play/Pause series</span>
                        </div>
                      </div>
                      <div className="shortcut-category">
                        <h4>Zoom & View</h4>
                        <div className="shortcut-item">
                          <kbd>+</kbd> or <kbd>=</kbd> <span>Zoom in</span>
                        </div>
                        <div className="shortcut-item">
                          <kbd>-</kbd> <span>Zoom out</span>
                        </div>
                        <div className="shortcut-item">
                          <kbd>F</kbd> <span>Fit to window</span>
                        </div>
                        <div className="shortcut-item">
                          <kbd>R</kbd> <span>Reset view</span>
                        </div>
                        <div className="shortcut-item">
                          <kbd>Mouse Wheel</kbd> <span>Zoom at cursor</span>
                        </div>
                      </div>
                      <div className="shortcut-category">
                        <h4>Window/Level Presets</h4>
                        <div className="shortcut-item">
                          <kbd>1</kbd> <span>Soft Tissue</span>
                        </div>
                        <div className="shortcut-item">
                          <kbd>2</kbd> <span>Bone</span>
                        </div>
                        <div className="shortcut-item">
                          <kbd>3</kbd> <span>Lung</span>
                        </div>
                        <div className="shortcut-item">
                          <kbd>4</kbd> <span>Brain</span>
                        </div>
                      </div>
                      <div className="shortcut-category">
                        <h4>Tools</h4>
                        <div className="shortcut-item">
                          <kbd>M</kbd> <span>Toggle measurement</span>
                        </div>
                        <div className="shortcut-item">
                          <kbd>A</kbd> <span>Toggle annotation</span>
                        </div>
                        <div className="shortcut-item">
                          <kbd>I</kbd> <span>Invert image</span>
                        </div>
                        <div className="shortcut-item">
                          <kbd>Esc</kbd> <span>Exit tool mode</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

                {/* Window/Level Presets */}
                <div className="control-group presets-group">
                  <label>Presets:</label>
                  <div className="preset-buttons">
                    <button onClick={() => applyPreset('softTissue')} className="preset-btn" title="Soft Tissue (1)">Soft Tissue</button>
                    <button onClick={() => applyPreset('bone')} className="preset-btn" title="Bone (2)">Bone</button>
                    <button onClick={() => applyPreset('lung')} className="preset-btn" title="Lung (3)">Lung</button>
                    <button onClick={() => applyPreset('brain')} className="preset-btn" title="Brain (4)">Brain</button>
                    <button onClick={() => applyPreset('abdomen')} className="preset-btn">Abdomen</button>
                    <button onClick={() => applyPreset('mediastinum')} className="preset-btn">Mediastinum</button>
                  </div>
                </div>

                {/* Image Filters */}
                <div className="control-group filters-group">
                  <label>Filters:</label>
                  <div className="filter-controls">
                    <label className="filter-label">
                      <input
                        type="checkbox"
                        checked={imageFilters.invert}
                        onChange={(e) => setImageFilters(prev => ({ ...prev, invert: e.target.checked }))}
                      />
                      Invert
                    </label>
                    <div className="filter-slider">
                      <label>Contrast: {imageFilters.contrast.toFixed(1)}</label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={imageFilters.contrast}
                        onChange={(e) => setImageFilters(prev => ({ ...prev, contrast: parseFloat(e.target.value) }))}
                      />
                    </div>
                    <div className="filter-slider">
                      <label>Brightness: {imageFilters.brightness}</label>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={imageFilters.brightness}
                        onChange={(e) => setImageFilters(prev => ({ ...prev, brightness: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="image-container-wrapper">
                <div 
                  className="image-container" 
                  ref={imageContainerRef}
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ cursor: activeTool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : activeTool === 'measure' ? 'crosshair' : 'default' }}
                >
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
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <canvas
                            ref={canvasRef}
                            className="dicom-canvas"
                            width={currentDicomData?.width || 512}
                            height={currentDicomData?.height || 512}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '600px',
                              display: 'block'
                            }}
                          />
                          <MeasurementsOverlay
                            measurements={measurements}
                            currentMeasurement={currentMeasurement}
                            zoom={zoom}
                            pan={pan}
                            canvasRef={canvasRef}
                            activeTool={activeTool}
                          />
                        </div>
                          {currentDicomData && (
                            <div className="dicom-info-overlay">
                              <p>Modality: {currentDicomData.modality || 'Unknown'}</p>
                              <p>Size: {currentDicomData.width} × {currentDicomData.height}</p>
                              {currentDicomData.pixelSpacing && (
                                <p>Pixel Spacing: {currentDicomData.pixelSpacing}</p>
                              )}
                              {activeTool === 'measure' && (
                                <p className="tool-hint">Click two points to measure distance</p>
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

                {/* Thumbnail Strip */}
                {showThumbnails && filePreviews.length > 1 && (
                  <div className="thumbnail-strip">
                    <button 
                      className="thumbnail-nav-btn"
                      onClick={() => {
                        const strip = document.querySelector('.thumbnail-strip-content')
                        if (strip) strip.scrollLeft -= 150
                      }}
                    >
                      <FiChevronLeft />
                    </button>
                    <div className="thumbnail-strip-content">
                      {filePreviews.map((preview, idx) => (
                        <div
                          key={idx}
                          className={`thumbnail-item ${idx === currentFileIndex ? 'active' : ''}`}
                          onClick={() => setCurrentFileIndex(idx)}
                        >
                          <img src={preview} alt={`Thumbnail ${idx + 1}`} />
                          <span className="thumbnail-number">{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                    <button 
                      className="thumbnail-nav-btn"
                      onClick={() => {
                        const strip = document.querySelector('.thumbnail-strip-content')
                        if (strip) strip.scrollLeft += 150
                      }}
                    >
                      <FiChevronRight />
                    </button>
                  </div>
                )}
              </div>

              {/* Measurements Panel */}
              {measurements.length > 0 && (
                <div className="measurements-panel">
                  <h4>Measurements</h4>
                  <div className="measurements-list">
                    {measurements.map((measurement, idx) => (
                      <div key={measurement.id} className="measurement-item">
                        <span>Measurement {idx + 1}: {measurement.distance} {measurement.unit}</span>
                        <button onClick={() => setMeasurements(measurements.filter(m => m.id !== measurement.id))}>
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setMeasurements([])} className="clear-btn">Clear All</button>
                </div>
              )}

              {/* Metadata Panel */}
              {showMetadata && currentDicomData && (
                <div className="metadata-panel">
                  <div className="metadata-header">
                    <h4>DICOM Metadata</h4>
                    <button onClick={() => setShowMetadata(false)}><FiX /></button>
                  </div>
                  <div className="metadata-content">
                    <div className="metadata-section">
                      <h5>Patient Information</h5>
                      {currentDicomData.patient && Object.entries(currentDicomData.patient).map(([key, value]) => (
                        <div key={key} className="metadata-item">
                          <span className="metadata-key">{key}:</span>
                          <span className="metadata-value">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="metadata-section">
                      <h5>Study Information</h5>
                      {currentDicomData.study && Object.entries(currentDicomData.study).map(([key, value]) => (
                        <div key={key} className="metadata-item">
                          <span className="metadata-key">{key}:</span>
                          <span className="metadata-value">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="metadata-section">
                      <h5>Image Information</h5>
                      <div className="metadata-item">
                        <span className="metadata-key">Modality:</span>
                        <span className="metadata-value">{currentDicomData.modality || 'Unknown'}</span>
                      </div>
                      <div className="metadata-item">
                        <span className="metadata-key">Dimensions:</span>
                        <span className="metadata-value">{currentDicomData.width} × {currentDicomData.height}</span>
                      </div>
                      {currentDicomData.pixelSpacing && (
                        <div className="metadata-item">
                          <span className="metadata-key">Pixel Spacing:</span>
                          <span className="metadata-value">{currentDicomData.pixelSpacing}</span>
                        </div>
                      )}
                      {currentDicomData.windowWidth && (
                        <div className="metadata-item">
                          <span className="metadata-key">Window Width:</span>
                          <span className="metadata-value">{currentDicomData.windowWidth}</span>
                        </div>
                      )}
                      {currentDicomData.windowCenter && (
                        <div className="metadata-item">
                          <span className="metadata-key">Window Center:</span>
                          <span className="metadata-value">{currentDicomData.windowCenter}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {filePreviews.length > 1 && (
                <div className="file-navigation">
                  <button 
                    onClick={() => setCurrentFileIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentFileIndex === 0}
                    title="Previous (←)"
                  >
                    <FiChevronLeft /> Previous
                  </button>
                  <div className="navigation-info">
                    <span>
                      Image {currentFileIndex + 1} of {selectedFiles.length}
                    </span>
                    <button 
                      onClick={handlePlayPause}
                      className="playback-btn"
                      title="Play/Pause (Space)"
                    >
                      {isPlaying ? <FiPause /> : <FiPlay />}
                    </button>
                    <select 
                      value={playbackSpeed} 
                      onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
                      className="speed-select"
                    >
                      <option value="1">1 fps</option>
                      <option value="2">2 fps</option>
                      <option value="5">5 fps</option>
                      <option value="10">10 fps</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => setCurrentFileIndex(prev => Math.min(selectedFiles.length - 1, prev + 1))}
                    disabled={currentFileIndex === selectedFiles.length - 1}
                    title="Next (→)"
                  >
                    Next <FiChevronRight />
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

          {/* 3D Viewing Section */}
          {show3DViewer && filePreviews.length > 0 && (
            <section className="viewing-3d-section">
              <h2>3D Viewing</h2>
              <Volume3DViewer
                imageData={null} // Would need actual DICOM volume data
                onClose={() => setShow3DViewer(false)}
              />
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

export default DICOMViewer
