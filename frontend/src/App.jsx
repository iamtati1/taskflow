import { useState, useEffect } from "react";
import { getMe, logout } from "./adapters/auth-adapters";

import AuthPage from "./components/AuthPage";
import TaskPage from "./components/TaskPage";
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleRegister = (user) => {
    setCurrentUser(user);
  };

  // 🔐 SESSION REHYDRATION
  useEffect(() => {
    const checkForSession = async () => {
      try {
        const { data, error } = await getMe();

        console.log("GET ME RAW RESPONSE:", data);

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

  // 🚪 LOGOUT
  const handleLogout = async () => {
    const { error } = await logout();

    if (error) {
      setError("Logout failed");
      return;
    }

    setCurrentUser(null);
  };

  // ⏳ LOADING STATE (rubric requirement)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading session...</p>
      </div>
    );
  }


  return (
    <div className="relative min-h-screen text-white overflow-hidden">

      {/* 🌌 FLOW BACKGROUND */}
      <div className="absolute inset-0 bg-drift">
        <div className="bg-glow w-[400px] h-[400px] bg-cyan-500 top-[-120px] left-[-120px]" />
        <div className="bg-glow w-[500px] h-[500px] bg-violet-500 bottom-[-150px] right-[-150px]" />
      </div>

      {/* 🧠 MAIN CONTENT */}
      <div className="relative z-10 container-flow">

        <h1 className="heading-flow text-center mb-6">
          Flow Todo System
        </h1>

        {error && (
          <p className="text-red-400 text-center mb-4">
            {error}
          </p>
        )}

        {currentUser ? (
          <TaskPage
            currentUser={currentUser}
            handleLogout={handleLogout}
          />
        ) : (
          <AuthPage
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        )}

      </div>
    </div>
  );
}
export default App;
