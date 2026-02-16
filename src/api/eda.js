const DEFAULT_BASE_URL = 'http://localhost:8000';

export const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL;
};

export const fetchExcludeAnalysis = async (groupBy = 'L3') => {
    const params = new URLSearchParams({ group_by: groupBy });
    const response = await fetch(`${getApiBaseUrl()}/api/v1/eda/exclude-analysis?${params.toString()}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch exclude analysis data');
    }
    return response.json();
};

export const updateRelevance = async (category, relevant) => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/eda/relevance`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category, relevant }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update relevance');
    }
    return response.json();
};
