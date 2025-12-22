# Technical Architecture Study Guide

## System Architecture Pattern

### Frontend-Backend Separation
- **Frontend**: React Single Page Application (SPA)
- **Backend**: Express.js REST API
- **Communication**: HTTP/JSON
- **Benefits**: 
  - Separation of concerns
  - Independent deployment
  - Scalability

### Database Architecture
- **Type**: MongoDB (NoSQL document database)
- **ODM**: Mongoose
- **Hosting**: MongoDB Atlas (Cloud)
- **Benefits**:
  - Flexible schema
  - Easy scaling
  - JSON-like structure

### Authentication Architecture
- **Method**: JWT (JSON Web Tokens)
- **Type**: Stateless authentication
- **Storage**: localStorage (frontend)
- **Benefits**:
  - No server-side session storage
  - Scalable across multiple servers
  - Works with SPAs

## Technology Stack Deep Dive

### Frontend Stack

#### React 18.2.0
- **Why**: Industry standard, component-based, large ecosystem
- **Key Features Used**:
  - Functional components
  - Hooks (useState, useEffect, useRef, useMemo, useCallback)
  - Context API for state management
- **File Structure**: Component-based organization

#### Vite 5.0.8
- **Why**: Fast build tool, HMR (Hot Module Replacement)
- **Benefits**: Quick development, optimized production builds
- **Configuration**: `vite.config.js`

#### React Router DOM v6.20.0
- **Purpose**: Client-side routing
- **Features**: Protected routes, navigation
- **Implementation**: `src/App.jsx`

#### State Management: Context API
- **AuthContext**: Authentication state
- **DataContext**: Patient/Study/Report data
- **NotificationContext**: Toast notifications
- **ThemeContext**: Theme management

#### DICOM Processing: dicom-parser v1.8.21
- **Purpose**: Parse DICOM files
- **Location**: `src/utils/dicomParser.js`
- **Functions**: `parseDICOMFile()`, `renderDICOMToCanvas()`

### Backend Stack

#### Node.js
- **Runtime**: JavaScript on server
- **Benefits**: Same language as frontend, large ecosystem

#### Express.js v4.18.2
- **Framework**: Web application framework
- **Features**: Routing, middleware, error handling
- **Location**: `backend/server.js`

#### MongoDB with Mongoose v8.0.3
- **ODM**: Object Document Mapper
- **Purpose**: Schema definition, validation, queries
- **Models**: User, Patient, Study, Report

#### Authentication: jsonwebtoken v9.0.2
- **Purpose**: JWT token generation and verification
- **Implementation**: `backend/middleware/auth.js`

#### Password Security: bcryptjs v2.4.3
- **Algorithm**: bcrypt with 10 salt rounds
- **Implementation**: Mongoose pre-save hook
- **Location**: `backend/models/User.js`

#### AI Integration: OpenAI API
- **Model**: GPT-3.5-turbo
- **Purpose**: Chatbot functionality
- **Location**: `backend/routes/chatbot.js`

## Data Flow Architecture

### Complete Request Flow

```
1. User Action (Frontend)
   ↓
2. React Component State Update
   ↓
3. Context API / API Service Layer
   ↓
4. HTTP Request (with JWT Token)
   ↓
5. Express Middleware (CORS, Body Parser)
   ↓
6. Authentication Middleware (JWT Verification)
   ↓
7. Route Handler (Business Logic)
   ↓
8. Mongoose Model (Database Query)
   ↓
9. MongoDB Database
   ↓
10. Response (JSON)
   ↓
11. Frontend State Update
   ↓
12. UI Re-render
```

### Example: User Registration Flow

```
1. User fills registration form
   ↓
2. Form submission triggers handleSubmit()
   ↓
3. AuthContext.register() called
   ↓
4. authAPI.register() sends POST /api/auth/register
   ↓
5. Backend validates input
   ↓
6. Password hashed via Mongoose pre-save hook
   ↓
7. User document created in MongoDB
   ↓
8. JWT token generated
   ↓
9. Response sent: { token, user }
   ↓
10. Token stored in localStorage
   ↓
11. User state updated in AuthContext
   ↓
12. Redirect to /viewer
```

### Example: DICOM File Upload Flow

```
1. User selects DICOM file
   ↓
2. File read as ArrayBuffer
   ↓
3. parseDICOMFile() called
   ↓
4. dicom-parser extracts metadata and pixel data
   ↓
5. Pixel data processed (bit depth, endianness)
   ↓
6. Window/Level applied
   ↓
7. Canvas rendering via renderDICOMToCanvas()
   ↓
8. Image displayed in viewer
   ↓
9. Metadata extracted for report generation
```

## Architecture Patterns Used

