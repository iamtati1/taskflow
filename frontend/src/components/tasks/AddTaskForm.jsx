import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Flag, CheckCircle2 } from "lucide-react";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Card from "../ui/Card";

function AddTaskForm({
    addTask,
    updateTask,        // 👈 NEW
    initialData = null // 👈 NEW
}) {
    const isEditMode = !!initialData;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // =========================
    // PREFILL FOR EDIT MODE
    // =========================
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || "");
            setDescription(initialData.description || "");
            setPriority(initialData.priority || "medium");
        } else {
            setTitle("");
            setDescription("");
            setPriority("medium");
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || isSubmitting) return;

        setIsSubmitting(true);
        setSuccess(false);

        try {
            let result;

            if (isEditMode) {
                result = await updateTask(initialData.task_id, {
                    title,
                    description,
                    priority,
                });
            } else {
                result = await addTask({
                    title,
                    description,
                    priority,
                });
            }

            if (result?.success) {
                if (!isEditMode) {
                    setTitle("");
                    setDescription("");
                    setPriority("medium");
                }

                setSuccess(true);
                setTimeout(() => setSuccess(false), 1200);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div layout>
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
                    />

                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (optional)"
                        rows={3}
                        className="
                            w-full
                            rounded-xl
                            border border-white/10
                            bg-black/20
                            px-4 py-3
                            text-white
                            outline-none
                            resize-none
                            focus:border-cyan-400/40
                        "
                    />

                    {/* PRIORITY */}
                    <div className="flex gap-2">
                        {["low", "medium", "high"].map((level) => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => setPriority(level)}
                                className={`
                                    flex items-center gap-2 px-3 py-2 rounded-xl text-sm border
                                    ${priority === level
                                        ? "border-cyan-400/40 bg-cyan-500/10 text-white"
                                        : "border-white/10 text-white/60"
                                    }
                                `}
                            >
                                <Flag size={14} />
                                {level}
                            </button>
                        ))}
                    </div>

                    {/* FOOTER */}
                    <div className="flex items-center justify-between pt-2">

                        {/* SUCCESS */}
                        <div className="text-sm text-cyan-300 min-h-[20px]">
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