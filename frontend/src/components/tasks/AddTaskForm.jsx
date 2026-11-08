import { useState, useEffect, useId, useRef } from "react";
import { Sparkles, X } from "lucide-react";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Field, { describedBy, fieldClass } from "../ui/Field";
import PillGroup from "../ui/PillGroup";
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
            className="p-6 sm:p-7"
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
                <Field id={titleInputId} label="Title" error={submitError}>
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
                        aria-describedby={describedBy(titleInputId, null, submitError)}
                    />
                </Field>

                <Field
                    id={dateInputId}
                    label="Due date (optional)"
                    action={dueDate && (
                        <button
                            type="button"
                            onClick={() => setDueDate("")}
                            className="rounded-lg px-2 py-1 text-xs text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                            Clear date
                        </button>
                    )}
                >
                    <input
                        id={dateInputId}
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className={fieldClass}
                    />

                    <PillGroup
                        label="Quick due dates"
                        value={dueDate}
                        onChange={setDueDate}
                        options={QUICK_DATES.map(({ label, days }) => ({ label, value: daysFromToday(days) }))}
                    />
                </Field>

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
                        loading={isSubmitting}
                        leftIcon={Sparkles}
                    >
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
