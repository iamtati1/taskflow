// @vitest-environment jsdom
// The whole edit flow on the Tasks page, with the task API mocked:
// click Edit -> form opens in view, prefilled -> change title -> save -> list updates.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

vi.mock("../api/tasks", () => ({
    taskApi: {
        getTasks: vi.fn(),
        createTask: vi.fn(),
        updateTask: vi.fn(),
        deleteTask: vi.fn(),
    },
}));

import { taskApi } from "../api/tasks";
import { NotificationProvider } from "../context/NotificationContext";
import ToastViewport from "../components/notifications/ToastViewport";
import Tasks from "./Tasks";

// The page with the toast area that AppLayout renders around it
const renderTasks = () =>
    render(
        <NotificationProvider>
            <Tasks />
            <ToastViewport />
        </NotificationProvider>
    );

const toasts = () => screen.getByRole("status", { name: "Notifications" });

const serverTasks = () => [
    { task_id: 2, user_id: 1, title: "Write report", is_complete: false, due_date: null },
    { task_id: 1, user_id: 1, title: "Buy milk", is_complete: false, due_date: null },
];

beforeEach(() => {
    // jsdom has no layout, so scrolling is recorded rather than performed
    Element.prototype.scrollIntoView = vi.fn();
    taskApi.getTasks.mockResolvedValue({ success: true, data: serverTasks(), error: null });
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

const openEditFor = async (title) => {
    renderTasks();
    const card = (await screen.findByText(title)).closest("div.group");
    fireEvent.click(within(card).getByRole("button", { name: "Edit" }));
    return screen.findByRole("heading", { name: "Edit Task" });
};

test("clicking Edit opens the form in view with the task's title, focused", async () => {
    await openEditFor("Write report");

    const input = screen.getByPlaceholderText("Task title...");
    expect(input.value).toBe("Write report");
    expect(document.activeElement).toBe(input);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
});

test("saving an edit sends the right task id and shows the saved title", async () => {
    taskApi.updateTask.mockImplementation(async (id, changes) => ({
        success: true,
        data: { ...serverTasks().find((t) => t.task_id === id), ...changes },
        error: null,
    }));

    await openEditFor("Write report");
    fireEvent.change(screen.getByPlaceholderText("Task title..."), { target: { value: "Write final report" } });
    fireEvent.click(screen.getByRole("button", { name: /Update Task/ }));

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Edit Task" })).toBeNull());
    expect(taskApi.updateTask).toHaveBeenCalledWith(2, { title: "Write final report", due_date: null });
    expect(screen.getByText("Write final report")).toBeTruthy();
    expect(screen.queryByText("Write report")).toBeNull();
    expect(screen.getByText("Buy milk")).toBeTruthy();
});

test("a failed save keeps the form open with the error and restores the list", async () => {
    taskApi.updateTask.mockResolvedValue({ success: false, data: null, error: { message: "Not authenticated" } });

    await openEditFor("Write report");
    fireEvent.change(screen.getByPlaceholderText("Task title..."), { target: { value: "Will fail" } });
    fireEvent.click(screen.getByRole("button", { name: /Update Task/ }));

    expect((await screen.findByRole("alert")).textContent).toBe("Not authenticated");
    expect(screen.getByPlaceholderText("Task title...").value).toBe("Will fail");
    expect(screen.getByText("Write report")).toBeTruthy();
    expect(screen.getByText("Buy milk")).toBeTruthy();
});

test("a save the server didn't apply (old title returned) is reported, not shown as success", async () => {
    taskApi.updateTask.mockImplementation(async (id) => ({
        success: true,
        data: serverTasks().find((t) => t.task_id === id), // unchanged title
        error: null,
    }));

    await openEditFor("Write report");
    fireEvent.change(screen.getByPlaceholderText("Task title..."), { target: { value: "Write final report" } });
    fireEvent.click(screen.getByRole("button", { name: /Update Task/ }));

    expect((await screen.findByRole("alert")).textContent).toMatch(/new title wasn't saved/);
    expect(screen.getByPlaceholderText("Task title...").value).toBe("Write final report");
    expect(screen.getByRole("heading", { name: "Edit Task" })).toBeTruthy();
});

test("double-clicking Update sends one request", async () => {
    let finish;
    taskApi.updateTask.mockImplementation(
        (id, changes) =>
            new Promise((resolve) => {
                finish = () => resolve({ success: true, data: { ...serverTasks().find((t) => t.task_id === id), ...changes }, error: null });
            })
    );

    await openEditFor("Write report");
    fireEvent.change(screen.getByPlaceholderText("Task title..."), { target: { value: "Once" } });
    const save = screen.getByRole("button", { name: /Update Task/ });
    fireEvent.click(save);
    fireEvent.click(screen.getByRole("button", { name: /Saving/ }));
    fireEvent.submit(save.closest("form"));

    expect(taskApi.updateTask).toHaveBeenCalledTimes(1);
    finish();
    expect(await screen.findByText("Once")).toBeTruthy();
});

test("ticking a task's checkbox sends the completion to the server and moves it to Completed", async () => {
    taskApi.updateTask.mockImplementation(async (id, changes) => ({
        success: true,
        data: { ...serverTasks().find((t) => t.task_id === id), ...changes },
        error: null,
    }));

    renderTasks();
    const card = (await screen.findByText("Buy milk")).closest("div.group");
    fireEvent.click(within(card).getAllByRole("button")[0]); // the checkbox

    await waitFor(() => expect(taskApi.updateTask).toHaveBeenCalledWith(1, { is_complete: true }));
    expect(await screen.findByRole("heading", { name: "Completed" })).toBeTruthy();
});

// ---------- Failed actions keep the list on screen ----------

test("a failed complete shows a dismissible notice, keeps the list, and reverts the checkbox", async () => {
    taskApi.updateTask.mockResolvedValue({ success: false, data: null, error: { message: "Not authenticated" } });

    renderTasks();
    const card = (await screen.findByText("Buy milk")).closest("div.group");
    fireEvent.click(within(card).getAllByRole("button")[0]);

    expect((await screen.findByRole("alert")).textContent).toMatch(/Couldn't update "Buy milk": Not authenticated/);
    expect(screen.getByText("Write report")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Completed" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("alert")).toBeNull();
});

test("a failed delete shows a notice and puts the task back", async () => {
    taskApi.deleteTask.mockResolvedValue({ success: false, data: null, error: { message: "Server unavailable" } });

    renderTasks();
    const card = (await screen.findByText("Buy milk")).closest("div.group");
    fireEvent.click(within(card).getByRole("button", { name: "Delete" }));
    expect(taskApi.deleteTask).not.toHaveBeenCalled(); // asks first
    fireEvent.click(within(card).getByRole("button", { name: "Yes, delete" }));

    expect((await screen.findByRole("alert")).textContent).toMatch(/Couldn't delete that task: Server unavailable/);
    expect(await screen.findByText("Buy milk")).toBeTruthy();
});

test("a failed create keeps the form open with the error and the typed title", async () => {
    taskApi.createTask.mockResolvedValue({ success: false, data: null, error: { message: "Title is required." } });

    renderTasks();
    await screen.findByText("Buy milk");
    fireEvent.click(screen.getByRole("button", { name: "+ New Task" }));
    fireEvent.change(screen.getByPlaceholderText("Task title..."), { target: { value: "New idea" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Task/ }));

    expect((await screen.findByRole("alert")).textContent).toBe("Title is required.");
    expect(screen.getByPlaceholderText("Task title...").value).toBe("New idea");
    expect(screen.getByText("Buy milk")).toBeTruthy();
});

test("a failed load explains the problem and can be retried", async () => {
    taskApi.getTasks
        .mockResolvedValueOnce({ success: false, data: null, error: { message: "Network error" } })
        .mockResolvedValueOnce({ success: true, data: serverTasks(), error: null });

    renderTasks();
    expect((await screen.findByRole("alert")).textContent).toMatch(/Couldn't load your tasks: Network error/);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Buy milk")).toBeTruthy();
});

// ---------- Due dates ----------

test("creating a task with a due date sends it as YYYY-MM-DD and keeps the task in the list", async () => {
    taskApi.createTask.mockImplementation(async (fields) => ({
        success: true,
        data: { task_id: 9, user_id: 1, is_complete: false, ...fields },
        error: null,
    }));

    renderTasks();
    await screen.findByText("Buy milk");
    fireEvent.click(screen.getByRole("button", { name: "+ New Task" }));
    fireEvent.change(screen.getByPlaceholderText("Task title..."), { target: { value: "File taxes" } });
    fireEvent.change(screen.getByLabelText("Due date (optional)"), { target: { value: "2027-04-15" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Task/ }));

    await waitFor(() => expect(taskApi.createTask).toHaveBeenCalledWith({ title: "File taxes", due_date: "2027-04-15" }));
    // A task due on another day is still listed (the calendar shows the day view)
    expect(await screen.findByText("File taxes")).toBeTruthy();
    expect(screen.getByText("Apr 15")).toBeTruthy();
});

test("editing a dated task prefills the date, and Clear date removes it", async () => {
    taskApi.getTasks.mockResolvedValue({
        success: true,
        data: [{ task_id: 5, user_id: 1, title: "Dentist", is_complete: false, due_date: "2026-11-20" }],
        error: null,
    });
    taskApi.updateTask.mockImplementation(async (id, changes) => ({
        success: true,
        data: { task_id: id, user_id: 1, title: "Dentist", is_complete: false, ...changes },
        error: null,
    }));

    await openEditFor("Dentist");
    expect(screen.getByLabelText("Due date (optional)").value).toBe("2026-11-20");

    fireEvent.click(screen.getByRole("button", { name: "Clear date" }));
    fireEvent.click(screen.getByRole("button", { name: /Update Task/ }));

    await waitFor(() => expect(taskApi.updateTask).toHaveBeenCalledWith(5, { title: "Dentist", due_date: null }));
});

// ---------- Toasts for task actions ----------

const echoUpdate = () =>
    taskApi.updateTask.mockImplementation(async (id, changes) => ({
        success: true,
        data: { ...serverTasks().find((t) => t.task_id === id), ...changes },
        error: null,
    }));

test("completing a task confirms it with a toast", async () => {
    echoUpdate();
    renderTasks();

    const card = (await screen.findByText("Buy milk")).closest("div.group");
    fireEvent.click(within(card).getByRole("button", { name: "Mark complete" }));

    await waitFor(() => expect(toasts().textContent).toContain('Completed "Buy milk"'));
});

test("reopening a completed task says it is active again", async () => {
    taskApi.getTasks.mockResolvedValue({
        success: true,
        data: [{ task_id: 1, user_id: 1, title: "Buy milk", is_complete: true, due_date: null }],
        error: null,
    });
    taskApi.updateTask.mockImplementation(async (id, changes) => ({
        success: true,
        data: { task_id: 1, user_id: 1, title: "Buy milk", due_date: null, ...changes },
        error: null,
    }));
    renderTasks();

    const card = (await screen.findByText("Buy milk")).closest("div.group");
    fireEvent.click(within(card).getByRole("button", { name: "Mark as not done" }));

    await waitFor(() => expect(toasts().textContent).toContain('Moved "Buy milk" back to active'));
});

test("adding, saving and deleting each confirm with a toast", async () => {
    taskApi.createTask.mockImplementation(async (fields) => ({
        success: true,
        data: { task_id: 9, user_id: 1, is_complete: false, ...fields },
        error: null,
    }));
    echoUpdate();
    taskApi.deleteTask.mockResolvedValue({ success: true, data: null, error: null });
    renderTasks();

    await screen.findByText("Buy milk");
    fireEvent.click(screen.getByRole("button", { name: "+ New Task" }));
    fireEvent.change(screen.getByPlaceholderText("Task title..."), { target: { value: "File taxes" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Task/ }));
    await waitFor(() => expect(toasts().textContent).toContain('Added "File taxes"'));

    const card = screen.getByText("Write report").closest("div.group");
    fireEvent.click(within(card).getByRole("button", { name: "Edit" }));
    fireEvent.change(await screen.findByPlaceholderText("Task title..."), { target: { value: "Write final report" } });
    fireEvent.click(screen.getByRole("button", { name: /Update Task/ }));
    await waitFor(() => expect(toasts().textContent).toContain('Saved "Write final report"'));

    const milk = screen.getByText("Buy milk").closest("div.group");
    fireEvent.click(within(milk).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(toasts().textContent).toContain('Deleted "Buy milk"'));
});

test("a failed action shows its inline error and no success toast", async () => {
    taskApi.updateTask.mockResolvedValue({ success: false, data: null, error: { message: "Not authenticated" } });
    renderTasks();

    const card = (await screen.findByText("Buy milk")).closest("div.group");
    fireEvent.click(within(card).getByRole("button", { name: "Mark complete" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(toasts().textContent).toBe("");
});

test("a very long title is shortened in the toast", async () => {
    const long = "A".repeat(120);
    taskApi.getTasks.mockResolvedValue({
        success: true,
        data: [{ task_id: 1, user_id: 1, title: long, is_complete: false, due_date: null }],
        error: null,
    });
    taskApi.deleteTask.mockResolvedValue({ success: true, data: null, error: null });
    renderTasks();

    const card = (await screen.findByText(long)).closest("div.group");
    fireEvent.click(within(card).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(toasts().textContent).toMatch(/^Deleted "A{60}…"/));
});
