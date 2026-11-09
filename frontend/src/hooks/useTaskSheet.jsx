import { useEffect, useState } from "react";

import AddTaskForm from "../components/tasks/AddTaskForm";
import TaskDetails from "../components/tasks/TaskDetails";
import Dialog from "../components/ui/Dialog";
import { useNotifications } from "../context/NotificationContext";
import { formatDueDate } from "../utils/dates";

// A task title for a toast, shortened so the toast stays small
export const quoted = (title = "") =>
    `"${title.length > 60 ? `${title.slice(0, 60)}…` : title}"`;

const SHEET_TITLE_ID = "task-form-title";

// The sheet over a page of tasks (Tasks, Calendar): a task's details, or
// the editor for a new task or an existing one. Details and editor share one
// Dialog, so focus returns to whatever opened it even after going from
// details to the editor. Saves are confirmed with toasts.
//   taskApi        what useTasks returns (tasks, addTask, editTask, ...)
//   newTaskButton  a ref focused when a new task is cancelled
// Returns the actions and `dialog`, to render once on the page.
function useTaskSheet({ tasks, addTask, editTask, toggleTask, activeActions }, { newTaskButton } = {}) {
    const { addNotification } = useNotifications();

    // null | { view: "details", taskId }
    //      | { view: "form", task, date, fromDetails }
    // `task` is a snapshot, so the form isn't reset by other changes while
    // open; `date` prefills a new task's due date; `fromDetails` returns to
    // the details after the editor closes.
    const [sheet, setSheet] = useState(null);
    const editingTask = sheet?.view === "form" ? sheet.task : null;
    const openTaskId = sheet?.view === "details" ? sheet.taskId : editingTask?.task_id;

    const openDetails = (task) => setSheet({ view: "details", taskId: task.task_id });
    const openEditor = (task) => setSheet({ view: "form", task, date: "", fromDetails: false });
    const openNewTask = (date = "") => setSheet({ view: "form", task: null, date, fromDetails: false });
    const closeSheet = () => setSheet(null);
    const editFromDetails = (task) => setSheet({ view: "form", task, date: "", fromDetails: true });

    // After saving or cancelling the editor: back to the details it came
    // from, otherwise closed
    const leaveForm = () =>
        setSheet((current) =>
            current?.view === "form" && current.fromDetails
                ? { view: "details", taskId: current.task.task_id }
                : null
        );

    // Closing a new task without saving puts focus back where new tasks
    // start (the dialog returns it to the opener instead when that was a
    // button)
    const cancelForm = () => {
        if (sheet?.fromDetails) {
            leaveForm();
            return;
        }
        closeSheet();
        newTaskButton?.current?.focus();
    };

    // The task shown in details, live (null once it's gone)
    const detailsTask = sheet?.view === "details"
        ? tasks.find((task) => task.task_id === sheet.taskId) ?? null
        : null;
    useEffect(() => {
        if (sheet?.view === "details" && !detailsTask) setSheet(null);
    }, [sheet, detailsTask]);

    // ===============================
    // SAVES
    // ===============================
    const create = async (data) => {
        const result = await addTask(data);
        // Keep the form open on failure so the error is visible and the text isn't lost
        if (result?.success) {
            closeSheet();
            addNotification(`Added ${quoted(result.data?.title ?? data.title)}`, "success");
        }
        return result;
    };

    const update = async (id, data) => {
        const result = await editTask(id, data);
        // Keep the form open on failure so the error is visible and the edit isn't lost
        if (result?.success) {
            leaveForm();
            addNotification(`Saved ${quoted(result.data?.title)}`, "success");
        }
        return result;
    };

    // Moves a task to another day (null removes its date), from the details
    // or the calendar. A failed move is rolled back by editTask and said here.
    const reschedule = async (id, dueDate) => {
        const task = tasks.find((t) => t.task_id === id);
        const result = await editTask(id, { due_date: dueDate });
        if (!task) return result;
        if (result?.success) {
            addNotification(
                dueDate
                    ? `Moved ${quoted(task.title)} to ${formatDueDate(dueDate, { weekday: "short", month: "short", day: "numeric" })}`
                    : `Removed the due date from ${quoted(task.title)}`,
                "success"
            );
        } else {
            addNotification(`Couldn't move ${quoted(task.title)}: ${result?.error ?? "please try again."}`, "error");
        }
        return result;
    };

    const toggle = async (id) => {
        const task = tasks.find((t) => t.task_id === id);
        const result = await toggleTask(id);
        if (result?.success && task) {
            addNotification(
                task.is_complete
                    ? `Moved ${quoted(task.title)} back to active`
                    : `Completed ${quoted(task.title)}`,
                "success"
            );
        }
        return result;
    };

    const dialog = (
        <Dialog
            open={sheet !== null}
            onClose={sheet?.view === "details" ? closeSheet : cancelForm}
            labelledBy={SHEET_TITLE_ID}
        >
            {sheet?.view === "details" && detailsTask ? (
                <TaskDetails
                    task={detailsTask}
                    titleId={SHEET_TITLE_ID}
                    busy={Boolean(activeActions[detailsTask.task_id])}
                    onClose={closeSheet}
                    onToggle={toggle}
                    onReschedule={reschedule}
                    onEdit={editFromDetails}
                />
            ) : (
                <AddTaskForm
                    addTask={create}
                    updateTask={update}
                    onCancel={cancelForm}
                    initialData={editingTask}
                    initialDate={sheet?.date ?? ""}
                    titleId={SHEET_TITLE_ID}
                />
            )}
        </Dialog>
    );

    return { openTaskId, openDetails, openEditor, openNewTask, closeSheet, toggle, reschedule, dialog };
}

export default useTaskSheet;
