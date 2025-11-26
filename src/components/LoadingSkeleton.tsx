import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
    className?: string;
    variant?: "text" | "card" | "avatar" | "button" | "chart";
    lines?: number;
}

const LoadingSkeleton = ({ className, variant = "text", lines = 1 }: LoadingSkeletonProps) => {
    const baseClasses = "animate-pulse bg-muted rounded";

    const variants = {
        text: "h-4 w-full",
        card: "h-32 w-full",
        avatar: "h-12 w-12 rounded-full",
        button: "h-10 w-24",
        chart: "h-64 w-full",
    };

    if (variant === "text" && lines > 1) {
        return (
            <div className={cn("space-y-3", className)}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            baseClasses,
                            variants[variant],
                            i === lines - 1 && "w-4/5" // Last line shorter
                        )}
                    />
                ))}
            </div>
        );
    }

    return <div className={cn(baseClasses, variants[variant], className)} />;
};

export default LoadingSkeleton;
