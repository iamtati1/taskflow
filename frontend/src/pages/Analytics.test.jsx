// @vitest-environment jsdom
// The Analytics page shows loading and failures as such, never as an empty workspace
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../api/tasks", () => ({
    taskApi: { getTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), deleteTask: vi.fn() },
}));

import { taskApi } from "../api/tasks";
import Analytics from "./Analytics";

const renderPage = () =>
    render(
        <MemoryRouter>
            <Analytics />
        </MemoryRouter>
    );

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

test("while tasks load it says so, without showing zeros as if they were real", () => {
    taskApi.getTasks.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByText("Loading tasks...")).toBeTruthy();
    expect(screen.queryByText("0%")).toBeNull();
});

test("a failed load explains the problem and can be retried", async () => {
    taskApi.getTasks
        .mockResolvedValueOnce({ success: false, data: null, error: { message: "Network error" } })
        .mockResolvedValueOnce({
            success: true,
            data: [
                { task_id: 2, user_id: 1, title: "Done thing", is_complete: true, due_date: null },
                { task_id: 1, user_id: 1, title: "Open thing", is_complete: false, due_date: null },
            ],
            error: null,
        });
    renderPage();

    expect((await screen.findByRole("alert")).textContent).toMatch(/Couldn't load your tasks: Network error/);
    expect(screen.queryByText("0%")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect((await screen.findAllByText("50%")).length).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).toBeNull();
});
