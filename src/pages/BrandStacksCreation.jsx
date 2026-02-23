import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import { useAuth } from '../context/AuthContext';
import { fetchLatestFile, getApiBaseUrl } from '../api/kickoff';
import { buildBrandStack, fetchBuiltStack } from '../api/eda';
import { Loader2, CheckCircle, AlertTriangle, Play, Eye } from 'lucide-react';
import { formatCurrencyMillions } from '../utils/formatters';

const step = steps.find((s) => s.slug === 'brand-stacks-creation');

export default function BrandStacksCreation() {
    const { token } = useAuth();
    const [isBuilding, setIsBuilding] = useState(false);
    const [buildResult, setBuildResult] = useState(null);
    const [error, setError] = useState(null);
    const [stackType, setStackType] = useState('brand');
    const [models, setModels] = useState([]);
    const [activeModelId, setActiveModelId] = useState(localStorage.getItem('active_model_id') || '');
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        setIsLoadingModels(true);
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/models`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setModels(data);
            if (data.length > 0 && !activeModelId) {
                setActiveModelId(data[0].model_id.toString());
                localStorage.setItem('active_model_id', data[0].model_id);
            }
        } catch (error) {
            console.error('Error fetching models:', error);
        } finally {
            setIsLoadingModels(false);
        }
    };

    useEffect(() => {
        if (activeModelId) {
            checkExistingStack();
        }
    }, [activeModelId, stackType]);

    const checkExistingStack = async () => {
        setBuildResult(null);
        setError(null);
        try {
            const latestFile = await fetchLatestFile('exclude_flags_raw', token, activeModelId);
            if (!latestFile) return; // Can't fetch stack if no exclude file

            const result = await fetchBuiltStack(latestFile.file_id, stackType, token);
            if (result) {
                setBuildResult(result);
            }
        } catch (err) {
            console.error("Failed to check existing stack:", err);
            // Don't show error to user just because it wasn't built yet
        }
    };

    const handleBuildStack = async () => {
        try {
            setIsBuilding(true);
            setError(null);
            setBuildResult(null);

            // Fetch the raw exclude flags file to get the file Id
            const latestFile = await fetchLatestFile('exclude_flags_raw', token, activeModelId);
            if (!latestFile) {
                throw new Error("Missing Exclude Flags file for selected model. Please complete Phase 1 / Phase 2 first.");
            }

            const payload = { stack_type: stackType };
            const result = await buildBrandStack(latestFile.file_id, payload, token);
            setBuildResult(result);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to build brand stacks.");
        } finally {
            setIsBuilding(false);
        }
    };

    return (
        <div>
            <PageHeader
                title={step.name}
                subtitle="Create total category stack and aggregated brand stacks for data prep and modeling."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
            >
                <StatusBadge status={buildResult ? 'completed' : 'not_started'} />
            </PageHeader>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold text-sm">Failed to build stacks</h4>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid-2">
                {/* Tasks */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon blue">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 11l3 3L22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                </svg>
                            </div>
                            Tasks
                        </div>
                    </div>
                    <TaskList tasks={step.tasks} />
                </div>

                {/* Stack Builder Controls */}
                <div className="card">
                    <div className="card-header pb-0 border-b border-slate-100 flex flex-col gap-4">
                        <div className="flex justify-between items-center w-full">
                            <div className="card-title">
                                <div className="card-title-icon green">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="6" width="20" height="4" rx="1" />
                                        <rect x="2" y="14" width="20" height="4" rx="1" />
                                    </svg>
                                </div>
                                Stack Builder
                            </div>
                        </div>
                        {/* Model Selector inserted here */}
                        <div className="flex items-center gap-4 py-3">
                            <span className="text-sm font-medium text-slate-700">Active Model:</span>
                            <div className="w-64">
                                <select
                                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                                    value={activeModelId}
                                    onChange={(e) => {
                                        setActiveModelId(e.target.value);
                                        localStorage.setItem('active_model_id', e.target.value);
                                        setBuildResult(null); // Clear previous results when switching model
                                    }}
                                    disabled={isLoadingModels}
                                >
                                    <option value="">-- Select Model --</option>
                                    {models.map(m => (
                                        <option key={m.model_id} value={m.model_id}>{m.model_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Stack Type</label>
                        <select
                            className="form-input form-select"
                            value={stackType}
                            onChange={(e) => setStackType(e.target.value)}
                        >
                            <option value="total">cleanbrand_agg</option>
                            <option value="brand">Aggregated Brand Stack</option>
                        </select>
                    </div>

                    <div className="form-group opacity-50 pointer-events-none">
                        <label className="form-label">Aggregation Level (Coming Soon)</label>
                        <select className="form-input form-select" disabled>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleBuildStack}
                            disabled={isBuilding}
                            className={`btn ${isBuilding ? 'bg-blue-400 text-white border-blue-400 cursor-wait' : 'btn-primary'}`}
                        >
                            {isBuilding ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Building Stacks...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Build Stack Pipeline
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stack Output Preview & QA Metrics */}
            {buildResult && (
                <div className="card mt-6">
                    <div className="card-header border-b border-slate-100 pb-4 mb-4">
                        <div className="card-title">
                            <div className="card-title-icon yellow">
                                <CheckCircle className="w-4 h-4" />
                            </div>
                            Pipeline Execution Success
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">Generated Output Files</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">CSV</div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700 m-0">cleanbrand_agg.csv</p>
                                            <p className="text-[11px] text-slate-500 m-0 mt-0.5">Category Stack Base</p>
                                        </div>
                                    </div>
                                    <StatusBadge status="completed" />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">CSV</div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700 m-0">aggbrand_modelingstack.csv</p>
                                            <p className="text-[11px] text-slate-500 m-0 mt-0.5">Aggregated Brand Model</p>
                                        </div>
                                    </div>
                                    <StatusBadge status="completed" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">Quality Assurance Metrics</h4>
                            <div className="space-y-3">
                                <div className={`p-3 border rounded-lg ${buildResult.totals_match_flag?.sales_match ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-slate-700">Total Sales Validation</span>
                                        {buildResult.totals_match_flag?.sales_match ? (
                                            <span className="text-xs font-bold text-green-600 uppercase tracking-wide flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Match</span>
                                        ) : (
                                            <span className="text-xs font-bold text-red-600 uppercase tracking-wide flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Mismatch</span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <p className="text-slate-500 m-0 mb-1">Expected (Base)</p>
                                            <p className="font-mono font-semibold text-slate-800 m-0">{formatCurrencyMillions(buildResult.actual_values?.sales?.flag_value)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 m-0 mb-1">Actual (Generated)</p>
                                            <p className="font-mono font-semibold text-slate-800 m-0">{formatCurrencyMillions(buildResult.actual_values?.sales?.df_value)}</p>
                                        </div>
                                    </div>
                                    {!buildResult.totals_match_flag?.sales_match && (
                                        <p className="text-[11px] text-red-600 mt-2 font-medium">{buildResult.reason?.sales_reason}</p>
                                    )}
                                </div>

                                <div className={`p-3 border rounded-lg ${buildResult.totals_match_flag?.spends_match ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-slate-700">Total Media Spends Validation</span>
                                        {buildResult.totals_match_flag?.spends_match ? (
                                            <span className="text-xs font-bold text-green-600 uppercase tracking-wide flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Match</span>
                                        ) : (
                                            <span className="text-xs font-bold text-red-600 uppercase tracking-wide flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Mismatch</span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <p className="text-slate-500 m-0 mb-1">Expected (Base)</p>
                                            <p className="font-mono font-semibold text-slate-800 m-0">{formatCurrencyMillions(buildResult.actual_values?.spends?.flag_value)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 m-0 mb-1">Actual (Generated)</p>
                                            <p className="font-mono font-semibold text-slate-800 m-0">{formatCurrencyMillions(buildResult.actual_values?.spends?.df_value)}</p>
                                        </div>
                                    </div>
                                    {!buildResult.totals_match_flag?.spends_match && (
                                        <p className="text-[11px] text-red-600 mt-2 font-medium">{buildResult.reason?.spends_reason}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '20px' }}>
                <AutomationNote notes={step.automationNotes} />
            </div>
        </div>
    );
}
