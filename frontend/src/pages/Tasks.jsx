import { useState } from "react";

import TaskCalendar from "../components/calendar/TaskCalendar";
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

    if (isLoading) {
        return (
            <div className="p-6 text-white/60">
                Loading tasks...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-8">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white">
                        Tasks
                    </h1>

                    <p className="mt-2 text-white/50">
                        Plan, organize, and execute your work.
                    </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
                    {tasks.length} Tasks
                </div>
            </div>

            {/* CREATE TASK */}
            <div className="flow-card p-5">
                <div className="flex gap-3">
                    <input
                        value={newTaskTitle}
                        onChange={(e) =>
                            setNewTaskTitle(e.target.value)
                        }
                        placeholder="What needs to get done?"
                        className="
                            flex-1
                            rounded-xl
                            border
                            border-white/10
                            bg-black/20
                            px-4
                            py-3
                            text-white
                            outline-none
                        "
                    />

                    <button
                        onClick={handleCreateTask}
                        className="btn-primary"
                    >
                        Add Task
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* CALENDAR */}
                <div>
                    <TaskCalendar
                        tasks={tasks}
                        onDateChange={setSelectedDate}
                    />
                </div>

                {/* TASKS */}
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