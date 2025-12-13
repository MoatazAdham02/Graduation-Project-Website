# Plaqio - Medical DICOM Viewer Project Documentation

## Overview
Plaqio is a web-based medical DICOM (Digital Imaging and Communications in Medicine) viewer application designed for healthcare professionals to upload, view, analyze, and manage medical imaging studies. The application features user authentication, patient management, DICOM file viewing with advanced tools, 3D volume rendering, and medical report generation.

**Tagline**: "Detect. Analyze. Monitor"

---

## Project Structure

```
Graduation-Project-Website/
├── backend/              # Node.js/Express backend server
├── src/                  # React frontend application
├── public/               # Static assets
└── Documentation files   # Various .md files
```

---

## Frontend Architecture

### Technology Stack
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **State Management**: React Context API
- **Styling**: CSS3 with CSS Variables
- **HTTP Client**: Fetch API
- **Icons**: React Icons (Feather Icons)
- **Notifications**: React Toastify

### Directory Structure

#### `/src/components/`
React components for UI elements and features.

| File | Purpose |
|------|---------|
| **DICOMViewer.jsx** | Main DICOM file viewer with upload, display, and analysis tools. Features include window/level adjustment, zoom, pan, rotation, measurements, annotations, filters, keyboard shortcuts, slice scroller, and 3D viewer integration. |
| **DICOMViewer.css** | Styles for the DICOM viewer including toolbar, image container, controls, and slice scroller. |
| **DICOMImageRenderer.jsx** | Component for rendering DICOM images to canvas with window/level adjustments. |
| **Volume3DViewer.jsx** | 3D volume rendering component for visualizing DICOM series in 3D space. |
| **Volume3DViewer.css** | Styles for the 3D viewer section. |
| **SeriesViewer.jsx** | Component for viewing multiple DICOM images in a grid layout. |
| **ComparisonViewer.jsx** | Side-by-side comparison tool for two DICOM images. |
| **Navigation.jsx** | Main navigation bar with links to all pages and user menu. |
| **Login.jsx** | User login page with email/password authentication. |
| **Register.jsx** | User registration page for creating new accounts. |
| **AuthLanding.jsx** | Landing page that presents login/register options. |
| **HeartIntro.jsx** | Homepage intro component with "Enter" button. |
| **ProgressIndicator.jsx** | Progress bar component for file uploads. |
| **ErrorBoundary.jsx** | React error boundary for catching and displaying errors gracefully. |

#### `/src/pages/`
Main page components for different sections of the application.

| File | Purpose |
|------|---------|
| **PatientManagement.jsx** | Patient CRUD operations page with search, filter, and card-based layout. Users can create, view, edit, and delete patients. |
| **Reports.jsx** | Medical reports management page with search, filter, and card-based layout matching Patients page. Users can view, edit, download, and print reports. |
| **Analytics.jsx** | Analytics dashboard for viewing statistics and insights. |
| **About.jsx** | About page explaining the website's purpose, features, security, and social media links. |

#### `/src/context/`
React Context providers for global state management.

| File | Purpose |
|------|---------|
| **AuthContext.jsx** | Manages authentication state, user data, login, register, and logout functions. Clears DICOM viewer data on login/register/logout. |
| **DataContext.jsx** | Manages patient, study, and report data operations. Provides functions for CRUD operations. |
| **NotificationContext.jsx** | Manages toast notifications for user feedback. |
| **ThemeContext.jsx** | Manages theme state (light/dark mode) and theme switching. |

#### `/src/services/`
API service layer for backend communication.

| File | Purpose |
|------|---------|
| **api.js** | Centralized API service with helper functions for all backend endpoints. Includes authAPI, patientsAPI, studiesAPI, and reportsAPI. Handles token management and error handling. |

#### `/src/utils/`
Utility functions and helpers.

| File | Purpose |
|------|---------|
| **dicomParser.js** | DICOM file parsing utilities using `dicom-parser` library. Extracts metadata and pixel data from DICOM files. Includes `parseDICOMFile` and `renderDICOMToCanvas` functions. |

