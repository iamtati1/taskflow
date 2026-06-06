import { useState } from "react";

import TaskCalendar from "../components/calendar/TaskCalendar";
import TaskList from "../components/tasks/TaskList";
import AddTaskForm from "../components/tasks/AddTaskForm";
import useTasks from "../hooks/useTasks";

import { CheckCircle2, ListTodo } from "lucide-react";

// =====================================================
// SHARED CARD SYSTEM (temporary local version)
// (later we extract this globally)
// =====================================================
function Card({ children, className = "" }) {
    return (
        <div className={`rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl ${className}`}>
            {children}
        </div>
    );
}

function Tasks() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

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

    const handleCreate = async (data) => addTask(data);
    const handleUpdate = async (id, data) => editTask(id, data);

    const handleEdit = (task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const filteredTasks = tasks.filter((task) => {
        if (!task.due_date) return true;
        return (
            new Date(task.due_date).toDateString() ===
            selectedDate.toDateString()
        );
    });

    const completedTasks = tasks.filter(
        (task) => task.is_complete
    ).length;

    const stats = [
        {
            icon: ListTodo,
            label: "Total",
            value: tasks.length,
        },
        {
            icon: CheckCircle2,
            label: "Completed",
            value: completedTasks,
        },
    ];

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
        <div className="space-y-10">

            {/* =====================================================
                HEADER (SYSTEM STANDARD)
            ===================================================== */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-cyan-300">
                        <ListTodo size={16} />
                        Task System
                    </div>

                    <h1 className="text-3xl font-bold text-white">
                        Your tasks, structured
                    </h1>

                    <p className="text-white/60 max-w-xl">
                        Plan, organize, and execute your work with clarity and momentum.
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-white transition hover:bg-cyan-400/15"
                >
                    + New Task
                </button>

            </div>

            {/* =====================================================
                STATS (UNIFIED SYSTEM)
            ===================================================== */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <Card key={stat.label}>
                            <Icon size={18} className="text-cyan-300" />

                            <h3 className="mt-4 text-3xl font-bold text-white">
                                {stat.value}
                            </h3>

                            <p className="mt-1 text-sm text-white/50">
                                {stat.label}
                            </p>
                        </Card>
                    );
                })}

            </div>

            {/* =====================================================
                MAIN GRID
            ===================================================== */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                <Card className="xl:col-span-1">
                    <TaskCalendar
                        tasks={tasks}
                        onDateChange={setSelectedDate}
                    />
                </Card>

                <Card className="xl:col-span-2">
                    <TaskList
                        tasks={filteredTasks}
                        selectedTaskId={selectedTaskId}
                        onDelete={removeTask}
                        onToggle={toggleTask}
                        onSelect={onSelect}
                        onEdit={handleEdit}
                    />
                </Card>

            </div>

            {/* =====================================================
                MODAL
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