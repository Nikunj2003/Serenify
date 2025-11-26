import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import confetti from "canvas-confetti";
import { checkAndUnlockAchievements } from "@/lib/achievement-service";

export type WellnessSession = {
    id: string;
    name: string;
    type: string;
    duration_minutes: number;
    instructions: { steps: string[] };
};

type GuidedSessionModalProps = {
    session: WellnessSession | null;
    isOpen: boolean;
    onClose: () => void;
};

const GuidedSessionModal = ({ session, isOpen, onClose }: GuidedSessionModalProps) => {
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (session && isOpen) {
            setTimeLeft(session.duration_minutes * 60);
            setIsActive(false);
            setIsCompleted(false);
            setCurrentStep(0);
        }
    }, [session, isOpen]);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            handleComplete();
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, timeLeft]);

    // Auto-advance steps based on progress (simple heuristic)
    useEffect(() => {
        if (session && isActive) {
            const totalTime = session.duration_minutes * 60;
            const progress = (totalTime - timeLeft) / totalTime;
            const totalSteps = session.instructions.steps.length;
            const expectedStep = Math.min(Math.floor(progress * totalSteps), totalSteps - 1);
            if (expectedStep !== currentStep) {
                setCurrentStep(expectedStep);
            }
        }
    }, [timeLeft, session, isActive]);

    const handleComplete = async () => {
        setIsActive(false);
        setIsCompleted(true);
        if (timerRef.current) clearInterval(timerRef.current);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        if (user && session) {
            try {
                await supabase.from("user_activities").insert({
                    user_id: user.id,
                    activity_type: session.type,
                    activity_name: session.name,
                    duration_minutes: session.duration_minutes,
                    session_id: session.id
                });
                toast.success("Session completed! Activity logged.");

                // Check for achievements
                checkAndUnlockAchievements(user.id);
            } catch (error) {
                console.error("Error logging activity:", error);
            }
        }
    };

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        if (session) {
            setIsActive(false);
            setTimeLeft(session.duration_minutes * 60);
            setIsCompleted(false);
            setCurrentStep(0);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    if (!session) return null;

    const progress = ((session.duration_minutes * 60 - timeLeft) / (session.duration_minutes * 60)) * 100;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{session.name}</DialogTitle>
                    <DialogDescription>
                        {session.duration_minutes} min • {session.type}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center py-6 space-y-6">
                    {/* Timer Display */}
                    <div className="relative flex items-center justify-center w-48 h-48 rounded-full border-4 border-primary/20">
                        <div className="text-4xl font-bold tabular-nums">
                            {isCompleted ? <CheckCircle2 className="w-16 h-16 text-green-500" /> : formatTime(timeLeft)}
                        </div>
                        <svg className="absolute top-0 left-0 w-full h-full -rotate-90 pointer-events-none">
                            <circle
                                cx="96"
                                cy="96"
                                r="92"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-primary transition-all duration-1000 ease-linear"
                                strokeDasharray={2 * Math.PI * 92}
                                strokeDashoffset={2 * Math.PI * 92 * (1 - progress / 100)}
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>

                    {/* Instructions */}
                    <div className="w-full space-y-2 text-center">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                            {isCompleted ? "Session Complete" : "Current Step"}
                        </h4>
                        <p className="text-lg font-medium min-h-[3rem] flex items-center justify-center">
                            {isCompleted
                                ? "Great job taking time for yourself!"
                                : session.instructions.steps[currentStep]}
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4">
                        {!isCompleted && (
                            <Button
                                size="lg"
                                className="rounded-full w-16 h-16 p-0"
                                onClick={toggleTimer}
                            >
                                {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full w-12 h-12"
                            onClick={resetTimer}
                            title="Reset"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default GuidedSessionModal;