#### `/src/App.jsx`
Main application component with routing configuration. Sets up protected routes, context providers, and route definitions.

#### `/src/main.jsx`
Application entry point that renders the App component to the DOM.

---

## Backend Architecture

### Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Environment**: dotenv

### Directory Structure

#### `/backend/server.js`
Main Express server file. Configures middleware (CORS, JSON parsing), connects to MongoDB, sets up routes, and starts the server on port 5000.

#### `/backend/config/`
Configuration files.

| File | Purpose |
|------|---------|
| **database.js** | MongoDB connection configuration using Mongoose. Handles connection to MongoDB database. |

#### `/backend/middleware/`
Express middleware functions.

| File | Purpose |
|------|---------|
| **auth.js** | JWT authentication middleware (`protect` function). Verifies JWT tokens from Authorization header and attaches user to request object. |

#### `/backend/models/`
Mongoose schema definitions for database collections.

| File | Purpose |
|------|---------|
| **User.js** | User schema with email, password (hashed), firstName, lastName, role. Includes password hashing hook and comparePassword method. |
| **Patient.js** | Patient schema with name, patientId, email, dateOfBirth, gender, phone, address, status, and createdBy (references User). Includes indexes for search and filtering. |
| **Study.js** | Study schema with patientId, studyId, modality, studyDate, description, bodyPart, files array, dicomData, and uploadedBy (references User). |
| **Report.js** | Report schema with studyId, patientId, reportId, findings array, recommendations, physicianName, physicianTitle, reportDate, and createdBy (references User). |

#### `/backend/routes/`
Express route handlers for API endpoints.

| File | Purpose |
|------|---------|
| **auth.js** | Authentication routes: POST `/api/auth/register`, POST `/api/auth/login`, GET `/api/auth/me`. Handles user registration, login, and current user retrieval. |
| **patients.js** | Patient CRUD routes: GET `/api/patients`, GET `/api/patients/:id`, POST `/api/patients`, PUT `/api/patients/:id`, DELETE `/api/patients/:id`. All routes filter by `createdBy: req.user._id` for user isolation. |
| **studies.js** | Study CRUD routes: GET `/api/studies`, GET `/api/studies/:id`, POST `/api/studies`, PUT `/api/studies/:id`, DELETE `/api/studies/:id`. All routes filter by `uploadedBy: req.user._id` for user isolation. |
| **reports.js** | Report CRUD routes: GET `/api/reports`, GET `/api/reports/:id`, POST `/api/reports`, PUT `/api/reports/:id`, DELETE `/api/reports/:id`. All routes filter by `createdBy: req.user._id` for user isolation. Includes population of related Patient and Study data. |

---

## Database Hierarchy

### Database: MongoDB
**Database Name**: `medical_dicom` (or as configured in MongoDB URI)

### Collections

#### 1. **Users Collection**
Stores user accounts (doctors, radiologists, administrators).

**Schema Fields**:
- `_id`: ObjectId (Primary Key)
- `email`: String (Unique, Required, Lowercase)
- `password`: String (Required, Hashed with bcrypt)
- `firstName`: String (Required)
- `lastName`: String (Required)
- `role`: String (Enum: 'doctor', 'radiologist', 'admin', Default: 'doctor')
- `createdAt`: Date (Auto-generated)

**Indexes**: `email` (unique)

**Methods**: `comparePassword(candidatePassword)` - Compares plain text password with hash

**Hooks**: `pre('save')` - Hashes password before saving

---

#### 2. **Patients Collection**
Stores patient information and demographics.

**Schema Fields**:
- `_id`: ObjectId (Primary Key)
- `name`: String (Required)
- `patientId`: String (Unique, Required)
- `email`: String (Optional, Lowercase)
- `dateOfBirth`: Date (Required)
- `gender`: String (Required, Enum: 'male', 'female', 'other')
- `phone`: String (Optional)
- `address`: Object (Optional)
  - `street`: String
  - `city`: String
  - `state`: String
  - `zipCode`: String
