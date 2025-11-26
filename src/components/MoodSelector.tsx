import { cn } from "@/lib/utils";

const moods = [
  { emoji: "😄", label: "Great", value: 5, color: "mood-great" },
  { emoji: "😊", label: "Good", value: 4, color: "mood-good" },
  { emoji: "😐", label: "Okay", value: 3, color: "mood-okay" },
  { emoji: "😔", label: "Not great", value: 2, color: "mood-difficult" },
  { emoji: "😢", label: "Struggling", value: 1, color: "mood-struggling" },
];

interface MoodSelectorProps {
  selectedMood?: number;
  onSelectMood: (value: number) => void;
  size?: "sm" | "md" | "lg";
}

const MoodSelector = ({ selectedMood, onSelectMood, size = "md" }: MoodSelectorProps) => {
  const sizeClasses = {
    sm: "text-2xl w-12 h-12",
    md: "text-3xl w-16 h-16",
    lg: "text-4xl w-20 h-20",
  };

  return (
    <div className="grid grid-cols-5 gap-1 sm:flex sm:gap-4 sm:justify-center">
      {moods.map((mood, index) => (
        <button
          key={mood.value}
          onClick={() => onSelectMood(mood.value)}
          className="flex flex-col items-center gap-2 group transition-all"
          style={{
            animationDelay: `${index * 50}ms`,
          }}
          aria-label={`Select ${mood.label} mood`}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-2xl transition-all duration-300 relative",
              sizeClasses[size],
              selectedMood === mood.value
                ? "bg-gradient-to-br from-primary/10 to-primary/5 ring-2 ring-primary shadow-lg scale-110"
                : "bg-transparent hover:bg-gradient-to-br hover:from-muted hover:to-muted/50 hover:shadow-md hover:scale-105"
            )}
          >
            <span className="group-hover:animate-float transition-transform duration-300">
              {mood.emoji}
            </span>
            {selectedMood === mood.value && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse-soft" />
            )}
          </div>

          <span className={cn(
            "text-xs font-medium transition-colors duration-300",
            selectedMood === mood.value ? "text-primary font-semibold" : "text-muted-foreground"
          )}>
            {mood.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default MoodSelector;
