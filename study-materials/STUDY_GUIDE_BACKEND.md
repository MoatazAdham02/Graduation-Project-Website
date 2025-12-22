# Backend Study Guide

## Server Architecture

### Express.js Setup

**Location**: `backend/server.js`

**Structure**:
```javascript
1. Import dependencies
2. Connect to MongoDB
3. Create Express app
4. Configure middleware (CORS, body parser)
5. Define routes
6. Error handling
7. Start server
```

### Middleware Stack

**Order Matters**: Middleware executes in order

1. **CORS**: Cross-origin resource sharing
2. **Request Logging**: Log all requests
3. **Body Parser**: Parse JSON and URL-encoded bodies
4. **Routes**: Handle API endpoints
5. **404 Handler**: Handle unknown routes
6. **Error Handler**: Catch all errors

## API Endpoints

### Authentication Routes

**Location**: `backend/routes/auth.js`

#### POST /api/auth/register
**Purpose**: Register new user

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "doctor"
}
```

**Process**:
1. Validate input
2. Check if user exists
3. Create user (password auto-hashed)
4. Generate JWT token
5. Return token and user data

**Response**:
```json
{
  "message": "User created successfully",
  "token": "eyJhbGci...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "doctor"
  }
}
```

#### POST /api/auth/login
**Purpose**: Login user

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Process**:
1. Validate input
2. Find user by email
3. Verify password
4. Generate JWT token
5. Return token and user data

#### GET /api/auth/me
**Purpose**: Get current user (protected)

**Headers**:
```
Authorization: Bearer <token>
```

**Process**:
1. Verify JWT token (middleware)
2. Find user by ID from token
3. Return user data

### Patient Routes

**Location**: `backend/routes/patients.js`

**All routes protected, filtered by `createdBy: req.user._id`**

#### GET /api/patients
**Purpose**: Get all patients for logged-in user

**Query Parameters**:
- `search`: Search term (name, email, patientId)
- `status`: Filter by status (active/inactive)

**Response**:
```json
[
  {
    "_id": "...",
    "name": "Jane Smith",
    "patientId": "P001",
    "email": "jane@example.com",
    "dateOfBirth": "1990-01-01",
    "gender": "female",
    "status": "active",
    "createdBy": "...",
    "createdAt": "..."
  }
]
```

#### GET /api/patients/:id
**Purpose**: Get single patient

**Process**:
1. Verify user owns patient
2. Return patient data

#### POST /api/patients
**Purpose**: Create patient

**Request Body**:
```json
{
  "name": "Jane Smith",
  "patientId": "P001",
  "email": "jane@example.com",
  "dateOfBirth": "1990-01-01",
  "gender": "female",
  "phone": "123-456-7890",
  "address": {
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "zipCode": "12345"
  }
}
```

**Process**:
1. Validate input
2. Check duplicate patientId
3. Create patient with `createdBy: req.user._id`
4. Return created patient

#### PUT /api/patients/:id
**Purpose**: Update patient

**Process**:
1. Verify user owns patient
2. Validate input
3. Update patient
4. Return updated patient

#### DELETE /api/patients/:id
**Purpose**: Delete patient

**Process**:
1. Verify user owns patient
2. Delete patient
3. Return success message

### Study Routes

**Location**: `backend/routes/studies.js`

**All routes protected, filtered by `uploadedBy: req.user._id`**

#### GET /api/studies
**Purpose**: Get all studies for logged-in user

#### GET /api/studies/:id
**Purpose**: Get single study

#### POST /api/studies
**Purpose**: Create study

**Request Body**:
```json
{
  "patientId": "...",
  "studyId": "S001",
  "modality": "CT",
  "studyDate": "2024-01-01",
  "description": "Chest CT",
  "files": [...]
}
```

#### PUT /api/studies/:id
**Purpose**: Update study

#### DELETE /api/studies/:id
**Purpose**: Delete study

### Report Routes

**Location**: `backend/routes/reports.js`

**All routes protected, filtered by `createdBy: req.user._id`**

#### GET /api/reports
**Purpose**: Get all reports (with populated patient/study data)

**Response**:
```json
[
  {
    "_id": "...",
    "reportId": "R001",
    "patientName": "Jane Smith",
    "findings": [...],
    "recommendations": [...],
    "reportDate": "..."
  }
]
```

#### GET /api/reports/:id
**Purpose**: Get single report

#### POST /api/reports
**Purpose**: Create report

**Request Body**:
```json
{
  "studyId": "...",
  "patientId": "...",
  "reportId": "R001",
  "findings": [
    {
      "title": "Heart Structure",
      "value": "Normal",
      "status": "normal"
    }
  ],
  "recommendations": ["Follow up in 6 months"]
}
```

#### PUT /api/reports/:id
**Purpose**: Update report

#### DELETE /api/reports/:id
**Purpose**: Delete report

### Chatbot Route

**Location**: `backend/routes/chatbot.js`

#### POST /api/chatbot
**Purpose**: Get AI response

**Request Body**:
```json
{
  "message": "What is DICOM?",
  "conversationHistory": [
    { "text": "Hello", "sender": "user" },
    { "text": "Hi! How can I help?", "sender": "bot" }
  ]
}
```

**Process**:
1. Check if OpenAI API key configured
2. If yes: Call OpenAI API with medical imaging context
3. If no: Use fallback keyword matching
4. Return response

**Response**:
```json
{
  "response": "DICOM is...",
  "model": "gpt-3.5-turbo"
}
```

## Authentication Middleware

**Location**: `backend/middleware/auth.js`

**Function**: `protect(req, res, next)`

**Process**:
1. Extract token from `Authorization: Bearer <token>` header
2. Verify token using `JWT_SECRET`
3. Extract `userId` from token payload
4. Find user in database
5. Attach user to `req.user`
6. Call `next()` to continue

**Usage**:
```javascript
router.get('/patients', protect, async (req, res) => {
  // req.user is available here
  const patients = await Patient.find({ createdBy: req.user._id })
  res.json(patients)
})
```

## Database Models

### User Model

**Location**: `backend/models/User.js`

**Schema**:
```javascript
{
  email: String (unique, required, validated)
  password: String (required, hashed)
  firstName: String (required)
  lastName: String (required)
  role: String (enum: 'doctor', 'radiologist', 'admin', default: 'doctor')
  createdAt: Date
}
```

**Hooks**:
- `pre('save')`: Hash password before saving

**Methods**:
- `comparePassword(candidatePassword)`: Verify password

### Patient Model

**Location**: `backend/models/Patient.js`

**Schema**: See Database Design guide

**Indexes**:
- `patientId` (unique)
- `name`, `email` (text search)
- `createdBy` (for user filtering)

### Study Model

**Location**: `backend/models/Study.js`

**Schema**: See Database Design guide

**Indexes**:
- `patientId`
- `studyId` (unique)
- `studyDate` (descending)

### Report Model

**Location**: `backend/models/Report.js`

**Schema**: See Database Design guide

**Indexes**:
- `studyId`
- `patientId`
- `reportId` (unique)
- `reportDate` (descending)

## Error Handling

### Error Handler Middleware

**Location**: `backend/server.js`

**Implementation**:
```javascript
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})
```

### Route-Level Error Handling

**Pattern**: Try-catch blocks

**Example**:
```javascript
router.post('/patients', protect, async (req, res) => {
  try {
    // Route logic
    res.json(patient)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to create patient' })
  }
})
```

### Validation Errors

**Mongoose Validation**:
```javascript
if (error.name === 'ValidationError') {
  const messages = Object.values(error.errors).map(err => err.message)
  return res.status(400).json({ error: messages.join(', ') })
}
```

## CORS Configuration

**Location**: `backend/server.js`

**Development**:
```javascript
app.use(cors({
  origin: function (origin, callback) {
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true)
    }
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))
```

**Production**:
```javascript
const allowedOrigins = [
  'https://yourdomain.com',
  process.env.FRONTEND_URL
]

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
```

## Database Connection

**Location**: `backend/config/database.js`

**Implementation**:
```javascript
const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

