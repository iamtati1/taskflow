import {
    createContext,
    useContext,
    useState,
    useCallback,
} from "react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    // =========================
    // ADD TOAST
    // =========================
    const addNotification = useCallback((message, type = "info") => {
        const id = crypto?.randomUUID?.() ?? Date.now();

        const newNotification = {
            id,
            message,
            type, // success | error | info | warning
        };

        setNotifications((prev) => [...prev, newNotification]);

        // auto remove after 4s
        setTimeout(() => {
            setNotifications((prev) =>
                prev.filter((n) => n.id !== id)
            );
        }, 4000);
    }, []);

    // =========================
    // REMOVE
    // =========================
    const removeNotification = (id) => {
        setNotifications((prev) =>
            prev.filter((n) => n.id !== id)
        );
    };

    // =========================
    // CLEAR ALL
    // =========================
    const clearAll = () => setNotifications([]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                addNotification,
                removeNotification,
                clearAll,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

// =========================
// HOOK
// =========================
export function useNotifications() {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error(
            "useNotifications must be used within NotificationProvider"
        );
    }

    return context;
}