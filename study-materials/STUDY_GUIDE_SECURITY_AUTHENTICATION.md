# Security & Authentication Study Guide

## Authentication Overview

### Authentication vs Authorization

**Authentication**: Verifying who the user is (login)
**Authorization**: Verifying what the user can do (permissions)

In this project:
- **Authentication**: JWT-based login/register
- **Authorization**: User-level data isolation (users only see their own data)

## Authentication Flow

### 1. Registration Flow

```
User fills registration form
  ↓
Frontend: AuthContext.register() called
  ↓
API: POST /api/auth/register
  ↓
Backend validates input (email, password, firstName, lastName, role)
  ↓
Check if user already exists (by email)
  ↓
Create new User document
  ↓
Mongoose pre-save hook hashes password (bcrypt)
  ↓
User saved to database
  ↓
Generate JWT token (payload: { userId: user._id })
  ↓
Return { token, user } to frontend
  ↓
Frontend stores token in localStorage
  ↓
Update AuthContext state (isAuthenticated = true, user = userData)
  ↓
Redirect to /viewer
```

### 2. Login Flow

```
User enters email and password
  ↓
Frontend: AuthContext.login() called
  ↓
API: POST /api/auth/login
  ↓
Backend finds user by email
  ↓
Verify password using user.comparePassword()
  ↓
If valid, generate JWT token
  ↓
Return { token, user } to frontend
  ↓
Frontend stores token in localStorage
  ↓
Update AuthContext state
  ↓
Redirect to /viewer
```

### 3. Protected Route Access Flow

```
User navigates to protected route (e.g., /patients)
  ↓
ProtectedRoute component checks isAuthenticated
  ↓
If not authenticated, redirect to /login
  ↓
If authenticated, render component
  ↓
Component makes API call (e.g., GET /api/patients)
  ↓
API service adds token to Authorization header
  ↓
Backend middleware extracts token
  ↓
Verify token using JWT_SECRET
  ↓
Extract userId from token payload
  ↓
Find user in database
  ↓
Attach user to req.user
  ↓
Route handler executes with req.user available
  ↓
Database query filters by req.user._id
  ↓
Return user's data only
```

## JWT (JSON Web Tokens) Implementation

### What is JWT?

**JWT** is a compact, URL-safe token format for securely transmitting information between parties.

### JWT Structure

```
Header.Payload.Signature
```

**Example**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NGExMjM0NTY3ODkwIiwiaWF0IjoxNjk4NzY1NDMyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### JWT Components

#### 1. Header
```json
{
  "alg": "HS256",  // Algorithm (HMAC SHA256)
  "typ": "JWT"     // Type
}
```

#### 2. Payload
```json
{
  "userId": "64a1234567890",  // User ID from database
  "iat": 1698765432            // Issued at timestamp
}
```

#### 3. Signature
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  JWT_SECRET
)
```

### JWT Implementation

**Library**: jsonwebtoken v9.0.2

**Token Generation** (Backend):
```javascript
const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)
```

**Token Verification** (Backend Middleware):
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET)
const user = await User.findById(decoded.userId)
```

**Token Storage** (Frontend):
```javascript
localStorage.setItem('authToken', token)
```

**Token Usage** (Frontend API Calls):
```javascript
const token = localStorage.getItem('authToken')
headers: {
  'Authorization': `Bearer ${token}`
}
```

### JWT Security Features

1. **Signed**: Cannot be tampered with (signature verification)
2. **Expiration**: Tokens expire after 7 days
3. **Secret Key**: Only server can verify tokens (JWT_SECRET)
4. **Stateless**: No server-side session storage needed

## Password Security

### Password Hashing

**Why Hash Passwords?**
- Passwords should never be stored in plain text
- If database is compromised, passwords are protected
- One-way function (cannot reverse hash to get password)

### bcrypt Algorithm

**Library**: bcryptjs v2.4.3

**How it Works**:
1. Generate random salt
2. Hash password with salt
3. Store salt + hash in database

