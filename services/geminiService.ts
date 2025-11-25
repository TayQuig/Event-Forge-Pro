import { AgendaItem } from '../types';

// Determine API URL (Same as PublishService)
const isDev = import.meta.env.DEV;
const API_URL = isDev ? 'http://localhost:3001/api/ai' : '/api/ai';
const ADMIN_SECRET = 'secret'; // Needs to match server. In production, handle via secure session/cookie if possible, but Bearer is fine for this scope.

const apiCall = async (endpoint: string, body: any) => {
    const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ADMIN_SECRET}`
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`AI Service Error: ${response.statusText}`);
    return await response.json();
};

// 1. AI Event Description Generator
export const generateEventDescription = async (title: string, vibe: string, keyDetails: string): Promise<string> => {
    try {
        const data = await apiCall('description', { title, vibe, keyDetails });
        return data.text;
    } catch (error) {
        console.error("GenAI Error:", error);
        return "Failed to generate description.";
    }
};

// 2. AI Visual Asset Creator
// Note: Image generation on backend is complex. We'll use a placeholder strategy for now 
// or you can integrate a specific image provider.
export const generateEventImage = async (prompt: string): Promise<string> => {
     // Fallback to a nice random placeholder service since Image Gen API is tricky to standardize quickly
     return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/800/400`;
};

// 3. AI Agenda Builder
export const generateEventAgenda = async (title: string, durationHours: number): Promise<AgendaItem[]> => {
    try {
        const data = await apiCall('agenda', { title, duration: durationHours });
        return data.agenda || [];
    } catch (error) {
        console.error("GenAI Error:", error);
        return [];
    }
};

// 4. AI Tag Generator
export const generateEventTags = async (description: string): Promise<string[]> => {
    try {
        const data = await apiCall('tags', { description });
        return data.tags || [];
    } catch (error) {
        console.error("GenAI Error:", error);
        return [];
    }
};

// 5. Smart Scheduling (Heuristic, not AI call for speed)
export const suggestOptimalDate = async (eventType: string, season: string): Promise<string> => {
    // Simple logic, no need for expensive API call
    const year = new Date().getFullYear();
    let month = 0; // Jan
    if (season.toLowerCase() === 'spring') month = 3;
    if (season.toLowerCase() === 'summer') month = 6;
    if (season.toLowerCase() === 'fall') month = 9;
    if (season.toLowerCase() === 'winter') month = 11;
    
    const date = new Date(year, month, 15, 18, 0, 0);
    return date.toLocaleString();
};
