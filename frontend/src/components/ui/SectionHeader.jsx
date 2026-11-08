// The compact heading at the top of a section: an icon, a small uppercase
// label, an optional count and an optional action on the right.
//   tone  brand (theme light), accent (interactive), or a status colour
const TONES = {
    brand: "text-brand-a",
    accent: "text-cyan-300",
    amber: "text-amber-200",
    rose: "text-rose-300",
    emerald: "text-emerald-300",
    muted: "text-white/60",
};

function SectionHeader({ icon: Icon, children, tone = "brand", count, action, as: Heading = "h2", id }) {
    return (
        <div className="flex items-center gap-2">
            <Heading
                id={id}
                className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] ${TONES[tone]}`}
            >
                {Icon && <Icon size={15} aria-hidden="true" />}
                {children}
            </Heading>

            {count !== undefined && (
                <span className="tabular rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/60">
                    {count}
                </span>
            )}

            {action && <div className="ml-auto">{action}</div>}
        </div>
    );
}

export default SectionHeader;
