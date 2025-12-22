# Database Design Study Guide

## Database Overview

### Database Type: MongoDB (NoSQL)
- **Database Name**: `medical-dicom`
- **Hosting**: MongoDB Atlas (Cloud-hosted)
- **ODM**: Mongoose v8.0.3
- **Connection**: Connection string in `backend/config/database.js`

### Why MongoDB?
1. **Flexible Schema**: Medical data varies in structure
2. **JSON-like**: Matches JavaScript objects naturally
3. **Scalability**: Easy horizontal scaling
4. **Document-based**: Perfect for patient records, studies, reports

## Entity Relationship Diagram

```
User (1) ──< creates >── (N) Patient
User (1) ──< uploads >── (N) Study
User (1) ──< creates >── (N) Report
Patient (1) ──< has >── (N) Study
Patient (1) ──< has >── (N) Report
Study (1) ──< generates >── (1) Report
```

### Relationship Details

#### User → Patient (One-to-Many)
- **Field**: `Patient.createdBy` (ObjectId, references User._id)
- **Cardinality**: One user can create many patients
- **Isolation**: Patients filtered by `createdBy: req.user._id`

#### User → Study (One-to-Many)
- **Field**: `Study.uploadedBy` (ObjectId, references User._id)
- **Cardinality**: One user can upload many studies
- **Isolation**: Studies filtered by `uploadedBy: req.user._id`

#### User → Report (One-to-Many)
- **Field**: `Report.createdBy` (ObjectId, references User._id)
- **Cardinality**: One user can create many reports
- **Isolation**: Reports filtered by `createdBy: req.user._id`

#### Patient → Study (One-to-Many)
- **Field**: `Study.patientId` (ObjectId, references Patient._id)
- **Cardinality**: One patient can have many studies
- **Purpose**: Link imaging studies to patient records

#### Patient → Report (One-to-Many)
- **Field**: `Report.patientId` (ObjectId, references Patient._id)
- **Cardinality**: One patient can have many reports
- **Purpose**: Link reports to patient records

#### Study → Report (One-to-One)
- **Field**: `Report.studyId` (ObjectId, references Study._id)
- **Cardinality**: One study generates one report
- **Purpose**: Link report to specific study

## Collection Schemas

### 1. Users Collection

**Purpose**: Store healthcare professional accounts

**Schema Location**: `backend/models/User.js`

**Key Fields**:
```javascript
{
  email: String (Unique, Required, Lowercase, Validated)
  password: String (Required, Hashed with bcrypt, Min 6 chars)
  firstName: String (Required)
  lastName: String (Required)
  role: String (Enum: 'doctor', 'radiologist', 'admin', Default: 'doctor')
  createdAt: Date (Auto-generated)
}
```

**Security Features**:
- Password hashed with bcrypt (10 salt rounds) via `pre('save')` hook
- Password excluded from JSON responses via `toJSON()` method
- `comparePassword(candidatePassword)` method for authentication

**Indexes**:
- `email` (unique index)

**Methods**:
- `comparePassword(candidatePassword)`: Compares plain text password with hash

**Hooks**:
- `pre('save')`: Hashes password before saving (if modified)

### 2. Patients Collection

**Purpose**: Store patient demographic and medical information

**Schema Location**: `backend/models/Patient.js`

**Key Fields**:
```javascript
{
  name: String (Required)
  patientId: String (Unique, Required) // Medical record identifier
  email: String (Optional, Validated)
  dateOfBirth: Date (Required)
  gender: String (Enum: 'male', 'female', 'other', Required)
  phone: String (Optional)
  address: {
    street: String
    city: String
    state: String
    zipCode: String
  }
  status: String (Enum: 'active', 'inactive', Default: 'active')
  createdBy: ObjectId (References User, Required) // USER ISOLATION
  createdAt: Date (Auto-generated)
  updatedAt: Date (Auto-updated)
}
```

**Indexes**:
- `patientId` (unique index) - Fast lookup by patient ID
- `name`, `email` (text search index) - Full-text search
- `createdBy` (index) - Fast filtering by user

**Hooks**:
- `pre('save')`: Updates `updatedAt` before saving

**Search Capabilities**:
- Text search on name and email
- Filter by status (active/inactive)
- Filter by createdBy (automatic user isolation)

### 3. Studies Collection

**Purpose**: Store DICOM study metadata and file information

**Schema Location**: `backend/models/Study.js`

