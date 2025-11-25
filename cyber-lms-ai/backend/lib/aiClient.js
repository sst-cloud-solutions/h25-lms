// backend/lib/aiClient.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Make sure GEMINI_API_KEY is set in .env
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY is not set. AI features will fail.');
}

let genAI = null;
let model = null;

// Initialize only if API key is available
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✅ Gemini AI client initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize Gemini AI:', err.message);
  }
} else {
  console.error('❌ GEMINI_API_KEY is missing or empty. AI features will not work.');
}

/**
 * Call Gemini and expect a JSON-only response.
 * - Cleans ```json fences
 * - Parses JSON
 */
async function generateJson(prompt) {
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Remove markdown fences like ```json ... ```
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('❌ Gemini JSON parse error:', err.message);
    console.error('Raw Gemini response was:\n', text);
    throw new Error('Failed to parse JSON from Gemini response');
  }
}

/**
 * Call Gemini and just return plain text.
 */
async function generateText(prompt) {
  try {
    // Check if model is initialized
    if (!model || !genAI) {
      throw new Error('Gemini AI client is not initialized. Please check GEMINI_API_KEY in .env file');
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim().length === 0) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt is empty');
    }

    console.log('📤 Sending request to Gemini API...');
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('Gemini returned empty response');
    }
    
    console.log('✅ Received response from Gemini API');
    return text.trim();
  } catch (err) {
    console.error('❌ Gemini generateText error:', err.message);
    if (err.stack) {
      console.error('Stack trace:', err.stack);
    }
    // Re-throw with more context
    throw new Error(`AI feedback generation failed: ${err.message}`);
  }
}

module.exports = {
  aiClient: {
    generateJson,
    generateText
  }
};
