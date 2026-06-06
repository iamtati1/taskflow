import { createContext, useEffect, useState } from "react";

import { getMe, login, register, logout } from "../api/auth";

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

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                isLoading,
                authReady,
                error,

                login: handleLogin,
                register: handleRegister,
                logout: handleLogout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}