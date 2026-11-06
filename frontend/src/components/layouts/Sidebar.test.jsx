// @vitest-environment jsdom
// Log Out in the sidebar, with the real AuthProvider and ProtectedRoute and
// the auth API mocked: signed in -> click Log Out -> back on the sign-in page.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../../api/auth", () => ({
    getMe: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
}));

import { getMe, logout } from "../../api/auth";
import { AuthProvider } from "../../context/AuthContext";
import ProtectedRoute from "../../routes/ProtectedRoute";
import Sidebar from "./Sidebar";

const renderSignedIn = () =>
    render(
        <AuthProvider>
            <MemoryRouter initialEntries={["/dashboard"]}>
                <Routes>
                    <Route path="/auth" element={<h1>Sign in page</h1>} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Sidebar />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        </AuthProvider>
    );

beforeEach(() => {
    getMe.mockResolvedValue({ data: { user: { id: 7, username: "tati" } }, error: null });
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

test("the sidebar shows who is signed in", async () => {
    renderSignedIn();

    expect(await screen.findByText("tati")).toBeTruthy();
    expect(screen.getByText("Signed in as")).toBeTruthy();
});

test("Log Out calls the logout endpoint once and lands on the sign-in page", async () => {
    logout.mockResolvedValue({ data: null, error: null });
    renderSignedIn();

    fireEvent.click(await screen.findByRole("button", { name: "Log Out" }));

    expect(await screen.findByRole("heading", { name: "Sign in page" })).toBeTruthy();
    expect(logout).toHaveBeenCalledTimes(1);
});

test("a second click while logging out doesn't send another request", async () => {
    let finish;
    logout.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    renderSignedIn();

    const button = await screen.findByRole("button", { name: "Log Out" });
    fireEvent.click(button);
    fireEvent.click(screen.getByRole("button", { name: /Logging out/ }));

    expect(logout).toHaveBeenCalledTimes(1);
    finish({ data: null, error: null });
    expect(await screen.findByRole("heading", { name: "Sign in page" })).toBeTruthy();
});

test("if the logout request fails, the user is still signed out locally", async () => {
    logout.mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderSignedIn();

    fireEvent.click(await screen.findByRole("button", { name: "Log Out" }));

    expect(await screen.findByRole("heading", { name: "Sign in page" })).toBeTruthy();
});
