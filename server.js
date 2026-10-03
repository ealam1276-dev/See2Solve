import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

const DEFAULT_SYSTEM_PROMPT = `You are See2Solve, an expert visual intelligence assistant powered by Gemma multimodal AI.

Analyze the uploaded screenshot or PDF document carefully. The file could be a coding error, terminal log, UI bug, email/invitation, document, schedule, chart, PDF assignment, QR code, or technical guide.

Special Instructions:
- If the image contains a QR code, decode the QR code and extract the exact URL / link or text stored inside it.
- State the extracted URL / link clearly in both the SOLUTION and STEPS sections.

Identify:
1. What the image/PDF shows (The exact problem, document type, QR code link, diagram, or event identified).
2. The context or why it happened / what it represents.
3. The exact fix, solution, extracted QR code link, or action required.
4. Step-by-Step instructions, checklist, or agenda timeline.
5. One prevention tip, key takeaway, or preparation advice.

Do not invent information that isn't visible in the file.

Return the response in this EXACT structured format:

PROBLEM:
[Clear description of what is shown, error message, or QR code detected]

ROOT CAUSE:
[Detailed context explaining why this error occurred OR background of this document/QR code]

SOLUTION:
[Exact code fix, terminal command, decoded QR Code URL / Link, OR key action required]

STEPS:
1. [First action or timeline step]
2. [Second action or timeline step]
3. [Third action or timeline step]

PREVENTION:
[Proactive tip to prevent this error OR preparation/learning takeaway]`;

// Helper to parse Gemma's structured output
function parseGemmaResponse(text) {
  const result = {
    problem: '',
    rootCause: '',
    solution: '',
    steps: [],
    prevention: '',
    rawText: text
  };

  try {
    const problemMatch = text.match(/PROBLEM:\s*([\s\S]*?)(?=ROOT CAUSE:|$)/i);
    const causeMatch = text.match(/ROOT CAUSE:\s*([\s\S]*?)(?=SOLUTION:|$)/i);
    const solutionMatch = text.match(/SOLUTION:\s*([\s\S]*?)(?=STEPS:|$)/i);
    const stepsMatch = text.match(/STEPS:\s*([\s\S]*?)(?=PREVENTION:|$)/i);
    const preventionMatch = text.match(/PREVENTION:\s*([\s\S]*?)$/i);

    if (problemMatch) result.problem = problemMatch[1].trim();
    if (causeMatch) result.rootCause = causeMatch[1].trim();
    if (solutionMatch) result.solution = solutionMatch[1].trim();
    
    if (stepsMatch) {
      const rawSteps = stepsMatch[1].trim();
      result.steps = rawSteps
        .split('\n')
        .map(s => s.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(s => s.length > 0);
    }
    
    if (preventionMatch) result.prevention = preventionMatch[1].trim();

    if (!result.problem && text) {
      result.problem = "Visual / Document analysis completed.";
      result.solution = text;
    }
  } catch (err) {
    console.error('Error parsing response structure:', err);
  }

  return result;
}

// Fallback demo data ONLY used when no file is uploaded and demo sample button is clicked
const DEMO_FALLBACKS = {
  flask: {
    problem: "Python cannot find the Flask package in your current environment (ModuleNotFoundError: No module named 'flask').",
    rootCause: "The Flask library is not installed in the specific Python virtual environment or interpreter currently active in VS Code / terminal.",
    solution: "pip install flask",
    steps: [
      "Open your terminal in VS Code (Ctrl + ` or Cmd + `)",
      "Ensure your virtual environment is active (if applicable)",
      "Run the command: pip install flask",
      "Restart your Python script or flask development server"
    ],
    prevention: "Add 'flask' to your requirements.txt file and ensure your IDE interpreter setting points to your project's active virtual environment."
  },
  generic: {
    problem: "Configuration or import resolution error detected in your application environment.",
    rootCause: "Required runtime dependency, module path, or environment variable is missing or mismatched.",
    solution: "Verify dependencies and environment setup:\n\n1. Run npm install or pip install\n2. Check environment variables in .env file",
    steps: [
      "Check terminal error trace for exact package or symbol name",
      "Install missing packages using your package manager",
      "Restart the local development server",
      "Verify system status and version compatibility"
    ],
    prevention: "Document all workspace prerequisites in README.md and use package lock files to lock dependencies."
  }
};

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMMA_API_KEY;
  res.json({
    status: 'ok',
    service: 'See2Solve Backend API',
    model: 'gemini-3.8-flash',
    hasApiKey: !!apiKey
  });
});

