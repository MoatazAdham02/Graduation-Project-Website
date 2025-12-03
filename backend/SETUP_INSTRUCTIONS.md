# Backend Setup Instructions

## ✅ Step 1: Install Dependencies

Open terminal in the `backend` folder and run:

```bash
cd backend
npm install
```

This will install all required packages:
- express
- mongoose
- cors
- dotenv
- bcryptjs
- jsonwebtoken
- nodemon (for development)

## ✅ Step 2: Create .env File

Create a file named `.env` in the `backend` folder with this content:

```env
PORT=5000
MONGODB_URI=mongodb+srv://medical-dicom-user:ZXBqUvF2qtuewSpu@cluster0.dagjxov.mongodb.net/medical-dicom?retryWrites=true&w=majority
JWT_SECRET=medical-dicom-super-secret-jwt-key-2024
FRONTEND_URL=http://localhost:5173
```

**Important:** The `.env` file is already created with your MongoDB credentials from the guide!

## ✅ Step 3: Start the Server

**Development mode (auto-reload on changes):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
📊 Database: medical-dicom
🚀 Server running on port 5000
📡 Health check: http://localhost:5000/api/health
```

## ✅ Step 4: Test the Server

Open your browser and visit:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-..."
}
```

## 🎯 What's Included

✅ **Models:**
- User (authentication)
- Patient (patient records)
- Study (DICOM studies)
- Report (medical reports)

✅ **Routes:**
- `/api/auth` - Register, Login, Get current user
- `/api/patients` - CRUD operations for patients
- `/api/studies` - CRUD operations for studies
- `/api/reports` - CRUD operations for reports

✅ **Features:**
- JWT authentication
- Password hashing with bcrypt
- Input validation
- Error handling
- MongoDB connection

## 🚨 Troubleshooting

### "Cannot find module" error?
```bash
cd backend
npm install
```

### MongoDB connection failed?
- Check your `.env` file has the correct `MONGODB_URI`
- Make sure your MongoDB Atlas cluster is running
- Verify network access is configured (0.0.0.0/0 for development)

### Port already in use?
Change `PORT=5000` to another port (e.g., `PORT=5001`) in `.env`

## 📝 Next Steps

1. ✅ Backend is ready!
2. Now update your frontend to use the API (see MONGODB_SETUP_GUIDE.md Step 8)
3. Test authentication first
4. Then migrate other features

Good luck! 🚀

