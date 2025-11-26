import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Manually parse .env file
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};

envConfig.split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const API_KEY = env['VITE_GEMINI_API_KEY'];

if (!API_KEY) {
    console.error('❌ Missing VITE_GEMINI_API_KEY in .env');
    process.exit(1);
}

console.log(`Checking Gemini API with key: ${API_KEY.substring(0, 10)}...`);

const genAI = new GoogleGenerativeAI(API_KEY);

async function verifyGemini() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = "Hello, are you working?";

        console.log(`Sending prompt: "${prompt}"`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Gemini API response received:');
        console.log(text);
    } catch (error: any) {
        console.error('❌ Gemini API failed:', error.message);
        if (error.message.includes('API_KEY_INVALID')) {
            console.error('   Hint: The API key seems to be invalid.');
        }
        process.exit(1);
    }
}

verifyGemini();
