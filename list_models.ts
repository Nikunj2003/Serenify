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

console.log(`Checking models with key: ${API_KEY.substring(0, 10)}...`);

// Use the API directly via fetch to list models if SDK doesn't expose it easily in this version,
// or try to use the SDK's listModels if available (it is in newer versions).
// For safety, let's use a simple fetch to the REST API.

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.error) {
            console.error('❌ Error listing models:', data.error);
            return;
        }

        console.log('✅ Available Models:');
        if (data.models) {
            data.models.forEach((model: any) => {
                if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${model.name} (Display: ${model.displayName})`);
                }
            });
        } else {
            console.log('No models found.');
        }

    } catch (error: any) {
        console.error('❌ Failed to list models:', error.message);
    }
}

listModels();