- `status`: String (Enum: 'active', 'inactive', Default: 'active')
- `createdBy`: ObjectId (Required, References User._id)
- `createdAt`: Date (Auto-generated)
- `updatedAt`: Date (Auto-updated)

**Indexes**: 
- `patientId` (unique)
- `name`, `email` (text search)
- `createdBy` (for user filtering)

**Hooks**: `pre('save')` - Updates `updatedAt` before saving

---

#### 3. **Studies Collection**
Stores DICOM study information and file metadata.

**Schema Fields**:
- `_id`: ObjectId (Primary Key)
- `patientId`: ObjectId (Required, References Patient._id)
- `studyId`: String (Unique, Required)
- `modality`: String (Required, Enum: 'CT', 'MRI', 'X-Ray', 'Ultrasound', 'PET', 'Other')
- `studyDate`: Date (Required, Default: Date.now)
- `description`: String (Optional)
- `bodyPart`: String (Optional)
- `files`: Array of Objects
  - `fileName`: String (Required)
  - `fileSize`: Number (Required, bytes)
  - `filePath`: String (Optional)
  - `uploadedAt`: Date (Auto-generated)
- `dicomData`: Object (Optional)
  - `width`: Number
  - `height`: Number
  - `pixelSpacing`: String
  - `sliceThickness`: Number
- `uploadedBy`: ObjectId (Optional, References User._id)
- `uploadedAt`: Date (Auto-generated)

**Indexes**: 
- `patientId` (for patient filtering)
- `studyId` (unique)
- `studyDate` (descending, for sorting)

---

#### 4. **Reports Collection**
Stores medical reports generated from studies.

**Schema Fields**:
- `_id`: ObjectId (Primary Key)
- `studyId`: ObjectId (Required, References Study._id)
- `patientId`: ObjectId (Required, References Patient._id)
- `reportId`: String (Unique, Required)
- `findings`: Array of Objects
  - `title`: String (Required)
  - `value`: String (Required)
  - `status`: String (Enum: 'normal', 'warning', 'critical', Default: 'normal')
- `recommendations`: Array of Strings
- `physicianName`: String (Optional)
- `physicianTitle`: String (Optional)
- `reportDate`: Date (Default: Date.now)
- `createdBy`: ObjectId (Optional, References User._id)
- `createdAt`: Date (Auto-generated)
- `updatedAt`: Date (Auto-updated)

**Indexes**: 
- `studyId` (for study filtering)
- `patientId` (for patient filtering)
- `reportId` (unique)
- `reportDate` (descending, for sorting)

**Hooks**: `pre('save')` - Updates `updatedAt` before saving

---

### Entity Relationships

```
User (1) ──< creates >── (N) Patient
User (1) ──< uploads >── (N) Study
User (1) ──< creates >── (N) Report
Patient (1) ──< has >── (N) Study
Patient (1) ──< has >── (N) Report
Study (1) ──< generates >── (1) Report
```

**Relationship Details**:
- **User → Patient**: One-to-Many (via `Patient.createdBy`)
- **User → Study**: One-to-Many (via `Study.uploadedBy`)
- **User → Report**: One-to-Many (via `Report.createdBy`)
- **Patient → Study**: One-to-Many (via `Study.patientId`)
- **Patient → Report**: One-to-Many (via `Report.patientId`)
- **Study → Report**: One-to-One (via `Report.studyId`)

---

## Key Features Implemented

### Frontend Features
1. **User Authentication**: Login, registration, protected routes
2. **DICOM Viewer**: 
   - File upload (drag & drop or click)
   - Multi-slice navigation with slice scroller
   - Window/Level adjustment with presets
   - Zoom, pan, rotation controls
   - Measurement tools (distance measurement)
   - Image filters (invert, brightness, contrast)
   - Keyboard shortcuts
   - Thumbnail strip with auto-scroll
   - Metadata panel
   - 3D volume viewer
   - Report generation
   - Local storage persistence
