import { useState } from "react";

import TaskCalendar from "../components/calendar/TaskCalendar";
import TaskList from "../components/tasks/TaskList";
import AddTaskForm from "../components/tasks/AddTaskForm";
import useTasks from "../hooks/useTasks";

function Tasks() {
    // =====================================================
    // UI STATE (OS CONTROL LAYER)
    // =====================================================
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    // =====================================================
    // TASK ENGINE
    // =====================================================
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

    // =====================================================
    // CREATE
    // =====================================================
    const handleCreate = async (data) => {
        return await addTask(data);
    };

    // =====================================================
    // EDIT
    // =====================================================
    const handleUpdate = async (id, data) => {
        return await editTask(id, data);
    };

    // =====================================================
    // OPEN EDIT MODE
    // =====================================================
    const handleEdit = (task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
    };

    // =====================================================
    // FILTER TASKS BY DATE
    // =====================================================
    const filteredTasks = tasks.filter((task) => {
        if (!task.due_date) return true;

        const taskDate = new Date(task.due_date);

        return (
            taskDate.toDateString() ===
            selectedDate.toDateString()
        );
    });

    const completedTasks = tasks.filter(
        (task) => task.is_complete
    ).length;

    // =====================================================
    // LOADING / ERROR
    // =====================================================
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

    // =====================================================
    // UI
    // =====================================================
    return (
        <div className="space-y-8">

            {/* HEADER */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                <div>
                    <h1 className="text-5xl font-black text-white">
                        Tasks
                    </h1>

                    <p className="mt-3 text-white/60 max-w-xl">
                        Plan, organize, and execute your work with clarity and flow.
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="
                        rounded-2xl
                        border border-cyan-400/20
                        bg-cyan-400/10
                        px-5 py-3
                        text-white
                        hover:bg-cyan-400/15
                        transition
                    "
                >
                    + New Task
                </button>

            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flow-card p-4">
                    <p className="text-white/40 text-xs uppercase">
                        Total
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-white">
                        {tasks.length}
                    </h3>
                </div>

                <div className="flow-card p-4">
                    <p className="text-white/40 text-xs uppercase">
                        Completed
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-emerald-400">
                        {completedTasks}
                    </h3>
                </div>
            </div>

            {/* MAIN */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* CALENDAR */}
                <TaskCalendar
                    tasks={tasks}
                    onDateChange={setSelectedDate}
                />

                {/* TASK LIST */}
                <div className="xl:col-span-2">
                    <TaskList
                        tasks={filteredTasks}
                        selectedTaskId={selectedTaskId}
                        onDelete={removeTask}
                        onToggle={toggleTask}
                        onSelect={onSelect}
                        onEdit={handleEdit}   // 👈 IMPORTANT FIX
                    />
                </div>
            </div>

            {/* =====================================================
                MODAL (CREATE + EDIT UNIFIED SYSTEM)
            ===================================================== */}
            <AddTaskForm
                addTask={handleCreate}
                updateTask={handleUpdate}
                initialData={editingTask}
            />

        </div>
    );
}

export default Tasks;