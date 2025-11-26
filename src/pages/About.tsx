import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, School, Lightbulb, Heart, MessageCircle, TrendingUp, Activity, BookOpen, Shield } from "lucide-react";
import { motion } from "framer-motion";

const About = () => {
    const features = [
        {
            icon: MessageCircle,
            title: "AI-Powered Chat Companion",
            description: "24/7 empathetic AI support using Google Gemini 2.0 Flash with context-aware responses"
        },
        {
            icon: TrendingUp,
            title: "Mood Tracking & Analytics",
            description: "Visual mood trends and emotional journey tracking over time"
        },
        {
            icon: Activity,
            title: "Wellness Activities",
            description: "Personalized mindfulness, exercise, and self-care recommendations"
        },
        {
            icon: BookOpen,
            title: "Journaling",
            description: "Private space for reflections with mood tagging and search"
        },
        {
            icon: Shield,
            title: "Document Upload",
            description: "Upload medical records for personalized AI support using RAG technology"
        },
        {
            icon: Heart,
            title: "Crisis Resources",
            description: "Immediate access to professional help and crisis support"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
            {/* Background decorations */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl animate-float" />
                <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-secondary/5 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
                <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: "4s" }} />
            </div>

            <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8 relative z-10">
                <Button variant="ghost" asChild className="mb-2 -ml-2">
                    <Link to="/">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Link>
                </Button>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center space-y-4"
                >
                    <div className="flex justify-center mb-6">
                        <img src="/logo.png" alt="Serenify Logo" className="w-24 h-24 rounded-full shadow-xl" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                        About Serenify
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        Your AI-Powered Proactive Mental Health Companion
                    </p>
                </motion.div>

                {/* Project Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <Card className="border-primary/20 glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="w-6 h-6 text-primary" />
                                Problem Statement
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-lg leading-relaxed">
                                <strong>Serenify</strong>
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                Serenify addresses the growing need for accessible, personalized mental health support by leveraging
                                artificial intelligence to create a proactive companion that provides 24/7 emotional support, mood tracking,
                                and evidence-based wellness recommendations.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Creators */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <Card className="border-secondary/20 glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-6 h-6 text-secondary" />
                                Created By
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                        D
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Dhruv Khitha</h3>
                                        <p className="text-sm text-muted-foreground">Student Developer</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-secondary/5 to-secondary/10 border border-secondary/20">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                        T
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Tanmay Khitha</h3>
                                        <p className="text-sm text-muted-foreground">Student Developer</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                                <School className="w-6 h-6 text-primary shrink-0 mt-1" />
                                <div>
                                    <p className="font-medium">Class 10th Theta</p>
                                    <p className="text-sm text-muted-foreground">RPS International School</p>
                                    <p className="text-sm text-muted-foreground">High School in Gurgaon, Haryana</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Features */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Key Features</CardTitle>
                            <CardDescription>
                                Comprehensive tools designed to support mental health and wellbeing
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                                {features.map((feature, index) => (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                                        className="flex gap-4 p-4 rounded-lg bg-gradient-to-br from-muted/30 to-muted/50 hover:from-primary/5 hover:to-primary/10 transition-all border border-border hover:border-primary/30"
                                    >
                                        <div className="shrink-0">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <feature.icon className="w-5 h-5 text-primary" />
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Technical Stack */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Technical Stack</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-primary">Frontend</h4>
                                    <ul className="space-y-1 text-muted-foreground">
                                        <li>• React + TypeScript</li>
                                        <li>• Tailwind CSS</li>
                                        <li>• Shadcn UI</li>
                                        <li>• Framer Motion</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-secondary">Backend</h4>
                                    <ul className="space-y-1 text-muted-foreground">
                                        <li>• Supabase</li>
                                        <li>• PostgreSQL</li>
                                        <li>• Row Level Security</li>
                                        <li>• Real-time subscriptions</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-accent">AI</h4>
                                    <ul className="space-y-1 text-muted-foreground">
                                        <li>• Google Gemini 2.0 Flash</li>
                                        <li>• RAG (Retrieval-Augmented Generation)</li>
                                        <li>• Vector embeddings</li>
                                        <li>• Context-aware responses</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="text-center pt-8 pb-12"
                >
                    <Link to="/onboarding">
                        <Button size="lg" className="shadow-lg hover:shadow-xl transition-all">
                            Get Started Free
                            <span className="ml-2">→</span>
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default About;
