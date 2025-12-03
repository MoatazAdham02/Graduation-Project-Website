# Medical DICOM Viewer - Backend API

Backend server for the Medical DICOM Viewer application.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and update with your MongoDB connection string:

```bash
cp .env.example .env
```

Edit `.env` and add your MongoDB Atlas connection string.

### 3. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000`

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Check if server is running

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Patients
- `GET /api/patients` - Get all patients (protected)
- `GET /api/patients/:id` - Get single patient (protected)
- `POST /api/patients` - Create patient (protected)
- `PUT /api/patients/:id` - Update patient (protected)
- `DELETE /api/patients/:id` - Delete patient (protected)

### Studies
- `GET /api/studies` - Get all studies (protected)
- `GET /api/studies/:id` - Get single study (protected)
- `POST /api/studies` - Create study (protected)
- `PUT /api/studies/:id` - Update study (protected)
- `DELETE /api/studies/:id` - Delete study (protected)

### Reports
- `GET /api/reports` - Get all reports (protected)
- `GET /api/reports/:id` - Get single report (protected)
- `POST /api/reports` - Create report (protected)
- `PUT /api/reports/:id` - Update report (protected)
- `DELETE /api/reports/:id` - Delete report (protected)

## 🔐 Authentication

Protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## 📦 Project Structure

```
backend/
├── config/
│   └── database.js       # MongoDB connection
├── middleware/
│   └── auth.js           # Authentication middleware
├── models/
│   ├── User.js          # User model
│   ├── Patient.js       # Patient model
│   ├── Study.js         # Study model
│   └── Report.js        # Report model
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── patients.js      # Patient routes
│   ├── studies.js       # Study routes
│   └── reports.js       # Report routes
├── .env                 # Environment variables
├── .env.example         # Environment variables template
├── server.js            # Main server file
└── package.json         # Dependencies
```

## 🛠️ Technologies

- **Express.js** - Web framework
- **MongoDB** - Database (via Mongoose)
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 📝 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
```

## ✅ Testing

Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

