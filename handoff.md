# Project Handoff - [11-26-25]

## 🚦 Status
- **Current Task:** Debugging Gemini API response parsing in `server/index.js`.
- **Last Action:** Updated `server/index.js` to handle variable response structures from Google GenAI SDK. Restarted server.
- **Server Status:** Running on ports 3001 (backend) and 5173 (frontend).

## 📝 Next Steps
1. [ ] Verify the AI description generation works in the UI.
2. [ ] Check if the "Agenda" and "Tags" features also need the same fix (likely yes).
3. [ ] Test the Stripe integration (currently in test mode).

## 🧠 Context & Gotchas
- **Environment:** We just rotated the `GEMINI_API_KEY` because the old one leaked. The new one is in `.env` (DO NOT COMMIT THIS FILE).
- **Railway Deployment:** The deployment failed earlier with `response.text is not a function`. We need to push the `server/index.js` fix to Railway once confirmed working locally.
- **Codebase:** `services/geminiService.ts` is the frontend service, but the actual API calls happen in `server/index.js` to hide the key.

## 🐛 Known Bugs
- "API Key not found" error might persist if the server process isn't fully killed before restarting.