// Analyze Image / PDF Endpoint
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    let imageBuffer;
    let mimeType = 'image/png';
    const userQuery = req.body.userQuery || 'Analyze this file and explain what it shows and how to resolve or handle it.';
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMMA_API_KEY;

    if (req.file) {
      imageBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
    } else if (req.body.imageBase64) {
      const match = req.body.imageBase64.match(/^data:(.*?);base64,/);
      if (match) mimeType = match[1];
      const base64Data = req.body.imageBase64.replace(/^data:.*?;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (req.body.isDemoSample) {
      const sampleKey = req.body.sampleKey || 'flask';
      const fallback = DEMO_FALLBACKS[sampleKey] || DEMO_FALLBACKS.flask;
      await new Promise(r => setTimeout(r, 800));

      return res.json({
        success: true,
        isDemoMode: true,
        modelUsed: "Gemma 4 Multimodal (Demo Mode)",
        structured: fallback,
        rawText: `PROBLEM:\n${fallback.problem}\n\nROOT CAUSE:\n${fallback.rootCause}\n\nSOLUTION:\n${fallback.solution}\n\nSTEPS:\n${fallback.steps.map((s, i) => `${i+1}. ${s}`).join('\n')}\n\nPREVENTION:\n${fallback.prevention}`
      });
    } else {
      return res.status(400).json({ error: 'No file provided. Please upload a screenshot or PDF document.' });
    }

    if (!apiKey) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is missing in your .env file.',
        details: 'Please add GEMINI_API_KEY=your_key in the .env file.'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Robust list of models for automatic failover if 503 / high demand occurs
    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-flash-latest'
    ];

    let textOutput = '';
    let usedModelName = '';
    let lastError = null;

    const promptText = `${DEFAULT_SYSTEM_PROMPT}\n\nUser Question/Context: ${userQuery}`;
    const filePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    // Retry & failover loop across candidate models
    for (const mName of candidateModels) {
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        try {
          console.log(`🤖 Attempting vision analysis with model [${mName}] (Attempt ${attempts + 1})...`);
          const model = genAI.getGenerativeModel({ model: mName });
          const result = await model.generateContent([promptText, filePart]);
          const response = await result.response;
          textOutput = response.text();
          usedModelName = mName;
          break; // Success!
        } catch (err) {
          attempts++;
          console.warn(`⚠️ Model [${mName}] attempt ${attempts} failed: ${err.message}`);
          lastError = err;
          
          // Wait 500ms before retrying or failing over
          if (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }

      if (textOutput) break; // Exit model loop once output received
    }

    if (!textOutput) {
      throw lastError || new Error('All model candidates are experiencing high load. Please try again in a few seconds.');
    }

    const parsed = parseGemmaResponse(textOutput);

    return res.json({
      success: true,
      isDemoMode: false,
      modelUsed: `Gemma 4 Multimodal (${usedModelName})`,
      structured: parsed,
      rawText: textOutput
    });

  } catch (error) {
    console.error('❌ Error analyzing file with Gemma API:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze file',
      details: 'Google AI servers experienced high demand. Automated retries failed, please try again.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 See2Solve Backend Server running at http://localhost:${PORT}`);
  console.log(`🔑 Gemini API Key configured: ${process.env.GEMINI_API_KEY ? 'YES' : 'NO'}`);
});
