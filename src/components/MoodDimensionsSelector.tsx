import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Zap, Brain, Activity } from "lucide-react";

interface MoodDimension {
    energy: number;
    anxiety: number;
    stress: number;
}

interface MoodDimensionsSelectorProps {
    dimensions: MoodDimension;
    onChange: (dimensions: MoodDimension) => void;
    className?: string;
}

const MoodDimensionsSelector = ({ dimensions, onChange, className }: MoodDimensionsSelectorProps) => {
    const handleDimensionChange = (dimension: keyof MoodDimension, value: number[]) => {
        onChange({
            ...dimensions,
            [dimension]: value[0],
        });
    };

    const getDimensionColor = (value: number) => {
        if (value <= 3) return "text-green-500";
        if (value <= 6) return "text-yellow-500";
        return "text-red-500";
    };

    const getDimensionLabel = (dimension: keyof MoodDimension, value: number) => {
        if (dimension === "energy") {
            if (value <= 3) return "Low";
            if (value <= 6) return "Moderate";
            return "High";
        }
        if (dimension === "anxiety" || dimension === "stress") {
            if (value <= 3) return "Low";
            if (value <= 6) return "Moderate";
            return "High";
        }
        return "";
    };

    return (
        <div className={cn("space-y-6", className)}>
            {/* Energy Level */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-500" />
                        <Label className="text-sm font-medium">Energy Level</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={cn("text-2xl font-bold tabular-nums", getDimensionColor(dimensions.energy))}>
                            {dimensions.energy}
                        </span>
                        <span className="text-xs text-muted-foreground min-w-[60px]">
                            {getDimensionLabel("energy", dimensions.energy)}
                        </span>
                    </div>
                </div>
                <Slider
                    value={[dimensions.energy]}
                    onValueChange={(value) => handleDimensionChange("energy", value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Drained</span>
                    <span>Energized</span>
                </div>
            </div>

            {/* Anxiety Level */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-500" />
                        <Label className="text-sm font-medium">Anxiety Level</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={cn("text-2xl font-bold tabular-nums", getDimensionColor(dimensions.anxiety))}>
                            {dimensions.anxiety}
                        </span>
                        <span className="text-xs text-muted-foreground min-w-[60px]">
                            {getDimensionLabel("anxiety", dimensions.anxiety)}
                        </span>
                    </div>
                </div>
                <Slider
                    value={[dimensions.anxiety]}
                    onValueChange={(value) => handleDimensionChange("anxiety", value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Calm</span>
                    <span>Anxious</span>
                </div>
            </div>

            {/* Stress Level */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-red-500" />
                        <Label className="text-sm font-medium">Stress Level</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={cn("text-2xl font-bold tabular-nums", getDimensionColor(dimensions.stress))}>
                            {dimensions.stress}
                        </span>
                        <span className="text-xs text-muted-foreground min-w-[60px]">
                            {getDimensionLabel("stress", dimensions.stress)}
                        </span>
                    </div>
                </div>
                <Slider
                    value={[dimensions.stress]}
                    onValueChange={(value) => handleDimensionChange("stress", value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Relaxed</span>
                    <span>Stressed</span>
                </div>
            </div>
        </div>
    );
};

export default MoodDimensionsSelector;
