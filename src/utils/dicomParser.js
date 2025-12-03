// DICOM file parser using dicom-parser library
import dicomParser from 'dicom-parser'

export const parseDICOMFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result
        
        // Parse DICOM file using dicom-parser
        const byteArray = new Uint8Array(arrayBuffer)
        const dataSet = dicomParser.parseDicom(byteArray)
        
        // Extract DICOM metadata - Columns (width) and Rows (height)
        const width = dataSet.uint16('x00280011') || 512  // Columns
        const height = dataSet.uint16('x00280010') || 512 // Rows
        const bitsAllocated = dataSet.uint16('x00280100') || 16
        const bitsStored = dataSet.uint16('x00280101') || bitsAllocated
        const highBit = dataSet.uint16('x00280102') || (bitsStored - 1)
        const samplesPerPixel = dataSet.uint16('x00280002') || 1
        const photometricInterpretation = dataSet.string('x00280004') || 'MONOCHROME2'
        // Window Center and Width can be arrays or single values
        let windowCenter = dataSet.floatString('x00281050') || dataSet.intString('x00281050')
        if (!windowCenter) {
          const wcArray = dataSet.elements.x00281050
          if (wcArray && wcArray.length > 0) {
            windowCenter = dataSet.floatString('x00281050', 0) || 50
          } else {
            windowCenter = 50
          }
        }
        
        let windowWidth = dataSet.floatString('x00281051') || dataSet.intString('x00281051')
        if (!windowWidth) {
          const wwArray = dataSet.elements.x00281051
          if (wwArray && wwArray.length > 0) {
            windowWidth = dataSet.floatString('x00281051', 0) || 400
          } else {
            windowWidth = 400
          }
        }
        
        const rescaleSlope = parseFloat(dataSet.string('x00281053') || '1')
        const rescaleIntercept = parseFloat(dataSet.string('x00281052') || '0')
        
        // Check if pixel data is signed
        const pixelRepresentation = dataSet.uint16('x00280103') || 0 // 0 = unsigned, 1 = signed
        const pixelSpacing = dataSet.string('x00280030')
        const modality = dataSet.string('x00080060') || 'CT'
        
        // Extract Patient Information (DICOM tags)
        let patientName = dataSet.string('x00100010') || '' // Patient's Name
        // DICOM names are often in format "LAST^FIRST^MIDDLE" or "LAST^FIRST"
        if (patientName.includes('^')) {
          const nameParts = patientName.split('^')
          if (nameParts.length >= 2) {
            patientName = `${nameParts[1] || ''} ${nameParts[0] || ''}`.trim() || patientName
          }
        }
        const patientId = dataSet.string('x00100020') || '' // Patient ID
        const patientBirthDate = dataSet.string('x00100030') || '' // Patient's Birth Date (YYYYMMDD)
        const patientSex = dataSet.string('x00100040') || '' // Patient's Sex (M/F/O)
        const patientAge = dataSet.string('x00101010') || '' // Patient's Age
        
        // Extract Study Information
        const studyDate = dataSet.string('x00080020') || '' // Study Date (YYYYMMDD)
        const studyTime = dataSet.string('x00080030') || '' // Study Time
        const studyDescription = dataSet.string('x00081030') || '' // Study Description
        const studyInstanceUID = dataSet.string('x0020000d') || '' // Study Instance UID
        const seriesInstanceUID = dataSet.string('x0020000e') || '' // Series Instance UID
        const seriesDescription = dataSet.string('x0008103e') || '' // Series Description
        const bodyPartExamined = dataSet.string('x00180015') || '' // Body Part Examined
        
        // Extract Institution/Equipment Info
        const institutionName = dataSet.string('x00080080') || '' // Institution Name
        const manufacturer = dataSet.string('x00080070') || '' // Manufacturer
        const manufacturerModelName = dataSet.string('x00081090') || '' // Manufacturer's Model Name
        
        // Format patient birth date from DICOM format (YYYYMMDD) to Date object
        let formattedBirthDate = null
        if (patientBirthDate && patientBirthDate.length >= 8) {
          const year = patientBirthDate.substring(0, 4)
          const month = patientBirthDate.substring(4, 6)
          const day = patientBirthDate.substring(6, 8)
          formattedBirthDate = new Date(`${year}-${month}-${day}`)
        }
        
        // Format study date
        let formattedStudyDate = null
        if (studyDate && studyDate.length >= 8) {
          const year = studyDate.substring(0, 4)
          const month = studyDate.substring(4, 6)
          const day = studyDate.substring(6, 8)
          formattedStudyDate = new Date(`${year}-${month}-${day}`)
        }
        
        // Map DICOM sex codes to our format
        let gender = null
        if (patientSex) {
          const sexUpper = patientSex.toUpperCase()
          if (sexUpper === 'M' || sexUpper === 'MALE') {
            gender = 'male'
          } else if (sexUpper === 'F' || sexUpper === 'FEMALE') {
            gender = 'female'
          } else {
            gender = 'other'
          }
        }
        
        // Extract pixel data (tag 7FE0,0010)
        const pixelDataElement = dataSet.elements.x7fe00010
        if (!pixelDataElement) {
          throw new Error('Pixel data not found in DICOM file')
        }
        
        const pixelDataOffset = pixelDataElement.dataOffset
        const pixelDataLength = pixelDataElement.length
        const pixelData = new Uint8Array(arrayBuffer, pixelDataOffset, pixelDataLength)
        
        // Convert pixel data based on bits allocated
        let pixelArray
        if (bitsAllocated === 8) {
          if (pixelRepresentation === 1) {
            // Signed 8-bit
            pixelArray = new Int8Array(pixelData)
          } else {
            // Unsigned 8-bit
            pixelArray = new Uint8Array(pixelData)
          }
        } else if (bitsAllocated === 16) {
          // Check byte order
          const transferSyntax = dataSet.string('x00020010') || ''
          const isBigEndian = transferSyntax === '1.2.840.10008.1.2.2' // Explicit VR Big Endian
          
          if (pixelRepresentation === 1) {
            // Signed 16-bit
            pixelArray = new Int16Array(pixelData.buffer, pixelData.byteOffset, pixelDataLength / 2)
            if (isBigEndian) {
              // Swap bytes for big endian
              const tempArray = new Int16Array(pixelArray.length)
              const view = new DataView(pixelData.buffer, pixelData.byteOffset, pixelDataLength)
              for (let i = 0; i < pixelArray.length; i++) {
                tempArray[i] = view.getInt16(i * 2, false) // false = big endian
              }
              pixelArray = tempArray
            }
          } else {
            // Unsigned 16-bit
            pixelArray = new Uint16Array(pixelData.buffer, pixelData.byteOffset, pixelDataLength / 2)
            if (isBigEndian) {
              // Swap bytes for big endian
              const tempArray = new Uint16Array(pixelArray.length)
              const view = new DataView(pixelData.buffer, pixelData.byteOffset, pixelDataLength)
              for (let i = 0; i < pixelArray.length; i++) {
                tempArray[i] = view.getUint16(i * 2, false) // false = big endian
              }
              pixelArray = tempArray
            }
          }
        } else {
          throw new Error(`Unsupported bits allocated: ${bitsAllocated}`)
        }
        
        // Apply rescale slope and intercept
        const scaledPixelData = new Float32Array(pixelArray.length)
        for (let i = 0; i < pixelArray.length; i++) {
          scaledPixelData[i] = pixelArray[i] * rescaleSlope + rescaleIntercept
        }
        
        resolve({
          file: file,
          dataSet: dataSet,
          width: width,
          height: height,
          bitsAllocated: bitsAllocated,
          bitsStored: bitsStored,
          highBit: highBit,
          samplesPerPixel: samplesPerPixel,
          photometricInterpretation: photometricInterpretation,
          windowCenter: parseFloat(windowCenter),
          windowWidth: parseFloat(windowWidth),
          pixelRepresentation: pixelRepresentation,
          rescaleSlope: parseFloat(rescaleSlope),
          rescaleIntercept: parseFloat(rescaleIntercept),
          pixelSpacing: pixelSpacing,
          modality: modality,
          pixelData: scaledPixelData,
          rawPixelData: pixelArray,
          // Patient Information
          patient: {
            name: patientName.trim(),
            patientId: patientId.trim(),
            dateOfBirth: formattedBirthDate,
            gender: gender,
            age: patientAge
          },
          // Study Information
          study: {
            studyDate: formattedStudyDate || new Date(),
            studyTime: studyTime,
            studyDescription: studyDescription,
            studyInstanceUID: studyInstanceUID,
            seriesInstanceUID: seriesInstanceUID,
            seriesDescription: seriesDescription,
            bodyPartExamined: bodyPartExamined,
            institutionName: institutionName,
            manufacturer: manufacturer,
            manufacturerModelName: manufacturerModelName
          }
        })
      } catch (error) {
        console.error('Error parsing DICOM file:', error)
        reject(error)
      }
    }
    
    reader.onerror = (error) => {
      reject(error)
    }
    
    reader.readAsArrayBuffer(file)
  })
}

