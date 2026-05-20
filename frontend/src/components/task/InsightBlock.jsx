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

                <div className="flow-card p-5 hover-lift">
                    <AnalyticsPanel
                        totalTasks={tasks.length}
                        completedTasks={completedTasks}
                        completionRate={completionRate}
                    />
                </div>

                <div className="flow-card p-5 hover-lift">
                    <MotivationalCard tasks={tasks} />
                </div>

                <div className="flow-card p-5 hover-lift">
                    <AIPlanCard task={selectedTask} />
                </div>

            </div>

        </div>
    );
}

export default InsightBlock;