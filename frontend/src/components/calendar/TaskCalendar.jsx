import { useMemo, useState, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import { CheckCircle2, CalendarDays } from "lucide-react";

function TaskCalendar({ tasks = [], onDateChange }) {
    const [selectedDate, setSelectedDate] = useState(new Date());

    // =====================================================
    // DATE NORMALIZATION (single source of truth)
    // =====================================================
    const formatDate = useCallback((date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split("T")[0];
    }, []);

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
                ? "bg-red-400"
                : data.total >= 3
                    ? "bg-yellow-400"
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
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl space-y-6">

            {/* HEADER */}
            <div>
                <div className="flex items-center gap-2 text-cyan-300">
                    <CalendarDays size={16} />
                    <span className="text-sm font-medium">
                        Planning Horizon
                    </span>
                </div>

                <p className="mt-2 text-sm text-white/40">
                    See where your attention is needed.
                </p>
            </div>

            {/* LEGEND */}
            <div className="flex flex-wrap gap-4 text-xs text-white/40">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-cyan-400" />
                    Light
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-400" />
                    Medium
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    Busy
                </div>
            </div>

            {/* CALENDAR */}
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20 p-3">
                <Calendar
                    value={selectedDate}
                    onChange={handleDateChange}
                    tileContent={tileContent}
                    tileClassName={tileClassName}
                />
            </div>

            {/* SELECTED DAY */}
            <div className="border-t border-white/10 pt-5">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                    Selected Day
                </p>

                <h3 className="mt-2 text-lg font-semibold text-white">
                    {selectedDate.toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                    })}
                </h3>

                <p className="mt-1 text-sm text-white/50">
                    {selectedTasks.length}{" "}
                    {selectedTasks.length === 1 ? "task" : "tasks"} planned
                </p>
            </div>

            {/* TASK LIST */}
            <div className="space-y-3">
                {selectedTasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5">
                        <p className="text-sm text-white/60">
                            Nothing planned yet.
                        </p>

                        <p className="mt-2 text-xs text-white/40">
                            A clear day can be used for focus, rest, or preparation.
                        </p>
                    </div>
                ) : (
                    selectedTasks.map((task) => (
                        <div
                            key={task.task_id}
                            className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-black/30 transition"
                        >
                            <span className="text-sm text-white/85">
                                {task.title}
                            </span>

                            {task.is_complete && (
                                <CheckCircle2 size={16} className="text-emerald-400" />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default TaskCalendar;