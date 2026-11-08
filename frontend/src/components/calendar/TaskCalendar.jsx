import { useMemo, useState, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import { CheckCircle2, CalendarDays } from "lucide-react";

import { toDateKey } from "../../utils/dates";

function TaskCalendar({ tasks = [], onDateChange }) {
    const [selectedDate, setSelectedDate] = useState(new Date());

    // =====================================================
    // DATE NORMALIZATION (single source of truth)
    // =====================================================
    // Local calendar days on both sides (due dates are "YYYY-MM-DD")
    const formatDate = useCallback((date) => toDateKey(date), []);

    // =====================================================
    // HANDLE DATE CHANGE
    // =====================================================
    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
        onDateChange?.(newDate);
    };

    // =====================================================
    // TASK MAP (calendar density engine)
    // =====================================================
    const taskMap = useMemo(() => {
        const map = {};

        for (const task of tasks) {
            if (!task?.due_date) continue;

            const key = formatDate(task.due_date);

            if (!map[key]) {
                map[key] = {
                    total: 0,
                    completed: 0,
                    pending: 0,
                };
            }

            map[key].total += 1;

            if (task.is_complete) {
                map[key].completed += 1;
            } else {
                map[key].pending += 1;
            }
        }

        return map;
    }, [tasks, formatDate]);

    // =====================================================
    // SELECTED DAY TASKS
    // =====================================================
    const selectedTasks = useMemo(() => {
        const key = formatDate(selectedDate);

        return tasks.filter(
            (task) =>
                task?.due_date &&
                formatDate(task.due_date) === key
        );
    }, [tasks, selectedDate, formatDate]);

    // =====================================================
    // TILE CONTENT (visual density indicator)
    // =====================================================
    const tileContent = ({ date }) => {
        const key = formatDate(date);
        const data = taskMap[key];

        if (!data) return null;

        const color =
            data.total >= 5
                ? "bg-rose-400"
                : data.total >= 3
                    ? "bg-amber-400"
                    : "bg-cyan-400";

        return (
            <div className="mt-1 flex justify-center">
                <div className={`h-1.5 w-1.5 rounded-full ${color}`} />
            </div>
        );
    };

    // =====================================================
    // TILE CLASS (selection + state styling)
    // =====================================================
    const tileClassName = ({ date }) => {
        const key = formatDate(date);

        const isSelected = key === formatDate(selectedDate);
        const hasTasks = Boolean(taskMap[key]);

        return [
            isSelected ? "calendar-selected" : "",
            hasTasks ? "calendar-has-tasks" : "",
        ].join(" ");
    };

    // =====================================================
    // UI
    // =====================================================
    return (
        <div className="space-y-5">

            {/* HEADER */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                        <CalendarDays size={17} className="text-cyan-300" aria-hidden="true" />
                        Calendar
                    </h2>
                    <p className="mt-1 text-sm text-white/50">
                        Dots mark days with tasks due.
                    </p>
                </div>

                {/* LEGEND */}
                <div className="flex flex-col gap-1 text-[11px] text-white/50">
                    {[
                        ["bg-cyan-400", "1–2"],
                        ["bg-amber-400", "3–4"],
                        ["bg-rose-400", "5+"],
                    ].map(([color, label]) => (
                        <span key={label} className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${color}`} aria-hidden="true" />
                            {label}
                        </span>
                    ))}
                </div>
            </div>

            {/* CALENDAR */}
            <div className="rounded-xl border border-white/[0.07] bg-black/20 p-2.5">
                <Calendar
                    value={selectedDate}
                    onChange={handleDateChange}
                    tileContent={tileContent}
                    tileClassName={tileClassName}
                />
            </div>

            {/* SELECTED DAY */}
            <div className="border-t border-white/[0.07] pt-4">
                <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">
                        {selectedDate.toLocaleDateString(undefined, {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                        })}
                    </h3>
                    <p className="tabular text-xs text-white/50">
                        {selectedTasks.length}{" "}
                        {selectedTasks.length === 1 ? "task" : "tasks"}
                    </p>
                </div>

                <ul className="mt-3 space-y-2">
                    {selectedTasks.length === 0 ? (
                        <li className="rounded-xl border border-dashed border-white/10 px-4 py-4 text-sm text-white/50">
                            Nothing due this day.
                        </li>
                    ) : (
                        selectedTasks.map((task) => (
                            <li
                                key={task.task_id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5"
                            >
                                <span className={`min-w-0 break-words text-sm ${task.is_complete ? "text-white/50 line-through" : "text-white/85"}`}>
                                    {task.title}
                                </span>
                                {task.is_complete && (
                                    <CheckCircle2 size={16} className="shrink-0 text-emerald-400" aria-label="Done" />
                                )}
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}

export default TaskCalendar;