import { createContext, useEffect, useState } from "react";

import { getMe, login, register, logout, updateProfile, changePassword } from "../api/auth";
import { SESSION_ENDED_EVENT } from "../api/config";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authReady, setAuthReady] = useState(false);
    const [error, setError] = useState(null);

    // ================================
    // NORMALIZE USER
    // ================================
    const normalizeUser = (data) => data?.user ?? data ?? null;

    // ================================
    // LOGIN
    // ================================
    const handleLogin = async (username, password) => {
        setError(null);

        const { data, error } = await login(username, password);

        if (error) {
            setError(error.message || "Login failed");
            return false;
        }

        const user = normalizeUser(data);
        setCurrentUser(user);

        return true;
    };

    // ================================
    // REGISTER
    // ================================
    const handleRegister = async (username, password) => {
        setError(null);

        const { data, error } = await register(username, password);

        if (error) {
            setError(error.message || "Registration failed");
            return false;
        }

        const user = normalizeUser(data);
        setCurrentUser(user);

        return true;
    };

    // ================================
    // LOGOUT
    // ================================
    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            setCurrentUser(null);
        }
    };

    // ================================
    // SESSION CHECK (CRITICAL FIX)
    // ================================
    useEffect(() => {
        const checkSession = async () => {
            setIsLoading(true);

            try {
                const { data, error } = await getMe();
                if (error) {
                    setCurrentUser(null);
                } else {
                    setCurrentUser(normalizeUser(data));
                }
            } catch (err) {
                console.error("Session check failed:", err);
                setCurrentUser(null);
            } finally {
                setIsLoading(false);
                setAuthReady(true);
            }
        };

        checkSession();
    }, []);

    // ================================
    // SESSION ENDED WHILE IN USE
    // ================================
    // A task request came back 401 (e.g. the session expired in an open tab):
    // drop the user so ProtectedRoute shows sign-in, and say why
    useEffect(() => {
        const handleSessionEnded = () => {
            setCurrentUser(null);
            setError("Your session has ended. Please sign in again.");
        };
        window.addEventListener(SESSION_ENDED_EVENT, handleSessionEnded);
        return () => window.removeEventListener(SESSION_ENDED_EVENT, handleSessionEnded);
    }, []);

    // ================================
    // ACCOUNT CHANGES
    // ================================
    const handleUpdateUsername = async (username) => {
        const { data, error } = await updateProfile(username);
        if (error) return { success: false, error: error.message };

        // Every screen showing the name (Topbar, Settings) updates at once
        setCurrentUser(normalizeUser(data));
        return { success: true };
    };

    const handleChangePassword = async (currentPassword, newPassword) => {
        const { error } = await changePassword(currentPassword, newPassword);
        return error ? { success: false, error: error.message } : { success: true };
    };

    return (
        <AuthContext.Provider
            value={{
                user: currentUser,
                currentUser, // name used by Topbar and Settings
                loading: isLoading,
                authReady,
                error,

                signIn: handleLogin,
                signOut: handleLogout,
                logout: handleLogout,
                register: handleRegister,
                updateUsername: handleUpdateUsername,
                changePassword: handleChangePassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}