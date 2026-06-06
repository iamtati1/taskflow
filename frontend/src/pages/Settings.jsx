import { useState, useEffect } from "react";
import {
    Bell,
    Shield,
    Sparkles,
    Moon,
    Palette,
    BrainCircuit,
    User,
    LogOut,
    Check,
    Monitor,
    Zap,
} from "lucide-react";

import { motion } from "framer-motion";
import useTasks from "../hooks/useTasks";
import { useAuth } from "../hooks/useAuth";

// =====================================================
// SHARED CARD SYSTEM (same pattern as Dashboard/Tasks)
// =====================================================
function Card({ children, className = "" }) {
    return (
        <div className={`rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl ${className}`}>
            {children}
        </div>
    );
}

const appearanceOptions = [
    { name: "Glass", preview: "from-cyan-500/30 via-blue-500/20 to-violet-500/30" },
    { name: "Midnight", preview: "from-slate-900 via-slate-800 to-slate-700" },
    { name: "Aurora", preview: "from-cyan-400/30 via-violet-500/20 to-pink-500/30" },
];

const aiSettingsList = [
    "Smart task prioritization",
    "AI workflow suggestions",
    "Focus session recommendations",
    "Productivity insights",
];

const quickSettingsList = [
    { icon: Bell, label: "Notifications" },
    { icon: Moon, label: "Focus Mode" },
    { icon: Monitor, label: "Desktop Layout" },
];

