import { useState } from "react";

import TaskCalendar from "../components/TaskCalendar";
import TaskList from "../components/tasks/TaskList";
import useTasks from "../hooks/useTasks";

function Tasks() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [newTaskTitle, setNewTaskTitle] = useState("");

    const {
        tasks,
        isLoading,
        error,
        selectedTaskId,
        onSelect,
        addTask,
        editTask,
        toggleTask,
        removeTask,
    } = useTasks();

    const handleCreateTask = async () => {
        const title = newTaskTitle.trim();
        if (!title) return;

        const result = await addTask({
            title,
            priority: "medium",
            is_complete: false,
        });

        if (result?.success) {
            setNewTaskTitle("");
        }
    };

    // LOADING
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-white/70">Loading tasks...</div>
            </div>
        );
    }

    // ERROR
    if (error) {
        return (
            <div className="p-6">
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                    <p className="text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    // PAGE
    return (
        <div className="space-y-6 p-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Tasks</h1>
                    <p className="mt-1 text-white/60">
                        Organize, prioritize, and complete your work.
                    </p>
                </div>

                <div className="text-sm text-white/50">
                    {tasks.length} Task{tasks.length !== 1 ? "s" : ""}
                </div>
            </div>

            {/* CREATE TASK INPUT (FIXED — NOW INSIDE RETURN) */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex gap-3">
                    <input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="What needs to get done?"
                        className="
                            flex-1
                            rounded-xl
                            border border-white/10
                            bg-black/20
                            px-4
                            py-3
                            text-white
                        "
                    />

                    <button
                        onClick={handleCreateTask}
                        className="
                            rounded-xl
                            border border-cyan-400/30
                            px-5
                            py-3
                            text-white
                            hover:bg-cyan-400/10
                        "
                    >
                        Add Task
                    </button>
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1">
                    <TaskCalendar
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                    />
                </div>

                <div className="xl:col-span-2">
                    <TaskList
                        tasks={tasks}
                        selectedTaskId={selectedTaskId}
                        onDelete={removeTask}
                        onToggle={toggleTask}
                        onSelect={onSelect}
                        onEdit={editTask}
                    />
                </div>
            </div>
        </div>
    );
}

export default Tasks;