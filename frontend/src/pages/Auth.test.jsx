// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import Auth from "./Auth";

afterEach(cleanup);

const renderAt = (authValue) =>
    render(
        <AuthContext.Provider value={authValue}>
            <MemoryRouter initialEntries={["/auth"]}>
                <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/tasks" element={<p>Tasks page</p>} />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );

const base = { signIn: async () => false, register: async () => false, error: null, loading: false };

test("a signed-in user who opens /auth is sent to their tasks", () => {
    renderAt({ ...base, user: { user_id: 3, username: "jordan" } });
    expect(screen.getByText("Tasks page")).toBeTruthy();
});

test("a signed-out visitor sees the sign-in form", () => {
    renderAt({ ...base, user: null });
    expect(screen.getByLabelText("Username")).toBeTruthy();
    expect(screen.queryByText("Tasks page")).toBeNull();
});
