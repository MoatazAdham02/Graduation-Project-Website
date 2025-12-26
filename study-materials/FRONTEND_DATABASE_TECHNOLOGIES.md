# Frontend & Database Technologies

## **FRONTEND**

### **Core Framework & Build Tools**
- **React** 18.2.0 — UI library
  - *What it does*: Component-based UI framework for building interactive interfaces
  - *Example*: `const Component = () => <div>Hello</div>`

- **React DOM** 18.2.0 — React rendering
  - *What it does*: Renders React components to the browser DOM
  - *Example*: `ReactDOM.render(<App />, document.getElementById('root'))`

- **Vite** 5.0.8 — Build tool & dev server
  - *What it does*: Fast build tool with hot module replacement (HMR)
  - *Example*: `npm run dev` starts dev server at `localhost:5173`

- **@vitejs/plugin-react** — Vite React plugin
  - *What it does*: Enables React JSX transformation in Vite
  - *Example*: `plugins: [react()]` in `vite.config.js`

### **Routing & Navigation**
- **react-router-dom** 6.20.0 — Client-side routing
  - *What it does*: Handles navigation between pages without page reload
  - *Example*: `<Route path="/patients" element={<PatientManagement />} />`

### **UI & Icons**
- **react-icons** 4.12.0 — Icon library (Feather Icons)
  - *What it does*: Provides icon components (FiUser, FiHome, etc.)
  - *Example*: `import { FiUser } from 'react-icons/fi'` then `<FiUser />`

- **react-toastify** 9.1.3 — Toast notifications
  - *What it does*: Shows temporary notification messages
  - *Example*: `toast.success('Login successful!')`

### **DICOM & Medical Imaging**
- **dicom-parser** 1.8.21 — DICOM parsing
  - *What it does*: Parses DICOM file format to extract medical image data
  - *Example*: `const dataSet = dicomParser.parseDicom(arrayBuffer)`

- **cornerstone-core** 2.6.1 — Medical image rendering
  - *What it does*: Renders medical images (CT, MRI) in browser
  - *Example*: `cornerstone.enable(element)` then `cornerstone.loadImage(imageId)`

- **cornerstone-tools** 6.0.4 — Image manipulation tools
  - *What it does*: Provides tools for zoom, pan, window/level adjustments
  - *Example*: `cornerstoneTools.addTool(ZoomTool)`

- **cornerstone-web-image-loader** 2.1.0 — Image loading
  - *What it does*: Loads images for Cornerstone to display
  - *Example*: `cornerstoneWebImageLoader.external.cornerstone = cornerstone`

- **vtk.js** 29.0.0 — 3D visualization
  - *What it does*: Renders 3D medical image volumes
  - *Example*: `vtkActor.setMapper(vtkMapper)` for 3D rendering

### **Utilities**
- **date-fns** 2.30.0 — Date formatting
  - *What it does*: Formats and manipulates dates
  - *Example*: `format(new Date(), 'MMM dd, yyyy')` → "Jan 15, 2024"

- **pdf-lib** 1.17.1 — PDF generation
  - *What it does*: Creates PDF files programmatically
  - *Example*: `const pdfDoc = await PDFDocument.create()` then `pdfDoc.addPage()`

### **State Management**
- React Context API (AuthContext, ThemeContext, NotificationContext, DataContext)
  - *What it does*: Shares state across components without prop drilling
  - *Example*: `const { user } = useContext(AuthContext)`

- React Hooks (useState, useEffect, useRef, useMemo, useCallback, useNavigate, useLocation)
  - *What it does*: Manages component state, side effects, and navigation
  - *Example*: `const [count, setCount] = useState(0)` or `useEffect(() => {}, [])`

### **API Communication**
- Native **fetch API** (no axios) — HTTP requests
  - *What it does*: Makes HTTP requests to backend API
  - *Example*: `fetch('/api/patients', { method: 'GET', headers: {...} })`

- Custom `api.js` service layer
  - *What it does*: Wraps fetch with auth tokens and error handling
  - *Example*: `patientsAPI.getAll()` returns patient data

