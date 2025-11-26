import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, Smile, Frown, Meh, TrendingUp, ArrowLeft, Search, Star, Lock, Sparkles } from "lucide-react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { format } from "date-fns";
import { motion } from "framer-motion";
import DOMPurify from 'dompurify';

type JournalEntry = {
    id: string;
    content: string;
    mood: string;
    created_at: string;
    sentiment_score: number;
    tags?: string[];
    is_favorite?: boolean;
    is_private?: boolean;
};

import JournalInsights from "@/components/JournalInsights";

const Journal = () => {
    const { user } = useAuth();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInsights, setShowInsights] = useState(false);

    useEffect(() => {
        if (user) {
            fetchEntries();
        }
    }, [user]);

    const fetchEntries = async () => {
        try {
            const { data, error } = await supabase
                .from("journal_entries")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setEntries(data || []);
        } catch (error) {
            console.error("Error fetching journal entries:", error);
        } finally {
            setLoading(false);
        }
    };

    const getMoodIcon = (mood: string) => {
        switch (mood?.toLowerCase()) {
            case "great":
            case "good":
                return <Smile className="h-5 w-5 text-green-500" />;
            case "okay":
                return <Meh className="h-5 w-5 text-yellow-500" />;
            case "difficult":
            case "struggling":
                return <Frown className="h-5 w-5 text-red-500" />;
            default:
                return <TrendingUp className="h-5 w-5 text-blue-500" />;
        }
    };

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    // Get all unique tags from entries
    const allTags = Array.from(new Set(entries.flatMap(entry => entry.tags || [])));

    const filteredEntries = entries.filter(entry => {
        const matchesSearch = (entry.content?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (entry.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesTag = selectedTag ? (entry.tags || []).includes(selectedTag) : true;
        const matchesFavorite = showFavoritesOnly ? entry.is_favorite : true;
        return matchesSearch && matchesTag && matchesFavorite;
    });

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8 pb-24">
                <Button
                    variant="ghost"
                    asChild
                    className="mb-2 -ml-2"
                >
                    <Link to="/dashboard">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </Button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                            Your Journal
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Reflect on your journey and track your growth
                        </p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            variant="outline"
                            className="flex-1 md:flex-none gap-2"
                            onClick={() => setShowInsights(true)}
                        >
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            AI Insights
                        </Button>
                        <Link to="/journal/new" className="flex-1 md:flex-none">
                            <Button className="w-full gap-2 shadow-lg hover:shadow-primary/25 transition-all">
                                <Plus className="h-4 w-4" />
                                New Entry
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search entries..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button
                            variant={showFavoritesOnly ? "default" : "outline"}
                            size="icon"
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            title="Show favorites only"
                        >
                            <Star className={`h-4 w-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
                        </Button>
                    </div>
                    {allTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={selectedTag === null ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setSelectedTag(null)}
                                className="text-xs"
                            >
                                All
                            </Button>
                            {allTags.map(tag => (
                                <Button
                                    key={tag}
                                    variant={selectedTag === tag ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                    className="text-xs"
                                >
                                    #{tag}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {[1, 2, 3, 4].map((i) => (
                            <LoadingSkeleton key={i} variant="card" className="h-40" />
                        ))}
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <Card className="glass-card border-dashed border-2">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Calendar className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold">No entries found</h3>
                            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                                {searchTerm || selectedTag || showFavoritesOnly ? "Try adjusting your search or filters." : "Start your journaling habit today."}
                            </p>
                            {!searchTerm && !selectedTag && !showFavoritesOnly && (
                                <Link to="/journal/new">
                                    <Button variant="outline">Write your first entry</Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {filteredEntries.map((entry, index) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link to={`/journal/${entry.id}`}>
                                    <Card className="glass-card hover:shadow-md transition-all cursor-pointer h-full group flex flex-col relative overflow-hidden">
                                        {entry.is_favorite && (
                                            <div className="absolute top-0 right-0 p-2">
                                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                            </div>
                                        )}
                                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                {format(new Date(entry.created_at), "MMM d, yyyy")}
                                                {entry.is_private && <Lock className="h-3 w-3 ml-1" />}
                                            </div>
                                            {getMoodIcon(entry.mood)}
                                        </CardHeader>
                                        <CardContent className="flex-1 flex flex-col gap-3">
                                            <p className="line-clamp-3 text-sm leading-relaxed text-foreground/80 group-hover:text-foreground transition-colors">
                                                {DOMPurify.sanitize(entry.content, { ALLOWED_TAGS: [] })}
                                            </p>
                                            {entry.tags && entry.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-auto pt-2">
                                                    {entry.tags.slice(0, 3).map(tag => (
                                                        <span key={tag} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-sm text-secondary-foreground">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                    {entry.tags.length > 3 && (
                                                        <span className="text-[10px] text-muted-foreground">+{entry.tags.length - 3}</span>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                <JournalInsights
                    isOpen={showInsights}
                    onClose={() => setShowInsights(false)}
                />
            </div>
        </Layout>
    );
};

export default Journal;
