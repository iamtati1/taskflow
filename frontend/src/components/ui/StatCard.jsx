import { motion } from "framer-motion";

import Card from "./Card";
import AnimatedNumber from "./AnimatedNumber";
import { rise } from "../../utils/motion";

// One statistic: a tinted icon, a large counting number and its label,
// with a thin bar in the stat's colour along the top. The border lights
// up gently on hover. Use inside a stagger container to cascade in.
//   tone  accent (interactive), brand, amber, rose, emerald
const TONES = {
    accent: { icon: "bg-cyan-400/12 text-cyan-300", bar: "from-cyan-400/80", hover: "hover:border-cyan-400/30" },
    brand: { icon: "bg-brand-a/12 text-brand-a", bar: "from-brand-a/80", hover: "hover:border-brand-a/30" },
    amber: { icon: "bg-amber-400/12 text-amber-200", bar: "from-amber-400/80", hover: "hover:border-amber-400/30" },
    rose: { icon: "bg-rose-500/12 text-rose-300", bar: "from-rose-400/80", hover: "hover:border-rose-400/30" },
    emerald: { icon: "bg-emerald-400/12 text-emerald-300", bar: "from-emerald-400/80", hover: "hover:border-emerald-400/30" },
};

function StatCard({ icon: Icon, value, label, tone = "accent", suffix = "" }) {
    const t = TONES[tone];

    return (
        <motion.div variants={rise} className="h-full">
            <Card padding="md" className={`relative h-full overflow-hidden sm:p-5 ${t.hover}`}>
                <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${t.bar} to-transparent`} />
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.icon}`}>
                    <Icon size={19} aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-[2rem] font-bold leading-none text-white">
                    <AnimatedNumber value={value} suffix={suffix} />
                </h3>
                <p className="mt-1.5 text-sm text-white/60">
                    {label}
                </p>
            </Card>
        </motion.div>
    );
}

export default StatCard;
