import { AlertCircle, CalendarClock, CalendarDays } from "lucide-react";

import { dueStatus, formatDueDate } from "../../utils/dates";

const STYLES = {
    overdue: "border-rose-400/25 bg-rose-500/10 text-rose-300",
    today: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    tomorrow: "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-200",
    later: "border-white/10 bg-white/[0.04] text-white/60",
};

const ICONS = { overdue: AlertCircle, today: CalendarClock, tomorrow: CalendarClock, later: CalendarDays };

// A task's due date as a small coloured label: rose when overdue, amber
// when due today. Finished tasks show the date plainly (nothing is urgent).
function DueChip({ dueDate, done = false }) {
    const status = dueStatus(dueDate);
    if (!status) return null;

    const kind = done ? "later" : status.kind;
    const text = done && status.kind === "overdue"
        ? `Due ${formatDueDate(dueDate, { month: "short", day: "numeric" })}`
        : status.text;
    const Icon = ICONS[kind];

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[kind]}`}>
            <Icon size={12} aria-hidden="true" />
            {text}
        </span>
    );
}

export default DueChip;
