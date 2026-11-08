import { motion } from "framer-motion";

import AnimatedNumber from "./AnimatedNumber";
import { EASE_OUT } from "../../utils/motion";

// A circular progress indicator (0-100) that sweeps to its value, with the
// percentage counting up in the middle. Exposed as a progressbar.
function ProgressRing({ value = 0, size = 132, stroke = 10, label = "Progress", caption }) {
    const pct = Math.max(0, Math.min(100, Math.round(value)));
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className="relative shrink-0"
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                <defs>
                    <linearGradient id="progress-ring-gradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="var(--color-cyan-300, #67e8f9)" />
                        <stop offset="100%" stopColor="var(--color-violet-400, #a78bfa)" />
                    </linearGradient>
                </defs>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.07)"
                    strokeWidth={stroke}
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="url(#progress-ring-gradient)"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
                    transition={{ duration: 1.1, ease: EASE_OUT }}
                />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
                <span className="font-display text-3xl font-bold text-white">
                    <AnimatedNumber value={pct} suffix="%" />
                </span>
                {caption && <span className="text-xs text-white/50">{caption}</span>}
            </div>
        </div>
    );
}

export default ProgressRing;
