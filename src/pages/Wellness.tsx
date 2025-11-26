import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Wind, Brain, Activity, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getWellnessRecommendations } from "@/lib/ai-service";
import GuidedSessionModal, { WellnessSession } from "@/components/GuidedSessionModal";
import LoadingSkeleton from "@/components/LoadingSkeleton";

const Wellness = () => {
  const [sessions, setSessions] = useState<WellnessSession[]>([]);
  const [recommendations, setRecommendations] = useState<WellnessSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<WellnessSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all sessions
        const { data: allSessions, error } = await supabase
          .from("wellness_sessions")
          .select("*");

        if (error) throw error;
        setSessions(allSessions || []);

        // Get recommendations based on latest mood
        // First get latest mood
        const { data: moodLogs } = await supabase
          .from("mood_logs")
          .select("mood_score")
          .order("created_at", { ascending: false })
          .limit(1);

        const latestMood = moodLogs?.[0]?.mood_score || 3;
        const recs = await getWellnessRecommendations(latestMood);
        setRecommendations(recs);

      } catch (error) {
        console.error("Error fetching wellness data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStartSession = (session: WellnessSession) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "meditation": return <Brain className="w-5 h-5 text-purple-500" />;
      case "breathing": return <Wind className="w-5 h-5 text-blue-500" />;
      case "yoga": return <Activity className="w-5 h-5 text-green-500" />;
      default: return <Sparkles className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8 pb-24">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Wellness Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Guided sessions to help you relax, focus, and recharge
          </p>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="space-y-4">
              <LoadingSkeleton variant="text" className="h-8 w-48" />
              <div className="grid gap-4 md:grid-cols-2">
                <LoadingSkeleton variant="card" className="h-48" />
                <LoadingSkeleton variant="card" className="h-48" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Recommendations */}
            {recommendations.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-xl font-semibold">Recommended for You</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {recommendations.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="glass-card hover:shadow-md transition-all cursor-pointer group h-full relative overflow-hidden border-primary/20">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          {getIconForType(session.type)}
                        </div>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="p-2 bg-primary/10 rounded-lg mb-2">
                              {getIconForType(session.type)}
                            </div>
                            <span className="text-xs font-medium px-2 py-1 bg-secondary rounded-full">
                              {session.duration_minutes} min
                            </span>
                          </div>
                          <CardTitle className="text-lg">{session.name}</CardTitle>
                          <CardDescription className="capitalize">{session.type}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            className="w-full group-hover:translate-x-1 transition-transform"
                            onClick={() => handleStartSession(session)}
                          >
                            Start Session <Play className="w-4 h-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* All Sessions */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">All Sessions</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {sessions.map((session) => (
                  <Card
                    key={session.id}
                    className="glass-card hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => handleStartSession(session)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        {getIconForType(session.type)}
                        <span className="text-xs text-muted-foreground">{session.duration_minutes} min</span>
                      </div>
                      <h3 className="font-semibold leading-tight">{session.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{session.type}</p>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}

        <GuidedSessionModal
          session={selectedSession}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </Layout>
  );
};

export default Wellness;