**Implementation**:
```javascript
// In User model pre-save hook
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  const salt = await bcrypt.genSalt(10)  // 10 rounds
  this.password = await bcrypt.hash(this.password, salt)
  next()
})
```

**Password Comparison**:
```javascript
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}
```

### Salt Rounds

**10 Rounds**: Good balance between security and performance
- Higher rounds = more secure but slower
- 10 rounds = ~100ms per hash (acceptable)

## Route Protection

### Frontend Protection

**Location**: `src/App.jsx`

**Implementation**:
```javascript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
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

### Backend Protection

**Location**: `backend/middleware/auth.js`

**Implementation**:
```javascript
const protect = async (req, res, next) => {
  try {
    let token

    // Extract token from header
    if (req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token' })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Get user from token
    req.user = await User.findById(decoded.userId).select('-password')
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' })
    }

    next()  // Continue to route handler
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized, invalid token' })
  }
}
```

**Usage**:
```javascript
router.get('/patients', protect, async (req, res) => {
  // req.user is available here
  const patients = await Patient.find({ createdBy: req.user._id })
  res.json(patients)
})
```

## Data Isolation

### Critical Security Feature

**Principle**: Users can only access their own data

**Implementation**: All database queries filter by user ID

### Pattern Used

```javascript
// In every route handler:
const data = await Model.find({ 
  ...queryParams,
  createdBy: req.user._id  // OR uploadedBy: req.user._id
})
```

### Applied In

#### Patients Routes
```javascript
// GET /api/patients
const patients = await Patient.find({ createdBy: req.user._id })

// POST /api/patients
const patient = new Patient({
  ...data,
  createdBy: req.user._id
})

// PUT /api/patients/:id
const patient = await Patient.findOneAndUpdate(
  { _id: id, createdBy: req.user._id },
  updates
)

// DELETE /api/patients/:id
await Patient.findOneAndDelete({ 
  _id: id, 
  createdBy: req.user._id 
})
```

#### Studies Routes
```javascript
// All queries filter by uploadedBy: req.user._id
const studies = await Study.find({ uploadedBy: req.user._id })
```

#### Reports Routes
```javascript
// All queries filter by createdBy: req.user._id
const reports = await Report.find({ createdBy: req.user._id })
```

### Why This Works

1. **JWT Token**: Contains userId, cannot be forged
2. **Middleware**: Verifies token and attaches user to request
3. **Database Queries**: Always filter by user ID
4. **Result**: Users physically cannot access other users' data

## Input Validation

### Frontend Validation

**Location**: Form components (Register.jsx, Login.jsx, etc.)

**Types**:
- **Required Fields**: Check if field is filled
- **Email Format**: Regex validation
- **Password Length**: Minimum 6 characters
- **Password Match**: Confirm password matches

**Example**:
```javascript
const validateField = (name, value) => {
  switch (name) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address'
      }
      return ''
    case 'password':
      if (value.length < 6) {
        return 'Password must be at least 6 characters'
      }
      return ''
  }
}
```

### Backend Validation

**Location**: Mongoose schemas and route handlers

**Types**:
- **Schema Validation**: Required fields, types, enums
- **Custom Validation**: Regex patterns, custom validators
- **Manual Checks**: Duplicate email, invalid role, etc.

**Example**:
```javascript
// Schema validation
email: {
  type: String,
  required: [true, 'Email is required'],
  unique: true,
  match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
}

// Manual validation in route
if (!email || !password) {
  return res.status(400).json({ error: 'Please provide all fields' })
}

