import { supabase } from "./supabase";
import { toast } from "sonner";

export const checkAndUnlockAchievements = async (userId: string) => {
    try {
        // 1. Fetch all available achievements
        const { data: allAchievements } = await supabase
            .from("achievements")
            .select("*");

        if (!allAchievements) return;

        // 2. Fetch user's current unlocked achievements
        const { data: userAchievements } = await supabase
            .from("user_achievements")
            .select("achievement_id")
            .eq("user_id", userId);

        const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id));

        // 3. Calculate User Stats
        // Streak
        const { data: moodDates } = await supabase
            .from("mood_logs")
            .select("created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        const { data: journalDates } = await supabase
            .from("journal_entries")
            .select("created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        const dates = [
            ...(moodDates?.map(d => d.created_at.split('T')[0]) || []),
            ...(journalDates?.map(d => d.created_at.split('T')[0]) || [])
        ];
        const uniqueDates = Array.from(new Set(dates)).sort().reverse();

        let currentStreak = 0;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
            currentStreak = 1;
            let checkDate = new Date(uniqueDates.includes(today) ? today : yesterday);
            for (let i = 1; i < uniqueDates.length; i++) {
                checkDate.setDate(checkDate.getDate() - 1);
                const expectedDate = checkDate.toISOString().split('T')[0];
                if (uniqueDates.includes(expectedDate)) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        // Counts
        const journalCount = journalDates?.length || 0;

        const { count: wellnessCount } = await supabase
            .from("user_activities")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", userId);

        // 4. Check conditions and unlock
        const newUnlocks = [];

        for (const achievement of allAchievements) {
            if (unlockedIds.has(achievement.id)) continue;

            let unlocked = false;

            switch (achievement.condition_type) {
                case 'streak':
                    if (currentStreak >= achievement.condition_value) unlocked = true;
                    break;
                case 'count':
                    // We need to know WHICH count. For now, we infer from name/description or add a 'category' field.
                    // Since we don't have a category field yet, let's use simple heuristics based on name/description.
                    const lowerName = achievement.name.toLowerCase();
                    const lowerDesc = achievement.description.toLowerCase();

                    if (lowerName.includes('journal') || lowerDesc.includes('journal') || lowerDesc.includes('write')) {
                        if (journalCount >= achievement.condition_value) unlocked = true;
                    } else if (lowerName.includes('zen') || lowerDesc.includes('wellness') || lowerDesc.includes('session')) {
                        if ((wellnessCount || 0) >= achievement.condition_value) unlocked = true;
                    } else if (lowerName.includes('first step') || lowerDesc.includes('check-in')) {
                        // Assuming 'First Step' is about check-in or just general usage
                        if ((moodDates?.length || 0) >= achievement.condition_value) unlocked = true;
                    }
                    break;
            }

            if (unlocked) {
                newUnlocks.push({
                    user_id: userId,
                    achievement_id: achievement.id
                });

                // Notify user immediately
                toast.success(`Achievement Unlocked: ${achievement.icon} ${achievement.name}!`, {
                    duration: 5000,
                });
            }
        }

        // 5. Persist new unlocks
        if (newUnlocks.length > 0) {
            await supabase.from("user_achievements").insert(newUnlocks);
        }

    } catch (error) {
        console.error("Error checking achievements:", error);
    }
};
