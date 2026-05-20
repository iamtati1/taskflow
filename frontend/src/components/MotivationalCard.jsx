function MotivationalCard({ tasks = [] }) {
    const completed = tasks.filter((t) => t.is_complete).length;
    const total = tasks.length;

    let message = "Start small. Build momentum.";
    let subtext = "Consistency beats intensity.";

    if (total > 0 && completed === total) {
        message = "You finished everything 🎉";
        subtext = "Reset, refine, and keep the momentum going.";
    } else if (completed > 0) {
        message = "You're making progress.";
        subtext = "Keep showing up — you're building something real.";
    }

    return (
        <div className="flow-card p-5 space-y-4 hover-lift">

            {/* HEADER */}
            <div className="space-y-1">
                <h3 className="text-section">
                    Daily Focus
                </h3>

                <div className="accent-line" />
            </div>

            {/* MESSAGE */}
            <div className="space-y-1">
                <p className="text-body font-medium">
                    {message}
                </p>

                <p className="text-muted">
                    {subtext}
                </p>
            </div>

            {/* FOOTER */}
            <div className="divider-soft pt-2 text-xs text-muted">
                {total === 0
                    ? "No tasks yet — create your first goal."
                    : `${completed} of ${total} tasks completed`}
            </div>

        </div>
    );
}

export default MotivationalCard;