export const renderDICOMToCanvas = (canvas, dicomData, windowLevel = null) => {
  try {
    const ctx = canvas.getContext('2d')
    
    if (!dicomData || !dicomData.pixelData) {
      // Fallback placeholder
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#fff'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('DICOM file loaded', canvas.width / 2, canvas.height / 2 - 10)
      ctx.fillText('Processing pixel data...', canvas.width / 2, canvas.height / 2 + 10)
      return
    }
    
    const { width, height, pixelData, windowCenter, windowWidth } = dicomData
    
    // Use provided window/level or DICOM file defaults
    const wl = windowLevel || { 
      window: windowWidth || 400, 
      level: windowCenter || 50 
    }
    
    // Set canvas size
    canvas.width = width
    canvas.height = height
    
    // Create ImageData
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data
    
    // Calculate window/level transformation
    const windowMin = wl.level - wl.window / 2
    const windowMax = wl.level + wl.window / 2
    const windowRange = windowMax - windowMin
    
    // Normalize pixel values to 0-255 range
    let minValue = Infinity
    let maxValue = -Infinity
    
    // Find min/max for normalization
    for (let i = 0; i < pixelData.length; i++) {
      const value = pixelData[i]
      if (value < minValue) minValue = value
      if (value > maxValue) maxValue = value
    }
    
    const valueRange = maxValue - minValue || 1
    
    // Apply window/level and render
    for (let i = 0; i < pixelData.length && i < width * height; i++) {
      let pixelValue = pixelData[i]
      
      // Apply window/level transformation
      if (pixelValue < windowMin) {
        pixelValue = 0
      } else if (pixelValue > windowMax) {
        pixelValue = 255
      } else {
        pixelValue = ((pixelValue - windowMin) / windowRange) * 255
      }
      
      // Clamp to 0-255
      pixelValue = Math.max(0, Math.min(255, Math.round(pixelValue)))
      
      const idx = i * 4
      data[idx] = pixelValue     // R
      data[idx + 1] = pixelValue // G
      data[idx + 2] = pixelValue // B
      data[idx + 3] = 255       // A
    }
    
    ctx.putImageData(imageData, 0, 0)
  } catch (error) {
    console.error('Error rendering DICOM to canvas:', error)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ff0000'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Error rendering DICOM', canvas.width / 2, canvas.height / 2 - 10)
    ctx.fillText(error.message, canvas.width / 2, canvas.height / 2 + 10)
  }
}

export const extractPixelData = (dicomData) => {
  if (!dicomData || !dicomData.pixelData) {
    return null
  }
  
  return {
    pixelData: dicomData.pixelData,
    width: dicomData.width,
    height: dicomData.height,
    bitsAllocated: dicomData.bitsAllocated,
    samplesPerPixel: dicomData.samplesPerPixel,
    photometricInterpretation: dicomData.photometricInterpretation
  }
}

