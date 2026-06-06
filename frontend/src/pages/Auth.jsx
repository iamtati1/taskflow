import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Eye,
    EyeOff,
    Sparkles,
    ArrowRight,
    BrainCircuit,
    Layers3,
    Loader2,
    CheckCircle2,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";

// =====================================================
// SHARED CARD SYSTEM (aligned with app)
// =====================================================
function Card({ children, className = "" }) {
    return (
        <div className={`rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl ${className}`}>
            {children}
        </div>
    );
}

function Auth() {
    const navigate = useNavigate();
    const { login, register, error } = useAuth();

    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [status, setStatus] = useState("idle");
    const isLoading = status === "loading";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");

        const success = isRegistering
            ? await register(username, password)
            : await login(username, password);

        if (success) {
            setStatus("success");
            setTimeout(() => navigate("/tasks"), 400);
        } else {
            setStatus("error");
            setTimeout(() => setStatus("idle"), 1200);
        }
    };

    const getButtonContent = () => {
        if (status === "loading") {
            return (
                <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing...
                </>
            );
        }

        if (status === "success") {
            return (
                <>
                    <CheckCircle2 size={18} />
                    Entering System...
                </>
            );
        }

        return (
            <>
                {isRegistering ? "Create System" : "Enter Workspace"}
                <ArrowRight size={18} />
            </>
        );
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-black text-white">

            {/* BACKGROUND */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#050816] via-black to-[#0a0f1f]" />

            {/* MAIN */}
            <div className="relative z-10 min-h-screen grid lg:grid-cols-2">

                {/* LEFT PANEL (kept, but slightly aligned tone) */}
                <div className="hidden lg:flex flex-col justify-between p-14">

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
                        <Sparkles size={16} className="text-cyan-300" />
                        <span className="text-sm text-white/70">Flow OS</span>
                    </div>

                    <div className="max-w-xl space-y-6">

                        <h1 className="text-5xl font-black leading-tight">
                            Build your
                            <span className="block text-cyan-300">
                                productivity system
                            </span>
                        </h1>

                        <p className="text-white/50 text-lg">
                            A focused environment for execution, clarity, and momentum.
                        </p>

                        <div className="grid grid-cols-2 gap-4">

                            <Card className="p-5">
                                <BrainCircuit className="text-cyan-300 mb-3" />
                                <h3 className="font-semibold">AI Planning</h3>
                                <p className="text-sm text-white/40">Execution guidance</p>
                            </Card>

                            <Card className="p-5">
                                <Layers3 className="text-violet-300 mb-3" />
                                <h3 className="font-semibold">Task Engine</h3>
                                <p className="text-sm text-white/40">Structured flow</p>
                            </Card>

                        </div>
                    </div>

                    <div className="text-white/20 text-sm">
                        Designed for focus-driven creators
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="flex items-center justify-center px-6">

                    <Card className="w-full max-w-md">

                        {/* HEADER */}
                        <div className="mb-8 space-y-3">

                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/40 uppercase tracking-widest">
                                <Sparkles size={12} />
                                Authentication
                            </div>

                            <h2 className="text-3xl font-bold">
                                {isRegistering ? "Create System" : "Welcome Back"}
                            </h2>

                            <p className="text-white/45">
                                {isRegistering
                                    ? "Initialize your productivity workspace"
                                    : "Continue your execution flow"}
                            </p>

                        </div>

                        {/* FORM */}
                        <form onSubmit={handleSubmit} className="space-y-5">

                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username"
                                className="w-full h-14 px-5 rounded-2xl border border-white/10 bg-white/[0.04] focus:border-cyan-400/40 outline-none"
                            />

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full h-14 px-5 pr-14 rounded-2xl border border-white/10 bg-white/[0.04] focus:border-violet-400/40 outline-none"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* ERROR */}
                            {(error || status === "error") && (
                                <div className="p-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                    {error?.message || error || "Authentication failed"}
                                </div>
                            )}

                            {/* BUTTON */}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className={`w-full h-14 rounded-2xl font-semibold flex items-center justify-center gap-3 transition
                                    ${status === "success"
                                        ? "bg-emerald-500/20 border border-emerald-400/30"
                                        : "bg-cyan-400/10 border border-cyan-400/20 hover:bg-cyan-400/15"
                                    }
                                    ${isLoading ? "opacity-80" : "opacity-100"}
                                `}
                            >
                                {getButtonContent()}
                            </motion.button>

                        </form>

                        {/* SWITCH */}
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="mt-6 w-full text-sm text-white/40 hover:text-cyan-300"
                        >
                            {isRegistering
                                ? "Already have an account? Login"
                                : "Need an account? Register"}
                        </button>

                    </Card>
                </div>
            </div>
        </div>
    );
}

export default Auth;