### **Styling**
- CSS3 (glassmorphism, animations, gradients)
  - *What it does*: Modern CSS effects (frosted glass, smooth animations)
  - *Example*: `background: rgba(255,255,255,0.1); backdrop-filter: blur(10px)`

- CSS Modules per component
  - *What it does*: Scoped CSS to prevent style conflicts
  - *Example*: `import styles from './Component.css'` then `className={styles.card}`

---

## **DATABASE**

### **Database System**
- **MongoDB Atlas** (cloud) — NoSQL database
  - *What it does*: Cloud-hosted MongoDB database (free tier available)
  - *Example*: Connection string `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

- Connection via MongoDB connection string
  - *What it does*: Connects backend to cloud database
  - *Example*: `mongoose.connect(process.env.MONGODB_URI)`

### **ODM (Object Document Mapper)**
- **Mongoose** 8.0.3 — MongoDB object modeling
  - *What it does*: Defines schemas and provides methods to interact with MongoDB
  - *Example*: `const User = mongoose.model('User', userSchema)` then `User.create({...})`

### **Database Models**
1. **User** — Authentication (email, password, firstName, lastName, role)
   - *What it does*: Stores user accounts with hashed passwords
   - *Example*: `{ email: "doc@hospital.com", role: "doctor" }`

2. **Patient** — Patient records (name, patientId, dateOfBirth, gender, contact info)
   - *What it does*: Stores patient demographic information
   - *Example*: `{ name: "John Doe", patientId: "P001", dateOfBirth: "1990-01-01" }`

3. **Study** — DICOM studies (patientId, studyId, modality, files, DICOM data)
   - *What it does*: Stores medical imaging study information
   - *Example*: `{ modality: "CT", studyId: "S001", patientId: ObjectId("...") }`

4. **Report** — Medical reports (studyId, patientId, findings, recommendations)
   - *What it does*: Stores medical report findings and recommendations
   - *Example*: `{ findings: [{title: "Lung", value: "Normal"}], reportId: "R001" }`

### **Database Features**
- Schema validation
  - *What it does*: Ensures data matches defined structure before saving
  - *Example*: `email: { type: String, required: true, match: /^\\S+@\\S+\\.\\S+$/ }`

- Pre-save hooks (password hashing, timestamps)
  - *What it does*: Runs code before saving (e.g., hash password automatically)
  - *Example*: `schema.pre('save', async function() { this.password = await hash(this.password) })`

- Indexes for performance
  - *What it does*: Speeds up database queries on frequently searched fields
  - *Example*: `schema.index({ patientId: 1 })` makes patientId searches faster

- References between models (ObjectId refs)
  - *What it does*: Links documents (e.g., Study references Patient)
  - *Example*: `patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }`

- Auto-updating timestamps
  - *What it does*: Automatically sets createdAt and updatedAt fields
  - *Example*: `updatedAt: { type: Date, default: Date.now }` updates on save

### **Backend Database Libraries**
- **bcryptjs** 2.4.3 — Password hashing
  - *What it does*: Securely hashes passwords before storing in database
  - *Example*: `const hash = await bcrypt.hash(password, 10)` then `await bcrypt.compare(password, hash)`

- **jsonwebtoken** 9.0.2 — JWT authentication
  - *What it does*: Creates and verifies JWT tokens for user authentication
  - *Example*: `jwt.sign({ userId }, secret)` creates token, `jwt.verify(token, secret)` verifies

- **dotenv** 16.3.1 — Environment variables
  - *What it does*: Loads environment variables from .env file
  - *Example*: `require('dotenv').config()` then `process.env.MONGODB_URI`

- **express** 4.18.2 — Backend framework
  - *What it does*: Creates REST API endpoints and handles HTTP requests
  - *Example*: `app.get('/api/patients', (req, res) => res.json(patients))`

- **cors** 2.8.5 — CORS handling
  - *What it does*: Allows frontend to make requests to backend from different origin
  - *Example*: `app.use(cors({ origin: 'http://localhost:5173' }))`

---

## **Summary**
**Frontend**: React + Vite frontend with DICOM libraries  
**Database**: MongoDB Atlas with Mongoose ODM on the backend

