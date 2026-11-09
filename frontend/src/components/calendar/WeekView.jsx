import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";

import CalendarTask from "./CalendarTask";
import { countLabel, dayKeyMove } from "./MonthView";
import { dayLabel, weekDays } from "../../utils/calendar";
import { parseDueDate } from "../../utils/dates";

// The week containing `selected`: seven columns on wider screens, the days
// stacked on phones. Tasks have a day and maybe a time but no length, so
// each day lists its tasks in time order (not an hourly grid, which would
// suggest durations they don't have).
function WeekView({ selected, today, days, onSelect, onOpen, onAdd, drag }) {
    const { taskDrag, dayDrop, overDay, draggingId } = drag;
    const week = weekDays(selected);

    // Arrow keys move focus with the selection
    const list = useRef(null);
    const moved = useRef(false);
    useEffect(() => {
        if (!moved.current) return;
        moved.current = false;
        list.current?.querySelector(`[data-day="${selected}"]`)?.focus();
    }, [selected]);

    const handleKeyDown = (e) => {
        const next = dayKeyMove(e.key, selected);
        if (!next) return;
        e.preventDefault();
        moved.current = true;
        onSelect(next);
    };

    return (
        <ol ref={list} aria-label="Week" className="grid grid-cols-1 gap-2 md:grid-cols-7">
            {week.map((day) => {
                const tasks = days.get(day) ?? [];
                const isSelected = day === selected;
                const isToday = day === today;
                const date = parseDueDate(day);

                return (
                    <li
                        key={day}
                        {...dayDrop(day)}
                        onClick={() => onSelect(day)}
                        className={`flex min-w-0 flex-col gap-2 rounded-xl border p-2 transition-colors md:min-h-72
                            ${overDay === day
                                ? "border-cyan-300/70 bg-cyan-400/15"
                                : isSelected
                                    ? "border-cyan-400/40 bg-cyan-400/[0.07]"
                                    : "border-white/[0.06] bg-white/[0.02]"}`}
                    >
                        <div className="flex items-center justify-between gap-1">
                            <button
                                type="button"
                                data-day={day}
                                tabIndex={isSelected ? 0 : -1}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(day);
                                }}
                                onKeyDown={handleKeyDown}
                                aria-label={`${dayLabel(day)}${isToday ? ", today" : ""}${countLabel(tasks)}`}
                                aria-current={isToday ? "date" : undefined}
                                aria-pressed={isSelected}
                                className="flex min-h-9 items-center gap-2 rounded-lg px-1 text-left touch:min-h-11 md:flex-col md:items-start md:gap-0"
                            >
                                <span className="text-xs font-medium uppercase tracking-wide text-white/50">
                                    {date.toLocaleDateString(undefined, { weekday: "short" })}
                                </span>
                                <span
                                    className={`tabular flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-sm
                                        ${isSelected
                                            ? "bg-cyan-400 font-semibold text-slate-950"
                                            : isToday
                                                ? "font-semibold text-cyan-200 ring-1 ring-cyan-300/70"
                                                : "text-white/85"}`}
                                >
                                    {date.getDate()}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAdd(day);
                                }}
                                aria-label={`Add a task on ${dayLabel(day)}`}
                                className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white inline-flex items-center justify-center touch:min-h-11 touch:min-w-11"
                            >
                                <Plus size={15} aria-hidden="true" />
                            </button>
                        </div>

                        {tasks.length > 0 ? (
                            <ul className="space-y-1.5">
                                {tasks.map((task) => (
                                    <li key={task.task_id}>
                                        <CalendarTask
                                            task={task}
                                            onOpen={onOpen}
                                            drag={taskDrag(task, day)}
                                            dragging={draggingId === task.task_id}
                                        />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="px-1 text-xs text-white/35 md:hidden">Nothing due</p>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

export default WeekView;
