// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useContext } from "react";

vi.mock("../api/auth", () => ({
    getMe: vi.fn(async () => ({ data: { user: { user_id: 1, username: "jordan" } }, error: null })),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(async (username) => ({ data: { user: { user_id: 1, username } }, error: null })),
    changePassword: vi.fn(async () => ({ data: { message: "Password updated." }, error: null })),
}));

import { updateProfile } from "../api/auth";
import { AuthContext, AuthProvider } from "./AuthContext";

afterEach(cleanup);

function Probe() {
    const { currentUser, updateUsername } = useContext(AuthContext);
    return (
        <>
            <p>name: {currentUser?.username ?? "-"}</p>
            <button onClick={() => updateUsername("jordan.lee")}>rename</button>
        </>
    );
}

test("renaming updates the signed-in user everywhere, without reloading", async () => {
    render(
        <AuthProvider>
            <Probe />
        </AuthProvider>
    );
    expect(await screen.findByText("name: jordan")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "rename" }));

    expect(await screen.findByText("name: jordan.lee")).toBeTruthy();
    expect(updateProfile).toHaveBeenCalledWith("jordan.lee");
});

test("a failed rename keeps the current name and reports the error", async () => {
    updateProfile.mockResolvedValueOnce({ data: null, error: { message: "Username already taken." } });
    let result;
    function Rename() {
        const { currentUser, updateUsername } = useContext(AuthContext);
        return (
            <>
                <p>name: {currentUser?.username ?? "-"}</p>
                <button onClick={async () => { result = await updateUsername("taken"); }}>rename</button>
            </>
        );
    }
    render(
        <AuthProvider>
            <Rename />
        </AuthProvider>
    );
    await screen.findByText("name: jordan");
    fireEvent.click(screen.getByRole("button", { name: "rename" }));

    await vi.waitFor(() => expect(result).toEqual({ success: false, error: "Username already taken." }));
    expect(screen.getByText("name: jordan")).toBeTruthy();
});
