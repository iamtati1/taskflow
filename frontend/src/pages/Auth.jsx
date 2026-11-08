import { useId, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    ArrowRight,
    BarChart3,
    CalendarClock,
    CheckCircle2,
    Eye,
    EyeOff,
    Loader2,
    Target,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import BrandMark from "../components/ui/BrandMark";
import AmbientBackground from "../components/ui/AmbientBackground";
import { fieldClass } from "../components/ui/Field";
import { EASE_OUT, rise, stagger } from "../utils/motion";

// What TaskFlow does, shown beside the form on large screens
const FEATURES = [
    { icon: Target, title: "Know what's next", text: "Today's Focus picks the most urgent task for you." },
    { icon: CalendarClock, title: "Never miss a date", text: "Overdue and due-today tasks stand out everywhere." },
    { icon: BarChart3, title: "See your progress", text: "Completion and the week ahead, at a glance." },
];

function Auth() {
    const navigate = useNavigate();
    const { signIn, register, error, clearError, user, loading } = useAuth();
    const ids = useId();

    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [status, setStatus] = useState("idle");
    const isLoading = status === "loading";

    // Already signed in (e.g. opened /auth from a bookmark): go to the app.
    // Not during a sign-in that just succeeded; that navigates after its animation.
    if (!loading && user && status === "idle") {
        return <Navigate to="/tasks" replace />;
    }

    // An error belongs to the attempt that caused it: editing or switching
    // between sign-in and registration clears it
    const clearMessages = () => {
        clearError?.();
        if (status === "error") setStatus("idle");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");

        const success = isRegistering
            ? await register(username, password)
            : await signIn(username, password);

        if (success) {
            setStatus("success");
            setTimeout(() => navigate("/tasks"), 400);
        } else {
            setStatus("error");
            setTimeout(() => setStatus("idle"), 1200);
        }
    };

    const buttonContent = () => {
        if (status === "loading") {
            return (
                <>
                    <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                    {isRegistering ? "Creating account..." : "Signing in..."}
                </>
            );
        }
        if (status === "success") {
            return (
                <>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    Welcome!
                </>
            );
        }
        return (
            <>
                {isRegistering ? "Create account" : "Sign in"}
                <ArrowRight size={18} aria-hidden="true" />
            </>
        );
    };

    const errorMessage = error?.message || error || (status === "error" ? "Couldn't sign you in. Please try again." : null);

    return (
        <div className="relative min-h-screen overflow-hidden bg-base text-white">

            {/* BACKGROUND: the same theme light as the app */}
            <AmbientBackground />

            <div className="relative z-10 grid min-h-screen lg:grid-cols-2">

                {/* LEFT: what TaskFlow is (large screens) */}
                <motion.div
                    variants={stagger(0.1, 0.08)}
                    initial="hidden"
                    animate="show"
                    className="hidden flex-col justify-between p-14 lg:flex"
                >
                    <motion.div variants={rise}>
                        <BrandMark tagline />
                    </motion.div>

                    <div className="max-w-lg space-y-8">
                        <motion.h1 variants={rise} className="text-5xl font-extrabold leading-[1.05]">
                            Plan your day.
                            <span className="block bg-gradient-to-r from-brand-a via-brand-b to-brand-c bg-clip-text text-transparent">
                                Finish what matters.
                            </span>
                        </motion.h1>

                        <ul className="space-y-4">
                            {FEATURES.map(({ icon: Icon, title, text }) => (
                                <motion.li key={title} variants={rise} className="flex items-start gap-4">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-a/20 bg-brand-a/10 text-brand-a">
                                        <Icon size={18} aria-hidden="true" />
                                    </span>
                                    <span>
                                        <span className="block font-semibold text-white">{title}</span>
                                        <span className="block text-sm text-white/60">{text}</span>
                                    </span>
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    <motion.p variants={rise} className="text-sm text-white/50">
                        Your tasks stay private to your account.
                    </motion.p>
                </motion.div>

                {/* RIGHT: the form */}
                <div className="flex flex-col items-center justify-center px-5 py-10 sm:px-8">
                    <div className="mb-8 lg:hidden">
                        <BrandMark tagline />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, ease: EASE_OUT }}
                        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-raised/80 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_30px_80px_-30px_rgba(0,0,0,0.8),0_0_80px_-40px_var(--brand-a)] backdrop-blur-xl sm:p-9"
                    >
                        {/* HEADER (animates when switching forms) */}
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={isRegistering ? "register" : "sign-in"}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.2 }}
                                className="mb-7 space-y-2"
                            >
                                <h2 className="text-3xl font-bold">
                                    {isRegistering ? "Create your account" : "Welcome back"}
                                </h2>
                                <p className="text-white/60">
                                    {isRegistering
                                        ? "Start organising your tasks in a minute."
                                        : "Sign in to pick up where you left off."}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {/* FORM */}
                        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                            <div className="space-y-2">
                                <label htmlFor={`${ids}-username`} className="text-sm font-medium text-white/80">
                                    Username
                                </label>
                                <input
                                    id={`${ids}-username`}
                                    name="username"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        clearMessages();
                                    }}
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    aria-describedby={isRegistering ? `${ids}-rules` : undefined}
                                    className={fieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor={`${ids}-password`} className="text-sm font-medium text-white/80">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id={`${ids}-password`}
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            clearMessages();
                                        }}
                                        autoComplete={isRegistering ? "new-password" : "current-password"}
                                        aria-describedby={isRegistering ? `${ids}-rules` : undefined}
                                        className={`${fieldClass} pr-12`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        aria-pressed={showPassword}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
                                    >
                                        {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                    </button>
                                </div>
                            </div>

                            {/* RULES (registration only; the server enforces them) */}
                            <AnimatePresence initial={false}>
                                {isRegistering && (
                                    <motion.p
                                        id={`${ids}-rules`}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden px-1 text-sm text-white/60"
                                    >
                                        Username: 3–30 letters, numbers, dots, dashes or underscores.
                                        Password: at least 8 characters.
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            {/* ERROR */}
                            <AnimatePresence>
                                {errorMessage && (
                                    <motion.div
                                        role="alert"
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0, x: [0, -6, 6, -3, 3, 0] }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.35 }}
                                        className="flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 p-3.5 text-sm text-rose-200"
                                    >
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                                        {errorMessage}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* SUBMIT */}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                aria-busy={isLoading || undefined}
                                className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl border font-semibold text-slate-950 transition-[background-color,box-shadow] duration-200
                                    ${status === "success"
                                        ? "border-emerald-300/50 bg-emerald-400 shadow-[0_10px_30px_-10px_rgb(52_211_153/0.7)]"
                                        : "border-cyan-300/50 bg-cyan-400 shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--color-cyan-400)_70%,transparent)] hover:bg-cyan-300 hover:shadow-[0_12px_36px_-8px_color-mix(in_oklab,var(--color-cyan-400)_80%,transparent)]"}
                                    ${isLoading ? "opacity-80" : ""}`}
                            >
                                {buttonContent()}
                            </motion.button>
                        </form>

                        {/* SWITCH */}
                        <p className="mt-6 text-center text-sm text-white/60">
                            {isRegistering ? "Already have an account?" : "New to TaskFlow?"}{" "}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegistering(!isRegistering);
                                    clearMessages();
                                }}
                                className="font-semibold text-cyan-300 underline-offset-4 hover:underline"
                            >
                                {isRegistering ? "Sign in" : "Create an account"}
                            </button>
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default Auth;
