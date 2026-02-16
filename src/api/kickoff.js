const DEFAULT_BASE_URL = 'http://localhost:8000';

export const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL;
};

export const uploadCsv = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${getApiBaseUrl()}/api/v1/files/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Upload failed');
    }

    return response.json();
};

export const fetchPreview = async (fileId, rows = 5) => {
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/preview?rows=${rows}`,
    );

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Preview failed');
    }

    return response.json();
};

export const fetchSubcategorySummary = async (fileId, options = {}) => {
    const params = new URLSearchParams();
    if (options.startDate) {
        params.set('start_date', options.startDate);
    }
    if (options.endDate) {
        params.set('end_date', options.endDate);
    }
    if (options.groupBy) {
        params.set('group_by', options.groupBy);
    }
    if (options.autoBucket) {
        params.set('auto_bucket', 'true');
    }
    const query = params.toString();
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/subcategory-summary${query ? `?${query}` : ''}`,
    );

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Summary failed');
    }

    return response.json();
};

export const fetchL2Values = async (fileId) => {
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/l2-values`,
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load L2 values');
    }
    return response.json();
};

export const fetchModelGroups = async (fileId) => {
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/model-groups`,
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load model groups');
    }
    return response.json();
};

export const previewAutoModelGroups = async (fileId, referencePath) => {
    const params = new URLSearchParams();
    params.set('reference_path', referencePath);
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/model-groups/auto/preview?${params.toString()}`,
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to auto-group model groups');
    }
    return response.json();
};

export const applyAutoModelGroups = async (fileId, referencePath, persist = true) => {
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/model-groups/auto`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference_path: referencePath, persist }),
        },
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to apply auto grouping');
    }
    return response.json();
};

export const saveModelGroups = async (fileId, groups) => {
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/model-groups`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groups }),
        },
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to save model groups');
    }
    return response.json();
};

export const fetchL3Analysis = async (fileId, options = {}) => {
    const params = new URLSearchParams();
    if (options.limitL2) {
        params.set('limit_l2', options.limitL2);
    }
    if (options.rows) {
        params.set('rows', options.rows);
    }
    if (options.startDate) {
        params.set('start_date', options.startDate);
    }
    if (options.endDate) {
        params.set('end_date', options.endDate);
    }
    const query = params.toString();
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/l3-analysis${query ? `?${query}` : ''}`,
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load L3 analysis');
    }
    return response.json();
};

export const fetchCorrelation = async (fileId) => {
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/correlation`,
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load correlation');
    }
    return response.json();
};

export const fetchWeeklySales = async (fileId, metric = 'sales') => {
    const params = new URLSearchParams();
    if (metric) {
        params.set('metric', metric);
    }
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/weekly-sales?${params.toString()}`,
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load weekly sales');
    }
    return response.json();
};

export const fetchModelGroupWeeklySales = async (fileId) => {
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/model-group-weekly-sales`,
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load model group weekly sales');
    }
    return response.json();
};

export const fetchModelGroupWeeklyMetrics = async (fileId, payload) => {
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/model-group-weekly-metrics`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        },
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load model group metrics');
    }
    return response.json();
};
