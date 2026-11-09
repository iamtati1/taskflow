import { useState, useEffect, useId, useLayoutEffect, useRef } from "react";
import { Sparkles, X } from "lucide-react";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Field, { describedBy, fieldClass, textareaClass } from "../ui/Field";
import PillGroup from "../ui/PillGroup";
import { daysFrom, toDateKey } from "../../utils/dates";

const DESCRIPTION_MAX = 2000;
const rowFieldClass = fieldClass.replace("w-full ", "");
// The description box grows with its text up to about ten lines, then scrolls
const DESCRIPTION_MAX_HEIGHT = 260;

// One-tap due dates, relative to today
const QUICK_DATES = [
    { label: "Today", days: 0 },
    { label: "Tomorrow", days: 1 },
    { label: "Next week", days: 7 },
];

// The task editor, shown in a Dialog (see Tasks). `titleId` labels the dialog.
// `initialDate` ("YYYY-MM-DD") prefills a new task's due date, e.g. from the
// calendar.
function AddTaskForm({
    addTask,
    updateTask,
    onCancel,
    initialData = null,
    initialDate = "",
    titleId,
}) {
    const isEditMode = !!initialData;
    const fieldId = useId();
    const titleInputId = `${fieldId}-title`;
    const descriptionId = `${fieldId}-description`;
    const dateInputId = `${fieldId}-date`;
    const timeInputId = `${fieldId}-time`;

    // The task fields the database stores (completion is the checkbox)
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState(""); // "YYYY-MM-DD" or "" for none
    const [scheduledTime, setScheduledTime] = useState(""); // "HH:MM" or "" for none
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const formRef = useRef(null);
    const descriptionRef = useRef(null);

    // Grow the description box to fit its text
    useLayoutEffect(() => {
        const box = descriptionRef.current;
        if (!box) return;
        box.style.height = "auto";
        box.style.height = `${Math.min(box.scrollHeight + 2, DESCRIPTION_MAX_HEIGHT)}px`;
    }, [description]);

    // A time belongs to a date: removing the date removes the time
    const changeDueDate = (value) => {
        setDueDate(value);
        if (!value) setScheduledTime("");
    };

    // =========================
    // PREFILL FOR EDIT MODE
    // =========================
    useEffect(() => {
        setTitle(initialData?.title || "");
        setDescription(initialData?.description || "");
        setDueDate(toDateKey(initialData?.due_date) || initialDate || "");
        setScheduledTime(initialData?.scheduled_time || "");
        setSubmitError(null);
    }, [initialData, initialDate]);

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
            // Empty description and time are sent as "none", so clearing them saves
            const fields = {
                title,
                due_date: dueDate || null,
                description: description.trim() ? description : null,
                scheduled_time: dueDate && scheduledTime ? scheduledTime : null,
            };

            const result = isEditMode
                ? await updateTask(initialData.task_id, fields)
                : await addTask(fields);

            if (result?.success) {
                if (!isEditMode) {
                    setTitle("");
                    setDescription("");
                    setDueDate("");
                    setScheduledTime("");
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
                        className="-mr-2 -mt-1 rounded-xl p-2 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white touch:-mr-3 touch:p-[13px]"
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
                    id={descriptionId}
                    label="Description (optional)"
                    hint={description.length > DESCRIPTION_MAX - 200
                        ? `${description.length.toLocaleString()} / ${DESCRIPTION_MAX.toLocaleString()} characters`
                        : null}
                >
                    <textarea
                        id={descriptionId}
                        ref={descriptionRef}
                        value={description}
                        onChange={(e) => {
                            setDescription(e.target.value);
                            setSubmitError(null);
                        }}
                        placeholder="Add more details about this task..."
                        rows={3}
                        maxLength={DESCRIPTION_MAX}
                        aria-describedby={describedBy(descriptionId, description.length > DESCRIPTION_MAX - 200, null)}
                        className={textareaClass}
                    />
                </Field>

                <Field
                    id={dateInputId}
                    label="Due date (optional)"
                    action={dueDate && (
                        <button
                            type="button"
                            onClick={() => changeDueDate("")}
                            className="rounded-lg px-2 py-1 text-xs text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white touch:min-h-11 touch:px-3"
                        >
                            Clear date
                        </button>
                    )}
                >
                    {/* The date is the deadline; a time is optional on top of it.
                        They share a row, or stack on the narrowest phones so the
                        date stays readable. (fieldClass is full width.) */}
                    <div className="flex flex-col gap-2 min-[400px]:flex-row">
                        <input
                            id={dateInputId}
                            type="date"
                            value={dueDate}
                            onChange={(e) => changeDueDate(e.target.value)}
                            className={`${rowFieldClass} min-w-0 flex-1`}
                        />
                        <input
                            id={timeInputId}
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            disabled={!dueDate}
                            aria-label="Time (optional)"
                            title={dueDate ? "Time (optional)" : "Choose a date to add a time"}
                            className={`${rowFieldClass} w-full shrink-0 px-3 min-[400px]:w-[9.25rem] disabled:cursor-not-allowed disabled:opacity-40`}
                        />
                    </div>

                    <PillGroup
                        label="Quick due dates"
                        value={dueDate}
                        onChange={changeDueDate}
                        options={QUICK_DATES.map(({ label, days }) => ({ label, value: daysFrom(days) }))}
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
