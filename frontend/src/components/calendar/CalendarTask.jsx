import { formatTime, isOverdue } from "../../utils/dates";

// A task on the calendar: its time (if any) and title, tinted rose when it
// is overdue and struck through when done. Clicking opens its details;
// `drag` (from useCalendarDrag) makes it draggable to another day.
//   compact  one truncated line (month cells), with the time only where
//            cells are wide enough to show the title too; otherwise the
//            title wraps
function CalendarTask({ task, onOpen, drag, dragging = false, compact = false, tabIndex }) {
    const done = Boolean(task.is_complete);
    const late = !done && isOverdue(task.due_date);
    const time = formatTime(task.scheduled_time);

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onOpen(task);
            }}
            tabIndex={tabIndex}
            title={compact ? task.title : undefined}
            {...drag}
            className={`group/task flex w-full min-w-0 items-baseline gap-1.5 rounded-lg border text-left transition-colors
                ${compact ? "px-1.5 py-0.5 text-xs" : "px-2.5 py-1.5 text-sm touch:min-h-11 touch:py-2.5"}
                ${drag?.draggable ? "cursor-grab active:cursor-grabbing" : ""}
                ${dragging ? "opacity-40" : ""}
                ${done
                    ? "border-transparent bg-white/[0.03] text-white/45 line-through decoration-white/30"
                    : late
                        ? "border-rose-400/20 bg-rose-500/10 text-rose-100 hover:border-rose-400/40"
                        : "border-cyan-400/15 bg-cyan-400/[0.08] text-white/90 hover:border-cyan-400/35 hover:bg-cyan-400/[0.12]"}`}
        >
            {time && (
                <span className={`tabular shrink-0 ${compact ? "hidden 2xl:inline" : ""} ${done ? "" : late ? "text-rose-200/80" : "text-cyan-200/80"}`}>
                    {time}
                </span>
            )}
            <span className={`min-w-0 ${compact ? "truncate" : "break-words"}`}>{task.title}</span>
        </button>
    );
}

export default CalendarTask;
