function UpcomingTasks({ tasks = [] }) {
    const upcoming = (tasks || [])
        .filter(t => !t?.is_complete)
        .slice(0, 5);

    return (
        <div className="flow-card relative overflow-hidden p-6">

            {/* glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-cyan-400/5 pointer-events-none" />

            <div className="relative z-10 space-y-5">

                <div className="flex items-center justify-between">
                    <h3 className="text-sm uppercase tracking-[0.2em] text-white/40">
                        Upcoming
                    </h3>

                    <span className="text-xs text-white/30">
                        {upcoming.length} tasks
                    </span>
                </div>

                {upcoming.length === 0 ? (
                    <p className="text-white/40 text-sm">
                        No upcoming tasks — your space is clear.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {upcoming.map((task) => (
                            <div
                                key={task.task_id}
                                className="group flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                            >
                                <div className="w-2 h-2 rounded-full bg-cyan-400/60" />

                                <span className="text-sm text-white/70 group-hover:text-white transition">
                                    {task.title}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}