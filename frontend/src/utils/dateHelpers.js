export const formatDateKey = (date) => {
    return new Date(date).toISOString().split("T")[0];
};

export const isSameDay = (a, b) => {
    return formatDateKey(a) === formatDateKey(b);
};

export const groupTasksByDate = (tasks = []) => {
    return tasks.reduce((acc, task) => {
        const key = task.date ? formatDateKey(task.date) : "no-date";

        if (!acc[key]) acc[key] = [];
        acc[key].push(task);

        return acc;
    }, {});
};