3. **Patient Management**: CRUD operations with search and filter
4. **Reports Management**: View, edit, download, print reports
5. **About Page**: Website information and social media links
6. **Theme Support**: Light/dark mode
7. **Responsive Design**: Mobile-friendly layouts

### Backend Features
1. **JWT Authentication**: Secure token-based authentication
2. **User Isolation**: All data filtered by `createdBy` or `uploadedBy` to ensure users only see their own data
3. **RESTful API**: Standard CRUD operations for all resources
4. **Data Validation**: Mongoose schema validation
5. **Password Security**: bcrypt hashing with 10 salt rounds
6. **CORS Configuration**: Configured for development and production
7. **Error Handling**: Comprehensive error handling middleware

### Security Features
1. **Password Hashing**: All passwords hashed with bcrypt
2. **JWT Tokens**: Secure token-based authentication
3. **User Data Isolation**: Users can only access their own data
4. **Input Validation**: Server-side validation on all inputs
5. **Protected Routes**: Frontend and backend route protection

---

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Patients (`/api/patients`)
- `GET /api/patients` - Get all patients for logged-in user (Protected)
- `GET /api/patients/:id` - Get single patient (Protected)
- `POST /api/patients` - Create patient (Protected)
- `PUT /api/patients/:id` - Update patient (Protected)
- `DELETE /api/patients/:id` - Delete patient (Protected)

### Studies (`/api/studies`)
- `GET /api/studies` - Get all studies for logged-in user (Protected)
- `GET /api/studies/:id` - Get single study (Protected)
- `POST /api/studies` - Create study (Protected)
- `PUT /api/studies/:id` - Update study (Protected)
- `DELETE /api/studies/:id` - Delete study (Protected)

### Reports (`/api/reports`)
- `GET /api/reports` - Get all reports for logged-in user (Protected)
- `GET /api/reports/:id` - Get single report (Protected)
- `POST /api/reports` - Create report (Protected)
- `PUT /api/reports/:id` - Update report (Protected)
- `DELETE /api/reports/:id` - Delete report (Protected)

---

## Data Flow

```
User Registration/Login
  ↓
JWT Token Generated
  ↓
Token Stored in localStorage
  ↓
Protected API Calls with Token
  ↓
Backend Validates Token & Filters Data by User ID
  ↓
Data Returned to Frontend
  ↓
React Components Update UI
```

---

## Environment Variables

### Frontend (`.env`)
- `VITE_API_URL` - Backend API URL (default: `http://localhost:5000/api`)

### Backend (`.env`)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS

---

## Local Storage Usage

### Frontend
- `authToken` - JWT authentication token
- `rememberedUser` - User email for "Remember Me" feature
- `dicomViewerData` - DICOM viewer state (file previews, metadata, report, current index, window/level settings)
- Theme preferences (if implemented)

**Note**: DICOM viewer data is cleared on login, register, and logout to ensure fresh start for each user session.

---

## Recent Enhancements

1. **Slice Scroller**: Added looping slice navigator with auto-scroll functionality
2. **User Data Isolation**: All backend routes filter by logged-in user
3. **Reports Page Layout**: Matched Patients page layout with card-based design
4. **About Page**: Added information page with social media links
5. **DICOM Viewer Persistence**: Local storage persistence for DICOM viewer state
6. **3D Viewer Integration**: Inline 3D volume viewer section
7. **Branding Update**: Changed from "Medical DICOM Viewer" to "Plaqio" with tagline
8. **DICOM Viewer Tools**: Added measurement tools, filters, presets, keyboard shortcuts

---

## Dependencies

### Frontend
- `react`, `react-dom` - React framework
- `react-router-dom` - Routing
- `react-icons` - Icon library
- `react-toastify` - Toast notifications
- `dicom-parser` - DICOM file parsing
- `pdf-lib` - PDF generation
- `vite` - Build tool

### Backend
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cors` - CORS middleware
- `dotenv` - Environment variables

---

*Last Updated: Based on current project state*

