# DICOM Processing Study Guide

## DICOM Standard Overview

### What is DICOM?
- **Full Name**: Digital Imaging and Communications in Medicine
- **Purpose**: Standard format for handling, storing, and transmitting medical imaging information
- **Developed By**: National Electrical Manufacturers Association (NEMA)
- **Version**: DICOM 3.0 (current standard)

### Why DICOM?
1. **Interoperability**: Works across different medical imaging devices
2. **Standardization**: Consistent format for all medical images
3. **Metadata**: Rich metadata embedded in files
4. **Industry Standard**: Used worldwide in healthcare

### DICOM File Structure

```
DICOM File
├── Header (Metadata)
│   ├── Patient Information
│   ├── Study Information
│   ├── Series Information
│   ├── Image Properties
│   └── Equipment Information
└── Pixel Data
    └── Raw image pixel values
```

## DICOM Tags

### Tag Format
- **Format**: Group-Element (e.g., `x00100010`)
- **Hexadecimal**: Tags are in hexadecimal format
- **VR (Value Representation)**: Defines data type (e.g., PN = Person Name, DA = Date)

### Important DICOM Tags

#### Patient Information Tags
| Tag | VR | Name | Description |
|-----|----|----|------------|
| x00100010 | PN | Patient's Name | Format: "LAST^FIRST^MIDDLE" |
| x00100020 | LO | Patient ID | Unique patient identifier |
| x00100030 | DA | Patient's Birth Date | Format: YYYYMMDD |
| x00100040 | CS | Patient's Sex | M/F/O (Male/Female/Other) |
| x00101010 | AS | Patient's Age | Format: "###Y" (e.g., "030Y") |

#### Study Information Tags
| Tag | VR | Name | Description |
|-----|----|----|------------|
| x00080020 | DA | Study Date | Format: YYYYMMDD |
| x00080030 | TM | Study Time | Format: HHMMSS.FFFFFF |
| x00080060 | CS | Modality | CT, MRI, X-Ray, etc. |
| x00081030 | LO | Study Description | Description of study |
| x0020000d | UI | Study Instance UID | Unique study identifier |
| x0020000e | UI | Series Instance UID | Unique series identifier |
| x00180015 | CS | Body Part Examined | Anatomical region |

#### Image Properties Tags
| Tag | VR | Name | Description |
|-----|----|----|------------|
| x00280010 | US | Rows | Image height in pixels |
| x00280011 | US | Columns | Image width in pixels |
| x00280100 | US | Bits Allocated | 8 or 16 bits per pixel |
| x00280101 | US | Bits Stored | Number of bits used |
| x00280103 | US | Pixel Representation | 0=unsigned, 1=signed |
| x00281050 | DS | Window Center | Brightness level |
| x00281051 | DS | Window Width | Contrast range |
| x00281052 | DS | Rescale Intercept | Hounsfield unit offset |
| x00281053 | DS | Rescale Slope | Hounsfield unit scale |
| x00280030 | DS | Pixel Spacing | Physical spacing between pixels |

## DICOM Parsing Implementation

### Library Used
- **Name**: dicom-parser
- **Version**: v1.8.21
- **Location**: `src/utils/dicomParser.js`
- **Purpose**: Parse DICOM files and extract data

### Key Functions

#### 1. parseDICOMFile(file)

**Purpose**: Parse a DICOM file and extract all metadata and pixel data

**Process**:
```javascript
1. Read file as ArrayBuffer using FileReader
2. Convert to Uint8Array
3. Parse DICOM structure using dicomParser.parseDicom()
4. Extract metadata tags
5. Extract pixel data (tag x7FE00010)
6. Handle bit depth (8-bit or 16-bit)
7. Handle endianness (little-endian or big-endian)
8. Handle signed/unsigned pixel data
9. Apply rescale slope/intercept for Hounsfield units
10. Return structured object with metadata and pixel arrays
```

**Return Value**:
```javascript
{
  file: File object,
  dataSet: Parsed DICOM dataset,
  width: Number,
  height: Number,
  bitsAllocated: Number (8 or 16),
  pixelData: Float32Array (scaled pixel values),
  rawPixelData: Int16Array or Uint16Array,
  windowCenter: Number,
  windowWidth: Number,
  modality: String,
  patient: {
    name: String,
    patientId: String,
    dateOfBirth: Date,
    gender: String,
    age: String
  },
  study: {
    studyDate: Date,
    studyTime: String,
    studyDescription: String,
    studyInstanceUID: String,
    seriesInstanceUID: String,
    bodyPartExamined: String,
    institutionName: String
  }
}
```

**Code Location**: `src/utils/dicomParser.js` lines 4-225

#### 2. renderDICOMToCanvas(canvas, dicomData, windowLevel)

**Purpose**: Render DICOM pixel data to HTML5 Canvas with window/level adjustment

