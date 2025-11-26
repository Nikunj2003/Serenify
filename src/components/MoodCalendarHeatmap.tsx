import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface MoodCalendarHeatmapProps {
    values: { date: string; count: number; mood: number }[];
    startDate: Date;
    endDate: Date;
    className?: string;
}

const MoodCalendarHeatmap = ({ values, startDate, endDate, className }: MoodCalendarHeatmapProps) => {
    const getTooltipData = (value: { date: string; count: number; mood: number } | null) => {
        if (!value || !value.date) {
            return { date: "No data", mood: "No data" };
        }
        const moodLabels = ["", "Struggling", "Difficult", "Okay", "Good", "Great"];
        return {
            date: format(new Date(value.date), "EEEE, MMMM do, yyyy"),
            mood: moodLabels[Math.round(value.mood)] || "Unknown",
        };
    };

    return (
        <div className={cn("w-full space-y-4", className)}>
            <div className="flex gap-2">
                {/* Custom Weekday Labels */}
                <div className="flex flex-col pt-6 pb-0 text-[10px] text-muted-foreground font-medium justify-between h-auto self-stretch">
                    <span className="leading-none">Sun</span>
                    <span className="leading-none">Mon</span>
                    <span className="leading-none">Tue</span>
                    <span className="leading-none">Wed</span>
                    <span className="leading-none">Thu</span>
                    <span className="leading-none">Fri</span>
                    <span className="leading-none">Sat</span>
                </div>

                {/* Heatmap */}
                <div className="flex-1 mood-heatmap">
                    <CalendarHeatmap
                        startDate={startDate}
                        endDate={endDate}
                        values={values}
                        classForValue={(value) => {
                            if (!value) {
                                return "color-empty";
                            }
                            return `color-scale-${Math.round(value.mood)}`;
                        }}
                        tooltipDataAttrs={(value: any) => {
                            return {
                                "data-tip": value.date ? `${format(new Date(value.date), "MMM d")}: ${value.mood}` : "No data",
                            };
                        }}
                        showWeekdayLabels={false} // We use custom ones
                        showMonthLabels={true}
                        gutterSize={2}
                        transformDayElement={(element, value, index) => (
                            <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                    {element}
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="text-xs">
                                        <p className="font-semibold">{getTooltipData(value).date}</p>
                                        <p className="capitalize">Mood: <span className="font-medium">{getTooltipData(value).mood}</span></p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    />
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-muted/40" />
                    <span>No Data</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[#ef4444]" />
                    <span>Struggling</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[#f97316]" />
                    <span>Difficult</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[#eab308]" />
                    <span>Okay</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[#22c55e]" />
                    <span>Good</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[#3b82f6]" />
                    <span>Great</span>
                </div>
            </div>

            <style>{`
        .mood-heatmap .react-calendar-heatmap {
            width: 100%;
            height: 100%;
        }
        .mood-heatmap .react-calendar-heatmap text {
          font-size: 5px;
          fill: hsl(var(--muted-foreground));
        }
        .mood-heatmap .react-calendar-heatmap .react-calendar-heatmap-month-label {
            transform: translateY(-3px); /* Move month labels up */
        }
        .mood-heatmap .react-calendar-heatmap .react-calendar-heatmap-weekday-label {
            display: none;
        }
        .mood-heatmap .react-calendar-heatmap .color-empty {
          fill: hsl(var(--muted));
          opacity: 0.2;
        }
        .mood-heatmap .react-calendar-heatmap rect:hover {
            stroke: hsl(var(--primary));
            stroke-width: 1px;
        }
        .mood-heatmap .react-calendar-heatmap .color-scale-1 { fill: #ef4444; }
        .mood-heatmap .react-calendar-heatmap .color-scale-2 { fill: #f97316; }
        .mood-heatmap .react-calendar-heatmap .color-scale-3 { fill: #eab308; }
        .mood-heatmap .react-calendar-heatmap .color-scale-4 { fill: #22c55e; }
        .mood-heatmap .react-calendar-heatmap .color-scale-5 { fill: #3b82f6; }
        
        .mood-heatmap .react-calendar-heatmap rect {
            rx: 1.5px;
            ry: 1.5px;
        }
      `}</style>
        </div>
    );
};

export default MoodCalendarHeatmap;
