# Chatbot AI Setup Guide

The chatbot is now integrated with OpenAI's API to provide intelligent responses to any questions. Follow these steps to enable full AI functionality.

## 🚀 Quick Setup

### Step 1: Install OpenAI Package

Navigate to the `backend` folder and install the OpenAI package:

```bash
cd backend
npm install openai
```

### Step 2: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy your API key (you'll only see it once!)

### Step 3: Add API Key to Backend

Add the following to your `backend/.env` file:

```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

**Note:** You can use `gpt-4` or `gpt-4-turbo` for better responses, but they cost more. `gpt-3.5-turbo` is recommended for most use cases and is more cost-effective.

### Step 4: Restart Backend Server

If your backend server is running, restart it to load the new environment variable:

```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

## ✅ Verification

1. Open your application in the browser
2. Click the chatbot button (bottom right)
3. Ask any question, for example: "What is DICOM?"
4. You should receive an intelligent AI-powered response!

## 💡 How It Works

- **With API Key**: The chatbot uses OpenAI's GPT model to provide intelligent, contextual responses
- **Without API Key**: The chatbot falls back to simple keyword-based responses (still functional, but limited)

## 🔒 Security Notes

- **Never commit your API key to Git** - The `.env` file should already be in `.gitignore`
- **Keep your API key secret** - Don't share it publicly
- **Monitor usage** - Check your OpenAI dashboard for usage and costs

## 💰 Cost Information

OpenAI charges based on usage:
- **GPT-3.5-turbo**: ~$0.002 per 1K tokens (very affordable)
- **GPT-4**: ~$0.03 per 1K tokens (more expensive but better quality)

A typical conversation might use 500-2000 tokens, costing a few cents.

## 🎯 Features

The chatbot can now:
- ✅ Answer any question intelligently
- ✅ Understand context from conversation history
- ✅ Provide medical imaging and DICOM-specific help
- ✅ Assist with platform navigation
- ✅ Handle general questions

## 🛠️ Troubleshooting

### "Network error" message
- Make sure your backend server is running on port 5000
- Check that `VITE_API_URL` in your frontend `.env` points to the correct backend URL

### "AI service temporarily unavailable"
- Check your OpenAI API key is correct
- Verify you have credits in your OpenAI account
- Check the backend console for error messages

### Still getting fallback responses
- Verify `OPENAI_API_KEY` is set in `backend/.env`
- Restart the backend server after adding the key
- Check backend console logs for errors

## 📝 Alternative: Free AI Services

If you prefer not to use OpenAI, you can modify `backend/routes/chatbot.js` to use:
- **Hugging Face Inference API** (free tier available)
- **Anthropic Claude API**
- **Google Gemini API**
- **Custom AI model**

Just replace the OpenAI integration in the chatbot route with your preferred service.