**Process**:
```javascript
1. Get canvas 2D context
2. Set canvas size to image dimensions
3. Create ImageData object
4. Calculate window/level bounds
5. For each pixel:
   - Apply window/level transformation
   - Normalize to 0-255 range
   - Set RGB values (grayscale: R=G=B)
   - Set alpha to 255
6. Put ImageData to canvas
```

**Window/Level Formula**:
```javascript
windowMin = level - window / 2
windowMax = level + window / 2

if (pixelValue < windowMin) {
  pixelValue = 0  // Black
} else if (pixelValue > windowMax) {
  pixelValue = 255  // White
} else {
  pixelValue = ((pixelValue - windowMin) / (windowMax - windowMin)) * 255
}
```

**Code Location**: `src/utils/dicomParser.js` lines 227-312

## Pixel Data Processing

### Bit Depth Handling

#### 8-Bit Images
```javascript
if (bitsAllocated === 8) {
  if (pixelRepresentation === 1) {
    // Signed 8-bit
    pixelArray = new Int8Array(pixelData)
  } else {
    // Unsigned 8-bit
    pixelArray = new Uint8Array(pixelData)
  }
}
```

#### 16-Bit Images
```javascript
if (bitsAllocated === 16) {
  if (pixelRepresentation === 1) {
    // Signed 16-bit
    pixelArray = new Int16Array(pixelData.buffer, offset, length / 2)
  } else {
    // Unsigned 16-bit
    pixelArray = new Uint16Array(pixelData.buffer, offset, length / 2)
  }
}
```

### Endianness Handling

**Problem**: Different systems store multi-byte values differently
- **Little-Endian**: Least significant byte first (Intel x86)
- **Big-Endian**: Most significant byte first (some DICOM files)

**Solution**:
```javascript
const transferSyntax = dataSet.string('x00020010')
const isBigEndian = transferSyntax === '1.2.840.10008.1.2.2' // Explicit VR Big Endian

if (isBigEndian) {
  // Swap bytes for big endian
  const view = new DataView(pixelData.buffer, offset, length)
  for (let i = 0; i < pixelArray.length; i++) {
    tempArray[i] = view.getInt16(i * 2, false) // false = big endian
  }
}
```

### Rescale Slope/Intercept

**Purpose**: Convert pixel values to Hounsfield units (for CT scans)

**Formula**:
```javascript
scaledValue = (pixelValue * rescaleSlope) + rescaleIntercept
```

**Implementation**:
```javascript
const rescaleSlope = parseFloat(dataSet.string('x00281053') || '1')
const rescaleIntercept = parseFloat(dataSet.string('x00281052') || '0')

const scaledPixelData = new Float32Array(pixelArray.length)
for (let i = 0; i < pixelArray.length; i++) {
  scaledPixelData[i] = pixelArray[i] * rescaleSlope + rescaleIntercept
}
```

**Hounsfield Units**:
- **Air**: -1000 HU
- **Water**: 0 HU
- **Soft Tissue**: 20-40 HU
- **Bone**: 400-3000 HU

## Window/Level Adjustment

### What is Window/Level?

**Window/Level** is a medical imaging technique to adjust contrast and brightness of images.

- **Window (Width)**: Range of pixel values displayed (controls contrast)
  - Narrow window = high contrast
  - Wide window = low contrast

- **Level (Center)**: Center point of the window (controls brightness)
  - Higher level = brighter image
  - Lower level = darker image

### Window/Level Formula

```javascript
windowMin = level - window / 2
windowMax = level + window / 2

if (pixelValue < windowMin) {
  output = 0  // Black (below window)
} else if (pixelValue > windowMax) {
  output = 255  // White (above window)
} else {
  // Linear mapping within window
  output = ((pixelValue - windowMin) / (windowMax - windowMin)) * 255
}
```

### Window/Level Presets

Different presets optimize viewing for different tissue types:

| Preset | Window | Level | Use Case |
|--------|--------|-------|----------|
| **Bone** | 1500 | 300 | Viewing bone structures |
| **Soft Tissue** | 400 | 50 | Viewing soft tissues |
| **Lung** | 1500 | -600 | Viewing lung structures |
| **Brain** | 80 | 40 | Viewing brain tissue |
| **Abdomen** | 400 | 50 | Viewing abdominal organs |

### Implementation in Code

**Location**: `src/components/DICOMViewer.jsx`

**State**:
```javascript
const [windowLevel, setWindowLevel] = useState({ window: 400, level: 50 })
```

**Preset Application**:
```javascript
const applyPreset = (preset) => {
  const presets = {
    bone: { window: 1500, level: 300 },
    softTissue: { window: 400, level: 50 },
    lung: { window: 1500, level: -600 },
    brain: { window: 80, level: 40 }
  }
  setWindowLevel(presets[preset])
}
```

**Real-time Update**:
```javascript
useEffect(() => {
  if (canvasRef.current && dicomData[currentFileIndex]) {
    renderDICOMToCanvas(
      canvasRef.current,
      dicomData[currentFileIndex],
      windowLevel
    )
  }
}, [currentFileIndex, windowLevel])
```

