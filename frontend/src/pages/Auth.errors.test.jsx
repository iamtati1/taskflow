// @vitest-environment jsdom
// The sign-in page with the real AuthProvider and the auth API mocked:
// an error belongs to the attempt that caused it, not to what comes next.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../api/auth", () => ({
    getMe: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
}));

import { getMe, login } from "../api/auth";
import { AuthProvider } from "../context/AuthContext";
import Auth from "./Auth";

const renderSignIn = () =>
    render(
        <AuthProvider>
            <MemoryRouter initialEntries={["/auth"]}>
                <Routes>
                    <Route path="/auth" element={<Auth />} />
                </Routes>
            </MemoryRouter>
        </AuthProvider>
    );

const failSignIn = async () => {
    fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "nobody" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "wrong-pass-1" } });
    fireEvent.click(screen.getByRole("button", { name: /Enter Workspace/ }));
    return screen.findByText("Invalid username or password");
};

beforeEach(() => {
    getMe.mockResolvedValue({ data: null, error: { message: "Not authenticated" } });
    login.mockResolvedValue({ data: null, error: { message: "Invalid username or password" } });
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

test("switching to Register clears a failed sign-in's error", async () => {
    renderSignIn();
    await screen.findByPlaceholderText("Username");
    await failSignIn();

    fireEvent.click(screen.getByRole("button", { name: "Need an account? Register" }));

    expect(screen.queryByText("Invalid username or password")).toBeNull();
    expect(screen.queryByText("Authentication failed")).toBeNull();
});

test("editing the username or password clears the error", async () => {
    renderSignIn();
    await screen.findByPlaceholderText("Username");

    await failSignIn();
    fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "somebody" } });
    expect(screen.queryByText("Invalid username or password")).toBeNull();

    await failSignIn();
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "another-try" } });
    expect(screen.queryByText("Invalid username or password")).toBeNull();
});

test("a failed sign-in still shows its error", async () => {
    renderSignIn();
    await screen.findByPlaceholderText("Username");
    expect(await failSignIn()).toBeTruthy();
});
