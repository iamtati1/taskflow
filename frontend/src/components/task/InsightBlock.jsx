import AnalyticsPanel from "../AnalyticsPanel";
import MotivationalCard from "../MotivationalCard";
import AIPlanCard from "../AIPlanCard";

function InsightBlock({
    tasks,
    completedTasks,
    completionRate,
    selectedTask,
}) {
    return (
        <div className="dashboard-section xl:pl-6 xl:sticky xl:top-6 h-fit">

            <div className="space-y-6">

                {/* NO WRAPPER CARDS HERE — THEY OWN THEIR OWN STYLE */}
                <AnalyticsPanel
                    totalTasks={tasks.length}
                    completedTasks={completedTasks}
                    completionRate={completionRate}
                />

                <MotivationalCard tasks={tasks} />

                <AIPlanCard task={selectedTask} />

            </div>

        </div>
    );
}

export default InsightBlock;