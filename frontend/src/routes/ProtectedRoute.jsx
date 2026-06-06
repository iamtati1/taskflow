import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, BrainCircuit } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

// =====================================================
// SYSTEM LOADING STATE (not a page, just a state UI)
// =====================================================
function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="
                    w-full max-w-md
                    rounded-3xl
                    border border-white/10
                    bg-white/[0.03]
                    backdrop-blur-xl
                    p-10
                    text-center
                "
            >

                {/* SPINNER */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="
                        w-20 h-20 mx-auto
                        rounded-2xl
                        border border-white/10
                        bg-white/[0.04]
                        flex items-center justify-center
                        mb-6
                    "
                >
                    <BrainCircuit size={32} className="text-cyan-300" />
                </motion.div>

                {/* TAG */}
                <div className="
                    inline-flex items-center gap-2
                    px-3 py-1
                    rounded-full
                    border border-white/10
                    bg-white/[0.04]
                    text-white/40 text-xs
                    uppercase tracking-widest
                    mb-4
                ">
                    <Sparkles size={12} />
                    Initializing Session
                </div>

                {/* TEXT */}
                <h2 className="text-2xl font-semibold text-white mb-2">
                    Preparing workspace
                </h2>

                <p className="text-white/45 text-sm">
                    Syncing authentication and system state...
                </p>

            </motion.div>
        </div>
    );
}

// =====================================================
// PROTECTED ROUTE (system guard layer)
// =====================================================
export default function ProtectedRoute({ children }) {
    const { currentUser, isLoading } = useAuth();

    // =====================================================
    // AUTH RESOLUTION (single source of truth)
    // =====================================================
    const isAuthenticated = Boolean(
        currentUser?.id || currentUser?.user_id
    );

    // =====================================================
    // 1. LOADING STATE
    // =====================================================
    if (isLoading) {
        return <LoadingScreen />;
    }

    // =====================================================
    // 2. UNAUTHORIZED STATE
    // =====================================================
    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    // =====================================================
    // 3. AUTHORIZED STATE
    // =====================================================
    return children;
}