**Key Fields**:
```javascript
{
  patientId: ObjectId (References Patient, Required)
  studyId: String (Unique, Required)
  modality: String (Enum: 'CT', 'MRI', 'X-Ray', 'Ultrasound', 'PET', 'Other', Required)
  studyDate: Date (Required, Default: Date.now)
  studyTime: String (Optional)
  studyInstanceUID: String (Optional) // DICOM identifier
  seriesInstanceUID: String (Optional) // DICOM identifier
  institutionName: String (Optional)
  description: String (Optional)
  bodyPart: String (Optional)
  files: [{
    fileName: String (Required)
    fileSize: Number (Required) // bytes
    filePath: String (Optional)
    uploadedAt: Date (Auto-generated)
  }]
  dicomData: {
    width: Number
    height: Number
    pixelSpacing: String
    sliceThickness: Number
  }
  uploadedBy: ObjectId (References User, Optional) // USER ISOLATION
  uploadedAt: Date (Auto-generated)
}
```

**Indexes**:
- `patientId` (index) - Fast lookup by patient
- `studyId` (unique index) - Fast lookup by study ID
- `studyDate` (descending index) - Fast sorting by date

**DICOM Metadata**:
- Stores extracted DICOM tags
- Links to patient via `patientId`
- Tracks file information

### 4. Reports Collection

**Purpose**: Store medical reports generated from studies

**Schema Location**: `backend/models/Report.js`

**Key Fields**:
```javascript
{
  studyId: ObjectId (References Study, Optional)
  patientId: ObjectId (References Patient, Optional)
  reportId: String (Unique, Required)
  
  // Denormalized patient data (for quick access)
  patientName: String
  patientDateOfBirth: Date
  patientGender: String
  patientAge: String
  
  // Denormalized study data
  studyDate: Date
  studyTime: String
  modality: String
  studyDescription: String
  bodyPartExamined: String
  institutionName: String
  studyInstanceUID: String
  
  findings: [{
    title: String (Required)
    value: String (Required)
    status: String (Enum: 'normal', 'warning', 'critical', Default: 'normal')
  }]
  recommendations: [String]
  physicianName: String (Optional)
  physicianTitle: String (Optional)
  reportDate: Date (Default: Date.now)
  createdBy: ObjectId (References User, Optional) // USER ISOLATION
  createdAt: Date (Auto-generated)
  updatedAt: Date (Auto-updated)
}
```

**Indexes**:
- `studyId` (index) - Fast lookup by study
- `patientId` (index) - Fast lookup by patient
- `reportId` (unique index) - Fast lookup by report ID
- `reportDate` (descending index) - Fast sorting by date

**Denormalization**:
- Patient and study data stored directly in report
- Benefits: Faster queries, no joins needed
- Trade-off: Data duplication (acceptable for read-heavy workload)

**Hooks**:
- `pre('save')`: Updates `updatedAt` before saving

## Data Isolation Strategy

### Critical Security Feature

**Implementation**: All database queries filter by user ID

**Pattern**:
```javascript
// In every route handler:
const data = await Model.find({ 
  ...queryParams,
  createdBy: req.user._id  // OR uploadedBy: req.user._id
})
```

**Applied In**:
- `backend/routes/patients.js` - All routes filter by `createdBy`
- `backend/routes/studies.js` - All routes filter by `uploadedBy`
- `backend/routes/reports.js` - All routes filter by `createdBy`

**Benefits**:
1. **Security**: Users cannot access other users' data
2. **Performance**: Indexed queries are fast
3. **Simplicity**: No complex permission system needed

**Example Query**:
```javascript
// Get all patients for logged-in user
const patients = await Patient.find({ 
  createdBy: req.user._id 
})
```

## Database Operations

### Create Operations

#### Create User
```javascript
const user = new User({
  email: 'doctor@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
  role: 'doctor'
})
await user.save() // Password automatically hashed
```

#### Create Patient
```javascript
const patient = new Patient({
  name: 'Jane Smith',
  patientId: 'P001',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'female',
  createdBy: req.user._id // Critical for isolation
})
await patient.save()
```

#### Create Study
```javascript
const study = new Study({
  patientId: patient._id,
  studyId: 'S001',
  modality: 'CT',
  studyDate: new Date(),
  uploadedBy: req.user._id // Critical for isolation
})
await study.save()
```

### Read Operations

