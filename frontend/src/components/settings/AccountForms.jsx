import { useState } from "react";

// Small inline forms for the Settings profile card. Each calls an
// AuthContext action that returns { success, error } and shows the result.

const fieldClass =
    "w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-white outline-none placeholder-white/30 focus:border-cyan-400/40";

function FormShell({ title, onSubmit, onCancel, saving, error, submitLabel, children }) {
    return (
        <form onSubmit={onSubmit} className="space-y-3 text-left" aria-label={title}>
            <p className="text-sm font-medium text-white">{title}</p>
            {children}
            {error && (
                <p role="alert" className="text-sm text-rose-300">
                    {error}
                </p>
            )}
            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-white hover:bg-cyan-400/20 disabled:opacity-60"
                >
                    {saving ? "Saving..." : submitLabel}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:text-white"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

export function EditProfileForm({ currentName, onSave, onDone }) {
    const [username, setUsername] = useState(currentName || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        setError(null);
        const result = await onSave(username.trim());
        setSaving(false);
        if (result?.success) onDone("Username updated.");
        else setError(result?.error || "Couldn't update your username.");
    };

    return (
        <FormShell title="Edit profile" onSubmit={submit} onCancel={() => onDone(null)} saving={saving} error={error} submitLabel="Save">
            <label className="block space-y-1 text-sm text-white/60">
                Username
                <input
                    className={fieldClass}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={30}
                    autoComplete="username"
                    autoFocus
                />
            </label>
            <p className="text-xs text-white/50">3–30 letters, numbers, dots, dashes or underscores.</p>
        </FormShell>
    );
}

export function ChangePasswordForm({ onSave, onDone }) {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        if (saving) return;
        if (next !== confirm) {
            setError("The new passwords don't match.");
            return;
        }
        setSaving(true);
        setError(null);
        const result = await onSave(current, next);
        setSaving(false);
        if (result?.success) onDone("Password updated.");
        else setError(result?.error || "Couldn't change your password.");
    };

    return (
        <FormShell title="Change password" onSubmit={submit} onCancel={() => onDone(null)} saving={saving} error={error} submitLabel="Update password">
            <label className="block space-y-1 text-sm text-white/60">
                Current password
                <input type="password" className={fieldClass} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" autoFocus />
            </label>
            <label className="block space-y-1 text-sm text-white/60">
                New password
                <input type="password" className={fieldClass} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
            </label>
            <label className="block space-y-1 text-sm text-white/60">
                Confirm new password
                <input type="password" className={fieldClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </label>
            <p className="text-xs text-white/50">At least 8 characters.</p>
        </FormShell>
    );
}
