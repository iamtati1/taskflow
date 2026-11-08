import { useState } from "react";

import Card from "../components/ui/Card";
import { EditProfileForm, ChangePasswordForm } from "../components/settings/AccountForms";
import useUISettings from "../hooks/useUISettings";


import {
    Sparkles,
    Moon,
    Lightbulb,
    LogOut,
    SlidersHorizontal,
    Palette,
    Check,
    UserPen,
    KeyRound,
} from "lucide-react";

import { motion } from "framer-motion";
import useTasks from "../hooks/useTasks";
import { useAuth } from "../hooks/useAuth";

// =====================================================
// DATA CONFIG
// =====================================================

// Each theme recolours every accent in the app (see THEMES in globals.css)
const appearanceOptions = [
    { id: "midnight", name: "Midnight", preview: "from-cyan-500/40 via-blue-500/20 to-cyan-300/30" },
    { id: "violet", name: "Violet", preview: "from-violet-500/40 via-purple-500/20 to-violet-300/30" },
    { id: "emerald", name: "Emerald", preview: "from-emerald-500/40 via-teal-500/20 to-emerald-300/30" },
    { id: "sunset", name: "Sunset", preview: "from-rose-500/40 via-orange-500/20 to-rose-300/30" },
];

// Every preference here changes the app: Focus Mode dims the sidebar and
// changes the Dashboard's focus copy; Workflow insights shows or hides the
// Dashboard's insight card. (Storage keys are kept for existing browsers.)
const preferences = [
    {
        icon: Moon,
        label: "Focus Mode",
        description: "Dim the sidebar and keep the Dashboard on one outcome.",
        group: "quick",
        key: "Focus Mode",
    },
    {
        icon: Lightbulb,
        label: "Workflow insights",
        description: "Show a short note on the Dashboard about your workload.",
        group: "ai",
        key: "Productivity insights",
    },
];

// =====================================================
// COMPONENT
// =====================================================

function Settings() {
    const { currentUser, signOut: logout, updateUsername, changePassword } = useAuth();

    // Which account form is open ("profile" | "password" | null), and the last result
    const [openForm, setOpenForm] = useState(null);
    const [accountMessage, setAccountMessage] = useState(null);
    const closeForm = (message) => {
        setOpenForm(null);
        setAccountMessage(message);
    };
    const { tasks = [], status, error } = useTasks();
    // The count is only shown once it's real (not while loading or after a failure)
    const tasksLoaded = status !== "loading" && !error;

    const {
        theme,
        setTheme,
        aiSettings,
        toggleAI,
        quickSettings,
        toggleQuick,
    } = useUISettings();

    const isOn = ({ group, key }) =>
        Boolean(group === "ai" ? aiSettings?.[key] : quickSettings?.[key]);
    const toggle = ({ group, key }) =>
        group === "ai" ? toggleAI(key) : toggleQuick(key);

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <section className="space-y-10">

            {/* HEADER */}
            <Card className="relative overflow-hidden">
                <div className="absolute -top-24 -right-24 h-72 w-72 bg-cyan-400/10 blur-[120px]" />
                <div className="absolute -bottom-24 -left-24 h-72 w-72 bg-violet-500/10 blur-[120px]" />

                <div className="relative space-y-3">
                    <div className="flex items-center gap-2 text-cyan-300">
                        <Sparkles size={16} />
                        Settings
                    </div>

                    <h1 className="text-3xl font-bold text-white">
                        Your workspace
                    </h1>

                    <p className="text-white/60">
                        Logged in as{" "}
                        <span className="text-white font-medium">
                            {currentUser?.username || "Guest"}
                        </span>
                        {tasksLoaded && (
                            <>
                                {" • "}
                                {tasks.length} {tasks.length === 1 ? "task" : "tasks"} in system
                            </>
                        )}
                    </p>
                </div>
            </Card>

            {/* GRID */}
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
                                    Accent colour for the whole app, saved in this browser
                                </p>
                            </div>
                        </div>

                        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {appearanceOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={theme === option.id}
                                    onClick={() => setTheme(option.id)}
                                    className={`p-3 rounded-2xl border text-left transition
                                        ${theme === option.id
                                            ? "border-cyan-400/40 bg-cyan-400/10"
                                            : "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]"
                                        }`}
                                >
                                    <div className={`h-14 rounded-xl mb-3 bg-gradient-to-br ${option.preview}`} />

                                    <div className="flex justify-between items-center">
                                        <span className="text-white text-sm font-medium">
                                            {option.name}
                                        </span>

                                        {theme === option.id && (
                                            <Check size={14} className="text-cyan-300" aria-hidden="true" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* PREFERENCES */}
                    <Card>
                        <div className="flex items-center gap-3 mb-6">
                            <SlidersHorizontal className="text-cyan-300" size={18} />
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    Preferences
                                </h3>
                                <p className="text-sm text-white/45">
                                    Saved in this browser
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {preferences.map((pref) => {
                                const { icon: Icon, label, description } = pref;
                                return (
                                    <div
                                        key={label}
                                        className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.04]"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Icon size={16} className="mt-0.5 text-white/60" />
                                            <div>
                                                <p className="text-white/85 text-sm font-medium">
                                                    {label}
                                                </p>
                                                <p className="text-white/45 text-sm">
                                                    {description}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={isOn(pref)}
                                            aria-label={label}
                                            onClick={() => toggle(pref)}
                                        >
                                            <Toggle enabled={isOn(pref)} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* RIGHT */}
                <div className="space-y-6">

                    {/* PROFILE */}
                    <Card className="text-center">
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
                            {accountMessage && !openForm && (
                                <p role="status" className="text-sm text-cyan-300">
                                    {accountMessage}
                                </p>
                            )}

                            {openForm === "profile" && (
                                <EditProfileForm
                                    currentName={currentUser?.username}
                                    onSave={updateUsername}
                                    onDone={closeForm}
                                />
                            )}

                            {openForm === "password" && (
                                <ChangePasswordForm onSave={changePassword} onDone={closeForm} />
                            )}

                            {!openForm && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => { setAccountMessage(null); setOpenForm("profile"); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white/80 hover:bg-white/[0.07]"
                                    >
                                        <UserPen size={16} />
                                        Edit Profile
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setAccountMessage(null); setOpenForm("password"); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white/80 hover:bg-white/[0.07]"
                                    >
                                        <KeyRound size={16} />
                                        Change Password
                                    </button>
                                </>
                            )}

                            <button
                                type="button"
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 text-red-300 border border-red-400/10"
                            >
                                <LogOut size={16} />
                                Log Out
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </section>
    );
}

// =====================================================
// TOGGLE COMPONENT
// =====================================================

function Toggle({ enabled }) {
    return (
        <div
            className={`w-11 h-6 rounded-full px-1 flex items-center transition ${enabled ? "bg-cyan-400/40" : "bg-white/10"
                }`}
        >
            <motion.div
                animate={{ x: enabled ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-4 h-4 rounded-full bg-white"
            />
        </div>
    );
}

export default Settings;