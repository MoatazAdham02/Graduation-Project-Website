const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @route   POST /api/chatbot
// @desc    Get AI response from chatbot
// @access  Protected (optional - can be public if you want)
router.post('/', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      // Fallback to simple responses if API key is not configured
      return res.json({
        response: generateFallbackResponse(message),
        model: 'fallback'
      });
    }

    // Use OpenAI API
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: openaiApiKey
      });

      // Build conversation context
      const messages = [
        {
          role: 'system',
          content: `You are a helpful medical imaging assistant for a DICOM (Digital Imaging and Communications in Medicine) viewer platform. 
          You help users with:
          - Understanding DICOM files and medical imaging
          - Navigating the platform features
          - Patient management
          - Report generation and analysis
          - Image viewing and annotation tools
          - General questions about medical imaging
        
          Be professional, concise, and helpful. If asked about something outside your knowledge, politely redirect to relevant features or suggest contacting support.`
        },
        ...(conversationHistory || []).map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        })),
        {
          role: 'user',
          content: message
        }
      ];

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });

      const response = completion.choices[0].message.content;

      res.json({
        response: response,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
      });

    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError);
      
      // Fallback if OpenAI API fails
      res.json({
        response: generateFallbackResponse(message),
        model: 'fallback',
        error: 'AI service temporarily unavailable, using fallback responses'
      });
    }

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      response: generateFallbackResponse(req.body.message || '')
    });
  }
});

// Fallback response generator (simple keyword matching)
function generateFallbackResponse(userInput) {
  const input = userInput.toLowerCase();
  
  if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
    return "Hello! I'm your medical imaging assistant. How can I help you today?";
  }
  if (input.includes('dicom') || input.includes('image')) {
    return "DICOM (Digital Imaging and Communications in Medicine) is a standard for handling, storing, and transmitting medical imaging information. You can upload DICOM files in the viewer section to analyze medical images.";
  }
  if (input.includes('patient') || input.includes('report')) {
    return "You can manage patients and view reports in the Patient Management and Reports sections. Would you like help with a specific task?";
  }
  if (input.includes('help') || input.includes('how')) {
    return "I can help you with:\n• Understanding DICOM files\n• Navigating the platform\n• Patient management\n• Report generation\n• Image analysis\n\nWhat would you like to know more about?";
  }
  if (input.includes('upload') || input.includes('file')) {
    return "To upload a DICOM file, go to the DICOM Viewer page and either drag and drop your file or click to browse. The system will automatically parse and display your medical images.";
  }
  if (input.includes('analyze') || input.includes('analysis')) {
    return "Our platform provides advanced image analysis tools including zoom, pan, window/level adjustments, and annotation tools. You can also generate detailed medical reports based on your findings.";
  }
  if (input.includes('export') || input.includes('download')) {
    return "You can export reports as PDF files. Simply go to the Reports section and click the export button on any report.";
  }
  
  return "I understand you're asking about: \"" + userInput + "\". To enable full AI-powered responses, please configure the OpenAI API key in the backend environment variables. For now, I can help you with DICOM files, patient management, reports, and general navigation. Could you rephrase your question or ask about a specific feature?";
}

module.exports = router;

