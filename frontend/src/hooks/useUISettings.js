import { useState, useEffect, useCallback } from "react";

// =====================================================
// DEFAULTS (stable constants)
// =====================================================
const DEFAULT_AI_SETTINGS = {
    "Smart task prioritization": true,
    "AI workflow suggestions": true,
    "Focus session recommendations": true,
    "Productivity insights": true,
};

const DEFAULT_QUICK_SETTINGS = {
    Notifications: true,
    "Focus Mode": false,
    "Desktop Layout": true,
};

// =====================================================
// GLOBAL SINGLETON STORE
// =====================================================
let globalState = {
    theme: localStorage.getItem("theme") || "midnight",
    aiSettings: JSON.parse(localStorage.getItem("aiSettings")) || DEFAULT_AI_SETTINGS,
    quickSettings: JSON.parse(localStorage.getItem("quickSettings")) || DEFAULT_QUICK_SETTINGS,
};

const listeners = new Set();

function emitChange() {
    for (const listener of listeners) {
        listener(globalState);
    }
}

function setGlobalState(updater) {
    globalState =
        typeof updater === "function"
            ? updater(globalState)
            : { ...globalState, ...updater };

    emitChange();
}

// =====================================================
// HOOK
// =====================================================
export function useUISettings() {
    const [state, setState] = useState(globalState);

    // =====================================================
    // SUBSCRIBE TO GLOBAL CHANGES
    // =====================================================
    useEffect(() => {
        const listener = (newState) => {
            setState(newState);
        };

        listeners.add(listener);

        return () => {
            listeners.delete(listener);
        };
    }, []);

    // =====================================================
    // SIDE EFFECTS (SYNC DOM + STORAGE)
    // =====================================================
    useEffect(() => {
        localStorage.setItem("theme", state.theme);
        document.documentElement.setAttribute("data-theme", state.theme);
    }, [state.theme]);

    useEffect(() => {
        localStorage.setItem("aiSettings", JSON.stringify(state.aiSettings));
    }, [state.aiSettings]);

    useEffect(() => {
        localStorage.setItem("quickSettings", JSON.stringify(state.quickSettings));

        if (state.quickSettings["Focus Mode"]) {
            document.body.classList.add("focus-mode");
        } else {
            document.body.classList.remove("focus-mode");
        }
    }, [state.quickSettings]);

    // =====================================================
    // ACTIONS
    // =====================================================
    const setTheme = useCallback((theme) => {
        setGlobalState((prev) => ({
            ...prev,
            theme,
        }));
    }, []);

    const toggleAI = useCallback((key) => {
        setGlobalState((prev) => ({
            ...prev,
            aiSettings: {
                ...prev.aiSettings,
                [key]: !prev.aiSettings[key],
            },
        }));
    }, []);

    const toggleQuick = useCallback((key) => {
        setGlobalState((prev) => ({
            ...prev,
            quickSettings: {
                ...prev.quickSettings,
                [key]: !prev.quickSettings[key],
            },
        }));
    }, []);

    // =====================================================
    // RETURN API (unchanged for your app)
    // =====================================================
    return {
        theme: state.theme,
        setTheme,

        aiSettings: state.aiSettings,
        toggleAI,

        quickSettings: state.quickSettings,
        toggleQuick,
    };
}

export default useUISettings;