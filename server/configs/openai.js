import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    timeout: 30000, // ✅ 30 second timeout
    maxRetries: 3,  // ✅ Auto retry on failure
});

export default openai;