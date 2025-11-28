import { useEffect, useState, useRef } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from "recharts";
import { Brain, Zap, Activity, Calendar, TrendingUp, TrendingDown, AlertCircle, Sparkles, Download } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { generateAIResponse } from "@/lib/ai-service";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import MarkdownMessage from "@/components/MarkdownMessage";


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const MoodInsights = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [moodLogs, setMoodLogs] = useState<any[]>([]);
    const [triggerStats, setTriggerStats] = useState<any[]>([]);
    const [dayStats, setDayStats] = useState<any[]>([]);
    const [correlations, setCorrelations] = useState<any[]>([]);
    const [heatmapData, setHeatmapData] = useState<any[]>([]);
    const [aiInsights, setAiInsights] = useState<string>("");
    const [generatingInsights, setGeneratingInsights] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
            fetchMoodData();
        }
    }, [user]);

    const fetchMoodData = async () => {
        try {
            // Fetch last 30 days of mood logs
            const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

            const { data, error } = await supabase
                .from("mood_logs")
                .select("*")
                .eq("user_id", user?.id)
                .gte("created_at", thirtyDaysAgo)
                .order("created_at", { ascending: true });

            if (error) throw error;

            if (data) {
                console.log("Fetched mood data:", data); // Debugging
                setMoodLogs(data);
                calculateAnalytics(data);
                if (data.length > 5) {
                    generateInsights(data);
                }
            }
        } catch (error) {
            console.error("Error fetching mood data:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateInsights = async (logs: any[]) => {
        setGeneratingInsights(true);
        try {
            // Prepare data summary for AI
            const summary = logs.map(l => ({
                date: format(new Date(l.created_at), 'yyyy-MM-dd'),
                mood: l.mood,
                triggers: l.triggers,
                energy: l.energy_level,
                anxiety: l.anxiety_level
            })).slice(-10); // Send last 10 logs to avoid token limits

            const prompt = `Analyze these recent mood logs and provide 3 short, actionable insights or patterns you notice. Focus on triggers and energy/anxiety correlations. Keep it encouraging. Data: ${JSON.stringify(summary)}`;

            const response = await generateAIResponse(prompt);
            setAiInsights(response);
        } catch (error) {
            console.error("Error generating insights:", error);
        } finally {
            setGeneratingInsights(false);
        }
    };

    const handleExportPDF = async () => {
        if (!reportRef.current) return;

        try {
            toast.info("Generating PDF report...");
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                backgroundColor: "#ffffff" // Ensure white background for PDF
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
            pdf.save(`MoodInsights_${format(new Date(), "yyyy-MM-dd")}.pdf`);
            toast.success("Report downloaded successfully");
        } catch (error) {
            console.error("Error exporting PDF:", error);
            toast.error("Failed to generate PDF");
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

    const calculateAnalytics = (logs: any[]) => {
        // 1. Trigger Frequency
        const triggers: Record<string, number> = {};
        logs.forEach(log => {
            if (log.triggers && Array.isArray(log.triggers)) {
                log.triggers.forEach((t: string) => {
                    triggers[t] = (triggers[t] || 0) + 1;
                });
            }
        });

        const triggerData = Object.entries(triggers)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        setTriggerStats(triggerData);

        // 2. Best/Worst Days of Week
        const days: Record<string, { total: number, count: number }> = {};
        logs.forEach(log => {
            const dayName = format(new Date(log.created_at), 'EEEE');
            if (!days[dayName]) days[dayName] = { total: 0, count: 0 };
            days[dayName].total += getMoodValue(log.mood);
            days[dayName].count += 1;
        });

        const dayData = Object.entries(days).map(([day, stats]) => ({
            day: day.substring(0, 3),
            averageMood: stats.total / stats.count
        }));

        // Sort by day of week
        const sorter: Record<string, number> = { "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 7 };
        dayData.sort((a, b) => sorter[a.day] - sorter[b.day]);

        setDayStats(dayData);

        // 3. Correlations (Energy vs Anxiety)
        const correlationData = logs
            .filter(log => log.energy_level && log.anxiety_level)
            .map(log => ({
                energy: log.energy_level,
                anxiety: log.anxiety_level,
                mood: getMoodValue(log.mood)
            }));

        setCorrelations(correlationData);

        // 4. Heatmap Data
        // Group logs by date and take average mood
        const logsByDate: Record<string, { total: number, count: number }> = {};
        logs.forEach(log => {
            const dateStr = format(new Date(log.created_at), 'yyyy-MM-dd');
            if (!logsByDate[dateStr]) logsByDate[dateStr] = { total: 0, count: 0 };
            logsByDate[dateStr].total += getMoodValue(log.mood);
            logsByDate[dateStr].count += 1;
        });

        const heatmap = Object.entries(logsByDate).map(([date, stats]) => ({
            date,
            count: stats.count,
            mood: stats.total / stats.count
        }));
        setHeatmapData(heatmap);
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 space-y-8" ref={reportRef}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                            Mood Insights
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Discover patterns in your emotional well-being over the last 6 months.
                        </p>
                    </div>
                    <Button onClick={handleExportPDF} variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export Report
                    </Button>
                </div>

                {/* AI Insights Section */}
                {moodLogs.length > 5 && (
                    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                AI Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {generatingInsights ? (
                                <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                                    <Brain className="h-4 w-4" />
                                    Analyzing your patterns...
                                </div>
                            ) : (
                                <div className="prose dark:prose-invert max-w-none">
                                    <MarkdownMessage content={aiInsights} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}



                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Trigger Analysis */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Brain className="h-5 w-5 text-purple-500" />
                                Top Triggers
                            </CardTitle>
                            <CardDescription>What influences your mood most often?</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                {triggerStats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={triggerStats}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {triggerStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        No trigger data available yet.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Day of Week Analysis */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-500" />
                                Weekly Patterns
                            </CardTitle>
                            <CardDescription>Average mood by day of the week</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                {dayStats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dayStats}>
                                            <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 5]} />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        const moodValue = Math.round(data.averageMood);
                                                        const emojis = ["", "😢", "😔", "😐", "🙂", "😄"];
                                                        const moodLabels = ["", "Struggling", "Difficult", "Okay", "Good", "Great"];

                                                        return (
                                                            <div className="bg-background/95 backdrop-blur-sm border border-border/50 p-3 rounded-xl shadow-xl text-xs space-y-1">
                                                                <p className="font-semibold mb-1">{label}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-lg">{emojis[moodValue] || "❓"}</span>
                                                                    <span className="font-medium">{moodLabels[moodValue] || "Unknown"}</span>
                                                                    <span className="text-muted-foreground">({data.averageMood.toFixed(1)})</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="averageMood" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        Not enough data for weekly patterns.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Energy vs Anxiety Correlation */}
                    <Card className="glass-card col-span-1 md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-orange-500" />
                                Energy vs. Anxiety
                            </CardTitle>
                            <CardDescription>See how your energy levels correlate with anxiety</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                {correlations.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                            <XAxis type="number" dataKey="energy" name="Energy" unit="/10" domain={[0, 10]} stroke="#888888" />
                                            <YAxis type="number" dataKey="anxiety" name="Anxiety" unit="/10" domain={[0, 10]} stroke="#888888" />
                                            <ZAxis type="number" dataKey="mood" range={[60, 400]} name="Mood" />
                                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                            <Scatter name="Logs" data={correlations} fill="#8884d8">
                                                {correlations.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.mood >= 4 ? '#4ade80' : entry.mood <= 2 ? '#f87171' : '#fbbf24'} />
                                                ))}
                                            </Scatter>
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        Need more detailed logs (energy & anxiety) to show correlations.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default MoodInsights;
