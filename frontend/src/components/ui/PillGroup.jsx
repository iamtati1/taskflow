import { useId } from "react";
import { LayoutGroup, motion } from "framer-motion";

import { SPRING } from "../../utils/motion";

// A row of toggle pills (e.g. quick due dates). The selected pill's
// highlight slides between options. Each pill is a button with
// aria-pressed; choosing the selected one again leaves it selected.
//   options  [{ value, label }]
function PillGroup({ label, options, value, onChange }) {
    const groupId = useId();

    return (
        <LayoutGroup id={groupId}>
            <div role="group" aria-label={label} className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const selected = option.value === value;
                    return (
                        <button
                            key={option.label}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onChange(option.value)}
                            className={`relative min-h-9 rounded-full border px-3.5 text-xs font-medium transition-colors duration-200 sm:min-h-8 touch:min-h-11 touch:px-4
                                ${selected
                                    ? "border-cyan-400/50 text-cyan-100"
                                    : "border-white/10 text-white/65 hover:border-white/25 hover:text-white"}`}
                        >
                            {selected && (
                                <motion.span
                                    layoutId="pill-selected"
                                    transition={SPRING}
                                    aria-hidden="true"
                                    className="absolute inset-0 rounded-full bg-cyan-400/15"
                                />
                            )}
                            <span className="relative">{option.label}</span>
                        </button>
                    );
                })}
            </div>
        </LayoutGroup>
    );
}

export default PillGroup;
