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
    fireEvent.click(within(milk).getByRole("button", { name: "Yes, delete" }));
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
    fireEvent.click(within(card).getByRole("button", { name: "Yes, delete" }));

    await waitFor(() => expect(toasts().textContent).toMatch(/^Deleted "A{60}…"/));
});

// ---------- Task list: reordering, saving lock, clicking a card ----------

// A drag carries data between dragstart and drop, like the browser's DataTransfer
const dragData = () => {
    const store = {};
    return {
        setData: (type, value) => { store[type] = value; },
        getData: (type) => store[type] ?? "",
    };
};
const cardFor = (title) => screen.getByText(title).closest("[draggable='true']");
const titlesIn = (heading) =>
    within(screen.getByRole("heading", { name: heading }).closest("section"))
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent)
        .filter((text) => text !== heading); // the section's own title

test("dragging an active task above another moves that task, even with a completed task between them", async () => {
    taskApi.getTasks.mockResolvedValue({
        success: true,
        data: [
            { task_id: 3, user_id: 1, title: "Charlie", is_complete: false, due_date: null },
            { task_id: 2, user_id: 1, title: "Bravo", is_complete: true, due_date: null },
            { task_id: 1, user_id: 1, title: "Alpha", is_complete: false, due_date: null },
        ],
        error: null,
    });
    renderTasks();
    await screen.findByText("Alpha");
    expect(titlesIn("Active")).toEqual(["Charlie", "Alpha"]);

    const data = dragData();
    fireEvent.pointerDown(screen.getByText("Alpha"));
    fireEvent.dragStart(cardFor("Alpha"), { dataTransfer: data });
    fireEvent.drop(cardFor("Charlie"), { dataTransfer: data });

    expect(titlesIn("Active")).toEqual(["Alpha", "Charlie"]);
    expect(titlesIn("Completed")).toEqual(["Bravo"]);
});

test("dropping something that isn't a task (e.g. text from another app) changes nothing", async () => {
    renderTasks();
    await screen.findByText("Buy milk");

    fireEvent.drop(cardFor("Write report"), { dataTransfer: { getData: () => "just some text" } });

    expect(titlesIn("Active")).toEqual(["Write report", "Buy milk"]);
});

test("while a completion is saving, the checkbox is locked and a second click sends nothing", async () => {
    let finish;
    taskApi.updateTask.mockImplementation(
        (id, changes) => new Promise((resolve) => {
            finish = () => resolve({ success: true, data: { ...serverTasks().find((t) => t.task_id === id), ...changes }, error: null });
        })
    );
    renderTasks();
    const card = (await screen.findByText("Buy milk")).closest("div.group");
    const box = within(card).getByRole("button", { name: "Mark complete" });

    fireEvent.click(box);
    fireEvent.click(box); // before React re-renders

    // The task moves to Completed at once; its new card is locked while saving
    const savingCard = () => screen.getByText("Buy milk").closest("div.group");
    await waitFor(() => expect(within(savingCard()).getAllByRole("button")[0].disabled).toBe(true));
    expect(within(savingCard()).getByText("syncing")).toBeTruthy();
    fireEvent.click(within(savingCard()).getAllByRole("button")[0]);

    expect(taskApi.updateTask).toHaveBeenCalledTimes(1);
    finish();
    expect(await screen.findByRole("heading", { name: "Completed" })).toBeTruthy();
});

test("clicking a task card opens it in the editor", async () => {
    renderTasks();
    fireEvent.click(await screen.findByText("Write report"));

    expect(await screen.findByRole("heading", { name: "Edit Task" })).toBeTruthy();
    expect(screen.getByPlaceholderText("Task title...").value).toBe("Write report");
});

test("deleting the task that is open in the editor closes the editor", async () => {
    taskApi.deleteTask.mockResolvedValue({ success: true, data: null, error: null });
    renderTasks();
    const card = (await screen.findByText("Write report")).closest("div.group");
    fireEvent.click(within(card).getByRole("button", { name: "Edit" }));
    await screen.findByRole("heading", { name: "Edit Task" });

    fireEvent.click(within(card).getByRole("button", { name: "Delete" }));
    fireEvent.click(within(card).getByRole("button", { name: "Yes, delete" }));

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Edit Task" })).toBeNull());
    expect(screen.queryByText("Write report")).toBeNull();
});

// ---------- Task form: cancelling and empty titles ----------

test("Cancel closes the new-task form without saving and returns focus to New Task", async () => {
    renderTasks();
    await screen.findByText("Buy milk");
    fireEvent.click(screen.getByRole("button", { name: "+ New Task" }));
    fireEvent.change(screen.getByPlaceholderText("Task title..."), { target: { value: "Never mind" } });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("heading", { name: "Create Task" })).toBeNull();
    expect(taskApi.createTask).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "+ New Task" }));
});

test("Escape cancels an edit and leaves the task unchanged", async () => {
    renderTasks();
    const card = (await screen.findByText("Write report")).closest("div.group");
    fireEvent.click(within(card).getByRole("button", { name: "Edit" }));
    const input = await screen.findByPlaceholderText("Task title...");
    fireEvent.change(input, { target: { value: "Changed my mind" } });

    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByRole("heading", { name: "Edit Task" })).toBeNull();
    expect(taskApi.updateTask).not.toHaveBeenCalled();
    expect(screen.getByText("Write report")).toBeTruthy();
});

test("submitting without a title explains why, and typing clears the message", async () => {
    renderTasks();
    await screen.findByText("Buy milk");
    fireEvent.click(screen.getByRole("button", { name: "+ New Task" }));
    const input = screen.getByPlaceholderText("Task title...");
    fireEvent.change(input, { target: { value: "   " } });

    fireEvent.click(screen.getByRole("button", { name: /Add Task/ }));

    expect(screen.getByRole("alert").textContent).toBe("Enter a title for the task.");
    expect(taskApi.createTask).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "Real title" } });
    expect(screen.queryByRole("alert")).toBeNull();
});

// ---------- Loading ----------

test("while tasks load it says so, instead of showing an empty list", () => {
    taskApi.getTasks.mockReturnValue(new Promise(() => {})); // never answers
    renderTasks();

    expect(screen.getByText("Loading tasks...")).toBeTruthy();
    expect(screen.queryByText(/Nothing on your plate yet/)).toBeNull();
});
