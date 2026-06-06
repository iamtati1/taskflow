import { useContext, useMemo, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used within an AuthProvider"
        );
    }

    const {
        user,
        session,
        loading,
        signIn,
        signOut,
        refreshSession,
        ...rest
    } = context;

    // =====================================================
    // NORMALIZED USER (prevents UI crashes)
    // =====================================================
    const safeUser = useMemo(() => {
        if (!user) return null;

        return {
            id: user.id || user.user_id || null,
            email: user.email || "",
            name: user.name || user.username || "User",
            role: user.role || "user",
        };
    }, [user]);

    // =====================================================
    // AUTH STATE HELPERS
    // =====================================================
    const isAuthenticated = useMemo(
        () => !!safeUser?.id,
        [safeUser]
    );

    const isGuest = useMemo(
        () => !loading && !safeUser?.id,
        [loading, safeUser]
    );

    const isReady = useMemo(
        () => !loading,
        [loading]
    );

    // =====================================================
    // ROLE HELPERS (future-proofing)
    // =====================================================
    const hasRole = useCallback(
        (role) => safeUser?.role === role,
        [safeUser]
    );

    const isAdmin = useMemo(
        () => safeUser?.role === "admin",
        [safeUser]
    );

    // =====================================================
    // SAFE ACTION WRAPPERS
    // =====================================================
    const handleSignOut = useCallback(async () => {
        try {
            await signOut?.();
        } catch (err) {
            console.error("Sign out failed:", err);
        }
    }, [signOut]);

    const handleRefresh = useCallback(async () => {
        try {
            await refreshSession?.();
        } catch (err) {
            console.error("Session refresh failed:", err);
        }
    }, [refreshSession]);

    // =====================================================
    // FINAL API SURFACE
    // =====================================================
    return {
        // raw (still available if needed)
        ...rest,

        // original context
        user: safeUser,
        session,

        // state
        loading,
        isReady,
        isAuthenticated,
        isGuest,

        // actions
        signIn,
        signOut: handleSignOut,
        refreshSession: handleRefresh,

        // helpers
        hasRole,
        isAdmin,
    };
}