#### Find All (User-Filtered)
```javascript
// Patients
const patients = await Patient.find({ 
  createdBy: req.user._id 
})

// Studies
const studies = await Study.find({ 
  uploadedBy: req.user._id 
})

// Reports
const reports = await Report.find({ 
  createdBy: req.user._id 
})
```

#### Find by ID (User-Filtered)
```javascript
const patient = await Patient.findOne({ 
  _id: patientId,
  createdBy: req.user._id 
})
```

#### Search with Filters
```javascript
// Search patients by name
const patients = await Patient.find({
  createdBy: req.user._id,
  $text: { $search: searchTerm }
})

// Filter by status
const activePatients = await Patient.find({
  createdBy: req.user._id,
  status: 'active'
})
```

### Update Operations

#### Update Patient
```javascript
const patient = await Patient.findOneAndUpdate(
  { 
    _id: patientId,
    createdBy: req.user._id // Ensure user owns this patient
  },
  { 
    name: 'Updated Name',
    phone: '123-456-7890'
  },
  { new: true } // Return updated document
)
```

### Delete Operations

#### Delete Patient
```javascript
await Patient.findOneAndDelete({
  _id: patientId,
  createdBy: req.user._id // Ensure user owns this patient
})
```

## Indexes and Performance

### Why Indexes Matter
- **Speed**: Fast queries on indexed fields
- **Uniqueness**: Enforce unique constraints
- **Text Search**: Enable full-text search

### Indexes Created

#### Users Collection
- `email` (unique) - Fast login lookups

#### Patients Collection
- `patientId` (unique) - Fast lookup by medical record ID
- `name`, `email` (text) - Full-text search
- `createdBy` - Fast user filtering

#### Studies Collection
- `patientId` - Fast patient lookup
- `studyId` (unique) - Fast study lookup
- `studyDate` (descending) - Fast date sorting

#### Reports Collection
- `studyId` - Fast study lookup
- `patientId` - Fast patient lookup
- `reportId` (unique) - Fast report lookup
- `reportDate` (descending) - Fast date sorting

## Data Validation

### Mongoose Schema Validation
- **Required Fields**: Enforced at schema level
- **Type Validation**: Automatic type checking
- **Enum Validation**: Only allowed values accepted
- **Custom Validation**: Regex patterns, custom validators

### Example Validations

#### Email Validation
```javascript
email: {
  type: String,
  match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
}
```

#### Enum Validation
```javascript
gender: {
  type: String,
  enum: ['male', 'female', 'other'],
  required: true
}
```

#### Custom Validation
```javascript
patientId: {
  type: String,
  unique: true,
  required: true,
  validate: {
    validator: function(v) {
      return /^[A-Z0-9]+$/.test(v)
    },
    message: 'Patient ID must be alphanumeric'
  }
}
```

## Data Relationships

### Populating References

#### Populate Patient in Study
```javascript
const study = await Study.findById(studyId)
  .populate('patientId', 'name patientId dateOfBirth')
```

#### Populate Study and Patient in Report
```javascript
const report = await Report.findById(reportId)
  .populate('studyId')
  .populate('patientId', 'name patientId')
```

### Virtual Fields (Not Used, But Possible)
```javascript
// Could add virtual field for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`
})
```

## Database Connection

### Connection Configuration
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

### Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### Environment Variable
- **Name**: `MONGODB_URI`
- **Location**: `backend/.env`
- **Security**: Never commit to Git

## Best Practices Implemented

1. **User Isolation**: All queries filter by user ID
2. **Indexes**: Created on frequently queried fields
3. **Validation**: Schema-level validation for data integrity
4. **Hooks**: Automatic timestamp updates
5. **References**: Proper use of ObjectId references
6. **Denormalization**: Strategic denormalization for performance
7. **Error Handling**: Try-catch blocks around database operations

## Common Query Patterns

### Pattern 1: Get All with User Filter
```javascript
const items = await Model.find({ createdBy: req.user._id })
```

### Pattern 2: Get One with User Filter
```javascript
const item = await Model.findOne({ 
  _id: id, 
  createdBy: req.user._id 
})
```

### Pattern 3: Create with User Reference
```javascript
const item = new Model({
  ...data,
  createdBy: req.user._id
})
await item.save()
```

### Pattern 4: Update with User Filter
```javascript
const item = await Model.findOneAndUpdate(
  { _id: id, createdBy: req.user._id },
  { ...updates },
  { new: true }
)
```

### Pattern 5: Delete with User Filter
```javascript
await Model.findOneAndDelete({ 
  _id: id, 
  createdBy: req.user._id 
})
```

