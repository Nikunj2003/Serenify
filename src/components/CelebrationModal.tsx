import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Trophy, Flame, Star } from "lucide-react";

interface CelebrationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: "streak" | "milestone" | "achievement";
    title: string;
    description: string;
    value?: number;
}

const CelebrationModal = ({ open, onOpenChange, type, title, description, value }: CelebrationModalProps) => {
    useEffect(() => {
        if (open) {
            // Trigger confetti
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval = setInterval(() => {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);

                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [open]);

    const getIcon = () => {
        switch (type) {
            case "streak":
                return <Flame className="w-16 h-16 text-orange-500" />;
            case "milestone":
                return <Trophy className="w-16 h-16 text-yellow-500" />;
            case "achievement":
                return <Star className="w-16 h-16 text-primary" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md text-center">
                <DialogHeader className="items-center space-y-4">
                    <div className="animate-bounce">{getIcon()}</div>
                    <DialogTitle className="text-2xl">{title}</DialogTitle>
                    <DialogDescription className="text-base">{description}</DialogDescription>
                    {value && (
                        <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            {value}
                        </div>
                    )}
                </DialogHeader>
                <div className="flex justify-center gap-2 pt-4">
                    <Button onClick={() => onOpenChange(false)} className="w-full">
                        Awesome! 🎉
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CelebrationModal;
