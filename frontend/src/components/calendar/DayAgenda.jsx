import { Plus } from "lucide-react";

import Button from "../ui/Button";
import CheckMark from "../ui/CheckMark";
import { dayLabel } from "../../utils/calendar";
import { formatTime, isOverdue } from "../../utils/dates";

// One day's tasks as a list: tasks without a time first ("Any time"), then
// by time. Each can be completed in place or opened; `taskDrag` (from
// useCalendarDrag) lets them be dragged onto another day.
//   headingLevel  2 on the Day view, 3 beside the month
function DayAgenda({ day, tasks, today, activeActions = {}, onOpen, onToggle, onAdd, taskDrag, draggingId, headingLevel = 3 }) {
    const Heading = `h${headingLevel}`;
    const open = tasks.filter((task) => !task.is_complete).length;

    return (
        <section aria-label={dayLabel(day)} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <Heading className="font-display text-lg font-semibold text-white">
                        {day === today ? "Today" : dayLabel(day)}
                    </Heading>
                    <p className="text-sm text-white/60">
                        {day === today && <>{dayLabel(day)} · </>}
                        {tasks.length === 0
                            ? "Nothing due"
                            : `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}${open < tasks.length ? `, ${tasks.length - open} done` : ""}`}
                    </p>
                </div>
                <Button size="sm" variant="secondary" leftIcon={Plus} onClick={() => onAdd(day)}>
                    Add task
                </Button>
            </div>

            {tasks.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm text-white/60">
                    No tasks on this day. Add one, or drag a task here from another day.
                </p>
            ) : (
                <ul className="space-y-2">
                    {tasks.map((task) => {
                        const done = Boolean(task.is_complete);
                        const late = !done && isOverdue(task.due_date);
                        const saving = Boolean(activeActions[task.task_id]);
                        return (
                            <li
                                key={task.task_id}
                                {...taskDrag?.(task, day)}
                                className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-opacity
                                    ${taskDrag ? "cursor-grab active:cursor-grabbing" : ""}
                                    ${draggingId === task.task_id ? "opacity-40" : ""}
                                    ${late ? "border-rose-400/20 bg-rose-500/[0.06]" : "border-white/[0.07] bg-white/[0.03]"}`}
                            >
                                <button
                                    type="button"
                                    onClick={() => onToggle(task.task_id)}
                                    disabled={saving}
                                    aria-label={`${done ? "Mark as not done" : "Mark complete"}: ${task.title}`}
                                    className="group/check -m-1 shrink-0 rounded-full p-1 disabled:opacity-60 touch:-m-2.5 touch:p-2.5"
                                >
                                    <CheckMark checked={done} saving={saving} />
                                </button>

                                <span className="tabular w-16 shrink-0 pt-0.5 text-xs text-white/55">
                                    {formatTime(task.scheduled_time) || "Any time"}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => onOpen(task)}
                                    className="min-w-0 flex-1 rounded-md text-left touch:min-h-11"
                                >
                                    <span className={`block break-words text-sm font-medium ${done ? "text-white/50 line-through decoration-white/30" : late ? "text-rose-100" : "text-white"}`}>
                                        {task.title}
                                    </span>
                                    {task.description && (
                                        <span className="mt-0.5 line-clamp-1 break-words text-xs text-white/50">
                                            {task.description}
                                        </span>
                                    )}
                                    {late && <span className="mt-0.5 block text-xs text-rose-300">Overdue</span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

export default DayAgenda;
