import { useState } from "react";

function AuthForm({
  title,
  buttonText,
  onSubmit,
  isLoading,
  errorMessage,
  variant = "primary"
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(username, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <h2 className="text-2xl font-bold tracking-tight">
        {title}
      </h2>

      <div className="space-y-3">

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="input-flow"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input-flow"
        />

      </div>

      {errorMessage && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={`
          btn-flow w-full
          ${variant === "secondary" ? "opacity-90" : ""}
        `}
      >
        {isLoading ? "Loading..." : buttonText}
      </button>

    </form>
  );
}

function AuthPage({ handleLogin, handleRegister }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const submitLogin = async (username, password) => {
    setIsLoading(true);
    setError(null);

    const result = await handleLogin(username, password);

    if (result) {
      setError("Invalid username or password.");
    }

    setIsLoading(false);
  };

  const submitRegister = async (username, password) => {
    setIsLoading(true);
    setError(null);

    const result = await handleRegister(username, password);

    if (result) {
      setError("Could not register. Username may already be taken.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">

      <div className="w-full max-w-md glass-card p-8 space-y-6 hover-lift">

        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            TaskFlow
          </h1>

          <div className="w-12 h-px bg-cyan-400/40 mx-auto" />

          <p className="text-zinc-400 text-sm">
            Organize your goals. Build consistency.
          </p>
        </div>

        {/* FORM */}
        {isLoginMode ? (
          <AuthForm
            title="Log In"
            buttonText="Log In"
            onSubmit={submitLogin}
            isLoading={isLoading}
            errorMessage={error}
            variant="primary"
          />
        ) : (
          <AuthForm
            title="Create Account"
            buttonText="Register"
            onSubmit={submitRegister}
            isLoading={isLoading}
            errorMessage={error}
            variant="primary"
          />
        )}

        {/* TOGGLE */}
        <div className="text-center pt-2 border-t border-white/10">
          <button
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-sm text-cyan-300 hover:text-cyan-200 transition"
          >
            {isLoginMode
              ? "Need an account? Register"
              : "Already have an account? Log in"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default AuthPage;