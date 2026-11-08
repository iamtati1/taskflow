import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";

// A number that counts up (or down) to its value. The final value is always
// rendered by React, so it's correct for screen readers and tests from the
// first frame; the animation only plays visually. Reduced motion: no count.
function AnimatedNumber({ value, suffix = "", duration = 0.9, className = "" }) {
    const ref = useRef(null);
    const previous = useRef(0);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        const node = ref.current;
        const from = previous.current;
        previous.current = value;
        if (!node || reduceMotion || from === value) return undefined;

        const controls = animate(from, value, {
            duration,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: (latest) => {
                node.textContent = `${Math.round(latest)}${suffix}`;
            },
            onComplete: () => {
                node.textContent = `${value}${suffix}`;
            },
        });
        return () => controls.stop();
    }, [value, suffix, duration, reduceMotion]);

    return (
        <span ref={ref} className={`tabular ${className}`}>
            {value}
            {suffix}
        </span>
    );
}

export default AnimatedNumber;
