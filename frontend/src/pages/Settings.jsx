import { useState } from "react";

import Card from "../components/ui/Card";
import { EditProfileForm, ChangePasswordForm } from "../components/settings/AccountForms";
import ThemePreview from "../components/settings/ThemePreview";
import useUISettings from "../hooks/useUISettings";
import { rise, stagger } from "../utils/motion";

import {
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

// Each theme recolours the whole app (see the themes in globals.css); the
// previews are drawn in the theme itself (ThemePreview)
const appearanceOptions = [
    { id: "midnight", name: "Midnight" },
    { id: "violet", name: "Violet" },
    { id: "emerald", name: "Emerald" },
    { id: "sunset", name: "Sunset" },
];

// A card's heading: icon tile, title and a short note
function SectionTitle({ icon: Icon, title, note }) {
    return (
        <div className="mb-6 flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-a/12 text-brand-a">
                <Icon size={17} aria-hidden="true" />
            </span>
            <div>
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                <p className="text-sm text-white/60">{note}</p>
            </div>
        </div>
    );
}

// The account actions on the profile card
const ACCOUNT_BUTTON =
    "flex w-full min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white/85 transition-colors hover:border-white/20 hover:bg-white/[0.07]";

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

    // Arrow keys choose the previous/next theme and move focus with it
    const handleThemeKeys = (e) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        const index = appearanceOptions.findIndex((option) => option.id === theme);
        const next = appearanceOptions[(index + step + appearanceOptions.length) % appearanceOptions.length];
        setTheme(next.id);
        e.currentTarget.querySelector(`[data-theme-option="${next.id}"]`)?.focus();
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <motion.section variants={stagger()} initial="hidden" animate="show" className="space-y-6">

            {/* HEADER */}
            <motion.div variants={rise} className="space-y-2">
                <h1 className="text-3xl font-bold text-white sm:text-4xl">
                    Settings
                </h1>

                <p className="text-white/60">
                    Signed in as{" "}
                    <span className="font-semibold text-white">
                        {currentUser?.username || "Guest"}
                    </span>
                    {tasksLoaded && (
                        <>
                            {" • "}
                            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                        </>
                    )}
                </p>
            </motion.div>

            {/* GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* LEFT */}
                <div className="xl:col-span-2 space-y-6">

                    {/* APPEARANCE */}
                    <motion.div variants={rise}>
                        <Card>
                            <SectionTitle icon={Palette} title="Appearance" note="Colours for the whole app, saved in this browser" />

                            {/* One tab stop; arrow keys move between themes (radio group pattern) */}
                            <div
                                role="radiogroup"
                                aria-label="Theme"
                                onKeyDown={handleThemeKeys}
                                className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
                            >
                                {appearanceOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={theme === option.id}
                                        tabIndex={theme === option.id ? 0 : -1}
                                        data-theme-option={option.id}
                                        onClick={() => setTheme(option.id)}
                                        className={`group relative rounded-2xl border p-2.5 text-left transition-colors duration-200
                                            ${theme === option.id
                                                ? "border-transparent"
                                                : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"
                                            }`}
                                    >
                                        {theme === option.id && (
                                            <motion.span
                                                layoutId="theme-selected"
                                                aria-hidden="true"
                                                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                                                className="absolute inset-0 rounded-2xl border-2 border-cyan-400/70 bg-cyan-400/10"
                                            />
                                        )}
                                        <div className="relative transition-transform duration-200 group-hover:scale-[1.02]">
                                            <ThemePreview theme={option.id} />
                                        </div>

                                        <div className="relative mt-2.5 flex items-center justify-between px-1">
                                            <span className="text-white text-sm font-medium">
                                                {option.name}
                                            </span>

                                            {theme === option.id && (
                                                <motion.span
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-slate-950"
                                                >
                                                    <Check size={12} strokeWidth={3} aria-hidden="true" />
                                                </motion.span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </motion.div>

                    {/* PREFERENCES */}
                    <motion.div variants={rise}>
                        <Card>
                            <SectionTitle icon={SlidersHorizontal} title="Preferences" note="Saved in this browser" />

                            <div className="space-y-3">
                                {preferences.map((pref) => {
                                    const { icon: Icon, label, description } = pref;
                                    return (
                                        <div
                                            key={label}
                                            className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"
                                        >
                                            <div className="flex items-start gap-3">
                                                <Icon size={16} className="mt-0.5 shrink-0 text-white/60" aria-hidden="true" />
                                                <div>
                                                    <p className="text-white/85 text-sm font-medium">
                                                        {label}
                                                    </p>
                                                    <p className="text-white/60 text-sm">
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
                                                className="-m-2 rounded-full p-2"
                                            >
                                                <Toggle enabled={isOn(pref)} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* RIGHT */}
                <motion.div variants={rise} className="space-y-6">

                    {/* PROFILE */}
                    <Card className="text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-a to-brand-b font-display text-2xl font-bold text-slate-950 shadow-[0_12px_32px_-12px_var(--brand-b)]">
                            {currentUser?.username?.[0]?.toUpperCase() || "G"}
                        </div>

                        <h2 className="text-xl font-semibold text-white">
                            {currentUser?.username || "Guest"}
                        </h2>

                        <p className="text-white/60 text-sm mt-1">
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
                                        className={ACCOUNT_BUTTON}
                                    >
                                        <UserPen size={16} aria-hidden="true" />
                                        Edit Profile
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setAccountMessage(null); setOpenForm("password"); }}
                                        className={ACCOUNT_BUTTON}
                                    >
                                        <KeyRound size={16} aria-hidden="true" />
                                        Change Password
                                    </button>
                                </>
                            )}

                            <button
                                type="button"
                                onClick={logout}
                                className="flex w-full min-h-12 items-center gap-3 rounded-2xl border border-rose-400/15 bg-rose-500/10 px-4 py-3 text-rose-300 transition-colors hover:border-rose-400/30 hover:bg-rose-500/15"
                            >
                                <LogOut size={16} aria-hidden="true" />
                                Log Out
                            </button>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </motion.section>
    );
}

// =====================================================
// TOGGLE COMPONENT
// =====================================================

function Toggle({ enabled }) {
    return (
        <div
            className={`flex h-6 w-11 items-center rounded-full px-1 transition-colors duration-200
                ${enabled ? "bg-cyan-400 shadow-[0_0_14px_-3px_var(--color-cyan-400)]" : "bg-white/15"}`}
        >
            <motion.div
                animate={{ x: enabled ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`h-4 w-4 rounded-full ${enabled ? "bg-slate-950" : "bg-white"}`}
            />
        </div>
    );
}

export default Settings;