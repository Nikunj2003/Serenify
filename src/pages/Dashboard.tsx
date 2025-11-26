import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { MessageCircle, Book, Activity, ArrowRight, Sun, Moon, Calendar, CheckCircle2, Clock, X } from "lucide-react";
import MoodSelector from "@/components/MoodSelector";
import MoodGoals from "@/components/MoodGoals";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import MoodDimensionsSelector from "@/components/MoodDimensionsSelector";
import MoodTriggerSelector from "@/components/MoodTriggerSelector";
import SupportModal from "@/components/SupportModal";
import CelebrationModal from "@/components/CelebrationModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { checkAndUnlockAchievements } from "@/lib/achievement-service";

const Dashboard = () => {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [activityStats, setActivityStats] = useState({ completedToday: 0, totalMinutes: 0 });
  const [isMoodDialogOpen, setIsMoodDialogOpen] = useState(false);
  const [isSubmittingMood, setIsSubmittingMood] = useState(false);
  const [moodDimensions, setMoodDimensions] = useState({ energy: 5, anxiety: 3, stress: 3 });
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [contextNote, setContextNote] = useState("");
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState({ title: "", message: "", value: 0 });
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch all data in parallel
      const [moodResponse, journalResponse, activityResponse] = await Promise.all([
        supabase
          .from("mood_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(7),
        supabase
          .from("journal_entries")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("user_activities")
          .select("*")
          .gte("completed_at", today.toISOString())
      ]);

      if (moodResponse.error) throw moodResponse.error;
      if (journalResponse.error) throw journalResponse.error;
      if (activityResponse.error) throw activityResponse.error;

      const moodLogs = moodResponse.data || [];
      const entries = journalResponse.data || [];
      const activities = activityResponse.data || [];

      // Process Mood Logs
      if (moodLogs.length > 0) {
        const latestLog = moodLogs[0];
        const logDate = new Date(latestLog.created_at);
        const now = new Date();

        if (logDate.getDate() === now.getDate() &&
          logDate.getMonth() === now.getMonth() &&
          logDate.getFullYear() === now.getFullYear()) {
          setSelectedMood(getMoodValue(latestLog.mood));
          if (latestLog.energy_level) {
            setMoodDimensions({
              energy: latestLog.energy_level,
              anxiety: latestLog.anxiety_level || 3,
              stress: latestLog.stress_level || 3,
            });
          }
          if (latestLog.triggers) setSelectedTriggers(latestLog.triggers);
          if (latestLog.context_note) setContextNote(latestLog.context_note);
        }
      }

      const chartData = [...moodLogs]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(log => ({
          day: new Date(log.created_at).toLocaleDateString("en-US", { weekday: "short" }),
          mood: getMoodValue(log.mood),
          energy: log.energy_level || null,
          anxiety: log.anxiety_level || null,
          stress: log.stress_level || null,
          triggers: log.triggers || [],
        }));
      setMoodData(chartData);

      // Process Journal Entries
      setRecentEntries(entries);

      // Process Activities
      const completedToday = activities.length;
      const totalMinutes = activities.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0) / 60;

      setActivityStats({
        completedToday,
        totalMinutes: Math.round(totalMinutes)
      });

      // Calculate Streak and Check for Celebration
      checkStreak(user.id);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkStreak = async (userId: string) => {
    try {
      // Fetch all dates with activity (mood or journal)
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

      // Check milestones
      const milestones = [3, 7, 14, 30, 50, 100, 365];
      if (milestones.includes(currentStreak)) {
        const lastCelebrated = localStorage.getItem(`celebrated_streak_${currentStreak}`);
        // Only celebrate if we haven't celebrated this specific streak TODAY
        // Actually, we should only celebrate ONCE per milestone ever?
        // Or maybe once per streak instance?
        // Let's store "last_celebrated_date_streak_X"
        const todayStr = new Date().toDateString();

        if (lastCelebrated !== todayStr) {
          setCelebrationData({
            title: `${currentStreak} Day Streak! 🔥`,
            message: "You're on fire! Keep up the amazing consistency.",
            value: currentStreak
          });
          setShowCelebration(true);
          localStorage.setItem(`celebrated_streak_${currentStreak}`, todayStr);
        }
      }
    } catch (error) {
      console.error("Error calculating streak:", error);
    }
  };

  const getMoodValue = (mood: string) => {
    const values: Record<string, number> = {
      "struggling": 1,
      "difficult": 2,
      "okay": 3,
      "good": 4,
      "great": 5
    };
    return values[mood.toLowerCase()] || 3;
  };

  const getMoodLabel = (value: number) => {
    const labels = ["", "struggling", "difficult", "okay", "good", "great"];
    return labels[value] || "okay";
  };

  const handleMoodClick = (moodValue: number) => {
    setSelectedMood(moodValue);
    setIsMoodDialogOpen(true);
  };

  const handleDetailedMoodSubmit = async () => {
    if (!selectedMood) return;
    setIsSubmittingMood(true);

    const moodLabel = getMoodLabel(selectedMood);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if we already have a log for today
      const { data: existingLogs } = await supabase
        .from("mood_logs")
        .select("id")
        .eq("user_id", user?.id)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false }) // Get the latest one if duplicates exist
        .limit(1);

      const logData = {
        mood: moodLabel,
        created_at: new Date().toISOString(),
        energy_level: moodDimensions.energy,
        anxiety_level: moodDimensions.anxiety,
        stress_level: moodDimensions.stress,
        triggers: selectedTriggers,
        context_note: contextNote,
        note: contextNote || "Daily check-in" // Fallback for backward compatibility
      };

      if (existingLogs && existingLogs.length > 0) {
        // Update existing log
        const { error } = await supabase
          .from("mood_logs")
          .update(logData)
          .eq("id", existingLogs[0].id);

        if (error) throw error;
        toast.success("Daily check-in updated");
      } else {
        // Insert new log
        const { error } = await supabase.from("mood_logs").insert({
          user_id: user?.id,
          ...logData
        });

        if (error) throw error;
        toast.success("Daily check-in complete!");
      }

      // Refresh dashboard data to reflect changes immediately
      fetchDashboardData();

      // Check for mood decline (3 days of low mood)
      if (selectedMood <= 2) {
        const { data: recentLogs } = await supabase
          .from("mood_logs")
          .select("mood")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (recentLogs && recentLogs.length >= 3) {
          const isDecline = recentLogs.every(log => getMoodValue(log.mood) <= 2);
          if (isDecline) {
            setShowSupportModal(true); // Trigger the support modal
          }
        }
      }

      // Check for achievements
      if (user?.id) {
        checkAndUnlockAchievements(user.id);
      }

      setIsMoodDialogOpen(false);
      fetchDashboardData(); // Refresh chart
    } catch (error: any) {
      toast.error("Error saving mood: " + error.message);
    } finally {
      setIsSubmittingMood(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-4 md:py-8 space-y-6 md:space-y-8">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <LoadingSkeleton className="h-8 w-48" />
              <LoadingSkeleton className="h-4 w-64" />
            </div>
            <LoadingSkeleton variant="button" className="w-full md:w-auto" />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <LoadingSkeleton variant="card" className="col-span-2 md:col-span-1 h-32" />
            <LoadingSkeleton variant="card" className="h-32" />
            <LoadingSkeleton variant="card" className="h-32" />
          </div>

          {/* Charts Skeleton */}
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-7">
            <LoadingSkeleton variant="chart" className="col-span-4 h-[350px]" />
            <LoadingSkeleton variant="card" className="col-span-3 h-[350px]" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 md:py-8 space-y-6 md:space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              {greeting}, {user?.user_metadata?.full_name?.split(" ")[0] || "Friend"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Ready to take a moment for yourself today?
            </p>
          </div>
          <Link to="/chat" className="w-full md:w-auto" data-tour="chat-button">
            <Button className="w-full md:w-auto shadow-lg hover:shadow-primary/25 transition-all">
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat with Companion
            </Button>
          </Link>
        </div>

        {/* Daily Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {/* Daily Check-in - Full width on mobile to fit mood selector */}
          <Card className="glass-card border-primary/10 col-span-2 md:col-span-1" data-tour="daily-checkin">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                {new Date().getHours() < 18 ? <Sun className="h-5 w-5 text-orange-400" /> : <Moon className="h-5 w-5 text-indigo-400" />}
                Daily Check-in
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MoodSelector selectedMood={selectedMood || 0} onSelectMood={handleMoodClick} size="sm" />
            </CardContent>
          </Card>

          {/* Activity Stats */}
          <Card className="glass-card border-primary/10 col-span-1">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl md:text-3xl font-bold">{activityStats.completedToday}</div>
              <p className="text-xs md:text-sm text-muted-foreground">Completed today</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/10 col-span-1">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                Minutes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl md:text-3xl font-bold">{activityStats.totalMinutes}</div>
              <p className="text-xs md:text-sm text-muted-foreground">Mindful time</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Mood Trend Chart */}
          <Card className="col-span-full lg:col-span-4 glass-card" data-tour="mood-trends">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Mood Trends
                </CardTitle>
                <CardDescription>Your emotional journey over the last 7 days</CardDescription>
              </div>
              <Link to="/mood-insights">
                <Button variant="outline" size="sm" className="gap-2">
                  View Insights
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    key={JSON.stringify(moodData)} // Force re-render on data change to play animation correctly
                    data={moodData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis
                      dataKey="day"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 6]}
                      ticks={[1, 2, 3, 4, 5]}
                      tickFormatter={(value) => ["", "😢", "😔", "😐", "🙂", "😄"][value]}
                      width={40}
                      tickMargin={10}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 10]}
                      hide={true}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background/95 backdrop-blur-sm border border-border/50 p-3 rounded-xl shadow-xl text-xs space-y-2 max-w-[200px]">
                              <p className="font-semibold">{label}</p>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                <span>Mood: {["", "😢", "😔", "😐", "🙂", "😄"][data.mood]}</span>
                              </div>
                              {data.energy && (
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                  <span>Energy: {data.energy}/10</span>
                                </div>
                              )}
                              {data.anxiety && (
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                  <span>Anxiety: {data.anxiety}/10</span>
                                </div>
                              )}
                              {data.stress && (
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  <span>Stress: {data.stress}/10</span>
                                </div>
                              )}
                              {data.triggers && data.triggers.length > 0 && (
                                <div className="pt-1 border-t border-border/50 mt-1">
                                  <p className="text-muted-foreground mb-1">Triggers:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {data.triggers.map((t: string) => (
                                      <span key={t} className="bg-muted px-1.5 py-0.5 rounded text-[10px] capitalize">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="mood"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      connectNulls={true}
                      name="Mood"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="energy"
                      stroke="#f97316" // Orange for energy
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
                      connectNulls={true}
                      name="Energy"
                      hide={!moodData.some(d => d.energy)}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="anxiety"
                      stroke="#a855f7" // Purple for anxiety
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: "#a855f7", strokeWidth: 0 }}
                      connectNulls={true}
                      name="Anxiety"
                      hide={!moodData.some(d => d.anxiety)}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="stress"
                      stroke="#ef4444" // Red for stress
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
                      connectNulls={true}
                      name="Stress"
                      hide={!moodData.some(d => d.stress)}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity / Quick Actions */}
          <Card className="col-span-full lg:col-span-3 glass-card flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5 text-primary" />
                Recent Journal Entries
              </CardTitle>
              <CardDescription>Your latest reflections</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-3">
                {recentEntries.length > 0 ? (
                  recentEntries.map((entry) => (
                    <Link key={entry.id} to={`/journal/${entry.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{entry.content}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No entries yet.</p>
                    <Link to="/journal/new">
                      <Button variant="link" className="mt-2">Start writing</Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Link to="/journal" className="w-full">
                <Button variant="outline" className="w-full">
                  View All Entries
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Mood Goals */}
        <div className="mt-6">
          <MoodGoals />
        </div>
      </div>

      {/* Detailed Mood Check-in Dialog */}
      <Dialog open={isMoodDialogOpen} onOpenChange={setIsMoodDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Daily Check-in</DialogTitle>
            <DialogDescription>
              How are you feeling right now? Take a moment to reflect.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <div className="space-y-8 py-4">
              {/* 1. Core Mood */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overall Mood</h3>
                <div className="flex justify-center py-2">
                  <MoodSelector
                    selectedMood={selectedMood || 0}
                    onSelectMood={setSelectedMood}
                    size="lg"
                  />
                </div>
              </div>

              {/* 2. Dimensions */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Deeper Dive</h3>
                <MoodDimensionsSelector
                  dimensions={moodDimensions}
                  onChange={setMoodDimensions}
                  className="bg-muted/30 p-4 rounded-xl"
                />
              </div>

              {/* 3. Triggers & Context */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Context</h3>
                <MoodTriggerSelector
                  selectedTriggers={selectedTriggers}
                  onTriggersChange={setSelectedTriggers}
                  contextNote={contextNote}
                  onContextNoteChange={setContextNote}
                  className="bg-muted/30 p-4 rounded-xl"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setIsMoodDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDetailedMoodSubmit} disabled={isSubmittingMood}>
              {isSubmittingMood ? "Saving..." : "Save Check-in"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />

      <CelebrationModal
        open={showCelebration}
        onOpenChange={setShowCelebration}
        type="streak"
        title={celebrationData.title}
        description={celebrationData.message}
        value={celebrationData.value}
      />
    </Layout>
  );
};

export default Dashboard;