### 1. MVC Pattern (Backend)
- **Model**: Mongoose schemas (User, Patient, Study, Report)
- **View**: JSON responses
- **Controller**: Route handlers (`backend/routes/`)

### 2. Component Pattern (Frontend)
- **Atomic Components**: Small, reusable components
- **Container Components**: Stateful components with logic
- **Page Components**: Full page views

### 3. Context Pattern (State Management)
- **Global State**: Shared across components
- **Providers**: Wrap application
- **Consumers**: Access state via hooks

### 4. Service Layer Pattern
- **API Service**: `src/services/api.js`
- **Centralized**: All API calls in one place
- **Reusable**: Used by multiple components

## File Structure

### Frontend Structure
```
src/
├── components/          # Reusable UI components
│   ├── DICOMViewer.jsx # Main DICOM viewer
│   ├── Navigation.jsx  # Navigation bar
│   └── ...
├── pages/              # Page components
│   ├── PatientManagement.jsx
│   ├── Reports.jsx
│   └── ...
├── context/            # Context providers
│   ├── AuthContext.jsx
│   ├── DataContext.jsx
│   └── ...
├── services/           # API services
│   └── api.js
├── utils/             # Utility functions
│   └── dicomParser.js
└── App.jsx            # Main app component
```

### Backend Structure
```
backend/
├── config/            # Configuration
│   └── database.js
├── middleware/        # Express middleware
│   └── auth.js
├── models/           # Mongoose models
│   ├── User.js
│   ├── Patient.js
│   └── ...
├── routes/           # Route handlers
│   ├── auth.js
│   ├── patients.js
│   └── ...
└── server.js         # Main server file
```

## Communication Protocols

### HTTP Methods Used
- **GET**: Retrieve data
- **POST**: Create data
- **PUT**: Update data
- **DELETE**: Delete data

### Request Format
```javascript
// Headers
Authorization: Bearer <jwt-token>
Content-Type: application/json

// Body (for POST/PUT)
{
  "field1": "value1",
  "field2": "value2"
}
```

### Response Format
```javascript
// Success
{
  "data": {...},
  "message": "Success message"
}

// Error
{
  "error": "Error message"
}
```

## Security Architecture

### Authentication Flow
1. User provides credentials
2. Backend validates and generates JWT
3. Token sent to frontend
4. Token stored in localStorage
5. Token included in all protected requests
6. Backend verifies token on each request

### Authorization Flow
1. Request includes JWT token
2. Middleware extracts and verifies token
3. User ID extracted from token
4. Database queries filtered by user ID
5. Only user's own data returned

### Data Isolation
- **Implementation**: All queries include `createdBy: req.user._id`
- **Location**: All route handlers
- **Benefit**: Complete data separation

## Scalability Considerations

### Frontend Scalability
- **Code Splitting**: Lazy loading routes
- **Component Optimization**: React.memo, useMemo
- **State Management**: Context API (can migrate to Redux if needed)

### Backend Scalability
- **Stateless**: JWT allows horizontal scaling
- **Database**: MongoDB sharding for large datasets
- **Caching**: Can add Redis for session/data caching

### Database Scalability
- **Indexes**: Optimized queries
- **Sharding**: MongoDB Atlas supports automatic sharding
- **Replication**: MongoDB Atlas provides replication

## Performance Optimizations

### Frontend
- **Lazy Loading**: Components loaded on demand
- **Memoization**: useMemo, useCallback for expensive operations
- **Image Optimization**: Canvas rendering for DICOM images

### Backend
- **Database Indexes**: Fast queries
- **Query Optimization**: Select only needed fields
- **Error Handling**: Prevents crashes

## Deployment Architecture

### Development
- **Frontend**: Vite dev server (localhost:5173)
- **Backend**: Node.js with nodemon (localhost:5000)
- **Database**: MongoDB Atlas (cloud)

### Production (Recommended)
- **Frontend**: Static hosting (Vercel, Netlify)
- **Backend**: Node.js server (Heroku, AWS EC2)
- **Database**: MongoDB Atlas (cloud)
- **CDN**: For static assets

## Error Handling Architecture

### Frontend Error Handling
- **Try-Catch**: API calls wrapped in try-catch
- **Error Boundaries**: React ErrorBoundary component
- **User Feedback**: Toast notifications for errors

### Backend Error Handling
- **Middleware**: Global error handler
- **Validation**: Mongoose schema validation
- **HTTP Status Codes**: Appropriate status codes returned

## Testing Architecture (Future)

### Unit Testing
- **Frontend**: React Testing Library
- **Backend**: Jest, Supertest

### Integration Testing
- **API Testing**: Supertest
- **Database Testing**: Test database

### E2E Testing
- **Tool**: Cypress or Playwright
- **Scenarios**: Complete user workflows

