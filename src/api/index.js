/**
 * Placeholder API module.
 * Replace these stubs with real HTTP calls (e.g. fetch / axios) when the backend is ready.
 */

const simulateDelay = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Step Status ───────────────────────────────────────────
export const fetchStepStatus = async (stepId) => {
    await simulateDelay();
    // TODO: GET /api/steps/{stepId}/status
    return { stepId, status: 'not_started', progress: 0 };
};

export const updateStepStatus = async (stepId, status) => {
    await simulateDelay();
    // TODO: PUT /api/steps/{stepId}/status
    console.log(`[API STUB] updateStepStatus(${stepId}, ${status})`);
    return { success: true };
};

// ─── Task Status ───────────────────────────────────────────
export const fetchTaskStatus = async (stepId, taskId) => {
    await simulateDelay();
    // TODO: GET /api/steps/{stepId}/tasks/{taskId}
    return { stepId, taskId, completed: false };
};

export const updateTaskStatus = async (stepId, taskId, completed) => {
    await simulateDelay();
    // TODO: PUT /api/steps/{stepId}/tasks/{taskId}
    console.log(`[API STUB] updateTaskStatus(${stepId}, ${taskId}, ${completed})`);
    return { success: true };
};

// ─── File Operations ───────────────────────────────────────
export const uploadFile = async (file) => {
    await simulateDelay(1500);
    // TODO: POST /api/files/upload
    console.log(`[API STUB] uploadFile(${file?.name})`);
    return { success: true, fileId: 'mock-file-id-' + Date.now(), name: file?.name };
};

export const downloadFile = async (fileId) => {
    await simulateDelay();
    // TODO: GET /api/files/{fileId}/download
    console.log(`[API STUB] downloadFile(${fileId})`);
    return { success: true, url: '#' };
};

// ─── Query Operations ──────────────────────────────────────
export const runQuery = async (query) => {
    await simulateDelay(2000);
    // TODO: POST /api/queries/run
    console.log(`[API STUB] runQuery(${query})`);
    return {
        success: true,
        rows: 0,
        message: 'Query executed successfully (mock)',
    };
};

// ─── Report Operations ─────────────────────────────────────
export const generateReport = async (stepId, params = {}) => {
    await simulateDelay(2000);
    // TODO: POST /api/reports/generate
    console.log(`[API STUB] generateReport(${stepId})`, params);
    return {
        success: true,
        reportId: 'mock-report-' + Date.now(),
        message: 'Report generated successfully (mock)',
    };
};

// ─── Connection Operations ─────────────────────────────────
export const testConnection = async (config) => {
    await simulateDelay(1200);
    // TODO: POST /api/connections/test
    console.log(`[API STUB] testConnection`, config);
    return { success: true, message: 'Connection successful (mock)' };
};

// ─── Brand Operations ──────────────────────────────────────
export const fetchBrands = async (categoryId) => {
    await simulateDelay();
    // TODO: GET /api/brands?category={categoryId}
    return {
        brands: [
            { id: 1, name: 'Brand A', status: 'included', coverage: '12.4%' },
            { id: 2, name: 'Brand B', status: 'included', coverage: '9.8%' },
            { id: 3, name: 'Brand C', status: 'excluded', coverage: '2.1%' },
            { id: 4, name: 'Brand D', status: 'included', coverage: '7.5%' },
            { id: 5, name: 'Private Label', status: 'excluded', coverage: '15.2%' },
        ],
    };
};

export const updateBrandStatus = async (brandId, status) => {
    await simulateDelay();
    // TODO: PUT /api/brands/{brandId}/status
    console.log(`[API STUB] updateBrandStatus(${brandId}, ${status})`);
    return { success: true };
};

// ─── Pipeline Status ───────────────────────────────────────
export const fetchPipelineStatus = async () => {
    await simulateDelay();
    // TODO: GET /api/pipeline/status
    return {
        totalSteps: 11,
        completed: 0,
        inProgress: 0,
        blocked: 0,
    };
};
