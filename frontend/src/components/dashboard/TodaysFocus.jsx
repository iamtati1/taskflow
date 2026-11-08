import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Plus, Sparkles, Target } from "lucide-react";

import Card from "../ui/Card";
import Button from "../ui/Button";
import CheckMark from "../ui/CheckMark";
import SectionHeader from "../ui/SectionHeader";
import DueChip from "../tasks/DueChip";
import { dueStatus } from "../../utils/dates";
import { EASE_OUT } from "../../utils/motion";

// How long a just-finished task stays, ticked, before the next one slides
// in. The save itself starts at once; only the swap waits.
export const CELEBRATE_MS = 700;

// Why this task is the one to look at, from its due date
const focusNote = (task, focusMode) => {
    if (focusMode) return "Focus Mode is on. One outcome at a time.";
    const kind = dueStatus(task.due_date)?.kind;
    if (kind === "overdue") return "It's past its due date. Finish it, or give it a new date.";
    if (kind === "today") return "Due today. Clearing it makes the rest of the day lighter.";
    if (kind) return "The next task on your list by due date.";
    return "Nothing has a due date yet, so this is first on your list.";
};

const slide = {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE_OUT } },
    exit: { opacity: 0, x: -16, transition: { duration: 0.2 } },
};

// The single most urgent open task, completable in place. Completing it
// ticks the box, says so, then brings in the next most urgent task.
//   onComplete(task)  resolves true when the change was saved
function TodaysFocus({ task, total, focusMode = false, onComplete, onNewTask }) {
    const [justDone, setJustDone] = useState(null);
    const timer = useRef(null);

    useEffect(() => () => clearTimeout(timer.current), []);

    const shown = justDone ?? task;

    const complete = async () => {
        if (!task || justDone) return;
        const finishing = task;
        setJustDone(finishing);
        timer.current = setTimeout(() => setJustDone(null), CELEBRATE_MS);

        const saved = await onComplete(finishing);
        if (!saved) {
            // The task is back on the list; show it as open again now
            clearTimeout(timer.current);
            setJustDone(null);
        }
    };

    return (
        <Card variant="focus" className="h-full">
            <SectionHeader icon={Target}>Today's Focus</SectionHeader>

            <AnimatePresence mode="wait" initial={false}>
                {shown ? (
                    <motion.div key={shown.task_id} {...slide} className="mt-5 flex items-start gap-4">
                        <button
                            type="button"
                            onClick={complete}
                            disabled={Boolean(justDone)}
                            aria-label={`Complete "${shown.title}"`}
                            className="group/check -m-1.5 shrink-0 rounded-full p-1.5"
                        >
                            <CheckMark checked={Boolean(justDone)} size="lg" />
                        </button>

                        <div className="min-w-0 space-y-2.5">
                            <h3
                                className={`break-words font-display text-xl font-semibold leading-snug transition-colors duration-300 sm:text-[1.375rem]
                                    ${justDone ? "text-white/60 line-through decoration-emerald-400/50" : "text-white"}`}
                            >
                                {shown.title}
                            </h3>

                            {justDone ? (
                                <motion.p
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-1.5 text-sm font-medium text-emerald-300"
                                >
                                    <Sparkles size={14} aria-hidden="true" />
                                    Done. Nice work.
                                </motion.p>
                            ) : (
                                <>
                                    <DueChip dueDate={shown.due_date} />
                                    <p className="text-sm text-white/60">
                                        {focusNote(shown, focusMode)}
                                    </p>
                                </>
                            )}
                        </div>
                    </motion.div>
                ) : total === 0 ? (
                    <motion.div key="empty" {...slide} className="mt-5 space-y-3">
                        <div>
                            <p className="font-display text-lg font-semibold text-white">Nothing planned yet</p>
                            <p className="mt-1 text-sm text-white/60">
                                Add a task, and the most urgent one will wait for you here.
                            </p>
                        </div>
                        <Button size="sm" leftIcon={Plus} onClick={onNewTask}>
                            New task
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div key="clear" {...slide} className="mt-5 flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/12 text-emerald-300">
                            <CheckCircle2 size={20} aria-hidden="true" />
                        </span>
                        <div>
                            <p className="font-display text-lg font-semibold text-white">All clear</p>
                            <p className="text-sm text-white/60">
                                Every task is complete. Enjoy the space, or plan what's next.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

export default TodaysFocus;
