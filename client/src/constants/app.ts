export const APP_CONFIG = {
    EMBED_API_CLIENT_ID: import.meta.env.VITE_ADOBE_EMBED_API_CLIENT_ID || "your-client-id-here",
    BACKEND_URL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8080",
    AUDIO_OVERVIEW_TYPES: ['overview', 'podcast'],
    INSIGHTS_GENERATION_TYPES: ['comprehensive', 'takeaways', 'examples', 'contradictions'],
}