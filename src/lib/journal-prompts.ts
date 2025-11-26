export type JournalPromptCategory =
    | "Gratitude"
    | "Reflection"
    | "Goals"
    | "Challenges"
    | "Anxiety"
    | "Sleep"
    | "Creative";

export interface JournalPrompt {
    id: string;
    text: string;
    category: JournalPromptCategory;
}

export const staticPrompts: JournalPrompt[] = [
    { id: "1", category: "Gratitude", text: "What are three small things you are grateful for today?" },
    { id: "2", category: "Gratitude", text: "Who is someone that made your day better recently, and why?" },
    { id: "3", category: "Gratitude", text: "Describe a moment today that brought you joy." },
    { id: "4", category: "Reflection", text: "How are you feeling right now, really?" },
    { id: "5", category: "Reflection", text: "What is one thing you learned about yourself this week?" },
    { id: "6", category: "Reflection", text: "If you could talk to your younger self, what would you say?" },
    { id: "7", category: "Goals", text: "What is one goal you want to achieve this month?" },
    { id: "8", category: "Goals", text: "What is a small step you can take tomorrow towards your dreams?" },
    { id: "9", category: "Challenges", text: "What is a challenge you are facing, and how can you overcome it?" },
    { id: "10", category: "Challenges", text: "Describe a time you showed resilience." },
    { id: "11", category: "Anxiety", text: "Write down everything that is worrying you right now. Then, cross out what you can't control." },
    { id: "12", category: "Anxiety", text: "What is the worst that could happen? What is the best that could happen? What is most likely to happen?" },
    { id: "13", category: "Sleep", text: "What can you let go of before you sleep tonight?" },
    { id: "14", category: "Sleep", text: "List three things that went well today." },
    { id: "15", category: "Creative", text: "If your mood was a weather forecast, what would it be?" },
];

export const getRandomPrompt = (category?: JournalPromptCategory): JournalPrompt => {
    const filtered = category
        ? staticPrompts.filter(p => p.category === category)
        : staticPrompts;
    return filtered[Math.floor(Math.random() * filtered.length)];
};
