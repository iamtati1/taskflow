import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

import "./styles/globals.css";

// Apply the saved theme before the first paint (including the sign-in page),
// so the colours don't flash from the default
try {
  document.documentElement.setAttribute("data-theme", localStorage.getItem("theme") || "midnight");
} catch {
  // Storage can be unavailable (e.g. private mode); the default theme applies
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>


);
