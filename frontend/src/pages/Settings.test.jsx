// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("../api/tasks", () => ({
    taskApi: { getTasks: vi.fn(async () => ({ success: true, data: [], error: null })) },
}));

import { AuthContext } from "../context/AuthContext";
import Settings from "./Settings";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const renderSettings = (logout = vi.fn()) => {
    render(
        <AuthContext.Provider value={{ user: { user_id: 1, username: "jordan" }, currentUser: { username: "jordan" }, signOut: logout, loading: false }}>
            <Settings />
        </AuthContext.Provider>
    );
    return logout;
};

test("only controls that work are shown: two preferences and Log Out", () => {
    renderSettings();

    expect(screen.getAllByRole("switch").map((s) => s.getAttribute("aria-label"))).toEqual(["Focus Mode", "Workflow insights"]);
    expect(screen.getAllByRole("button").map((b) => b.textContent.trim()).filter(Boolean)).toEqual(["Log Out"]);
    for (const gone of ["Edit Profile", "Security", "Appearance", "Notifications", "Desktop Layout"]) {
        expect(screen.queryByText(gone)).toBeNull();
    }
});

test("preference switches toggle and are saved in the browser", () => {
    renderSettings();
    const focus = screen.getByRole("switch", { name: "Focus Mode" });

    expect(focus.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(focus);
    expect(focus.getAttribute("aria-checked")).toBe("true");
    expect(JSON.parse(localStorage.getItem("quickSettings"))["Focus Mode"]).toBe(true);
});

test("Log Out calls sign-out", () => {
    const logout = renderSettings();
    fireEvent.click(screen.getByRole("button", { name: "Log Out" }));
    expect(logout).toHaveBeenCalled();
});
