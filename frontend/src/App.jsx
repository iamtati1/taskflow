import { useState, useEffect } from "react";
import { getMe, logout, login, register } from "./adapters/auth-adapters";

import AuthPage from "./components/AuthPage";
import TaskPage from "./components/TaskPage";

import "./App.css";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // =========================
  // AUTH
  // =========================
  const handleLogin = async (username, password) => {
    const { data, error } = await login(username, password);
    if (error) return error;
    setCurrentUser(data);
  };

  const handleRegister = async (username, password) => {
    const { data, error } = await register(username, password);
    if (error) return error;
    setCurrentUser(data);
  };

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) return setError("Logout failed");
    setCurrentUser(null);
  };

  // =========================
  // SESSION
  // =========================
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await getMe();
        setCurrentUser(data?.user || data || null);
      } catch {
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // =========================
  // LOADING
  // =========================
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="flow-card px-8 py-6">
          <p className="text-body">Loading TaskFlow...</p>
        </div>
      </div>
    );
  }

  // =========================
  // APP
  // =========================
  return (
    <div className="relative min-h-screen overflow-hidden text-white">

      {/* GLOBAL BACKGROUND ONLY */}
      <div className="absolute inset-0 bg-drift pointer-events-none">
        <div className="bg-glow w-[420px] h-[420px] bg-cyan-500 top-[-140px] left-[-140px]" />
        <div className="bg-glow w-[520px] h-[520px] bg-violet-500 bottom-[-180px] right-[-180px]" />
      </div>

      <main className="relative z-10 container-flow space-y-10">

        {/* =========================
            APP BRAND HEADER (ONLY ONCE)
        ========================= */}
        <section className="text-center space-y-4">
          <h1 className="text-hero heading-flow text-glow">
            TaskFlow
          </h1>

          <p className="text-body max-w-2xl mx-auto">
            A focused system for executing tasks, tracking progress, and building momentum.
          </p>
        </section>

        {/* ERROR */}
        {error && (
          <div className="flow-card border border-red-500/20 text-red-300 p-4 text-center">
            {error}
          </div>
        )}

        {/* ROUTING */}
        {currentUser ? (
          <TaskPage
            currentUser={currentUser}
            handleLogout={handleLogout}
          />
        ) : (
          <AuthPage
            handleLogin={handleLogin}
            handleRegister={handleRegister}
          />
        )}

      </main>
    </div>
  );
}

export default App;