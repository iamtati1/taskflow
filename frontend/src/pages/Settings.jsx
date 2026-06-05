import { useState } from "react";
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

const appearanceOptions = [
    {
        name: "Glass",
        preview:
            "from-cyan-500/30 via-blue-500/20 to-violet-500/30",
    },
    {
        name: "Midnight",
        preview:
            "from-slate-900 via-slate-800 to-slate-700",
    },
    {
        name: "Aurora",
        preview:
            "from-cyan-400/30 via-violet-500/20 to-pink-500/30",
    },
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
    const { currentUser, logout } = useAuth();
    const { tasks = [] } = useTasks();

    const [theme, setTheme] = useState("Midnight");

    const [aiSettings, setAiSettings] = useState({
        "Smart task prioritization": true,
        "AI workflow suggestions": true,
        "Focus session recommendations": true,
        "Productivity insights": true,
    });

    const [quickSettings, setQuickSettings] = useState({
        Notifications: true,
        "Focus Mode": false,
        "Desktop Layout": true,
    });

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
        <section className="space-y-10 fade-in">

            {/* HEADER */}
            <div className="flow-card p-8 relative overflow-hidden">

                <div className="absolute -top-24 -right-24 h-72 w-72 bg-cyan-400/10 blur-[120px]" />
                <div className="absolute -bottom-24 -left-24 h-72 w-72 bg-violet-500/10 blur-[120px]" />

                <div className="relative z-10">

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/60 text-sm mb-5">
                        <Sparkles size={15} />
                        Workspace Settings
                    </div>

                    <h1 className="text-4xl font-bold text-white">
                        Personalize your workspace
                    </h1>

                    <p className="mt-4 text-white/50">
                        Logged in as{" "}
                        <span className="text-white font-medium">
                            {currentUser?.username || "Guest"}
                        </span>
                        {" • "}
                        {tasks.length} tasks in system
                    </p>

                </div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* LEFT COLUMN */}
                <div className="xl:col-span-2 space-y-6">

                    {/* APPEARANCE */}
                    <div className="flow-card p-7 space-y-6">

                        <SectionHeader
                            icon={Palette}
                            title="Appearance"
                            subtitle="Visual styling and theme options"
                            color="text-cyan-300"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            {appearanceOptions.map((option) => (

                                <button
                                    key={option.name}
                                    onClick={() => setTheme(option.name)}
                                    className={`
                                        p-4 rounded-2xl border transition-all text-left
                                        ${theme === option.name
                                            ? "border-cyan-400/40 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.18)]"
                                            : "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]"
                                        }
                                    `}
                                >

                                    <div
                                        className={`
                                            h-20 rounded-xl mb-3
                                            bg-gradient-to-br ${option.preview}
                                        `}
                                    />

                                    <div className="flex items-center justify-between">

                                        <span className="font-medium text-white">
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
                    </div>

                    {/* AI SETTINGS */}
                    <div className="flow-card p-7 space-y-6">

                        <SectionHeader
                            icon={BrainCircuit}
                            title="AI Preferences"
                            subtitle="Control how AI supports your workflow"
                            color="text-cyan-300"
                        />

                        <div className="space-y-3">

                            {aiSettingsList.map((setting) => (

                                <div
                                    key={setting}
                                    className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.04]"
                                >

                                    <div className="flex items-center gap-3">

                                        <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center">
                                            <Check
                                                size={16}
                                                className="text-cyan-300"
                                            />
                                        </div>

                                        <p className="text-white/80 text-sm">
                                            {setting}
                                        </p>

                                    </div>

                                    <button
                                        onClick={() => toggleAI(setting)}
                                    >
                                        <Toggle
                                            enabled={aiSettings[setting]}
                                        />
                                    </button>

                                </div>

                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">

                    {/* PROFILE */}
                    <div className="flow-card p-7 text-center">

                        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center text-2xl font-bold mb-4">
                            {currentUser?.username?.[0]?.toUpperCase() || "G"}
                        </div>

                        <h2 className="text-xl font-semibold text-white">
                            {currentUser?.username || "Guest"}
                        </h2>

                        <p className="text-white/45 text-sm mt-1">
                            Productivity workspace
                        </p>

                        <div className="mt-6 space-y-3">

                            <SidebarButton
                                icon={User}
                                label="Edit Profile"
                            />

                            <SidebarButton
                                icon={Shield}
                                label="Security"
                            />

                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 text-red-300 border border-red-400/10 hover:bg-red-500/20 transition"
                            >
                                <LogOut size={18} />
                                Log Out
                            </button>

                        </div>
                    </div>

                    {/* QUICK SETTINGS */}
                    <div className="flow-card p-7 space-y-4">

                        <div className="flex items-center gap-2">
                            <Zap
                                size={18}
                                className="text-cyan-300"
                            />
                            <h3 className="text-lg font-semibold">
                                Quick Settings
                            </h3>
                        </div>

                        {quickSettingsList.map(
                            ({ icon: Icon, label }) => (
                                <div
                                    key={label}
                                    className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.04]"
                                >

                                    <div className="flex items-center gap-3">
                                        <Icon
                                            size={16}
                                            className="text-white/60"
                                        />
                                        <span className="text-white/70 text-sm">
                                            {label}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() =>
                                            toggleQuick(label)
                                        }
                                    >
                                        <Toggle
                                            enabled={
                                                quickSettings[label]
                                            }
                                        />
                                    </button>

                                </div>
                            )
                        )}
                    </div>

                </div>
            </div>
        </section>
    );
}

function SectionHeader({
    icon: Icon,
    title,
    subtitle,
    color,
}) {
    return (
        <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Icon
                    className={color}
                    size={18}
                />
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white">
                    {title}
                </h3>

                <p className="text-sm text-white/45">
                    {subtitle}
                </p>
            </div>

        </div>
    );
}

function SidebarButton({
    icon: Icon,
    label,
}) {
    return (
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition">
            <Icon
                size={16}
                className="text-white/60"
            />
            <span className="text-white/70 text-sm">
                {label}
            </span>
        </button>
    );
}

function Toggle({ enabled }) {
    return (
        <div
            className={`
                w-11 h-6 rounded-full px-1 flex items-center transition
                ${enabled
                    ? "bg-cyan-400/40"
                    : "bg-white/10"
                }
            `}
        >
            <motion.div
                animate={{
                    x: enabled ? 20 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                }}
                className="w-4 h-4 rounded-full bg-white"
            />
        </div>
    );
}

export default Settings;