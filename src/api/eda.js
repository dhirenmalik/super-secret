const DEFAULT_BASE_URL = 'http://localhost:8000';

export const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL;
};

export const fetchExcludeAnalysis = async (groupBy = 'L3', token = null, modelId = null) => {
    const params = new URLSearchParams({ group_by: groupBy });
    if (modelId) params.append('model_id', modelId);

    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${getApiBaseUrl()}/api/v1/eda/exclude-analysis?${params.toString()}`, {
        headers: headers
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch exclude analysis data');
    }
    return response.json();
};

export const updateRelevance = async (category, relevant, token = null, modelId = null) => {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${getApiBaseUrl()}/api/v1/eda/relevance`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ category, relevant, model_id: modelId }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update relevance');
    }
    return response.json();
};

export const fetchBrandExclusion = async (fileId, token = null, modelId = null) => {
    const params = new URLSearchParams();
    if (modelId) params.append('model_id', modelId);

    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${getApiBaseUrl()}/api/v1/files/${fileId}/brand-exclusion?${params.toString()}`, {
        headers: headers
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch brand exclusion data');
    }
    return response.json();
};

export const buildBrandStack = async (fileId, payload, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${getApiBaseUrl()}/api/v1/files/${fileId}/build-stack`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to build stack');
    }
    return response.json();
};

export const fetchBuiltStack = async (fileId, stackType = 'brand', token = null) => {
    const params = new URLSearchParams();
    if (stackType) params.append('stack_type', stackType);

    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${getApiBaseUrl()}/api/v1/files/${fileId}/build-stack?${params.toString()}`, {
        headers: headers
    });

    if (response.status === 404) {
        return null; // Not built yet
    }
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch built stack');
    }
    return response.json();
};

