export const sortTasksByPriority = (tasks = []) => {
    const order = { high: 1, medium: 2, low: 3 };

    return [...tasks].sort(
        (a, b) => order[a.priority] - order[b.priority]
    );
};

export const filterCompleted = (tasks = []) =>
    tasks.filter((t) => t.is_complete);

export const filterActive = (tasks = []) =>
    tasks.filter((t) => !t.is_complete);

export const getTaskProgress = (tasks = []) => {
    if (!tasks.length) return 0;

    const completed = tasks.filter((t) => t.is_complete).length;
    return Math.round((completed / tasks.length) * 100);
};