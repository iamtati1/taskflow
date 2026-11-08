// @vitest-environment jsdom
// The sign-in page with the real AuthProvider and the auth API mocked:
// an error belongs to the attempt that caused it, not to what comes next.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "nobody" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong-pass-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
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
    await screen.findByLabelText("Username");
    await failSignIn();

    fireEvent.click(screen.getByRole("button", { name: "Create an account" }));

    await waitFor(() => expect(screen.queryByText("Invalid username or password")).toBeNull());
    await waitFor(() => expect(screen.queryByText("Authentication failed")).toBeNull());
});

test("editing the username or password clears the error", async () => {
    renderSignIn();
    await screen.findByLabelText("Username");

    await failSignIn();
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "somebody" } });
    await waitFor(() => expect(screen.queryByText("Invalid username or password")).toBeNull());

    await failSignIn();
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "another-try" } });
    await waitFor(() => expect(screen.queryByText("Invalid username or password")).toBeNull());
});

test("a failed sign-in still shows its error", async () => {
    renderSignIn();
    await screen.findByLabelText("Username");
    expect(await failSignIn()).toBeTruthy();
});

test("fields are labelled for password managers, and the password can be shown", async () => {
    renderSignIn();
    const username = await screen.findByLabelText("Username");
    const password = screen.getByLabelText("Password");
    expect(username.getAttribute("autocomplete")).toBe("username");
    expect(username.getAttribute("autocapitalize")).toBe("none");
    expect(password.getAttribute("autocomplete")).toBe("current-password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password.getAttribute("type")).toBe("text");
    expect(screen.getByRole("button", { name: "Hide password" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Create an account" }));
    expect(password.getAttribute("autocomplete")).toBe("new-password");
});

test("a failed sign-in is announced as an alert", async () => {
    renderSignIn();
    await screen.findByLabelText("Username");
    await failSignIn();
    expect(screen.getByRole("alert").textContent).toContain("Invalid username or password");
});
