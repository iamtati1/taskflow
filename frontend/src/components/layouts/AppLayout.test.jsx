// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../../api/auth", () => ({
    getMe: vi.fn(async () => ({ data: { user: { user_id: 1, username: "tati" } }, error: null })),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
}));

import { AuthProvider } from "../../context/AuthContext";
import { NotificationProvider } from "../../context/NotificationContext";
import AppLayout from "./AppLayout";

const renderAt = (path) =>
    render(
        <AuthProvider>
            <NotificationProvider>
                <MemoryRouter initialEntries={[path]}>
                    <Routes>
                        <Route element={<AppLayout />}>
                            <Route path="/tasks" element={<h1>Tasks heading</h1>} />
                            <Route path="/analytics" element={<h1>Analytics heading</h1>} />
                        </Route>
                    </Routes>
                </MemoryRouter>
            </NotificationProvider>
        </AuthProvider>
    );

afterEach(cleanup);

test("the browser tab names the current page", async () => {
    renderAt("/analytics");
    await screen.findByText("Analytics heading");
    expect(document.title).toBe("Analytics · TaskFlow");
});

test("a skip link leads keyboard users straight to the page content", async () => {
    renderAt("/tasks");
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip.getAttribute("href")).toBe("#main");
    expect(document.getElementById("main").tagName).toBe("MAIN");
});

test("the page's own heading is the only top-level heading (the bar doesn't repeat it)", async () => {
    renderAt("/tasks");
    await screen.findByText("Tasks heading");
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toEqual(["Tasks heading"]);
});

test("navigating changes page, and the current page is marked in the navigation", async () => {
    renderAt("/tasks");
    await screen.findByText("Tasks heading");
    const [analyticsLink] = screen.getAllByRole("link", { name: "Analytics" });
    fireEvent.click(analyticsLink);

    expect(await screen.findByText("Analytics heading")).toBeTruthy();
    for (const link of screen.getAllByRole("link", { name: "Analytics" })) {
        expect(link.getAttribute("aria-current")).toBe("page");
    }
});