## DICOM File Upload Flow

### Complete Flow

```
1. User selects DICOM file(s)
   ↓
2. FileReader reads file as ArrayBuffer
   ↓
3. parseDICOMFile() called
   ↓
4. dicom-parser.parseDicom() parses structure
   ↓
5. Extract metadata tags
   ↓
6. Extract pixel data (tag x7FE00010)
   ↓
7. Determine bit depth (8 or 16)
   ↓
8. Determine endianness
   ↓
9. Convert pixel data to appropriate array type
   ↓
10. Apply rescale slope/intercept
    ↓
11. Store parsed data in state
    ↓
12. Render first image to canvas
    ↓
13. Apply window/level adjustment
    ↓
14. Display image in viewer
```

### Code Implementation

**Location**: `src/components/DICOMViewer.jsx`

**File Upload Handler**:
```javascript
const handleFileChange = async (files) => {
  const validFiles = Array.from(files).filter(file => 
    file.name.toLowerCase().endsWith('.dcm') || 
    file.type === 'application/dicom'
  )
  
  const previews = []
  const parsedData = []
  
  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i]
    try {
      const parsed = await parseDICOMFile(file)
      parsedData.push(parsed)
      
      // Create preview
      const canvas = document.createElement('canvas')
      canvas.width = parsed.width
      canvas.height = parsed.height
      renderDICOMToCanvas(canvas, parsed)
      previews.push(canvas.toDataURL())
    } catch (error) {
      console.error('Error parsing DICOM:', error)
    }
  }
  
  setDicomData(parsedData)
  setFilePreviews(previews)
}
```

## Image Rendering

### Canvas Rendering

**Why Canvas?**
- Direct pixel manipulation
- Fast rendering
- No external dependencies
- Works in all browsers

**Process**:
```javascript
1. Get canvas element reference
2. Get 2D rendering context
3. Set canvas dimensions
4. Create ImageData object
5. Fill ImageData with pixel values
6. Apply window/level transformation
7. Put ImageData to canvas
```

### Performance Considerations

1. **Pixel Data Size**: Large images (512x512, 1024x1024) have many pixels
2. **Processing Time**: Window/level calculation for each pixel
3. **Memory Usage**: Storing pixel data arrays
4. **Optimization**: Use typed arrays (Float32Array, Uint16Array)

## Common DICOM Challenges

### Challenge 1: Different Bit Depths
**Solution**: Check `bitsAllocated` tag and use appropriate array type

### Challenge 2: Endianness
**Solution**: Check transfer syntax and swap bytes if needed

### Challenge 3: Signed vs Unsigned
**Solution**: Check `pixelRepresentation` tag (0=unsigned, 1=signed)

### Challenge 4: Hounsfield Units
**Solution**: Apply rescale slope/intercept for CT scans

### Challenge 5: Window/Level Values
**Solution**: Extract from DICOM tags or use defaults

## DICOM Metadata Extraction

### Patient Name Parsing

**DICOM Format**: "LAST^FIRST^MIDDLE"
**Our Format**: "FIRST LAST"

**Code**:
```javascript
let patientName = dataSet.string('x00100010') || ''
if (patientName.includes('^')) {
  const nameParts = patientName.split('^')
  if (nameParts.length >= 2) {
    patientName = `${nameParts[1] || ''} ${nameParts[0] || ''}`.trim()
  }
}
```

### Date Parsing

**DICOM Format**: "YYYYMMDD"
**JavaScript Format**: Date object

**Code**:
```javascript
const studyDate = dataSet.string('x00080020') || ''
if (studyDate.length >= 8) {
  const year = studyDate.substring(0, 4)
  const month = studyDate.substring(4, 6)
  const day = studyDate.substring(6, 8)
  formattedDate = new Date(`${year}-${month}-${day}`)
}
```

### Gender Mapping

**DICOM Format**: "M", "F", "O"
**Our Format**: "male", "female", "other"

**Code**:
```javascript
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
```

## Error Handling

### Common Errors

1. **Pixel Data Not Found**
   - Error: "Pixel data not found in DICOM file"
   - Solution: Check if tag x7FE00010 exists

2. **Unsupported Bit Depth**
   - Error: "Unsupported bits allocated: X"
   - Solution: Only 8-bit and 16-bit supported

3. **Invalid DICOM File**
   - Error: "Invalid DICOM file"
   - Solution: Verify file is valid DICOM format

### Error Handling Code

```javascript
try {
  const parsed = await parseDICOMFile(file)
  // Process successfully
} catch (error) {
  console.error('Error parsing DICOM:', error)
  // Show error to user
  // Create placeholder image
}
```

## Best Practices

1. **Validate Files**: Check file extension and MIME type
2. **Error Handling**: Wrap parsing in try-catch
3. **Progress Feedback**: Show upload progress
4. **Memory Management**: Don't store all pixel data in memory
5. **Caching**: Cache rendered images
6. **Lazy Loading**: Parse files on demand

