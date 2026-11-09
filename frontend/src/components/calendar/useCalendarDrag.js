import { useState } from "react";

// Drags carry a TaskFlow-only type, so text or links dragged in from
// elsewhere are never taken for a task
export const TASK_DRAG_TYPE = "application/x-taskflow-task";

// Drag a task onto another day to move it there. Mouse and trackpad only:
// touch screens (and keyboards) move tasks from the task's details instead.
//   onMove(taskId, dayKey)  saves the move (optimistic, rolled back on failure)
// Spread taskDrag(task) on a draggable task and dayDrop(key) on a day.
function useCalendarDrag(onMove) {
    const [dragging, setDragging] = useState(null); // { id, from }
    const [overDay, setOverDay] = useState(null);

    const end = () => {
        setDragging(null);
        setOverDay(null);
    };

    const taskDrag = (task, from) => ({
        draggable: true,
        onDragStart: (e) => {
            e.dataTransfer.setData(TASK_DRAG_TYPE, String(task.task_id));
            e.dataTransfer.effectAllowed = "move";
            setDragging({ id: task.task_id, from });
        },
        onDragEnd: end,
    });

    const carriesTask = (e) => Array.from(e.dataTransfer?.types ?? []).includes(TASK_DRAG_TYPE);

    const dayDrop = (key) => ({
        onDragOver: (e) => {
            if (!carriesTask(e)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (overDay !== key) setOverDay(key);
        },
        onDragLeave: (e) => {
            // Leaving for a child of the same day isn't leaving the day
            if (e.currentTarget.contains(e.relatedTarget)) return;
            setOverDay((day) => (day === key ? null : day));
        },
        onDrop: (e) => {
            if (!carriesTask(e)) return;
            e.preventDefault();
            const raw = e.dataTransfer.getData(TASK_DRAG_TYPE);
            const from = dragging?.from;
            end();
            const id = /^\d+$/.test(raw) ? Number(raw) : null;
            if (id === null || from === key) return;
            onMove(id, key);
        },
    });

    return { draggingId: dragging?.id ?? null, overDay, taskDrag, dayDrop };
}

export default useCalendarDrag;
