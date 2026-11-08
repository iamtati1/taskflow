import { useState, useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

import Button from "../ui/Button";
import Input from "../ui/Input";
import { toDateKey } from "../../utils/dates";

// One-tap due dates, relative to today
const daysFromToday = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return toDateKey(date);
};
const QUICK_DATES = [
    { label: "Today", days: 0 },
    { label: "Tomorrow", days: 1 },
    { label: "Next week", days: 7 },
];

// The task editor, shown in a Dialog (see Tasks). `titleId` labels the dialog.
function AddTaskForm({
    addTask,
    updateTask,
    onCancel,
    initialData = null,
    titleId,
}) {
    const isEditMode = !!initialData;
    const fieldId = useId();
    const titleInputId = `${fieldId}-title`;
    const dateInputId = `${fieldId}-date`;
    const errorId = `${fieldId}-error`;

    // The task fields the database stores (completion is the checkbox)
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState(""); // "YYYY-MM-DD" or "" for none
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const formRef = useRef(null);

    // =========================
    // PREFILL FOR EDIT MODE
    // =========================
    useEffect(() => {
        setTitle(initialData?.title || "");
        setDueDate(toDateKey(initialData?.due_date) || "");
        setSubmitError(null);
    }, [initialData]);

    // =========================
    // FOCUS THE TITLE
    // =========================
    useEffect(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        formRef.current?.querySelector("input")?.focus({ preventScroll: true });
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        if (!title.trim()) {
            setSubmitError("Enter a title for the task.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // An empty date field means "no due date" (null clears an existing one)
            const fields = { title, due_date: dueDate || null };

            const result = isEditMode
                ? await updateTask(initialData.task_id, fields)
                : await addTask(fields);

            if (result?.success) {
                if (!isEditMode) {
                    setTitle("");
                    setDueDate("");
                }
            } else if (result) {
                setSubmitError(result.error || "Couldn't save the task. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            ref={formRef}
            className="border border-white/10 bg-[#0b1024] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_30px_80px_-20px_rgba(0,0,0,0.8)] sm:p-7 rounded-t-3xl sm:rounded-3xl"
        >
            {/* HEADER */}
            <div className="mb-6 flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <h2 id={titleId} className="text-xl font-bold text-white">
                        {isEditMode ? "Edit Task" : "Create Task"}
                    </h2>
                    <p className="text-sm text-white/50">
                        {isEditMode
                            ? "Update your task details."
                            : "Add something you want to accomplish."}
                    </p>
                </div>

                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Close"
                        className="-mr-2 -mt-1 rounded-xl p-2 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                )}
            </div>

            {/* FORM */}
            <form
                onSubmit={handleSubmit}
                onKeyDown={(e) => {
                    if (e.key === "Escape") onCancel?.();
                }}
                className="space-y-5"
            >
                <div className="space-y-2">
                    <label htmlFor={titleInputId} className="text-sm font-medium text-white/75">
                        Title
                    </label>
                    <Input
                        id={titleInputId}
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            setSubmitError(null);
                        }}
                        placeholder="Task title..."
                        maxLength={200}
                        autoComplete="off"
                        aria-invalid={submitError ? true : undefined}
                        aria-describedby={submitError ? errorId : undefined}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label htmlFor={dateInputId} className="text-sm font-medium text-white/75">
                            Due date (optional)
                        </label>
                        {dueDate && (
                            <button
                                type="button"
                                onClick={() => setDueDate("")}
                                className="rounded-lg px-2 py-0.5 text-xs text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
                            >
                                Clear date
                            </button>
                        )}
                    </div>

                    <input
                        id={dateInputId}
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition [color-scheme:dark] focus:border-cyan-400/50"
                    />

                    <div className="flex flex-wrap gap-2" role="group" aria-label="Quick due dates">
                        {QUICK_DATES.map(({ label, days }) => {
                            const value = daysFromToday(days);
                            const selected = dueDate === value;
                            return (
                                <button
                                    key={label}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => setDueDate(value)}
                                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150
                                        ${selected
                                            ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-200"
                                            : "border-white/10 text-white/60 hover:border-white/25 hover:text-white"}`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ERROR */}
                <AnimatePresence>
                    {submitError && (
                        <motion.p
                            id={errorId}
                            role="alert"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
                        >
                            {submitError}
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* CANCEL + SUBMIT */}
                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting}
                    >
                        <Sparkles size={14} className="inline" aria-hidden="true" />
                        {isSubmitting
                            ? "Saving..."
                            : isEditMode
                                ? "Update Task"
                                : "Add Task"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default AddTaskForm;
