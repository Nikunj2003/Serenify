import { useEffect, useRef, useState } from "react";
import { Search, X, MessageCircle, Map, ArrowRight } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";
import { Link, useNavigate } from "react-router-dom";

interface SearchResult {
    id: string;
    type: "journal" | "mood" | "activity" | "chat" | "navigation";
    title: string;
    content: string;
    date?: string;
    url: string;
}

const GlobalSearch = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
    const { user } = useAuth();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery("");
            setResults([]);
        }
    }, [open]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                onOpenChange(true);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onOpenChange]);

    useEffect(() => {
        const searchAll = async () => {
            if (!user && query.trim().length < 2) {
                // Allow navigation search even without user if we wanted, but for now keep it simple
                if (query.trim().length >= 2) {
                    searchNavigation(query);
                } else {
                    setResults([]);
                }
                return;
            }

            if (query.trim().length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            const searchTerm = query.toLowerCase();
            const allResults: SearchResult[] = [];

            // 1. Navigation Search (Static)
            const navItems = [
                { title: "Dashboard", url: "/dashboard", keywords: ["home", "main", "start"] },
                { title: "Chat", url: "/chat", keywords: ["ai", "message", "talk", "bot"] },
                { title: "Journal", url: "/journal", keywords: ["write", "diary", "entry", "log"] },
                { title: "Wellness Activities", url: "/wellness", keywords: ["meditation", "breathing", "exercise", "relax"] },
                { title: "Profile", url: "/profile", keywords: ["settings", "account", "user", "preferences"] },
                { title: "Mood Insights", url: "/mood-insights", keywords: ["analytics", "charts", "trends", "stats"] },
                { title: "Crisis Resources", url: "/crisis", keywords: ["help", "emergency", "support", "suicide", "hotline"] },
            ];

            navItems.forEach(item => {
                if (item.title.toLowerCase().includes(searchTerm) || item.keywords.some(k => k.includes(searchTerm))) {
                    allResults.push({
                        id: `nav-${item.title}`,
                        type: "navigation",
                        title: item.title,
                        content: "Go to page",
                        url: item.url
                    });
                }
            });

            if (user) {
                // 2. Search journals
                const { data: journals } = await supabase
                    .from("journal_entries")
                    .select("id, content, mood, created_at")
                    .ilike("content", `%${searchTerm}%`)
                    .limit(3);

                journals?.forEach((j) => {
                    allResults.push({
                        id: j.id,
                        type: "journal",
                        title: `Journal Entry - ${j.mood}`,
                        content: j.content.substring(0, 100) + "...",
                        date: new Date(j.created_at).toLocaleDateString(),
                        url: `/journal/${j.id}`,
                    });
                });

                // 3. Search mood logs
                const { data: moods } = await supabase
                    .from("mood_logs")
                    .select("id, mood, note, created_at")
                    .or(`mood.ilike.%${searchTerm}%,note.ilike.%${searchTerm}%`)
                    .limit(3);

                moods?.forEach((m) => {
                    allResults.push({
                        id: m.id,
                        type: "mood",
                        title: `Mood: ${m.mood}`,
                        content: m.note || "No note",
                        date: new Date(m.created_at).toLocaleDateString(),
                        url: "/dashboard",
                    });
                });

                // 4. Search activities
                const { data: activities } = await supabase
                    .from("user_activities")
                    .select("id, activity_type, completed_at")
                    .ilike("activity_type", `%${searchTerm}%`)
                    .limit(3);

                activities?.forEach((a) => {
                    allResults.push({
                        id: a.id,
                        type: "activity",
                        title: `Activity: ${a.activity_type}`,
                        content: "Wellness activity completed",
                        date: new Date(a.completed_at).toLocaleDateString(),
                        url: "/wellness",
                    });
                });

                // 5. Search Chat Sessions (Titles)
                const { data: chatSessions } = await supabase
                    .from("chat_sessions")
                    .select("id, title, created_at")
                    .ilike("title", `%${searchTerm}%`)
                    .limit(3);

                chatSessions?.forEach((s) => {
                    allResults.push({
                        id: s.id,
                        type: "chat",
                        title: s.title || "Chat Session",
                        content: "Chat conversation",
                        date: new Date(s.created_at).toLocaleDateString(),
                        url: "/chat", // Ideally we'd link to specific session, but /chat loads most recent or we need to handle session selection
                    });
                });

                // 6. Search Chat Messages
                // Note: This might be heavy if there are many messages, but limit helps
                const { data: chatMessages } = await supabase
                    .from("chat_messages")
                    .select("id, content, created_at, session_id")
                    .ilike("content", `%${searchTerm}%`)
                    .limit(3);

                // We need to fetch session titles for these messages to be useful context
                // For now, just show the message content
                chatMessages?.forEach((m) => {
                    allResults.push({
                        id: m.id,
                        type: "chat",
                        title: "Chat Message",
                        content: m.content.substring(0, 100) + "...",
                        date: new Date(m.created_at).toLocaleDateString(),
                        url: "/chat", // Same limitation
                    });
                });
            }

            setResults(allResults);
            setLoading(false);
        };

        const searchNavigation = (term: string) => {
            // Helper for non-logged in users if needed
        };

        const debounce = setTimeout(searchAll, 300);
        return () => clearTimeout(debounce);
    }, [query, user]);

    const getTypeEmoji = (type: string) => {
        switch (type) {
            case "journal": return "📝";
            case "mood": return "😊";
            case "activity": return "🧘";
            case "chat": return "💬";
            case "navigation": return "🧭";
            default: return "📄";
        }
    };

    const handleSelect = (url: string) => {
        onOpenChange(false);
        navigate(url);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden [&>button]:hidden">
                <DialogHeader className="px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            ref={inputRef}
                            placeholder="Type to search..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="border-none shadow-none focus-visible:ring-0 px-0 h-auto text-base"
                        />
                        {query && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setQuery("")}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <div className="max-h-[400px] overflow-y-auto">
                    {loading && (
                        <div className="text-center py-8 text-muted-foreground">
                            Searching...
                        </div>
                    )}

                    {!loading && query && results.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No results found for "{query}"
                        </div>
                    )}

                    {!loading && results.length > 0 && (
                        <div className="p-2">
                            {results.map((result) => (
                                <div
                                    key={result.id}
                                    onClick={() => handleSelect(result.url)}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                                >
                                    <div className="text-xl shrink-0 mt-0.5 bg-muted rounded-md w-8 h-8 flex items-center justify-center">
                                        {getTypeEmoji(result.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                                {result.title}
                                            </p>
                                            {result.date && (
                                                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                                    {result.date}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate line-clamp-1">
                                            {result.content}
                                        </p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center" />
                                </div>
                            ))}
                        </div>
                    )}

                    {!query && (
                        <div className="py-12 text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                                Search for journals, chats, activities, or pages
                            </p>
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                <kbd className="px-2 py-1 bg-muted rounded border">Cmd</kbd>
                                <span>+</span>
                                <kbd className="px-2 py-1 bg-muted rounded border">K</kbd>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default GlobalSearch;
