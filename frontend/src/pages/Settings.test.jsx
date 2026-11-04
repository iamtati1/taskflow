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

test("Settings shows the theme picker, the two working preferences and Log Out; no-op toggles stay gone", () => {
    renderSettings();

    expect(screen.getAllByRole("switch").map((s) => s.getAttribute("aria-label"))).toEqual(["Focus Mode", "Workflow insights"]);
    expect(screen.getAllByRole("radio").map((r) => r.textContent.trim())).toEqual(["Midnight", "Violet", "Emerald", "Sunset"]);
    expect(screen.getByRole("button", { name: "Log Out" })).toBeTruthy();
    for (const gone of ["Notifications", "Desktop Layout", "AI Preferences"]) {
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

test("choosing a theme applies it to the whole page and saves it", () => {
    renderSettings();
    const violet = screen.getByRole("radio", { name: "Violet" });

    fireEvent.click(violet);

    expect(violet.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "Midnight" }).getAttribute("aria-checked")).toBe("false");
    expect(document.documentElement.getAttribute("data-theme")).toBe("violet");
    expect(localStorage.getItem("theme")).toBe("violet");
});
