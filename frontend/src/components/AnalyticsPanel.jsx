function AnalyticsPanel({
    totalTasks = 0,
    completedTasks = 0,
    completionRate = 0,
}) {
    let insight = "Start completing tasks to see insights.";

    if (totalTasks > 0 && completionRate === 100) {
        insight = "Perfect score. You completed everything 🎉";
    } else if (completionRate >= 50) {
        insight = "You’re more than halfway there. Keep going.";
    } else if (totalTasks > 0) {
        insight = "Focus on completing your current tasks.";
    }

    return (
        <div className="flow-card p-5 space-y-6 hover-lift">

            {/* =========================
                HEADER
            ========================= */}
            <div className="space-y-1">
                <h2 className="text-section">
                    Progress Overview
                </h2>

                <div className="accent-line" />
            </div>

            {/* =========================
                METRICS GRID
            ========================= */}
            <div className="grid grid-cols-3 gap-4 text-center">

                <div className="space-y-1">
                    <p className="stat-label">Total</p>
                    <p className="stat-number">{totalTasks}</p>
                </div>

                <div className="space-y-1">
                    <p className="stat-label">Done</p>
                    <p className="stat-number text-cyan-300">
                        {completedTasks}
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="stat-label">Rate</p>
                    <p className="stat-number text-violet-300">
                        {completionRate}%
                    </p>
                </div>

            </div>

            {/* =========================
                DIVIDER
            ========================= */}
            <div className="divider-soft" />

            {/* =========================
                INSIGHT SECTION
            ========================= */}
            <div className="space-y-3">

                <p className="text-body leading-relaxed">
                    {insight}
                </p>

                <p className="text-muted text-xs">
                    Based on your current task completion patterns
                </p>

            </div>

        </div>
    );
}

export default AnalyticsPanel;