const existingUser = await User.findOne({ email })
if (existingUser) {
  return res.status(400).json({ error: 'User already exists' })
}
```

## CORS Configuration

### What is CORS?

**CORS** (Cross-Origin Resource Sharing) allows web pages to make requests to a different domain.

### Configuration

**Location**: `backend/server.js`

**Development**:
```javascript
app.use(cors({
  origin: function (origin, callback) {
    // Allow localhost on any port
    if (origin.startsWith('http://localhost:') || 
        origin.startsWith('http://127.0.0.1:')) {
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

## Environment Variables

### Security Best Practice

**Never commit `.env` files to Git**

### Required Environment Variables

**Backend** (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5173
OPENAI_API_KEY=your-openai-key
```

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### JWT_SECRET

**Importance**: Used to sign and verify JWT tokens

**Requirements**:
- Long, random string
- Never share publicly
- Different for development and production

**Generation**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Security Best Practices Implemented

### 1. Password Security
- ✅ Passwords hashed with bcrypt
- ✅ Never stored in plain text
- ✅ Never logged or returned in responses

### 2. Authentication
- ✅ JWT tokens with expiration
- ✅ Secure token storage (localStorage)
- ✅ Token verification on every request

### 3. Authorization
- ✅ User-level data isolation
- ✅ All queries filter by user ID
- ✅ Protected routes on frontend and backend

### 4. Input Validation
- ✅ Frontend validation before submission
- ✅ Backend validation in schemas
- ✅ Manual validation in route handlers

### 5. Error Handling
- ✅ Generic error messages (don't leak information)
- ✅ Proper HTTP status codes
- ✅ Try-catch blocks around sensitive operations

### 6. CORS
- ✅ Configured for development and production
- ✅ Whitelist of allowed origins

## Security Considerations for Production

### Additional Measures to Implement

1. **HTTPS**: Encrypt all traffic
2. **Rate Limiting**: Prevent brute force attacks
3. **Token Refresh**: Implement refresh tokens
4. **Password Policy**: Enforce strong passwords
5. **Account Lockout**: Lock after failed login attempts
6. **Audit Logging**: Log security events
7. **Input Sanitization**: Prevent injection attacks
8. **Content Security Policy**: Prevent XSS attacks

## Common Security Vulnerabilities Prevented

### 1. SQL Injection
**Prevented by**: Mongoose ODM (parameterized queries)

### 2. XSS (Cross-Site Scripting)
**Prevented by**: React's automatic escaping

### 3. CSRF (Cross-Site Request Forgery)
**Prevented by**: CORS configuration, JWT tokens

### 4. Session Hijacking
**Prevented by**: JWT tokens, HTTPS (in production)

### 5. Password Theft
**Prevented by**: Password hashing, HTTPS (in production)

## Authentication Context

**Location**: `src/context/AuthContext.jsx`

**State**:
```javascript
const [isAuthenticated, setIsAuthenticated] = useState(false)
const [user, setUser] = useState(null)
const [loading, setLoading] = useState(true)
```

**Functions**:
```javascript
register(userData)    // Register and auto-login
login(email, password) // Login user
logout()              // Clear token and state
checkAuth()           // Validate token on page load
```

**Token Persistence**:
- Token stored in localStorage
- Validated on app load
- Cleared on logout

## Error Handling in Authentication

### Frontend Errors
```javascript
try {
  await login(email, password)
} catch (error) {
  // Show error message to user
  setErrors({ submit: error.message })
}
```

### Backend Errors
```javascript
// Invalid credentials
if (!user || !isMatch) {
  return res.status(401).json({ error: 'Invalid credentials' })
}

// Missing fields
if (!email || !password) {
  return res.status(400).json({ error: 'Please provide all fields' })
}
```

## Token Expiration Handling

### Current Implementation
- Tokens expire after 7 days
- User must re-login after expiration

### Future Enhancement
- Implement refresh tokens
- Automatic token refresh before expiration
- Seamless user experience

## Security Checklist

- [x] Passwords hashed with bcrypt
- [x] JWT tokens with expiration
- [x] User data isolation
- [x] Protected routes (frontend and backend)
- [x] Input validation
- [x] CORS configuration
- [x] Environment variables for secrets
- [x] Error handling
- [ ] Rate limiting (to implement)
- [ ] HTTPS (production)
- [ ] Token refresh (future)

