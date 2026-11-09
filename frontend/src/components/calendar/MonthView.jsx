import { useEffect, useRef } from "react";

import CalendarTask from "./CalendarTask";
import { addDays, addMonths, dayLabel, monthWeeks, sameMonth, startOfWeek, weekdayNames } from "../../utils/calendar";
import { isOverdue } from "../../utils/dates";

// Titles shown in a month cell before "+N more"
const SHOWN = 2;

// Keys that move the selected day, as in a date picker
export const dayKeyMove = (key, day) => ({
    ArrowLeft: addDays(day, -1),
    ArrowRight: addDays(day, 1),
    ArrowUp: addDays(day, -7),
    ArrowDown: addDays(day, 7),
    Home: startOfWeek(day),
    End: addDays(startOfWeek(day), 6),
    PageUp: addMonths(day, -1),
    PageDown: addMonths(day, 1),
}[key]);

// What a day's label says about its tasks, for screen readers
export const countLabel = (tasks) => {
    if (!tasks.length) return "";
    const open = tasks.filter((task) => !task.is_complete).length;
    return open === tasks.length
        ? `, ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`
        : `, ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}, ${tasks.length - open} done`;
};

// The month containing `selected`, in whole weeks. Each day is a button
// (arrow keys move between days, as in a date picker); on wider screens a
// cell lists its first tasks, which can be dragged to another day. On phones
// cells show dots, and the selected day's list does the rest.
function MonthView({ selected, today, days, onSelect, onOpen, drag }) {
    const { taskDrag, dayDrop, overDay, draggingId } = drag;
    const weeks = monthWeeks(selected);
    const names = weekdayNames("short");
    const longNames = weekdayNames("long");

    // Arrow keys move focus with the selection
    const grid = useRef(null);
    const moved = useRef(false);
    useEffect(() => {
        if (!moved.current) return;
        moved.current = false;
        grid.current?.querySelector(`[data-day="${selected}"]`)?.focus();
    }, [selected]);

    const handleKeyDown = (e) => {
        const next = dayKeyMove(e.key, selected);
        if (!next) return;
        e.preventDefault();
        moved.current = true;
        onSelect(next);
    };

    return (
        <table ref={grid} role="grid" aria-readonly="true" aria-label="Month" className="w-full table-fixed border-separate border-spacing-1">
            <thead>
                <tr>
                    {names.map((name, i) => (
                        <th key={name} scope="col" abbr={longNames[i]} className="pb-1 text-xs font-medium text-white/50">
                            {name}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {weeks.map((week) => (
                    <tr key={week[0]}>
                        {week.map((day) => {
                            const tasks = days.get(day) ?? [];
                            const isSelected = day === selected;
                            const isToday = day === today;
                            const outside = !sameMonth(day, selected);
                            const more = tasks.length - SHOWN;

                            return (
                                <td
                                    key={day}
                                    role="gridcell"
                                    aria-selected={isSelected}
                                    {...dayDrop(day)}
                                    onClick={() => onSelect(day)}
                                    className={`h-14 cursor-pointer rounded-lg border p-0.5 align-top sm:rounded-xl transition-colors sm:h-28 sm:p-1.5
                                        ${overDay === day
                                            ? "border-cyan-300/70 bg-cyan-400/15"
                                            : isSelected
                                                ? "border-cyan-400/40 bg-cyan-400/[0.07]"
                                                : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"}
                                        ${outside ? "opacity-45" : ""}`}
                                >
                                    <div className="flex h-full flex-col items-center gap-1 sm:items-stretch">
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
                                            className={`tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs transition-colors
                                                ${isSelected
                                                    ? "bg-cyan-400 font-semibold text-slate-950"
                                                    : isToday
                                                        ? "font-semibold text-cyan-200 ring-1 ring-cyan-300/70"
                                                        : "text-white/80 hover:bg-white/10"}`}
                                        >
                                            {Number(day.slice(8))}
                                        </button>

                                        {/* Phones: a dot per task, up to three (the whole cell is the tap target) */}
                                        {tasks.length > 0 && (
                                            <span aria-hidden="true" className="flex gap-0.5 sm:hidden">
                                                {tasks.slice(0, 3).map((task) => (
                                                    <span
                                                        key={task.task_id}
                                                        className={`h-1.5 w-1.5 rounded-full ${task.is_complete ? "bg-white/30" : isOverdue(task.due_date) ? "bg-rose-400" : "bg-cyan-300"}`}
                                                    />
                                                ))}
                                            </span>
                                        )}

                                        {/* Wider screens: the first titles, then a count */}
                                        <div className="hidden min-w-0 space-y-1 sm:block">
                                            {tasks.slice(0, SHOWN).map((task) => (
                                                <CalendarTask
                                                    key={task.task_id}
                                                    task={task}
                                                    compact
                                                    tabIndex={-1}
                                                    onOpen={onOpen}
                                                    drag={taskDrag(task, day)}
                                                    dragging={draggingId === task.task_id}
                                                />
                                            ))}
                                            {more > 0 && (
                                                <span className="block px-1.5 text-xs text-white/55">+{more} more</span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default MonthView;
