import { useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import MonthView from "../components/calendar/MonthView";
import WeekView from "../components/calendar/WeekView";
import DayAgenda from "../components/calendar/DayAgenda";
import useCalendarDrag from "../components/calendar/useCalendarDrag";
import TasksLoadState from "../components/tasks/TasksLoadState";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import PillGroup from "../components/ui/PillGroup";
import useTasks from "../hooks/useTasks";
import useTaskSheet from "../hooks/useTaskSheet";
import { VIEWS, isDateKey, step, tasksByDay, viewHeading } from "../utils/calendar";
import { toDateKey } from "../utils/dates";
import { rise, stagger } from "../utils/motion";

const VIEW_LABELS = { month: "Month", week: "Week", day: "Day" };
const UNIT = { month: "month", week: "week", day: "day" };

// Phones open on the Day view; wider screens on the month
const defaultView = () =>
    typeof window !== "undefined" && window.matchMedia?.("(max-width: 639px)").matches ? "day" : "month";

// Tasks by due date, as a month, a week or a day. The view and the selected
// day live in the address (?view=week&date=2026-11-10), so a reload, the
// Back button or a link (the Dashboard's calendar) lands on the same day;
// switching views keeps the day.
function Calendar() {
    const taskState = useTasks();
    const { tasks, status, error, refreshTasks, activeActions } = taskState;

    const newTaskButton = useRef(null);
    const { openDetails, openNewTask, toggle, reschedule, dialog } = useTaskSheet(taskState, { newTaskButton });

    const [params, setParams] = useSearchParams();
    const today = toDateKey(new Date());
    const view = VIEWS.includes(params.get("view")) ? params.get("view") : defaultView();
    const selected = isDateKey(params.get("date")) ? params.get("date") : today;

    const go = (changes) =>
        setParams(
            (current) => {
                const next = new URLSearchParams(current);
                Object.entries(changes).forEach(([key, value]) => next.set(key, value));
                return next;
            },
            { replace: true }
        );
    const select = (date) => go({ date });

    const days = useMemo(() => tasksByDay(tasks), [tasks]);
    const undated = tasks.filter((task) => !task.due_date && !task.is_complete).length;

    // Dragging a task onto a day moves it there (the time stays)
    const drag = useCalendarDrag((id, day) => reschedule(id, day));

    if (status === "loading" || error) {
        return <TasksLoadState status={status} error={error} onRetry={refreshTasks} />;
    }

    const heading = viewHeading(view, selected);
    const agenda = (headingLevel) => (
        <DayAgenda
            day={selected}
            today={today}
            tasks={days.get(selected) ?? []}
            activeActions={activeActions}
            onOpen={openDetails}
            onToggle={toggle}
            onAdd={openNewTask}
            taskDrag={drag.taskDrag}
            draggingId={drag.draggingId}
            headingLevel={headingLevel}
        />
    );

    return (
        <motion.div variants={stagger()} initial="hidden" animate="show" className="space-y-6">

            {/* HEADER */}
            <motion.div variants={rise} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white sm:text-4xl">Calendar</h1>
                    <p className="text-sm text-white/55">
                        Tasks by due date.{" "}
                        <span className="[@media(hover:none)]:hidden">Drag a task to another day to move it.</span>
                        <span className="hidden [@media(hover:none)]:inline">Open a task to move it to another day.</span>
                    </p>
                </div>
                <Button ref={newTaskButton} size="lg" leftIcon={Plus} onClick={() => openNewTask(selected)}>
                    New Task
                </Button>
            </motion.div>

            <motion.div variants={rise}>
                <Card padding="none" className="p-3 sm:p-5">
                    {/* TOOLBAR: today, back and forward, the period, the view */}
                    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-3">
                        <div className="flex items-center gap-1">
                            <Button size="sm" variant="secondary" onClick={() => select(today)} disabled={selected === today}>
                                Today
                            </Button>
                            <button
                                type="button"
                                onClick={() => select(step(view, selected, -1))}
                                aria-label={`Previous ${UNIT[view]}`}
                                className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white inline-flex items-center justify-center touch:min-h-11 touch:min-w-11"
                            >
                                <ChevronLeft size={18} aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                onClick={() => select(step(view, selected, 1))}
                                aria-label={`Next ${UNIT[view]}`}
                                className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white inline-flex items-center justify-center touch:min-h-11 touch:min-w-11"
                            >
                                <ChevronRight size={18} aria-hidden="true" />
                            </button>
                        </div>

                        <h2 aria-live="polite" className="min-w-0 flex-1 font-display text-lg font-semibold text-white sm:text-xl">
                            {heading}
                        </h2>

                        <PillGroup
                            label="View"
                            value={view}
                            onChange={(next) => go({ view: next, date: selected })}
                            options={VIEWS.map((value) => ({ value, label: VIEW_LABELS[value] }))}
                        />
                    </div>

                    {view === "month" && (
                        <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
                            <MonthView
                                selected={selected}
                                today={today}
                                days={days}
                                onSelect={select}
                                onOpen={openDetails}
                                drag={drag}
                            />
                            <div className="border-t border-white/[0.07] pt-4 2xl:border-l 2xl:border-t-0 2xl:pl-5 2xl:pt-0">
                                {agenda(3)}
                            </div>
                        </div>
                    )}

                    {view === "week" && (
                        <WeekView
                            selected={selected}
                            today={today}
                            days={days}
                            onSelect={select}
                            onOpen={openDetails}
                            onAdd={openNewTask}
                            drag={drag}
                        />
                    )}

                    {view === "day" && agenda(3)}

                    {undated > 0 && (
                        <p className="mt-5 border-t border-white/[0.07] pt-4 text-sm text-white/55">
                            {undated} open {undated === 1 ? "task has" : "tasks have"} no due date, so {undated === 1 ? "it isn't" : "they aren't"} on the calendar.{" "}
                            <Link to="/tasks" className="text-cyan-300 underline-offset-2 hover:underline">See them in Tasks</Link>
                        </p>
                    )}
                </Card>
            </motion.div>

            {dialog}
        </motion.div>
    );
}

export default Calendar;
