import { useId } from "react";
import { CalendarX2, Pencil, X } from "lucide-react";

import Button from "../ui/Button";
import CheckMark from "../ui/CheckMark";
import PillGroup from "../ui/PillGroup";
import SectionHeader from "../ui/SectionHeader";
import { fieldClass } from "../ui/Field";
import DueChip from "./DueChip";
import { daysFrom, toDateKey } from "../../utils/dates";

const QUICK_MOVES = [
    { label: "Today", days: 0 },
    { label: "Tomorrow", days: 1 },
    { label: "Next week", days: 7 },
];

// One task in full, shown in a Dialog: the whole description (line breaks
// kept), its due date and time, and the everyday actions: complete it, move
// it to another day, or open the editor. `task` is the live task, so the
// sheet reflects each change as it is saved; `busy` locks the actions while
// one is saving.
function TaskDetails({ task, titleId, busy = false, onClose, onToggle, onReschedule, onEdit }) {
    const dateInputId = useId();
    const dueKey = toDateKey(task.due_date) || "";
    const done = Boolean(task.is_complete);

    return (
        <div className="p-6 sm:p-7">
            {/* HEADER: complete, title, close */}
            <div className="flex items-start gap-3">
                <button
                    type="button"
                    onClick={() => onToggle(task.task_id)}
                    disabled={busy}
                    aria-label={done ? "Mark as not done" : "Mark complete"}
                    className="group/check -m-1.5 mt-0 shrink-0 rounded-full p-1.5 disabled:opacity-60 touch:-m-2 touch:p-2"
                >
                    <CheckMark checked={done} size="lg" />
                </button>

                <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                    <h2
                        id={titleId}
                        className={`break-words font-display text-xl font-bold leading-snug transition-colors duration-300
                            ${done ? "text-white/60 line-through decoration-white/30" : "text-white"}`}
                    >
                        {task.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        {task.due_date ? (
                            <DueChip dueDate={task.due_date} time={task.scheduled_time} done={done} />
                        ) : (
                            <span className="text-white/60">No due date</span>
                        )}
                        {done && <span className="font-medium text-emerald-300">Completed</span>}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="-mr-2 -mt-1 shrink-0 rounded-xl p-2 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white touch:-mr-3 touch:p-[13px]"
                >
                    <X size={18} aria-hidden="true" />
                </button>
            </div>

            {/* DESCRIPTION (only when there is one) */}
            {task.description && (
                <section className="mt-6 space-y-2.5">
                    <SectionHeader as="h3" tone="muted">Description</SectionHeader>
                    <p className="max-h-[40dvh] overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 leading-relaxed text-white/85">
                        {task.description}
                    </p>
                </section>
            )}

            {/* RESCHEDULE: one tap, or any day */}
            <section className="mt-6 space-y-3">
                <SectionHeader as="h3" tone="muted">Reschedule</SectionHeader>
                <PillGroup
                    label="Move to"
                    value={dueKey}
                    onChange={(value) => !busy && value !== dueKey && onReschedule(task.task_id, value)}
                    options={QUICK_MOVES.map(({ label, days }) => ({ label, value: daysFrom(days) }))}
                />
                <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor={dateInputId} className="sr-only">Due date</label>
                    <input
                        id={dateInputId}
                        type="date"
                        value={dueKey}
                        disabled={busy}
                        onChange={(e) => e.target.value && e.target.value !== dueKey && onReschedule(task.task_id, e.target.value)}
                        className={`${fieldClass} h-11 max-w-[12rem] flex-1 disabled:opacity-60`}
                    />
                    {task.due_date && (
                        <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={CalendarX2}
                            disabled={busy}
                            onClick={() => onReschedule(task.task_id, null)}
                        >
                            Remove date
                        </Button>
                    )}
                </div>
                {task.scheduled_time && (
                    <p className="text-xs text-white/60">Moving the task keeps its time; removing the date removes the time.</p>
                )}
            </section>

            {/* ACTIONS (closing is the × above, or Escape) */}
            <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button leftIcon={Pencil} onClick={() => onEdit(task)}>
                    Edit task
                </Button>
            </div>
        </div>
    );
}

export default TaskDetails;
