import { Check } from "lucide-react";

// TaskFlow's mark: a check in an accent-tinted tile, with the name beside it
// unless `compact`. Decorative wherever the name is already given.
function BrandMark({ compact = false, tagline = false }) {
    return (
        <div className="flex items-center gap-3">
            <div
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-a/35 bg-gradient-to-br from-brand-a/30 to-brand-b/20 shadow-[0_0_24px_-6px_color-mix(in_oklab,var(--brand-a)_60%,transparent)]"
            >
                <Check size={18} strokeWidth={3} className="text-white" />
            </div>

            {!compact && (
                <div className="leading-tight">
                    <p className="font-display text-base font-bold tracking-tight text-white">
                        TaskFlow
                    </p>
                    {tagline && (
                        <p className="text-xs text-white/50">
                            Plan · Focus · Finish
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default BrandMark;
