const DEFAULT_BASE_URL = 'http://localhost:8000';

export const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL;
};

export const uploadCsv = async (file, category = null, token = null) => {
    const formData = new FormData();
    formData.append('file', file);

    const url = new URL(`${getApiBaseUrl()}/api/v1/files/upload`);
    if (category) {
        url.searchParams.append('category', category);
    }

    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData,
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Upload failed');
    }

    return response.json();
};

export const fetchFiles = async (token = null) => {
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${getApiBaseUrl()}/api/v1/files`, {
        headers: headers
    });
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to fetch files');
    }
    return response.json();
};

export const deleteFile = async (fileId, token = null) => {
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${getApiBaseUrl()}/api/v1/files/${fileId}`, {
        method: 'DELETE',
        headers: headers
    });
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to delete file');
    }
    return response.json();
};

export const fetchLatestFile = async (token = null) => {
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${getApiBaseUrl()}/api/v1/files/latest`, {
        headers: headers
    });
    if (!response.ok) {
        if (response.status === 404) return null;
        const message = await response.text();
        throw new Error(message || 'Failed to fetch latest file');
    }
    return response.json();
};

export const fetchPreview = async (fileId, rows = 5, token = null) => {
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/preview?rows=${rows}`,
        { headers: headers }
    );

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Preview failed');
    }

    return response.json();
};

export const fetchSubcategorySummary = async (fileId, options = {}, token = null) => {
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
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/subcategory-summary${query ? `?${query}` : ''}`,
        { headers: headers }
    );

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Summary failed');
    }

    return response.json();
};

export const fetchL2Values = async (fileId, token = null) => {
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/l2-values`,
        { headers: headers }
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load L2 values');
    }
    return response.json();
};

export const fetchModelGroups = async (fileId, token = null) => {
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/model-groups`,
        { headers: headers }
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load model groups');
    }
    return response.json();
};

export const previewAutoModelGroups = async (fileId, referencePath, token = null) => {
    const params = new URLSearchParams();
    params.set('reference_path', referencePath);
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/model-groups/auto/preview?${params.toString()}`,
        { headers: headers }
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to auto-group model groups');
    }
    return response.json();
};

export const applyAutoModelGroups = async (fileId, referencePath, persist = true, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/model-groups/auto`,
        {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ reference_path: referencePath, persist }),
        },
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to apply auto grouping');
    }
    return response.json();
};

export const saveModelGroups = async (fileId, groups, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/model-groups`,
        {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ groups }),
        },
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to save model groups');
    }
    return response.json();
};

export const fetchL3Analysis = async (fileId, options = {}, token = null) => {
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
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/l3-analysis${query ? `?${query}` : ''}`,
        { headers: headers }
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load L3 analysis');
    }
    return response.json();
};

export const fetchCorrelation = async (fileId, token = null) => {
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/correlation`,
        { headers: headers }
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load correlation');
    }
    return response.json();
};

export const fetchWeeklySales = async (fileId, metric = 'sales', token = null) => {
    const params = new URLSearchParams();
    if (metric) {
        params.set('metric', metric);
    }
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/weekly-sales?${params.toString()}`,
        { headers: headers }
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load weekly sales');
    }
    return response.json();
};

export const fetchModelGroupWeeklySales = async (fileId, token = null) => {
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/model-group-weekly-sales`,
        { headers: headers }
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load model group weekly sales');
    }
    return response.json();
};

export const fetchModelGroupWeeklyMetrics = async (fileId, payload, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/model-group-weekly-metrics`,
        {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        },
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load model group metrics');
    }
    return response.json();
};
export const fetchChartSelection = async (fileId, token = null) => {
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/selections`,
        { headers: headers }
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load chart selection');
    }
    return response.json();
};

export const saveChartSelection = async (fileId, l2Values, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/${fileId}/selections`,
        {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ l2_values: l2Values }),
        },
    );
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to save chart selection');
    }
    return response.json();
};

export const fetchComments = async (fileId, token = null) => {
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${getApiBaseUrl()}/api/v1/files/${fileId}/comments`, {
        headers: headers
    });
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to fetch comments');
    }
    return response.json();
};

export const addComment = async (fileId, text, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${getApiBaseUrl()}/api/v1/files/${fileId}/comments`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ comment_text: text }),
    });
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to add comment');
    }
    return response.json();
};

export const updateReportStatus = async (fileId, status, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${getApiBaseUrl()}/api/v1/files/${fileId}/status`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ status }),
    });
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to update status');
    }
    return response.json();
};
