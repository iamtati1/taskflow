export const formatAIResponse = (response) => {
    if (!response) return null;

    return {
        summary: response.summary ?? "",
        tasks: response.tasks ?? [],
        insights: response.insights ?? [],
    };
};

export const extractTasksFromAI = (response) => {
    return response?.tasks ?? [];
};

export const isValidAIResponse = (response) => {
    return response && typeof response === "object";
};