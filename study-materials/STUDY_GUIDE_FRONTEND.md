# Frontend Study Guide

## React Architecture

### Component Structure

**Functional Components**: All components use function syntax with hooks

**Example**:
```javascript
const DICOMViewer = () => {
  const [state, setState] = useState(initialValue)
  // Component logic
  return <div>JSX</div>
}
```

### Key React Hooks Used

#### useState
- **Purpose**: Manage component state
- **Usage**: All stateful components
- **Example**: `const [zoom, setZoom] = useState(1)`

#### useEffect
- **Purpose**: Side effects (API calls, subscriptions, DOM manipulation)
- **Dependencies**: Array of dependencies
- **Example**: 
```javascript
useEffect(() => {
  // Effect code
}, [dependency1, dependency2])
```

#### useRef
- **Purpose**: Access DOM elements, store mutable values
- **Usage**: Canvas references, file input references
- **Example**: `const canvasRef = useRef(null)`

#### useMemo
- **Purpose**: Memoize expensive calculations
- **Usage**: Computed values that don't need recalculation
- **Example**: `const filteredData = useMemo(() => ..., [dependencies])`

#### useCallback
- **Purpose**: Memoize functions
- **Usage**: Functions passed as props
- **Example**: `const handleClick = useCallback(() => ..., [deps])`

## Context API

### Context Providers

#### 1. AuthContext
**Location**: `src/context/AuthContext.jsx`

**Purpose**: Manage authentication state

**State**:
- `isAuthenticated` (boolean)
- `user` (object: id, email, firstName, lastName, role)
- `loading` (boolean)

**Functions**:
- `register(userData)` - Register and auto-login
- `login(email, password, rememberMe)` - Login user
- `logout()` - Clear token and state
- `checkAuth()` - Validate token on page load

**Usage**:
```javascript
const { isAuthenticated, user, login, logout } = useAuth()
```

#### 2. DataContext
**Location**: `src/context/DataContext.jsx`

**Purpose**: Manage patient, study, and report data

**Functions**:
- `addPatient(patientData)`
- `updatePatient(id, patientData)`
- `deletePatient(id)`
- `addStudy(studyData)`
- `addReport(reportData)`
- `refreshData()` - Refetch all data

**Usage**:
```javascript
const { patients, addPatient, refreshData } = useData()
```

#### 3. NotificationContext
**Location**: `src/context/NotificationContext.jsx`

**Purpose**: Show toast notifications

**Functions**:
- `notify(message, type)`
- `notifySuccess(message)`
- `notifyError(message)`

**Usage**:
```javascript
const { notifySuccess, notifyError } = useNotifications()
```

#### 4. ThemeContext
**Location**: `src/context/ThemeContext.jsx`

**Purpose**: Manage theme (light/dark)

**State**:
- `theme` ('light' | 'dark')

**Functions**:
- `toggleTheme()`

**Usage**:
```javascript
const { theme, toggleTheme } = useTheme()
```

## Main Components

### 1. DICOM Viewer

**Location**: `src/components/DICOMViewer.jsx` (1871 lines)

**Purpose**: Main DICOM file viewing component

**Key Features**:
- File upload (drag & drop)
- DICOM parsing
- Image display (canvas)
- Window/Level adjustment
- Zoom, pan, rotation
- Annotations
- Image filters
- Slice navigation
- Report generation

**State Management**:
- 30+ useState hooks
- Multiple useRef for DOM references
- useEffect for side effects

**Key Functions**:
- `handleFileChange()` - Process uploaded files
- `handleWindowLevelChange()` - Adjust contrast/brightness
- `handleZoom()` - Zoom in/out
- `handlePan()` - Pan image
- `generateReport()` - Create medical report

### 2. Patient Management

**Location**: `src/pages/PatientManagement.jsx`

**Purpose**: CRUD operations for patients

**Features**:
- Create patient
- View patient list (cards)
- Edit patient
- Delete patient
- Search patients
- Filter by status

**State**:
- `patients` - Array of patients
- `searchTerm` - Search query
- `statusFilter` - Active/inactive filter
- `showForm` - Form visibility

**API Integration**:
- Uses `patientsAPI` from `src/services/api.js`

### 3. Reports

**Location**: `src/pages/Reports.jsx`

**Purpose**: View and manage medical reports

**Features**:
- View reports (cards)
- Edit reports
- Export to PDF
- Print reports
- Search reports
- Filter reports

**PDF Generation**:
- Uses `pdf-lib` library
- Generates structured PDF with patient info, findings, recommendations

### 4. Navigation

**Location**: `src/components/Navigation.jsx`

**Purpose**: Main navigation bar

**Features**:
- Links to all pages
- User menu (logout)
- Help button (keyboard shortcuts)

**Routing**:
- Uses React Router `Link` components
- Active route highlighting

## Routing

### Route Configuration

**Location**: `src/App.jsx`

**Routes**:
```javascript
/                    → HomePage (public)
/login              → Login (public)
/register           → Register (public)
/viewer             → DICOMViewer (protected)
/patients           → PatientManagement (protected)
/reports            → Reports (protected)
/analytics          → Analytics (protected)
```

### Protected Routes

**Implementation**:
```javascript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  return isAuthenticated ? children : <Navigate to="/login" />
}
```

**Usage**:
```javascript
<Route
  path="/patients"
  element={
    <ProtectedRoute>
      <PatientManagement />
    </ProtectedRoute>
  }
/>
```

## API Service Layer

### Centralized API Service

**Location**: `src/services/api.js`

**Purpose**: All API calls in one place

