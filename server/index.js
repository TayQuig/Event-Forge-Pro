import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Use port 3000 as the default for the unified app (typical for deployments) or fallback to env
const PORT = process.env.PORT || 3000;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'secret';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize GenAI
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Paths
const PUBLIC_DIR = path.join(__dirname, '../public');
const DIST_DIR = path.join(__dirname, '../dist'); // Vite build output
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

// Ensure Upload Directories Exist
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR);
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// --- Static File Serving ---

// 1. Serve User Uploads & Public JSON
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/events.json', express.static(path.join(PUBLIC_DIR, 'events.json')));

// 2. Serve Frontend (Vite Build)
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage: storage });

// Security Middleware
const checkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader === `Bearer ${ADMIN_SECRET}`) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// --- API Routes ---

app.post('/api/upload', checkAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const publicPath = `/uploads/${req.file.filename}`;
  res.json({ url: publicPath });
});

app.post('/api/publish', checkAuth, (req, res) => {
  const { events, settings } = req.body;
  
  if (!events || !Array.isArray(events)) {
    return res.status(400).json({ error: 'Invalid events data' });
  }

  const publishData = {
    lastUpdated: new Date().toISOString(),
    events,
    settings
  };

  const filePathPublic = path.join(PUBLIC_DIR, 'events.json');
  const filePathDist = path.join(DIST_DIR, 'events.json');
  
  try {
    fs.writeFileSync(filePathPublic, JSON.stringify(publishData, null, 2));
    if (fs.existsSync(DIST_DIR)) {
        fs.writeFileSync(filePathDist, JSON.stringify(publishData, null, 2));
    }
    console.log(`Events published.`);
    res.json({ success: true, message: 'Events published successfully' });
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ error: 'Failed to write events file' });
  }
});

// --- AI Endpoints (Server-Side) ---

app.post('/api/ai/description', checkAuth, async (req, res) => {
    const { title, vibe, keyDetails } = req.body;
    try {
        const prompt = `Write a compelling, marketing-focused event description for an event titled "${title}". 
        The vibe should be ${vibe}. 
        Key details to include: ${keyDetails}. 
        Keep it under 200 words, plain text, no markdown formatting other than paragraphs.`;

        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });
        res.json({ text: response.text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to generate description" });
    }
});

app.post('/api/ai/agenda', checkAuth, async (req, res) => {
    const { title, duration } = req.body;
    try {
        const prompt = `Create a 3-item agenda for an event titled "${title}".
        Return ONLY a valid JSON array of objects with keys: "time", "title", "description".
        Do not wrap in markdown code blocks.`;

        const response = await genAI.models.generateContent({
             model: 'gemini-2.0-flash',
             contents: prompt,
             config: { responseMimeType: 'application/json' }
        });
        
        // Parse JSON safely
        let agenda = [];
        try {
            const text = response.text || "[]";
            // Clean potential markdown
            const cleanText = text.replace(/```json|```/g, '').trim();
            agenda = JSON.parse(cleanText);
        } catch (e) {
            console.warn("Failed to parse AI JSON, returning empty", e);
        }
        res.json({ agenda });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to generate agenda" });
    }
});

app.post('/api/ai/tags', checkAuth, async (req, res) => {
    const { description } = req.body;
    try {
        const prompt = `Generate 5 short, relevant tags for this event description: "${description}". Return as a JSON array of strings.`;
        const response = await genAI.models.generateContent({
             model: 'gemini-2.0-flash',
             contents: prompt,
             config: { responseMimeType: 'application/json' }
        });
         let tags = [];
        try {
             const cleanText = (response.text || "[]").replace(/```json|```/g, '').trim();
            tags = JSON.parse(cleanText);
        } catch (e) { console.warn(e); }
        res.json({ tags });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to generate tags" });
    }
});

// Note: Image Generation (Imagen 3) via Gemini API requires specific model access.
// For now, we will use a placeholder generator or text-based prompt if model is unavailable.
// Assuming text-to-image is available on the key:
app.post('/api/ai/image', checkAuth, async (req, res) => {
   // This is complex as the current SDK might not support direct Image return easily in all tiers.
   // We will stub this or use a standard prompt response for now.
   // Implementing a mock response for safety unless paid tier is confirmed.
   res.status(501).json({ error: "Image generation requires advanced model configuration." });
});

// --- Catch-All ---
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  } else {
    res.status(404).send('Frontend build not found. Run npm run build.');
  }
});

app.listen(PORT, () => {
  console.log(`EventForge Server running on port ${PORT}`);
});
