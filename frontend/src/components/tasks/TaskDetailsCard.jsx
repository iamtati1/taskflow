import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";

import {
    Calendar,
    Flag,
    CheckCircle2,
    Sparkles,
} from "lucide-react";

function TaskDetailsCard({
    task,
    onToggle,
    onDelete,
    onEdit,
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [dueDate, setDueDate] = useState("");

    useEffect(() => {
        if (!task) return;

        setTitle(task.title || "");
        setDescription(task.description || "");
        setPriority(task.priority || "medium");
        setDueDate(
            task.due_date
                ? task.due_date.slice(0, 10)
                : ""
        );
    }, [task]);

    if (!task) {
        return (
            <Card className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                    <p className="text-white/40">
                        Select a task
                    </p>

                    <p className="text-xs text-white/25">
                        Details will appear here
                    </p>
                </div>
            </Card>
        );
    }

    const handleSave = async () => {
        await onEdit(task.task_id, {
            title,
            description,
            priority,
            due_date: dueDate || null,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full"
        >
            <Card className="p-6 space-y-6">

                {/* HEADER */}
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                        Task Details
                    </p>
                </div>

                {/* TITLE */}
                <div className="space-y-2">
                    <label className="text-sm text-white/60">
                        Title
                    </label>

                    <Input
                        value={title}
                        onChange={(e) =>
                            setTitle(e.target.value)
                        }
                    />
                </div>

                {/* DESCRIPTION */}
                <div className="space-y-2">
                    <label className="text-sm text-white/60">
                        Description
                    </label>

                    <textarea
                        value={description}
                        onChange={(e) =>
                            setDescription(e.target.value)
                        }
                        rows={5}
                        className="
                            w-full
                            rounded-xl
                            border border-white/10
                            bg-black/20
                            p-3
                            text-white
                        "
                    />
                </div>

                {/* PRIORITY */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-white/60">
                        <Flag size={14} />
                        Priority
                    </label>

                    <select
                        value={priority}
                        onChange={(e) =>
                            setPriority(e.target.value)
                        }
                        className="
                            w-full
                            rounded-xl
                            border border-white/10
                            bg-black/20
                            p-3
                            text-white
                        "
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>

                {/* DUE DATE */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-white/60">
                        <Calendar size={14} />
                        Due Date
                    </label>

                    <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) =>
                            setDueDate(e.target.value)
                        }
                    />
                </div>

                {/* AI INSIGHT BLOCK */}
                <div
                    className="
                        rounded-2xl
                        border border-cyan-400/10
                        bg-cyan-500/5
                        p-4
                    "
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles
                            size={14}
                            className="text-cyan-300"
                        />

                        <span className="text-sm text-cyan-200">
                            AI Insight
                        </span>
                    </div>

                    <p className="text-sm text-white/50">
                        Future AI planning suggestions,
                        execution guidance, and focus
                        recommendations will appear here.
                    </p>
                </div>

                {/* ACTIONS */}
                <div className="pt-4 border-t border-white/10 space-y-3">

                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() =>
                            onToggle(task.task_id)
                        }
                    >
                        <CheckCircle2 size={16} />

                        {task.is_complete
                            ? "Mark Incomplete"
                            : "Mark Complete"}
                    </Button>

                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={handleSave}
                    >
                        Save Changes
                    </Button>

                    <Button
                        variant="danger"
                        className="w-full"
                        onClick={() =>
                            onDelete(task.task_id)
                        }
                    >
                        Delete Task
                    </Button>

                </div>
            </Card>
        </motion.div>
    );
}

export default TaskDetailsCard;