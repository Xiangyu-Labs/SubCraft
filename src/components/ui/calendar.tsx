"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  format,
  isToday,
} from "date-fns";

export interface CalendarProps {
  value?: Date | undefined;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
}

export function Calendar({ value, onSelect, className }: CalendarProps) {
  const [viewDate, setViewDate] = React.useState(value || new Date());

  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [viewDate]);

  const handlePrevMonth = () => setViewDate((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setViewDate((prev) => addMonths(prev, 1));

  const handleDateSelect = (date: Date) => {
    onSelect?.(date);
  };

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className={cn("w-[280px] p-3", className)}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors hover:bg-accent"
          style={{ borderColor: "var(--border)" }}
          onClick={handlePrevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="font-semibold text-sm">
          {format(viewDate, "MMMM yyyy")}
        </div>
        <button
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors hover:bg-accent"
          style={{ borderColor: "var(--border)" }}
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs text-muted-foreground font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((date) => {
          const isCurrentMonth = isSameMonth(date, viewDate);
          const isSelected = value && isSameDay(date, value);
          const isTodayDate = isToday(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateSelect(date)}
              className={cn(
                "h-8 w-8 rounded-md text-sm flex items-center justify-center",
                "transition-colors relative",
                "hover:bg-accent",
                !isCurrentMonth && "text-muted-foreground/40",
                isCurrentMonth && "text-foreground",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                isTodayDate &&
                  !isSelected &&
                  "ring-1 ring-primary ring-inset text-primary font-medium"
              )}
            >
              {format(date, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
