import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Lightbulb, BookOpen } from "lucide-react";
import { generateJournalInsights } from "@/lib/ai-service";
import { useAuth } from "@/components/AuthProvider";
import LoadingSkeleton from "@/components/LoadingSkeleton";

type Insights = {
    summary: string;
    mood_trend: string;
    key_topics: string[];
    advice: string;
};

type JournalInsightsProps = {
    isOpen: boolean;
    onClose: () => void;
};

const JournalInsights = ({ isOpen, onClose }: JournalInsightsProps) => {
    const { user } = useAuth();
    const [insights, setInsights] = useState<Insights | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchInsights = async () => {
            if (isOpen && user && !insights) {
                setLoading(true);
                const data = await generateJournalInsights(user.id);
                setInsights(data);
                setLoading(false);
            }
        };

        fetchInsights();
    }, [isOpen, user, insights]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Weekly AI Insights
                    </DialogTitle>
                    <DialogDescription>
                        AI-powered analysis of your journal entries from the past week.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {loading ? (
                        <div className="space-y-4">
                            <LoadingSkeleton variant="text" className="h-20" />
                            <LoadingSkeleton variant="text" className="h-12" />
                            <LoadingSkeleton variant="text" className="h-24" />
                        </div>
                    ) : insights ? (
                        <>
                            {/* Summary */}
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                                    <BookOpen className="w-4 h-4" /> Summary
                                </h4>
                                <p className="text-sm leading-relaxed bg-secondary/30 p-3 rounded-lg border border-secondary">
                                    {insights.summary}
                                </p>
                            </div>

                            {/* Mood Trend */}
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                                    <TrendingUp className="w-4 h-4" /> Mood Trend
                                </h4>
                                <p className="text-sm leading-relaxed">
                                    {insights.mood_trend}
                                </p>
                            </div>

                            {/* Key Topics */}
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                                    <Lightbulb className="w-4 h-4" /> Key Topics
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {insights.key_topics.map((topic, i) => (
                                        <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Advice */}
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                                    <Sparkles className="w-4 h-4" /> Advice
                                </h4>
                                <p className="text-sm leading-relaxed italic text-muted-foreground border-l-2 border-purple-500 pl-3">
                                    "{insights.advice}"
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>Not enough journal data to generate insights yet.</p>
                            <p className="text-sm mt-2">Try writing a few entries this week!</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default JournalInsights;
