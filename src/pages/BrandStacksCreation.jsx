import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import { useAuth } from '../context/AuthContext';
import { fetchLatestFile, getApiBaseUrl } from '../api/kickoff';
import { buildBrandStack, fetchBuiltStack } from '../api/eda';
import { Loader2, CheckCircle, AlertTriangle, Play, Settings } from 'lucide-react';
import { formatCurrencyMillions } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import ModelGallery from '../components/ModelGallery';

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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full bg-slate-50/30 min-h-screen pb-12"
        >
            <PageHeader
                title={step.name}
                subtitle="Create total category stack and aggregated brand stacks for data prep and modeling."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
            >
                <div className="flex items-center gap-4">
                    {activeModelId && (
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Model:</span>
                            <span className="text-sm font-semibold text-blue-700">
                                {models.find(m => String(m.model_id) === String(activeModelId))?.model_name || 'Selected Model'}
                            </span>
                            <button
                                onClick={() => setActiveModelId('')}
                                className="ml-2 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                                title="Switch Model"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M4 4l5 5" />
                                </svg>
                            </button>
                        </div>
                    )}
                    <StatusBadge status={buildResult ? 'completed' : 'not_started'} />
                </div>
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
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800 shadow-sm appearance-none bg-white outline-none"
                                            value={stackType}
                                            onChange={(e) => setStackType(e.target.value)}
                                        >
                                            <option value="total">cleanbrand_agg</option>
                                            <option value="brand">Aggregated Brand Stack</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2 opacity-50 pointer-events-none">
                                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest pl-1">Aggregation Level <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded ml-1">Coming Soon</span></label>
                                        <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 shadow-sm appearance-none bg-slate-50">
                                            <option value="weekly">Weekly</option>
                                        </select>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={handleBuildStack}
                                            disabled={isBuilding}
                                            className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 outline-none
                                        ${isBuilding
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