module.exports = connectDB
```

**Usage**:
```javascript
// In server.js
const connectDB = require('./config/database')
connectDB()
```

## Query Patterns

### Pattern 1: Get All (User-Filtered)
```javascript
const items = await Model.find({ createdBy: req.user._id })
```

### Pattern 2: Get One (User-Filtered)
```javascript
const item = await Model.findOne({ 
  _id: id, 
  createdBy: req.user._id 
})
```

### Pattern 3: Create (With User Reference)
```javascript
const item = new Model({
  ...data,
  createdBy: req.user._id
})
await item.save()
```

### Pattern 4: Update (User-Filtered)
```javascript
const item = await Model.findOneAndUpdate(
  { _id: id, createdBy: req.user._id },
  { ...updates },
  { new: true }
)
```

### Pattern 5: Delete (User-Filtered)
```javascript
await Model.findOneAndDelete({ 
  _id: id, 
  createdBy: req.user._id 
})
```

## Search Implementation

### Text Search

**Patients**:
```javascript
const patients = await Patient.find({
  createdBy: req.user._id,
  $text: { $search: searchTerm }
})
```

### Filter by Status

```javascript
const activePatients = await Patient.find({
  createdBy: req.user._id,
  status: 'active'
})
```

## Response Format

### Success Response
```json
{
  "data": {...},
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

### Array Response
```json
[
  {...},
  {...}
]
```

## Best Practices

1. **User Isolation**: Always filter by user ID
2. **Input Validation**: Validate all inputs
3. **Error Handling**: Try-catch around async operations
4. **Status Codes**: Use appropriate HTTP status codes
5. **Error Messages**: Generic messages (don't leak info)
6. **Logging**: Log errors for debugging
7. **Environment Variables**: Use for secrets

