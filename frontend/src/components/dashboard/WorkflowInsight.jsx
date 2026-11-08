import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CalendarClock, CheckCircle2, Lightbulb, Target } from "lucide-react";

import Card from "../ui/Card";
import SectionHeader from "../ui/SectionHeader";

// One short note about the workload, from today's counts only: nothing
// here claims a trend or history the app doesn't record
export const insightFor = ({ total, active, completed, overdue, dueToday }) => {
    const n = (count, one, many) => `${count} ${count === 1 ? one : many}`;

    if (total === 0)
        return { tone: "brand", text: "Add a few tasks and this note will reflect how your workload is going." };
    if (active === 0)
        return { tone: "emerald", text: "Everything on your list is done. A good moment to plan what's next." };
    if (overdue > 0)
        return {
            tone: "rose",
            text: `${n(overdue, "task is", "tasks are")} overdue. Finishing or rescheduling ${overdue === 1 ? "it" : "them"} first will lighten everything else.`,
        };
    if (dueToday > 0)
        return {
            tone: "amber",
            text: `${n(dueToday, "task is", "tasks are")} due today. Clearing ${dueToday === 1 ? "it" : "them"} keeps tomorrow free.`,
        };
    if (active === 1)
        return { tone: "brand", text: "One task left. Finish it and your list is clear." };
    if (completed >= active)
        return { tone: "emerald", text: `You've finished ${completed} of ${total} tasks. Your workload looks balanced.` };
    return { tone: "brand", text: "You have more open than finished work. Consider closing a few tasks before adding new ones." };
};

const TONES = {
    brand: { icon: Target, tile: "bg-brand-c/12 text-brand-c" },
    emerald: { icon: CheckCircle2, tile: "bg-emerald-400/12 text-emerald-300" },
    rose: { icon: AlertCircle, tile: "bg-rose-500/12 text-rose-300" },
    amber: { icon: CalendarClock, tile: "bg-amber-400/12 text-amber-200" },
};

// Shown when "Productivity insights" is on in Settings; otherwise a quiet
// note saying where to turn it on
function WorkflowInsight({ enabled, counts }) {
    if (!enabled) {
        return (
            <Card variant="subtle" className="h-full">
                <p className="flex items-center gap-2 text-sm text-white/60">
                    <Lightbulb size={16} aria-hidden="true" />
                    Insights are off. Turn on Workflow insights in Settings to see a note about your workload.
                </p>
            </Card>
        );
    }

    const { tone, text } = insightFor(counts);
    const { icon: Icon, tile } = TONES[tone];

    return (
        <Card className="h-full">
            <SectionHeader icon={Lightbulb} tone="brandAlt">Workflow Insight</SectionHeader>

            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={text}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                    className="mt-5 flex items-start gap-3"
                >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${tile}`}>
                        <Icon size={18} aria-hidden="true" />
                    </span>
                    <p className="leading-relaxed text-white/80">{text}</p>
                </motion.div>
            </AnimatePresence>
        </Card>
    );
}

export default WorkflowInsight;
