import { useState, useEffect } from "react";

import {
  getMe,
  logout,
  login,
  register
} from "./adapters/auth-adapters";

import AuthPage from "./components/AuthPage";
import TaskPage from "./components/TaskPage";

import "./App.css";

function App() {

  const [currentUser, setCurrentUser] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState(null);

  // =========================================================
  // 🔐 LOGIN
  // =========================================================

  const handleLogin = async (username, password) => {

    const { data, error } = await login(username, password);

    if (error) return error;

    setCurrentUser(data);

    return null;
  };

  // =========================================================
  // 📝 REGISTER
  // =========================================================

  const handleRegister = async (username, password) => {

    const { data, error } = await register(username, password);

    if (error) return error;

    setCurrentUser(data);

    return null;
  };

  // =========================================================
  // 🔄 SESSION REHYDRATION
  // =========================================================

  useEffect(() => {

    const checkForSession = async () => {

      try {

        const { data, error } = await getMe();

        if (error) {
          setCurrentUser(null);
        } else {
          setCurrentUser(data?.user || data || null);
        }

      } catch (err) {

        console.error("Session error:", err);

        setCurrentUser(null);

      } finally {

        setIsLoading(false);
      }
    };

    checkForSession();

  }, []);

  // =========================================================
  // 🚪 LOGOUT
  // =========================================================

  const handleLogout = async () => {

    const { error } = await logout();

    if (error) {

      setError("Logout failed");

      return;
    }

    setCurrentUser(null);
  };

  // =========================================================
  // ⏳ LOADING
  // =========================================================

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">

        <div className="flow-card px-8 py-6 fade-in">

          <p className="text-body">
            Loading session...
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // 🎨 UI
  // =========================================================

  return (

    <div className="relative min-h-screen overflow-hidden text-white">

      {/* =====================================================
          🌌 BACKGROUND GLOWS
      ====================================================== */}

      <div className="absolute inset-0 bg-drift pointer-events-none">

        <div
          className="
            bg-glow
            w-[420px]
            h-[420px]
            bg-cyan-500
            top-[-140px]
            left-[-140px]
          "
        />

        <div
          className="
            bg-glow
            w-[520px]
            h-[520px]
            bg-violet-500
            bottom-[-180px]
            right-[-180px]
          "
        />

      </div>

      {/* =====================================================
          🧠 MAIN CONTENT
      ====================================================== */}

      <main className="relative z-10 container-flow">

        {/* =================================================
            🚀 HERO SECTION
        ================================================== */}

        <section className="text-center mb-14 fade-in">

          <div
            className="
              inline-flex
              items-center
              gap-2
              px-4
              py-2
              rounded-full
              border
              border-cyan-400/20
              bg-cyan-400/10
              text-cyan-300
              text-sm
              backdrop-blur-md
              mb-6
            "
          >
            Productivity Reimagined
          </div>

          <h1 className="text-hero heading-flow text-glow">
            Flow Todo System
          </h1>

          <p className="max-w-2xl mx-auto mt-5 text-body">
            Organize tasks, maintain focus, and build momentum with a
            distraction-free workflow experience designed for deep work.
          </p>

        </section>

        {/* =================================================
            ❌ ERROR STATE
        ================================================== */}

        {error && (

          <div className="max-w-md mx-auto mb-6">

            <div
              className="
                flow-card
                px-5
                py-4
                border
                border-red-500/20
                bg-red-500/10
              "
            >
              <p className="text-red-300 text-sm text-center">
                {error}
              </p>
            </div>

          </div>
        )}

        {/* =================================================
            🔐 AUTH / TASK PAGE
        ================================================== */}

        <section className="fade-in">

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

        </section>

      </main>
    </div>
  );
}

export default App;