import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabase";

import { chatService } from "./chat-service";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("VITE_GEMINI_API_KEY is not set. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

// Generate embedding for a given text
export const generateEmbedding = async (text: string): Promise<number[] | null> => {
    if (!API_KEY) return null;
    try {
        const model = genAI.getGenerativeModel({ model: "embedding-001" });
        const result = await model.embedContent(text);
        const embedding = result.embedding;
        return embedding.values;
    } catch (error) {
        console.error("Error generating embedding:", error);
        return null;
    }
};

export const generateAIResponse = async (prompt: string): Promise<string> => {
    if (!API_KEY) return "AI service unavailable.";
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating AI response:", error);
        return "Failed to generate insights.";
    }
};

// Store document embedding in Supabase
export const storeDocumentEmbedding = async (
    userId: string,
    content: string,
    type: 'document' | 'condition' | 'chat' | 'journal',
    metadata: any = {}
) => {
    const embedding = await generateEmbedding(content);
    if (!embedding) return null;

    const { data, error } = await supabase
        .from('embeddings')
        .insert({
            user_id: userId,
            content,
            embedding,
            type,
            metadata
        })
        .select()
        .single();

    if (error) {
        console.error("Error storing embedding:", error);
        throw error;
    }

    return data;
};

// Search for relevant context
export const searchContext = async (query: string, matchThreshold = 0.7, matchCount = 5) => {
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding) return [];

    const { data, error } = await supabase.rpc('match_embeddings', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount
    });

    if (error) {
        console.error("Error searching context:", error);
        return [];
    }

    return data;
};

// Helper to get privacy settings
const getPrivacySettings = async (userId: string) => {
    const { data } = await supabase
        .from('profiles')
        .select('privacy_settings')
        .eq('id', userId)
        .single();

    return data?.privacy_settings || { share_journal: true, share_mood: true, share_activities: true };
};

