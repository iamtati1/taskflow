import AnalyticsPanel from "../AnalyticsPanel";
import MotivationalCard from "../MotivationalCard";
import AIPlanCard from "../AIPlanCard";
import { motion } from "framer-motion";

function InsightBlock({
    tasks = [],
    completedTasks = [],
    activeTasks = [],
    completionRate = 0,
    selectedTask = null,
    status = "idle",
}) {

    // =====================================================
    // ENGINE DERIVED STATE (LOCAL INTELLIGENCE LAYER)
    // =====================================================
    const hasTasks = tasks.length > 0;
    const isEmpty = !hasTasks;
    const isLoading = status === "loading";

    const selectedTaskSafe = selectedTask || null;

    // AI readiness signal (future-proofing)
    const hasContext = selectedTaskSafe || tasks.length > 0;

    return (
        <motion.aside
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="
                dashboard-section 
                xl:pl-6 
                xl:sticky 
                xl:top-6 
                h-fit
            "
        >

            <div className="space-y-6">

                {/* =====================================================
                    ANALYTICS PANEL (ENGINE FEED)
                ===================================================== */}
                <AnalyticsPanel
                    totalTasks={tasks.length}
                    completedTasks={completedTasks.length}
                    activeTasks={activeTasks.length}
                    completionRate={completionRate}
                    isLoading={isLoading}
                />

                {/* =====================================================
                    MOTIVATION (STATE-AWARE)
                ===================================================== */}
                <MotivationalCard
                    tasks={tasks}
                    isEmpty={isEmpty}
                    completionRate={completionRate}
                />

                {/* =====================================================
                    AI PLAN (CONTEXT-AWARE ENGINE)
                ===================================================== */}
                <AIPlanCard
                    task={selectedTaskSafe}
                    hasContext={hasContext}
                    isEmpty={isEmpty}
                />

                {/* =====================================================
                    EMPTY STATE SUPPORT (NEW UX LAYER)
                ===================================================== */}
                {isEmpty && (
                    <div className="
                        rounded-2xl
                        border border-white/10
                        bg-white/5
                        p-6
                        text-center
                        text-white/50
                        text-sm
                    ">
                        No insights yet — start creating tasks to unlock your productivity engine.
                    </div>
                )}

            </div>

        </motion.aside>
    );
}

export default InsightBlock;