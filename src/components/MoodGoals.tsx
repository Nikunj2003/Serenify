import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Target, Trash2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

const MoodGoals = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // New Goal State
    const [goalType, setGoalType] = useState("frequency");
    const [targetMetric, setTargetMetric] = useState("mood");
    const [targetValue, setTargetValue] = useState("4"); // Default to "Good" (4) or value
    const [frequency, setFrequency] = useState("5"); // Days per week

    useEffect(() => {
        if (user) {
            fetchGoals();
        }
    }, [user]);

    const fetchGoals = async () => {
        try {
            const { data, error } = await supabase
                .from("mood_goals")
                .select("*")
                .eq("user_id", user?.id)
                .eq("is_active", true)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setGoals(data || []);
        } catch (error) {
            console.error("Error fetching goals:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddGoal = async () => {
        try {
            let goalData: any = {};

            if (goalType === "frequency") {
                goalData = {
                    mood: parseInt(targetValue),
                    days_per_week: parseInt(frequency)
                };
            } else if (goalType === "reduction") {
                goalData = {
                    metric: targetMetric, // stress, anxiety
                    max_value: parseInt(targetValue)
                };
            }

            const { error } = await supabase.from("mood_goals").insert({
                user_id: user?.id,
                goal_type: goalType,
                target_value: goalData
            });

            if (error) throw error;

            toast.success("Goal set successfully!");
            setIsDialogOpen(false);
            fetchGoals();
        } catch (error: any) {
            toast.error("Failed to set goal: " + error.message);
        }
    };

    const handleDeleteGoal = async (id: string) => {
        try {
            const { error } = await supabase
                .from("mood_goals")
                .update({ is_active: false })
                .eq("id", id);

            if (error) throw error;
            toast.success("Goal removed");
            fetchGoals();
        } catch (error) {
            toast.error("Failed to remove goal");
        }
    };

    const getGoalDescription = (goal: any) => {
        const target = goal.target_value;
        if (goal.goal_type === "frequency") {
            const moodLabel = ["", "Struggling", "Difficult", "Okay", "Good", "Great"][target.mood] || "Good";
            return `Feel "${moodLabel}" at least ${target.days_per_week} days/week`;
        } else if (goal.goal_type === "reduction") {
            return `Keep ${target.metric} below ${target.max_value}/10`;
        }
        return "Custom Goal";
    };

    return (
        <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Mood Goals
                    </CardTitle>
                    <CardDescription>Set and track your emotional well-being targets</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Goal
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Set a New Goal</DialogTitle>
                            <DialogDescription>What would you like to achieve?</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Goal Type</Label>
                                <Select value={goalType} onValueChange={setGoalType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="frequency">Mood Frequency (e.g., Feel Good 5x/week)</SelectItem>
                                        <SelectItem value="reduction">Reduction (e.g., Keep Stress low)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {goalType === "frequency" && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Target Mood</Label>
                                        <Select value={targetValue} onValueChange={setTargetValue}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">Great (5)</SelectItem>
                                                <SelectItem value="4">Good (4)</SelectItem>
                                                <SelectItem value="3">Okay (3)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Days per Week</Label>
                                        <Select value={frequency} onValueChange={setFrequency}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                                    <SelectItem key={d} value={d.toString()}>{d} days</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            {goalType === "reduction" && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Metric to Reduce</Label>
                                        <Select value={targetMetric} onValueChange={setTargetMetric}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="stress">Stress</SelectItem>
                                                <SelectItem value="anxiety">Anxiety</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Maximum Level (1-10)</Label>
                                        <Select value={targetValue} onValueChange={setTargetValue}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 5].map(v => (
                                                    <SelectItem key={v} value={v.toString()}>{v} (Low)</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddGoal}>Set Goal</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading goals...</div>
                ) : goals.length > 0 ? (
                    <div className="space-y-3">
                        {goals.map((goal) => (
                            <div key={goal.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium text-sm">{getGoalDescription(goal)}</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No active goals.</p>
                        <Button variant="link" onClick={() => setIsDialogOpen(true)}>Set your first goal</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MoodGoals;