function Settings() {
    const { user, signOut } = useAuth();
    const { tasks = [] } = useTasks();

    const [theme, setTheme] = useState(
        () => localStorage.getItem("theme") || "Midnight"
    );

    const [aiSettings, setAiSettings] = useState(() => {
        const saved = localStorage.getItem("aiSettings");
        return saved
            ? JSON.parse(saved)
            : Object.fromEntries(aiSettingsList.map((s) => [s, true]));
    });

    const [quickSettings, setQuickSettings] = useState(() => {
        const saved = localStorage.getItem("quickSettings");
        return saved
            ? JSON.parse(saved)
            : {
                Notifications: true,
                "Focus Mode": false,
                "Desktop Layout": true,
            };
    });

    useEffect(() => {
        localStorage.setItem("theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem("aiSettings", JSON.stringify(aiSettings));
    }, [aiSettings]);

    useEffect(() => {
        localStorage.setItem("quickSettings", JSON.stringify(quickSettings));

        if (quickSettings["Focus Mode"]) {
            document.body.classList.add("focus-mode");
        } else {
            document.body.classList.remove("focus-mode");
        }
    }, [quickSettings]);

    const toggleAI = (setting) => {
        setAiSettings((prev) => ({
            ...prev,
            [setting]: !prev[setting],
        }));
    };

    const toggleQuick = (setting) => {
        setQuickSettings((prev) => ({
            ...prev,
            [setting]: !prev[setting],
        }));
    };

    return (
        <section className="space-y-10">

            {/* =====================================================
                HEADER (SYSTEM STANDARD)
            ===================================================== */}
            <Card className="relative overflow-hidden">

                <div className="absolute -top-24 -right-24 h-72 w-72 bg-cyan-400/10 blur-[120px]" />
                <div className="absolute -bottom-24 -left-24 h-72 w-72 bg-violet-500/10 blur-[120px]" />

                <div className="relative space-y-3">

                    <div className="flex items-center gap-2 text-cyan-300">
                        <Sparkles size={16} />
                        Workspace Settings
                    </div>

                    <h1 className="text-3xl font-bold text-white">
                        Personalize your workspace
                    </h1>

                    <p className="text-white/60">
                        Logged in as{" "}
                        <span className="text-white font-medium">
                            {user?.username || "Guest"}
                        </span>
                        {" • "}
                        {tasks.length} tasks in system
                    </p>

                </div>
            </Card>

            {/* =====================================================
                GRID
            ===================================================== */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* LEFT */}
                <div className="xl:col-span-2 space-y-6">

                    {/* APPEARANCE */}
                    <Card>
                        <div className="flex items-center gap-3 mb-6">
                            <Palette className="text-cyan-300" size={18} />
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    Appearance
                                </h3>
                                <p className="text-sm text-white/45">
                                    Visual styling and theme options
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            {appearanceOptions.map((option) => (
                                <button
                                    key={option.name}
                                    onClick={() => setTheme(option.name)}
                                    className={`p-4 rounded-2xl border transition text-left
                                        ${theme === option.name
                                            ? "border-cyan-400/40 bg-cyan-400/10"
                                            : "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]"
                                        }`}
                                >
                                    <div className={`h-20 rounded-xl mb-3 bg-gradient-to-br ${option.preview}`} />

                                    <div className="flex justify-between">
                                        <span className="text-white font-medium">
                                            {option.name}
                                        </span>

                                        {theme === option.name && (
                                            <span className="text-xs text-cyan-300">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}

                        </div>
                    </Card>

                    {/* AI SETTINGS */}
                    <Card>
                        <div className="flex items-center gap-3 mb-6">
                            <BrainCircuit className="text-cyan-300" size={18} />
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    AI Preferences
                                </h3>
                                <p className="text-sm text-white/45">
                                    Control how AI supports your workflow
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {aiSettingsList.map((setting) => (
                                <div
                                    key={setting}
                                    className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.04]"
                                >
                                    <div className="flex items-center gap-3">
                                        <Check size={16} className="text-cyan-300" />
                                        <span className="text-white/80 text-sm">
                                            {setting}
                                        </span>
                                    </div>

                                    <button onClick={() => toggleAI(setting)}>
                                        <Toggle enabled={aiSettings[setting]} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>

                </div>

                {/* RIGHT */}
                <div className="space-y-6">

                    {/* PROFILE */}
                    <Card className="text-center">

                        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center text-2xl font-bold mb-4">
                            {user?.username?.[0]?.toUpperCase() || "G"}
                        </div>

                        <h2 className="text-xl font-semibold text-white">
                            {user?.username || "Guest"}
                        </h2>

                        <p className="text-white/45 text-sm mt-1">
                            Productivity workspace
                        </p>

                        <div className="mt-6 space-y-3">

                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white/70">
                                <User size={16} />
                                Edit Profile
                            </button>

                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white/70">
                                <Shield size={16} />
                                Security
                            </button>

                            <button
                                onClick={signOut}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 text-red-300 border border-red-400/10"
                            >
                                <LogOut size={16} />
                                Log Out
                            </button>

                        </div>
                    </Card>

                    {/* QUICK SETTINGS */}
                    <Card>

                        <div className="flex items-center gap-2 mb-4">
                            <Zap size={18} className="text-cyan-300" />
                            <h3 className="text-lg font-semibold text-white">
                                Quick Settings
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {quickSettingsList.map(({ icon: Icon, label }) => (
                                <div
                                    key={label}
                                    className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.04]"
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon size={16} className="text-white/60" />
                                        <span className="text-white/70 text-sm">
                                            {label}
                                        </span>
                                    </div>

                                    <button onClick={() => toggleQuick(label)}>
                                        <Toggle enabled={quickSettings[label]} />
                                    </button>
                                </div>
                            ))}
                        </div>

                    </Card>

                </div>
            </div>
        </section>
    );
}

// =====================================================
// TOGGLE (kept but aligned visually)
// =====================================================
function Toggle({ enabled }) {
    return (
        <div className={`w-11 h-6 rounded-full px-1 flex items-center transition
            ${enabled ? "bg-cyan-400/40" : "bg-white/10"}`}>
            <motion.div
                animate={{ x: enabled ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-4 h-4 rounded-full bg-white"
            />
        </div>
    );
}

export default Settings;