function AIPlanCard({ task }) {
    if (!task) {
        return (
            <div className="flow-card p-6 text-muted hover-lift">
                Select a task to generate an AI execution plan ✨
            </div>
        );
    }

    return (
        <div className="flow-card p-6 space-y-4 hover-lift fade-in">

            {/* HEADER */}
            <div className="space-y-1">
                <h2 className="text-section">
                    AI Execution Plan
                </h2>

                <p className="text-muted">
                    Strategic breakdown for:
                </p>
            </div>

            {/* TASK BLOCK */}
            <div className="flow-card p-4 space-y-3">

                <h3 className="text-title text-cyan-300">
                    {task.title}
                </h3>

                <div className="space-y-2 text-body">
                    <p>1. Break the task into smaller milestones.</p>
                    <p>2. Allocate focused deep-work time.</p>
                    <p>3. Remove distractions before starting.</p>
                    <p>4. Complete the highest-impact portion first.</p>
                </div>

            </div>

        </div>
    );
}

export default AIPlanCard;