**Structure**:
```javascript
// Helper function
async function apiCall(endpoint, options) {
  const token = localStorage.getItem('authToken')
  // Add token to headers
  // Make request
  // Handle errors
  // Return data
}

// API modules
export const authAPI = { register, login, getCurrentUser }
export const patientsAPI = { getAll, getById, create, update, delete }
export const studiesAPI = { getAll, getById, create, update, delete }
export const reportsAPI = { getAll, getById, create, update, delete }
export const chatbotAPI = { sendMessage }
```

**Features**:
- Automatic token injection
- Error handling
- Network error detection
- JSON parsing

## Styling

### CSS Architecture

**Approach**: Component-scoped CSS files

**Structure**:
- Each component has its own `.css` file
- CSS Variables for theming
- Responsive design with media queries

### CSS Variables

**Location**: `src/index.css`

**Variables**:
```css
--bg-primary: Background color
--bg-secondary: Secondary background
--text-primary: Primary text color
--text-secondary: Secondary text color
--primary: Primary accent color
--border: Border color
--gradient-primary: Gradient background
```

### Design Patterns

#### Glassmorphism
```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.2);
```

#### Gradient Backgrounds
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

#### Animations
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

## Form Handling

### Form State Management

**Pattern**: Controlled components

**Example**:
```javascript
const [formData, setFormData] = useState({
  name: '',
  email: ''
})

const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  })
}
```

### Form Validation

**Types**:
- Real-time validation (on blur)
- Submit validation
- Error messages display

**Example**:
```javascript
const validateField = (name, value) => {
  switch (name) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return 'Invalid email'
      }
      return ''
  }
}
```

## State Management Patterns

### Local State (useState)
- Component-specific state
- Not shared with other components

### Context State (Context API)
- Shared state across components
- Global state (auth, data, notifications)

### Derived State (useMemo)
- Computed from other state
- Memoized for performance

### Ref State (useRef)
- Mutable values that don't trigger re-renders
- DOM element references

## Performance Optimizations

### 1. Memoization
```javascript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])
```

### 2. Callback Memoization
```javascript
const handleClick = useCallback(() => {
  // Handler code
}, [dependencies])
```

### 3. Lazy Loading
```javascript
const LazyComponent = React.lazy(() => import('./Component'))
```

### 4. Code Splitting
- Route-based code splitting
- Component-based code splitting

## Error Handling

### Error Boundaries

**Location**: `src/components/ErrorBoundary.jsx`

**Purpose**: Catch React errors

**Usage**:
```javascript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### API Error Handling

**Pattern**: Try-catch blocks

**Example**:
```javascript
try {
  const data = await apiCall('/endpoint')
  // Handle success
} catch (error) {
  // Handle error
  notifyError(error.message)
}
```

## User Experience Features

### Loading States
- Skeleton loaders
- Progress indicators
- Spinner animations

### Empty States
- Helpful messages
- Call-to-action buttons
- Illustrations

### Notifications
- Toast notifications (React Toastify)
- Success messages
- Error messages
- Info messages

### Responsive Design
- Mobile-friendly layouts
- Media queries
- Flexible grid systems

## Key Frontend Patterns

### 1. Container/Presentational Pattern
- Container: Logic and state
- Presentational: UI only

### 2. Custom Hooks
- Reusable logic
- Example: `useAuth()`, `useData()`

### 3. Higher-Order Components
- Not used in this project (using hooks instead)

### 4. Render Props
- Not used in this project

## File Upload

### DICOM File Upload

**Implementation**:
```javascript
const handleFileChange = async (files) => {
  const validFiles = Array.from(files).filter(file => 
    file.name.endsWith('.dcm')
  )
  
  for (const file of validFiles) {
    const parsed = await parseDICOMFile(file)
    // Process file
  }
}
```

**Features**:
- Drag & drop
- Click to browse
- Multiple file support
- File validation
- Progress indication

## Canvas Rendering

### DICOM Image Rendering

**Purpose**: Display DICOM images

**Implementation**:
```javascript
const canvasRef = useRef(null)

useEffect(() => {
  if (canvasRef.current && dicomData) {
    renderDICOMToCanvas(canvasRef.current, dicomData, windowLevel)
  }
}, [dicomData, windowLevel])
```

**Features**:
- Real-time rendering
- Window/Level adjustment
- Zoom and pan
- Annotations overlay

## Keyboard Shortcuts

### Implementation

**Location**: `src/components/DICOMViewer.jsx`

**Shortcuts**:
- Arrow keys: Navigate slices
- +/-: Zoom in/out
- R: Reset view
- Space: Play/pause
- F: Fit to window

**Code**:
```javascript
useEffect(() => {
  const handleKeyPress = (e) => {
    switch(e.key) {
      case 'ArrowLeft':
        // Previous slice
        break
      case 'ArrowRight':
        // Next slice
        break
    }
  }
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [])
```

## Local Storage

### Usage

**Stored Data**:
- `authToken` - JWT token
- `rememberedUser` - User email
- `dicomViewerData` - DICOM viewer state

**Implementation**:
```javascript
// Save
localStorage.setItem('key', JSON.stringify(data))

// Load
const data = JSON.parse(localStorage.getItem('key'))

// Clear
localStorage.removeItem('key')
```

## Best Practices

1. **Component Organization**: One component per file
2. **Reusability**: Extract common logic to hooks
3. **Performance**: Memoize expensive calculations
4. **Error Handling**: Try-catch around async operations
5. **Accessibility**: Semantic HTML, ARIA labels
6. **Code Splitting**: Lazy load routes
7. **Type Safety**: Consider TypeScript for future

