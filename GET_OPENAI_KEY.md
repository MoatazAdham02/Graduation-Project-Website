# 🔑 How to Get Your OpenAI API Key

Follow these simple steps to get your OpenAI API key and enable full AI chatbot functionality:

## Step 1: Create an OpenAI Account

1. Go to [https://platform.openai.com/](https://platform.openai.com/)
2. Click **"Sign up"** or **"Log in"** if you already have an account
3. Complete the registration process

## Step 2: Add Payment Method (Required)

OpenAI requires a payment method to use their API, but they offer:
- **$5 free credit** for new users
- Very affordable pricing (~$0.002 per 1K tokens for GPT-3.5-turbo)
- Pay-as-you-go (no monthly fees)

1. Go to [Billing Settings](https://platform.openai.com/account/billing)
2. Click **"Add payment method"**
3. Add your credit card (you'll only be charged for actual usage)

## Step 3: Get Your API Key

1. Go to [API Keys](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Give it a name (e.g., "Medical DICOM Chatbot")
4. **Copy the key immediately** - you won't be able to see it again!

The key will look like: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 4: Add Key to Your Project

1. Open `backend/.env` file
2. Find the line: `OPENAI_API_KEY=your-openai-api-key-here`
3. Replace `your-openai-api-key-here` with your actual key:

```env
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

4. Save the file

## Step 5: Restart Backend Server

If your backend server is running:
1. Stop it (press `Ctrl+C` in the terminal)
2. Restart it:
   ```bash
   cd backend
   npm run dev
   ```

## ✅ Test It!

1. Open your application
2. Click the chatbot button (bottom right)
3. Ask any question: "What can you do?"
4. You should get an intelligent AI response!

## 💰 Cost Information

- **GPT-3.5-turbo**: ~$0.002 per 1K tokens (very affordable)
- A typical conversation uses 500-2000 tokens
- Cost per conversation: **Less than 1 cent**
- With $5 free credit, you can have **thousands of conversations**

## 🆓 Free Alternatives

If you prefer not to use OpenAI, you can use:
- **Hugging Face Inference API** (free tier available)
- **Anthropic Claude API**
- **Google Gemini API**

Just modify `backend/routes/chatbot.js` to use your preferred service.

## 🔒 Security

- ✅ Never commit your `.env` file to Git (it's already in `.gitignore`)
- ✅ Never share your API key publicly
- ✅ Keep your key secure

## 🆘 Need Help?

If you encounter any issues:
1. Check that your API key is correct in `backend/.env`
2. Verify you have credits in your OpenAI account
3. Check the backend console for error messages
4. Make sure the backend server is running

