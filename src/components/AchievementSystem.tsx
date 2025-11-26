import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Lock, Medal } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { motion } from "framer-motion";
import { format } from "date-fns";

type Achievement = {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition_type: string;
    condition_value: number;
};

type UserAchievement = {
    achievement_id: string;
    unlocked_at: string;
};

const AchievementSystem = () => {
    const { user } = useAuth();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [userAchievements, setUserAchievements] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                setLoading(true);

                // Fetch all achievements
                const { data: allAchievements, error: achError } = await supabase
                    .from("achievements")
                    .select("*")
                    .order("condition_value", { ascending: true });

                if (achError) throw achError;
                setAchievements(allAchievements || []);

                // Fetch user unlocked achievements
                const { data: unlocked, error: userAchError } = await supabase
                    .from("user_achievements")
                    .select("achievement_id, unlocked_at")
                    .eq("user_id", user.id);

                if (userAchError) throw userAchError;

                const unlockedMap: Record<string, string> = {};
                unlocked?.forEach((ua: UserAchievement) => {
                    unlockedMap[ua.achievement_id] = ua.unlocked_at;
                });
                setUserAchievements(unlockedMap);

            } catch (error) {
                console.error("Error fetching achievements:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <LoadingSkeleton key={i} variant="card" className="h-32" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Achievements
                </h3>
                <span className="text-sm text-muted-foreground">
                    {Object.keys(userAchievements).length} / {achievements.length} Unlocked
                </span>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {achievements.map((achievement, index) => {
                    const isUnlocked = !!userAchievements[achievement.id];
                    const unlockedDate = isUnlocked ? new Date(userAchievements[achievement.id]) : null;

                    return (
                        <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className={`h-full transition-all ${isUnlocked ? "border-primary/50 bg-primary/5" : "opacity-70 grayscale"}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className={`p-2 rounded-full ${isUnlocked ? "bg-primary/20" : "bg-muted"}`}>
                                            <span className="text-xl">{achievement.icon}</span>
                                        </div>
                                        {isUnlocked ? (
                                            <Medal className="w-4 h-4 text-yellow-500" />
                                        ) : (
                                            <Lock className="w-4 h-4 text-muted-foreground" />
                                        )}
                                    </div>
                                    <CardTitle className="text-base mt-2">{achievement.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-xs mb-2">
                                        {achievement.description}
                                    </CardDescription>
                                    {isUnlocked && unlockedDate && (
                                        <p className="text-[10px] text-muted-foreground">
                                            Unlocked {format(unlockedDate, "MMM d, yyyy")}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default AchievementSystem;
