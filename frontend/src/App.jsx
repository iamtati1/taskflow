import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./components/layouts/AppLayout";

import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Analytics from "./pages/Analytics";
import AI from "./pages/AI";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";

import ProtectedRoute from "./routes/ProtectedRoute";

// =====================================================
// THEME SYSTEM (DOM-driven, no context needed)
// =====================================================

const THEMES = ["glass", "midnight", "aurora"];

function applyTheme(theme) {
  const root = document.documentElement;

  THEMES.forEach(t => root.classList.remove(`theme-${t}`));
  root.classList.add(`theme-${theme}`);

  localStorage.setItem("app-theme", theme);
}

function initTheme() {
  const savedTheme = localStorage.getItem("app-theme") || "glass";
  applyTheme(savedTheme);
}

// optional global access for Settings UI
function setTheme(theme) {
  applyTheme(theme);
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "app-theme",
      newValue: theme,
    })
  );
}

window.__setTheme = setTheme;

// =====================================================
// APP
// =====================================================

function App() {
  useEffect(() => {
    initTheme();
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
           PUBLIC ROUTES
        ===================================================== */}
        <Route path="/auth" element={<Auth />} />

        {/* redirect root → tasks */}
        <Route path="/" element={<Navigate to="/tasks" replace />} />

        {/* =====================================================
           PROTECTED APP SHELL
        ===================================================== */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai" element={<AI />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* =====================================================
           FALLBACK ROUTE
        ===================================================== */}
        <Route path="*" element={<Navigate to="/auth" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;