// Generate User Persona based on recent activity
export const generateUserPersona = async (userId: string) => {
    if (!API_KEY) return null;

    try {
        const settings = await getPrivacySettings(userId);
        let moodLogs: any[] = [];
        let activities: any[] = [];
        let journalEntries: any[] = [];

        // 1. Fetch recent data based on privacy settings
        if (settings.share_mood) {
            const { data } = await supabase
                .from('mood_logs')
                .select('mood, note, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10);
            moodLogs = data || [];
        }

        if (settings.share_activities) {
            const { data } = await supabase
                .from('user_activities')
                .select('activity_type, duration_seconds, completed_at')
                .eq('user_id', userId)
                .order('completed_at', { ascending: false })
                .limit(10);
            activities = data || [];
        }

        if (settings.share_journal) {
            const { data } = await supabase
                .from('journal_entries')
                .select('content, mood, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);
            journalEntries = data || [];
        }

        // 2. Construct prompt
        const dataContext = `
        Recent Moods: ${JSON.stringify(moodLogs)}
        Recent Activities: ${JSON.stringify(activities)}
        Recent Journal Entries: ${JSON.stringify(journalEntries)}
        `;

        const prompt = `
        Analyze the following user data (moods, activities, journals) and generate a concise "User Persona" summary (max 3 sentences).
        Focus on their current mental state, what helps them (activities), and any recurring themes.
        Do not use the user's name, just refer to them as "the user".
        
        Data:
        ${dataContext}
        `;

        // 3. Call Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const persona = result.response.text();

        // 4. Save to profile
        await supabase
            .from('profiles')
            .update({ persona_summary: persona })
            .eq('id', userId);

        return persona;
    } catch (error) {
        console.error("Error generating persona:", error);
        return null;
    }
};

// Generate Initial Persona from Onboarding Data
export const generateInitialPersona = async (userId: string, goals: string[], bio: string, initialMood: string) => {
    if (!API_KEY) return null;

    try {
        const prompt = `
        Generate a concise "User Persona" summary (max 3 sentences) for a new user based on their onboarding inputs.
        
        User Goals: ${goals.join(", ")}
        User Bio/Intent: "${bio}"
        Initial Mood: "${initialMood}"
        
        Focus on their motivations and current state. Do not use the user's name.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const persona = result.response.text();

        // Save to profile
        await supabase
            .from('profiles')
            .update({ persona_summary: persona })
            .eq('id', userId);

        return persona;
    } catch (error) {
        console.error("Error generating initial persona:", error);
        return null;
    }
};

// Generate personalized journal prompts
export const generateJournalPrompt = async (userId: string): Promise<string[]> => {
    if (!API_KEY) return ["What is one thing you are grateful for today?"];

    try {
        const settings = await getPrivacySettings(userId);
        let moodLogs: any[] = [];
        let journalEntries: any[] = [];

        // 1. Fetch recent context based on privacy settings
        if (settings.share_mood) {
            const { data } = await supabase
                .from('mood_logs')
                .select('mood, note, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);
            moodLogs = data || [];
        }

        if (settings.share_journal) {
            const { data } = await supabase
                .from('journal_entries')
                .select('content, mood, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(3);
            journalEntries = data || [];
        }

        // 2. Construct prompt
        const prompt = `
        Based on the user's recent mood and journal history, generate 3 personalized, thought-provoking journal prompts to help them reflect and process their emotions.
        
        Recent Moods: ${JSON.stringify(moodLogs)}
        Recent Journals: ${JSON.stringify(journalEntries)}
        
        Output ONLY the 3 prompts as a JSON array of strings. Example: ["Prompt 1", "Prompt 2", "Prompt 3"]
        Do not include any markdown formatting or extra text.
        `;

        // 3. Call Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // 4. Parse response
        try {
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const prompts = JSON.parse(cleanedText);
            return Array.isArray(prompts) ? prompts : ["What's on your mind right now?"];
        } catch (e) {
            console.error("Error parsing prompts:", e);
            return ["What is the most dominant emotion you are feeling right now?", "What is one small win you had today?", "Write about a challenge you overcame recently."];
        }
    } catch (error) {
        console.error("Error generating prompts:", error);
        return ["What are you grateful for today?", "How are you feeling in this moment?", "What is one goal for tomorrow?"];
    }
};

export const getWellnessRecommendations = async (moodScore: number) => {
    try {
        const { data: sessions, error } = await supabase
            .from('wellness_sessions')
            .select('*');

        if (error) throw error;

        // Simple heuristic for now:
        // Low mood (< 3): Focus on stress relief, anxiety reset
        // High mood (> 3): Focus on mindfulness, growth
        let recommendedType = 'meditation';
        if (moodScore <= 2) recommendedType = 'breathing';
        else if (moodScore >= 4) recommendedType = 'meditation';

        // Return top 2 matching types, plus 1 random
        const recommended = sessions.filter(s => s.type === recommendedType).slice(0, 2);
        const others = sessions.filter(s => s.type !== recommendedType);
        if (others.length > 0) {
            recommended.push(others[Math.floor(Math.random() * others.length)]);
        }

        return recommended.length > 0 ? recommended : sessions.slice(0, 3);
    } catch (error) {
        console.error("Error getting recommendations:", error);
        return [];
    }
};

// Generate weekly journal insights
export const generateJournalInsights = async (userId: string) => {
    if (!API_KEY) return null;

    try {
        const settings = await getPrivacySettings(userId);

        if (!settings.share_journal) {
            return {
                summary: "Journal analysis is disabled due to privacy settings.",
                mood_trend: "Enable 'Share Journal Entries' in your profile to see insights.",
                key_topics: [],
                advice: "You can update your privacy settings in your Profile."
            };
        }

        // Fetch last 7 days of journals
        const { data: entries } = await supabase
            .from('journal_entries')
            .select('content, mood, created_at, tags')
            .eq('user_id', userId)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: true });

        if (!entries || entries.length === 0) return null;

        const prompt = `
    Analyze these journal entries from the past week:
    ${JSON.stringify(entries)}

    Provide a JSON response with the following structure:
    {
      "summary": "A brief 2-3 sentence summary of the week's themes.",
      "mood_trend": "A description of how the mood shifted (e.g., 'Started low but improved').",
      "key_topics": ["Topic 1", "Topic 2", "Topic 3"],
      "advice": "One actionable piece of advice based on these entries."
    }
    Do not include markdown formatting.
    `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        try {
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (e) {
            console.error("Error parsing insights:", e);
            return null;
        }
    } catch (error) {
        console.error("Error generating insights:", error);
        return null;
    }
};

// Generate tags for journal entry
export const generateJournalTags = async (content: string): Promise<string[]> => {
    if (!API_KEY || !content) return [];

    try {
        const prompt = `
        Analyze the following journal entry and suggest up to 5 relevant tags (keywords) that capture the main themes, emotions, or topics.
        
        Journal Entry:
        "${content}"
        
        Output ONLY a JSON array of strings. Example: ["anxiety", "work", "gratitude"]
        Do not include markdown formatting.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        try {
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const tags = JSON.parse(cleanedText);
            return Array.isArray(tags) ? tags : [];
        } catch (e) {
            console.error("Error parsing tags:", e);
            return [];
        }
    } catch (error) {
        console.error("Error generating tags:", error);
        return [];
    }
};

// Generate tags for chat session
export const generateChatTags = async (history: string): Promise<string[]> => {
    if (!API_KEY || !history) return [];

    try {
        const prompt = `
        Analyze the following conversation history and suggest up to 3 relevant tags (keywords) that capture the main topics or themes.
        
        Conversation:
        "${history}"
        
        Output ONLY a JSON array of strings. Example: ["anxiety", "work", "relationships"]
        Do not include markdown formatting.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        try {
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const tags = JSON.parse(cleanedText);
            return Array.isArray(tags) ? tags : [];
        } catch (e) {
            console.error("Error parsing chat tags:", e);
            return [];
        }
    } catch (error) {
        console.error("Error generating chat tags:", error);
        return [];
    }
};

// Get AI-recommended activities based on chat context
export const getRecommendedActivities = async (context: string): Promise<any[]> => {
    if (!API_KEY) return [];

    try {
        const prompt = `
        Based on the following conversation context, suggest 3 specific wellness activities that would be helpful for the user right now.
        Choose from these types: "meditation", "breathing", "yoga", "gratitude", "journaling", "walk".
        
        Context:
        "${context}"
        
        Output ONLY a JSON array of objects. Example:
        [
            { "type": "meditation", "title": "Calming Meditation", "reason": "To help reduce anxiety." },
            { "type": "walk", "title": "Nature Walk", "reason": "To clear your mind." }
        ]
        Do not include markdown formatting.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        try {
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const activities = JSON.parse(cleanedText);
            return Array.isArray(activities) ? activities : [];
        } catch (e) {
            console.error("Error parsing activities:", e);
            return [];
        }
    } catch (error) {
        console.error("Error generating activity recommendations:", error);
        return [];
    }
};

// Chat with AI using RAG, History, and Persona
export const chatWithAI = async (message: string, userId: string, sessionId: string) => {
    if (!API_KEY) return "I'm sorry, but I can't process your request right now because my AI brain is missing an API key.";

    try {
        const settings = await getPrivacySettings(userId);

        // 1. Retrieve relevant context (RAG)
        const contextItems = await searchContext(message);

        // Filter context based on privacy settings
        const filteredContext = contextItems?.filter((item: any) => {
            if (item.type === 'journal' && !settings.share_journal) return false;
            // Assuming 'mood' type might be added later or mapped
            // if (item.type === 'mood' && !settings.share_mood) return false; 
            // if (item.type === 'activity' && !settings.share_activities) return false;
            return true;
        });

        const contextString = filteredContext
            ?.map((item: any) => `[${item.type.toUpperCase()}] ${item.content}`)
            .join("\n\n");

        // 2. Retrieve Conversation History (Last 20 messages)
        const history = await chatService.getMessages(sessionId);
        const recentHistory = history.slice(-20).map(msg => `${msg.sender.toUpperCase()}: ${msg.content}`).join("\n");

        // 3. Retrieve User Persona
        const { data: profile } = await supabase
            .from('profiles')
            .select('persona_summary, full_name')
            .eq('id', userId)
            .single();

        const userPersona = profile?.persona_summary || "No specific persona available yet.";
        const userName = profile?.full_name || "User";

        // 4. Retrieve Recent Activity (Live Context)
        let recentActivity = "";

        if (settings.share_mood) {
            const { data: moods } = await supabase
                .from('mood_logs')
                .select('mood, note, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (moods && moods.length > 0) {
                recentActivity += `RECENT MOOD LOGS:\n${JSON.stringify(moods)}\n\n`;
            }
        }

        if (settings.share_journal) {
            const { data: journals } = await supabase
                .from('journal_entries')
                .select('content, mood, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(3);

            if (journals && journals.length > 0) {
                recentActivity += `RECENT JOURNAL ENTRIES:\n${JSON.stringify(journals)}\n\n`;
            }
        }

        if (settings.share_activities) {
            const { data: activities } = await supabase
                .from('user_activities')
                .select('activity_type, duration_seconds, completed_at')
                .eq('user_id', userId)
                .order('completed_at', { ascending: false })
                .limit(5);

            if (activities && activities.length > 0) {
                recentActivity += `RECENT COMPLETED ACTIVITIES:\n${JSON.stringify(activities)}\n\n`;
            }
        }

        // 5. Construct prompt
        const systemPrompt = `
You are MindCompanion, a supportive, empathetic, and personalized mental health AI assistant.
Your goal is to provide comforting, non-judgmental support and practical wellness advice.

IMPORTANT SAFETY GUIDELINES:
- You are NOT a doctor or therapist. Do NOT give medical diagnoses or prescribe medication.
- If the user expresses self-harm, suicide, or severe crisis, you MUST immediately urge them to seek professional help and provide this resource: "Please reach out to a professional or call a crisis helpline immediately."

USER PERSONA (Use this to tailor your tone and advice):
${userPersona}

RECENT USER ACTIVITY (Live data - Use this to answer questions about "today" or recent events):
${recentActivity || "No recent activity found."}

USER CONTEXT (From documents/journals - RAG Search):
${contextString || "No specific context available."}

CONVERSATION HISTORY:
${recentHistory}

CURRENT USER MESSAGE:
${message}

Respond to the user (${userName}) with empathy, warmth, and helpfulness. Keep responses concise but meaningful.
`;

        // 6. Call Gemini API
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(systemPrompt);
        const response = result.response;
        const text = response.text();

        return text;
    } catch (error) {
        console.error("Error in chatWithAI:", error);
        return "I'm having trouble thinking right now. Please try again later.";
    }
};
