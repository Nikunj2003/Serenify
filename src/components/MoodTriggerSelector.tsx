import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Briefcase, Heart, Moon, Users, Cloud, Coffee } from "lucide-react";

const triggerOptions = [
    { id: "work", label: "Work", icon: Briefcase, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { id: "relationships", label: "Relationships", icon: Heart, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
    { id: "health", label: "Health", icon: Heart, color: "bg-red-500/10 text-red-600 dark:text-red-400" },
    { id: "sleep", label: "Sleep", icon: Moon, color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
    { id: "social", label: "Social", icon: Users, color: "bg-green-500/10 text-green-600 dark:text-green-400" },
    { id: "weather", label: "Weather", icon: Cloud, color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
    { id: "other", label: "Other", icon: Coffee, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
];

interface MoodTriggerSelectorProps {
    selectedTriggers: string[];
    onTriggersChange: (triggers: string[]) => void;
    contextNote: string;
    onContextNoteChange: (note: string) => void;
    className?: string;
}

const MoodTriggerSelector = ({
    selectedTriggers,
    onTriggersChange,
    contextNote,
    onContextNoteChange,
    className,
}: MoodTriggerSelectorProps) => {
    const toggleTrigger = (triggerId: string) => {
        if (selectedTriggers.includes(triggerId)) {
            onTriggersChange(selectedTriggers.filter((t) => t !== triggerId));
        } else {
            onTriggersChange([...selectedTriggers, triggerId]);
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="space-y-2">
                <Label className="text-sm font-medium">What's affecting your mood? (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                    {triggerOptions.map((trigger) => {
                        const Icon = trigger.icon;
                        const isSelected = selectedTriggers.includes(trigger.id);
                        return (
                            <Badge
                                key={trigger.id}
                                variant={isSelected ? "default" : "outline"}
                                className={cn(
                                    "cursor-pointer transition-all hover:scale-105",
                                    isSelected ? trigger.color : "hover:bg-muted",
                                    "px-3 py-1.5 gap-1.5"
                                )}
                                onClick={() => toggleTrigger(trigger.id)}
                            >
                                <Icon className="w-3 h-3" />
                                {trigger.label}
                            </Badge>
                        );
                    })}
                </div>
            </div>

            {selectedTriggers.length > 0 && (
                <div className="space-y-2">
                    <Label htmlFor="context-note" className="text-sm font-medium">
                        Add a note (Optional, max 200 chars)
                    </Label>
                    <Textarea
                        id="context-note"
                        placeholder="What's happening? How are you feeling about it?"
                        value={contextNote}
                        onChange={(e) => {
                            if (e.target.value.length <= 200) {
                                onContextNoteChange(e.target.value);
                            }
                        }}
                        className="resize-none h-20"
                        maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                        {contextNote.length}/200
                    </p>
                </div>
            )}
        </div>
    );
};

export default MoodTriggerSelector;
