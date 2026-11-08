import { useId } from "react";

// A miniature of the Dashboard drawn in one theme: its background, brand
// light, completion ring and button. It sets data-theme on itself, so it
// shows that theme's real colours whatever the page is using.
function ThemePreview({ theme }) {
    // React's ids contain colons, which break url(#...) references
    const gradientId = `ring-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;

    return (
        <div
            data-theme={theme}
            aria-hidden="true"
            className="relative h-20 overflow-hidden rounded-xl border border-white/[0.08] bg-base"
        >
            {/* Brand light */}
            <span className="absolute -left-4 -top-6 h-16 w-20 rounded-full bg-brand-a/35 blur-xl" />
            <span className="absolute -bottom-8 right-2 h-16 w-20 rounded-full bg-brand-b/30 blur-xl" />

            {/* A hero card with a greeting line and a button */}
            <span className="absolute inset-x-2 top-2 bottom-2 rounded-lg border border-white/10 bg-raised/70" />
            <span className="absolute left-4 top-[1.15rem] h-1.5 w-10 rounded-full bg-white/70" />
            <span className="absolute left-4 top-[1.75rem] h-1 w-14 rounded-full bg-white/25" />
            <span className="absolute left-4 bottom-[1.05rem] h-2.5 w-9 rounded-full bg-cyan-400 shadow-[0_0_10px_-1px_var(--color-cyan-400)]" />

            {/* Completion ring */}
            <svg viewBox="0 0 32 32" className="absolute right-4 top-1/2 h-9 w-9 -translate-y-1/2 -rotate-90">
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="var(--ring-from)" />
                        <stop offset="100%" stopColor="var(--ring-to)" />
                    </linearGradient>
                </defs>
                <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle
                    cx="16"
                    cy="16"
                    r="12"
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 12}
                    strokeDashoffset={2 * Math.PI * 12 * 0.35}
                />
            </svg>
        </div>
    );
}

export default ThemePreview;
