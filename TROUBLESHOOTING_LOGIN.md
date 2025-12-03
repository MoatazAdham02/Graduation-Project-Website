# Troubleshooting Login Connection

## ✅ Fixed Issues

1. **Created `.env.local` file** - The frontend now knows where the API is
   - Location: Root folder
   - Content: `VITE_API_URL=http://localhost:5000/api`

2. **Added Debugging** - Console logs will show API calls
   - Check browser console (F12) for `[API]` messages
   - Check backend terminal for request logs

3. **Improved CORS** - Backend now accepts requests from frontend
   - Methods: GET, POST, PUT, DELETE, OPTIONS
   - Headers: Content-Type, Authorization

## 🔍 How to Test

### Step 1: Restart Frontend
**Important:** After creating `.env.local`, you MUST restart the Vite dev server:

```bash
# Stop the current frontend (Ctrl+C)
# Then restart:
npm run dev
```

### Step 2: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to login
4. Look for `[API]` messages showing:
   - API URL being used
   - Request details
   - Success/Error messages

### Step 3: Check Backend Terminal
You should see requests logged like:
```
POST /api/auth/login - Body: {"email":"...","password":"..."}
```

## 🐛 Common Issues

### Issue 1: "Network error: Could not connect to server"
**Solution:**
- Make sure backend is running: `cd backend && npm run dev`
- Check backend is on port 5000
- Verify MongoDB is connected (you should see ✅ MongoDB Connected)

### Issue 2: CORS Error
**Solution:**
- Backend CORS is configured for `http://localhost:5173`
- Make sure frontend is running on port 5173 (Vite default)
- If using different port, update `backend/.env` FRONTEND_URL

### Issue 3: 401 Unauthorized
**Solution:**
- Check if user exists in database
- Verify password is correct
- Check backend terminal for error messages

### Issue 4: API URL not found
**Solution:**
- Restart frontend after creating `.env.local`
- Check `.env.local` exists in root folder
- Verify content: `VITE_API_URL=http://localhost:5000/api`

## 📝 Testing Steps

1. **Backend Running?**
   ```bash
   cd backend
   npm run dev
   ```
   Should see: `🚀 Server running on port 5000`

2. **Frontend Running?**
   ```bash
   npm run dev
   ```
   Should see: `Local: http://localhost:5173`

3. **Test Health Endpoint**
   Open browser: `http://localhost:5000/api/health`
   Should return: `{"status":"OK","message":"Server is running"}`

4. **Test Login**
   - Go to login page
   - Enter email and password
   - Check browser console for `[API]` logs
   - Check backend terminal for request logs

## 🔧 Debug Commands

### Check if .env.local is loaded:
In browser console:
```javascript
console.log(import.meta.env.VITE_API_URL)
```
Should show: `http://localhost:5000/api`

### Test API directly:
In browser console:
```javascript
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(console.log)
```

## ✅ Expected Behavior

When you click "Sign In":
1. Browser console shows: `[API] Calling: http://localhost:5000/api/auth/login`
2. Backend terminal shows: `POST /api/auth/login`
3. If successful: Redirects to `/viewer`
4. If error: Shows error message below form

## 🆘 Still Not Working?

1. **Check both terminals are running**
   - Backend: `cd backend && npm run dev`
   - Frontend: `npm run dev`

2. **Check ports**
   - Backend: http://localhost:5000
   - Frontend: http://localhost:5173

3. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

4. **Check browser console errors**
   - Look for red error messages
   - Share the error message for help

