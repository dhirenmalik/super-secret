import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import { useAuth } from '../context/AuthContext';
import { fetchLatestFile, getApiBaseUrl } from '../api/kickoff';
import { buildBrandStack, fetchBuiltStack, updateStageStatus } from '../api/eda';
import { Loader2, CheckCircle, AlertTriangle, Play, Settings } from 'lucide-react';
import { formatCurrencyMillions } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import ModelGallery from '../components/ModelGallery';

export default function BrandStacksCreation({ mode, overrideStepSlug }) {
    const stepSlug = overrideStepSlug || 'brand-stacks-creation';
    const step = steps.find((s) => s.slug === stepSlug);
    const { token } = useAuth();
    const location = useLocation();

    const [isBuilding, setIsBuilding] = useState(false);
    const [buildResult, setBuildResult] = useState(null);
    const [error, setError] = useState(null);
    const [stackType, setStackType] = useState('brand');
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [activeModelId, setActiveModelId] = useState(localStorage.getItem('active_model_id') || '');
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    // Force Dashboard View on Sidebar Navigation
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('dashboard') === 'true') {
            setActiveModelId('');
            localStorage.removeItem('active_model_id');
        }
    }, [location.search]);

    // Add effect to find the active model object
    const activeModel = useMemo(() => {
        return models.find(m => m.model_id.toString() === activeModelId);
    }, [models, activeModelId]);

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

            // Re-fetch models to update the stack_built status if needed, though activeModel might be stale
            loadModels();
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to build brand stacks.");
        } finally {
            setIsBuilding(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            await updateStageStatus(activeModelId, 'brand', newStatus, token);
            // Reload models to refresh the UI status
            await loadModels();
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to update review status.");
        }
    };

    const isReadOnly = useMemo(() => {
        if (mode === 'reviewer') return true;
        return false;
    }, [mode]);

    const userRole = localStorage.getItem('role') || 'modeler'; // Assuming role is stored here for now, or get from AuthContext
    const isModeler = userRole === 'modeler' && mode !== 'reviewer';
    const isReviewer = userRole === 'reviewer' || mode === 'reviewer';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="brand-stacks-container min-h-screen bg-slate-50 relative pb-20"
        >
            <PageHeader
                title={step.name}
                subtitle="Build and review the final analytical stacks based on defined parameters."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
                activeModelId={activeModelId}
                models={models}
                onModelSwitch={setActiveModelId}
                showBackButton={!!activeModelId}
                onBack={() => {
                    setActiveModelId('');
                    setBuildResult(null);
                    setError(null);
                }}
            >
                {activeModel && (
                    <div className="flex items-center gap-3">
                        <StatusBadge status={activeModel.brand_status || 'not_started'} />

                        {/* Actions for Modeler */}
                        {isModeler && activeModel.brand_status !== 'in_review' && activeModel.brand_status !== 'approved' && buildResult && (
                            <button
                                onClick={() => handleStatusUpdate('in_review')}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                            >
                                Submit for Review
                            </button>
                        )}

                        {/* Actions for Reviewer */}
                        {isReviewer && activeModel.brand_status === 'in_review' && (
                            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 ml-1">
                                <button
                                    onClick={() => handleStatusUpdate('approved')}
                                    className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate('rejected')}
                                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </PageHeader>

            <div className="px-6 mt-6 space-y-6">
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 shadow-sm"
                        >
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
                            <div>
                                <h4 className="font-bold text-sm text-red-800">Failed to build stacks</h4>
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!activeModelId ? (
                    <ModelGallery
                        models={models}
                        onSelect={(id) => {
                            setActiveModelId(id);
                            localStorage.setItem('active_model_id', id);
                            setBuildResult(null);
                        }}
                    />
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Tasks */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
                            >
                                <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-white">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 11l3 3L22 4" />
                                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-indigo-900 m-0 leading-none tracking-tight">Tasks</h3>
                                </div>
                                <div className="flex-1 bg-slate-50/50">
                                    <TaskList tasks={step.tasks} />
                                </div>
                            </motion.div>

                            {/* Stack Builder Controls */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
                            >
                                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm border border-emerald-100">
                                            <Settings className="w-4 h-4" strokeWidth={2.5} />
                                        </div>
                                        <h3 className="text-lg font-bold text-emerald-900 m-0 leading-none tracking-tight">Stack Builder</h3>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6 bg-slate-50/30 flex-1">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest pl-1">Stack Type</label>
                                        <select
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800 shadow-sm appearance-none bg-white outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                            value={stackType}
                                            onChange={(e) => setStackType(e.target.value)}
                                            disabled={isReadOnly}
                                        >
                                            <option value="total">cleanbrand_agg</option>
                                            <option value="brand">Aggregated Brand Stack</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2 opacity-50 pointer-events-none">
                                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest pl-1">Aggregation Level <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded ml-1">In Development</span></label>
                                        <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 shadow-sm appearance-none bg-slate-50">
                                            <option value="weekly">National / Weekly</option>
                                        </select>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={handleBuildStack}
                                            disabled={isBuilding || isReadOnly}
                                            className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 outline-none
                                        ${isReadOnly
                                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                    : isBuilding
                                                        ? 'bg-indigo-400 text-white cursor-wait opacity-80'
                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200 hover:-translate-y-0.5'
                                                }`}
                                        >
                                            {isBuilding ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Building Stacks...
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4" strokeWidth={3} />
                                                    Build Stack Pipeline
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Stack Output Preview & QA Metrics */}
                        <AnimatePresence>
                            {buildResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                                >
                                    <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-white">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm border border-emerald-100">
                                            <CheckCircle className="w-4 h-4" strokeWidth={3} />
                                        </div>
                                        <h3 className="text-lg font-bold text-emerald-900 m-0 leading-none tracking-tight">Pipeline Execution Success</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100">
                                        <div className="p-6 bg-white">
                                            <h4 className="text-sm font-extrabold text-slate-800 mb-4 pb-2 border-b border-slate-100 uppercase tracking-wide">Generated Output Files</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs shadow-sm">CSV</div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800 m-0">cleanbrand_agg.csv</p>
                                                            <p className="text-xs font-medium text-slate-500 m-0 mt-0.5">Category Stack Base</p>
                                                        </div>
                                                    </div>
                                                    <StatusBadge status="completed" />
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 font-black text-xs shadow-sm">CSV</div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800 m-0">aggbrand_modelingstack.csv</p>
                                                            <p className="text-xs font-medium text-slate-500 m-0 mt-0.5">Aggregated Brand Model</p>
                                                        </div>
                                                    </div>
                                                    <StatusBadge status="completed" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-white">
                                            <h4 className="text-sm font-extrabold text-slate-800 mb-4 pb-2 border-b border-slate-100 uppercase tracking-wide">Quality Assurance Metrics</h4>
                                            <div className="space-y-4">
                                                <div className={`p-4 border rounded-xl shadow-sm ${buildResult.totals_match_flag?.sales_match ? 'bg-emerald-50/30 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-sm font-bold text-slate-800">Total Sales Validation</span>
                                                        {buildResult.totals_match_flag?.sales_match ? (
                                                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 bg-emerald-100 px-2 py-1 rounded-md"><CheckCircle className="w-3.5 h-3.5" /> Match</span>
                                                        ) : (
                                                            <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5 bg-rose-100 px-2 py-1 rounded-md"><AlertTriangle className="w-3.5 h-3.5" /> Mismatch</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Expected (Base)</p>
                                                            <p className="font-mono font-bold text-slate-900 text-base">{formatCurrencyMillions(buildResult.actual_values?.sales?.flag_value)}</p>
                                                        </div>
                                                        <div className="w-px h-10 bg-slate-200"></div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Actual (Generated)</p>
                                                            <p className="font-mono font-bold text-slate-900 text-base">{formatCurrencyMillions(buildResult.actual_values?.sales?.df_value)}</p>
                                                        </div>
                                                    </div>
                                                    {!buildResult.totals_match_flag?.sales_match && (
                                                        <div className="mt-3 pt-3 border-t border-rose-100 text-xs font-semibold text-rose-600">
                                                            Reason: {buildResult.reason?.sales_reason}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={`p-4 border rounded-xl shadow-sm ${buildResult.totals_match_flag?.spends_match ? 'bg-emerald-50/30 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-sm font-bold text-slate-800">Total Media Spends Validation</span>
                                                        {buildResult.totals_match_flag?.spends_match ? (
                                                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 bg-emerald-100 px-2 py-1 rounded-md"><CheckCircle className="w-3.5 h-3.5" /> Match</span>
                                                        ) : (
                                                            <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5 bg-rose-100 px-2 py-1 rounded-md"><AlertTriangle className="w-3.5 h-3.5" /> Mismatch</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Expected (Base)</p>
                                                            <p className="font-mono font-bold text-slate-900 text-base">{formatCurrencyMillions(buildResult.actual_values?.spends?.flag_value)}</p>
                                                        </div>
                                                        <div className="w-px h-10 bg-slate-200"></div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Actual (Generated)</p>
                                                            <p className="font-mono font-bold text-slate-900 text-base">{formatCurrencyMillions(buildResult.actual_values?.spends?.df_value)}</p>
                                                        </div>
                                                    </div>
                                                    {!buildResult.totals_match_flag?.spends_match && (
                                                        <div className="mt-3 pt-3 border-t border-rose-100 text-xs font-semibold text-rose-600">
                                                            Reason: {buildResult.reason?.spends_reason}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                        >
                            <AutomationNote notes={step.automationNotes} />
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
