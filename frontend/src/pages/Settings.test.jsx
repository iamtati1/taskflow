// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("../api/tasks", () => ({
    taskApi: { getTasks: vi.fn(async () => ({ success: true, data: [], error: null })) },
}));

import { AuthContext } from "../context/AuthContext";
import Settings from "./Settings";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const renderSettings = (logout = vi.fn(), account = {}) => {
    const updateUsername = account.updateUsername || vi.fn(async () => ({ success: true }));
    const changePassword = account.changePassword || vi.fn(async () => ({ success: true }));
    render(
        <AuthContext.Provider value={{ user: { user_id: 1, username: "jordan" }, currentUser: { username: "jordan" }, signOut: logout, loading: false, updateUsername, changePassword }}>
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

// ---------- Account forms ----------

test("Edit Profile opens prefilled, saves the trimmed name, and confirms", async () => {
    const updateUsername = vi.fn(async () => ({ success: true }));
    renderSettings(vi.fn(), { updateUsername });

    fireEvent.click(screen.getByRole("button", { name: "Edit Profile" }));
    const input = screen.getByLabelText("Username");
    expect(input.value).toBe("jordan");

    fireEvent.change(input, { target: { value: "  jordan.lee " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateUsername).toHaveBeenCalledWith("jordan.lee"));
    expect((await screen.findByRole("status")).textContent).toBe("Username updated.");
    expect(screen.queryByLabelText("Username")).toBeNull();
});

test("Edit Profile shows the server's error and stays open", async () => {
    const updateUsername = vi.fn(async () => ({ success: false, error: "Username already taken." }));
    renderSettings(vi.fn(), { updateUsername });

    fireEvent.click(screen.getByRole("button", { name: "Edit Profile" }));
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "taken" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Username already taken.");
    expect(screen.getByLabelText("Username").value).toBe("taken");
});

test("Change Password checks the confirmation before sending anything", async () => {
    const changePassword = vi.fn(async () => ({ success: true }));
    renderSettings(vi.fn(), { changePassword });

    fireEvent.click(screen.getByRole("button", { name: "Change Password" }));
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "old-password-1" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "new-password-2" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "different" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect((await screen.findByRole("alert")).textContent).toBe("The new passwords don't match.");
    expect(changePassword).not.toHaveBeenCalled();
});

test("Change Password sends current and new password, then confirms", async () => {
    const changePassword = vi.fn(async () => ({ success: true }));
    renderSettings(vi.fn(), { changePassword });

    fireEvent.click(screen.getByRole("button", { name: "Change Password" }));
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "old-password-1" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "new-password-2" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "new-password-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => expect(changePassword).toHaveBeenCalledWith("old-password-1", "new-password-2"));
    expect((await screen.findByRole("status")).textContent).toBe("Password updated.");
});

test("Change Password shows a wrong-current-password error from the server", async () => {
    const changePassword = vi.fn(async () => ({ success: false, error: "Your current password is incorrect." }));
    renderSettings(vi.fn(), { changePassword });

    fireEvent.click(screen.getByRole("button", { name: "Change Password" }));
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "nope" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "new-password-2" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "new-password-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Your current password is incorrect.");
});
