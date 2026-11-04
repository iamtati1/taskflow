import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2 } from "lucide-react";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Card from "../ui/Card";
import { toDateKey } from "../../utils/dates";

function AddTaskForm({
    addTask,
    updateTask,
    initialData = null
}) {
    const isEditMode = !!initialData;

    // The task fields the database stores (completion is the checkbox)
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState(""); // "YYYY-MM-DD" or "" for none
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
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
    // BRING THE FORM INTO VIEW
    // =========================
    // It renders below the task list, so without this Edit looks like it did nothing
    useEffect(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        formRef.current?.querySelector("input")?.focus({ preventScroll: true });
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || isSubmitting) return;

        setIsSubmitting(true);
        setSuccess(false);
        setSubmitError(null);

        try {
            let result;

            // An empty date field means "no due date" (null clears an existing one)
            const fields = { title, due_date: dueDate || null };

            if (isEditMode) {
                result = await updateTask(initialData.task_id, fields);
            } else {
                result = await addTask(fields);
            }

            if (result?.success) {
                if (!isEditMode) {
                    setTitle("");
                    setDueDate("");
                }

                setSuccess(true);
                setTimeout(() => setSuccess(false), 1200);
            } else if (result) {
                setSubmitError(result.error || "Couldn't save the task. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div layout ref={formRef}>
            <Card className="space-y-6">

                {/* HEADER */}
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-white">
                        {isEditMode ? "Edit Task" : "Create Task"}
                    </h2>

                    <p className="text-sm text-white/50">
                        {isEditMode
                            ? "Update your task details."
                            : "Add something you want to accomplish."}
                    </p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Task title..."
                        maxLength={200}
                    />

                    <label className="flex flex-col gap-2 text-sm text-white/60 sm:flex-row sm:items-center sm:gap-3">
                        Due date (optional)
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-white outline-none [color-scheme:dark] focus:border-cyan-400/40"
                        />
                        {dueDate && (
                            <button
                                type="button"
                                onClick={() => setDueDate("")}
                                className="self-start text-xs text-white/50 hover:text-white sm:self-auto"
                            >
                                Clear date
                            </button>
                        )}
                    </label>

                    {/* FOOTER */}
                    <div className="flex items-center justify-between pt-2">

                        {/* SUCCESS / ERROR */}
                        <div className="text-sm text-cyan-300 min-h-[20px]">
                            {submitError && (
                                <div role="alert" className="text-red-300">
                                    {submitError}
                                </div>
                            )}
                            <AnimatePresence>
                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={14} />
                                        {isEditMode ? "Task updated" : "Task created"}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* SUBMIT */}
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting}
                        >
                            <Sparkles size={14} className="inline mr-1" />
                            {isSubmitting
                                ? "Saving..."
                                : isEditMode
                                    ? "Update Task"
                                    : "Add Task"}
                        </Button>
                    </div>
                </form>
            </Card>
        </motion.div>
    );
}

export default AddTaskForm;