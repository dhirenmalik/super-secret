import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../api/kickoff';
import { motion, AnimatePresence } from 'framer-motion';
import ModelGallery from '../components/ModelGallery';
import ChartTab from '../components/discovery/ChartTab';
import AgentInsights from '../components/discovery/AgentInsights';
import MediaTacticsTable from '../components/discovery/MediaTacticsTable';
import { Target, Search, Loader2, Activity, TrendingUp, BarChart2, Layers, Bot, FileText, Filter, RefreshCw } from 'lucide-react';

const Sk = ({ h = "h-4", w = "w-full" }) => <div className={`${h} ${w} bg-slate-200 rounded animate-pulse`}></div>;

const step = steps.find((s) => s.slug === 'tool-review');

const mockTactics = [
    { id: 1, name: 'TV Linear', type: 'Media', cappingValue: 100 },
    { id: 2, name: 'Digital Display', type: 'Media', cappingValue: 100 },
    { id: 3, name: 'Social Media', type: 'Media', cappingValue: 100 },
    { id: 4, name: 'Search SEM', type: 'Media', cappingValue: 100 },
    { id: 5, name: 'In-Store Display', type: 'Trade', cappingValue: 100 },
    { id: 6, name: 'Feature / Flyer', type: 'Trade', cappingValue: 100 },
];

export default function ToolReview() {
    const { token } = useAuth();
    const [tactics, setTactics] = useState([]);
    const [models, setModels] = useState([]);
    const [activeModelId, setActiveModelId] = useState('');
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [error, setError] = useState(null);

    // Discovery Data State
    const [discoveryData, setDiscoveryData] = useState(null);
    const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false);
    const [discoveryError, setDiscoveryError] = useState(null);
    const [tacticFilter, setTacticFilter] = useState('All');
    const [severityFilter, setSeverityFilter] = useState('All');
    const [selectedL2s, setSelectedL2s] = useState([]);

    useEffect(() => {
        loadModels();
    }, []);

    useEffect(() => {
        if (activeModelId) {
            loadBrandData(activeModelId);
            loadDiscoveryData(activeModelId);
        }
    }, [activeModelId]);

    // Reset L2 selection whenever a new model is loaded
    useEffect(() => {
        const l2s = discoveryData?.metadata?.l2_list || [];
        setSelectedL2s(l2s); // default: all selected
    }, [discoveryData]);

    const loadDiscoveryData = async (modelId) => {
        setIsLoadingDiscovery(true);
        setDiscoveryError(null);
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/eda/discovery/${modelId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errBody = await response.text();
                throw new Error(errBody || "Failed to fetch discovery data");
            }
            const data = await response.json();
            setDiscoveryData(data);
        } catch (err) {
            console.error("Discovery error:", err);
            setDiscoveryError(err.message);
        } finally {
            setIsLoadingDiscovery(false);
        }
    };

    // Metrics calculation logic (cached from DiscoveryToolAnalysis)
    const metrics = React.useMemo(() => {
        if (!discoveryData || !discoveryData.time_series || discoveryData.time_series.length === 0) return null;

        const ts = discoveryData.time_series;
        const lastIdx = ts.length - 1;
        const curr = ts[lastIdx];
        const prev = ts[lastIdx - 1] || curr;

        const computeMetrics = (row) => ({
            unitOnlinePct: row.Units_Online_Units / (row.Units_Online_Units + row.Units_Offline_Units) * 100,
            salesOnlinePct: row.Sales_Online_GMV / (row.Sales_Online_GMV + row.Sales_Offline_GMV) * 100,
            wmcPen: row.WMC_Spends / row.Sales_Online_GMV * 100,
            price: row.Sales_Online_GMV / row.Units_Online_Units
        });

        const latest = computeMetrics(curr);
        const prior = computeMetrics(prev);

        const periods = ts.slice(-3).map(r => ({
            name: r.Anomaly_Date || r.Date || 'N/A',
            ...computeMetrics(r)
        }));

        return {
            unitOnlinePct: latest.unitOnlinePct,
            salesOnlinePct: latest.salesOnlinePct,
            wmcPen: latest.wmcPen,
            avgPrice: latest.price,
            periods,
            yoy: {
                unitOnline: latest.unitOnlinePct - prior.unitOnlinePct,
                salesOnline: latest.salesOnlinePct - prior.salesOnlinePct,
                wmcPen: latest.wmcPen - prior.wmcPen,
                price: ((latest.price / prior.price) - 1) * 100
            },
            mediaTactics: discoveryData.media_tactics || []
        };
    }, [discoveryData]);

    // Compute filtered view for chart + anomalies
    const filteredDiscoveryData = React.useMemo(() => {
        if (!discoveryData) return null;
        const l2s = discoveryData.metadata?.l2_list || [];
        if (!selectedL2s.length || selectedL2s.length === l2s.length) return discoveryData;
        const filteredAnomalies = (discoveryData.anomalies || []).filter(row => {
            const rowL2 = row.L2 || row.l2 || '';
            return selectedL2s.some(l => l.toUpperCase() === String(rowL2).toUpperCase());
        });
        return { ...discoveryData, anomalies: filteredAnomalies };
    }, [discoveryData, selectedL2s]);

    const loadBrandData = async (modelId) => {
        setIsLoadingData(true);
        setError(null);
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/analytics/eda/brand-agg/${modelId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch brand data');
            const data = await response.json();

            if (data.length > 0) {
                // Extract tactics (columns starting with M_)
                const sampleRow = data[0];
                const tacticCols = Object.keys(sampleRow).filter(k => k.startsWith('M_'));

                // Map to UI format
                const derivedTactics = tacticCols.map((col, idx) => {
                    const cleanName = col.replace('M_', '').split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
                    return {
                        id: idx,
                        name: cleanName,
                        key: col,
                        type: col.includes('SEARCH') ? 'Search' : 'Display',
                        cappingValue: 100
                    };
                });
                setTactics(derivedTactics);
            } else {
                setTactics([]);
            }
        } catch (err) {
            console.error('Error loading brand data:', err);
            setError(err.message);
        } finally {
            setIsLoadingData(false);
        }
    };

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

    const updateCapping = (id, value) => {
        setTactics(tactics.map((t) => (t.id === id ? { ...t, cappingValue: value } : t)));
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full bg-slate-50/30 pb-12"
        >
            <PageHeader
                title={step.name}
                subtitle="Review tactical outputs, adjust peaks, and finalize modeling parameters."
                stepNumber={step.id}
                phase={step.phase}
                activeModelId={activeModelId}
                models={models}
                onModelSwitch={setActiveModelId}
                showBackButton={!!activeModelId}
                onBack={() => {
                    setActiveModelId('');
                    setDiscoveryData(null);
                    setTactics([]);
                }}
            >
                <StatusBadge status="not_started" />
            </PageHeader>

            <div className="px-6 mt-6 space-y-8">
                {!activeModelId ? (
                    <ModelGallery
                        models={models}
                        onSelect={(id) => {
                            setActiveModelId(id);
                            localStorage.setItem('active_model_id', id);
                        }}
                    />
                ) : (
                    <>
                        <div className="space-y-6">
                            {/* Discovery Analysis Results (Moved from Analysis Page) */}
                            {discoveryError ? (
                                <div className="card p-12 flex flex-col items-center justify-center bg-rose-50 border-rose-200 rounded-2xl border">
                                    <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4 border border-rose-200 shadow-sm">
                                        <Target className="w-6 h-6 text-rose-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-rose-800 mb-2">Analysis Results Unavailable</h3>
                                    <p className="text-rose-600 text-sm max-w-md text-center">{discoveryError}</p>
                                </div>
                            ) : (
                                <>
                                    <AnimatePresence mode="wait">
                                        {(discoveryData || isLoadingDiscovery) && (
                                            <motion.div
                                                key={isLoadingDiscovery ? 'loading' : 'loaded'}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="space-y-6"
                                            >
                                                {isLoadingDiscovery ? (
                                                    <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-500 shadow-sm">
                                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                                                        <p className="text-sm font-bold text-slate-600">Loading detailed stack explorer & trends...</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <ChartTab
                                                            chartData={filteredDiscoveryData}
                                                            activeTacticFilter={tacticFilter}
                                                            anomaliesTable={filteredDiscoveryData?.anomalies}
                                                        />
                                                        <AgentInsights
                                                            modelId={activeModelId}
                                                            insights={discoveryData?.metadata?.agent_insights || null}
                                                            anomaliesTable={filteredDiscoveryData?.anomalies}
                                                            isLoading={isLoadingDiscovery}
                                                            tacticFilter={tacticFilter}
                                                            setTacticFilter={setTacticFilter}
                                                            severityFilter={severityFilter}
                                                            setSeverityFilter={setSeverityFilter}
                                                            availableTactics={['All', ...new Set(filteredDiscoveryData?.anomalies?.map(a => a.Tactic_Prefix) || [])]}
                                                            availableSeverities={['All', 'Critical', 'High', 'Medium', 'Low']}
                                                        />
                                                    </>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </div>

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

                            {/* Merge/Remove Controls */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
                            >
                                <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-white">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm border border-emerald-100">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-emerald-900 m-0 leading-none tracking-tight">Tactic Controls</h3>
                                </div>
                                {/* Model Selector */}
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                                    <span className="text-sm font-bold text-slate-700">Active Model:</span>
                                    <div className="w-full">
                                        <select
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold text-slate-700 shadow-sm bg-white cursor-pointer transition-all outline-none"
                                            value={activeModelId}
                                            onChange={(e) => {
                                                setActiveModelId(e.target.value);
                                                localStorage.setItem('active_model_id', e.target.value);
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
                                <div className="p-6 space-y-5 flex-1 bg-white">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest pl-1">Action</label>
                                        <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700 shadow-sm outline-none bg-slate-50">
                                            <option value="">Select action...</option>
                                            <option value="merge">Merge Tactics</option>
                                            <option value="remove">Remove Tactic</option>
                                            <option value="adjust">Adjust Data</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest pl-1">Select Tactics</label>
                                        <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700 shadow-sm outline-none bg-slate-50" multiple style={{ minHeight: '130px' }}>
                                            {tactics.map((t) => (
                                                <option key={t.id} value={t.id} className="py-1">{t.name} ({t.type})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-200/50 hover:-translate-y-0.5 transition-all outline-none">Apply</button>
                                        <button className="px-5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all outline-none">Reset</button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Capping Sliders */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm border border-amber-100">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 20v-6M6 20V10M18 20V4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-amber-900 m-0 leading-none tracking-tight">Variable Peak Capping</h3>
                                </div>
                                <button className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors">Reset All to 100%</button>
                            </div>
                            <div className="p-6 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {tactics.map((tactic) => (
                                    <div key={tactic.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="font-bold text-slate-800 text-sm tracking-tight">{tactic.name}</span>
                                            <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md text-sm">{tactic.cappingValue}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            min="0"
                                            max="200"
                                            value={tactic.cappingValue}
                                            onChange={(e) => updateCapping(tactic.id, parseInt(e.target.value))}
                                        />
                                        <div className="flex justify-between items-center mt-3 text-xs font-semibold">
                                            <span className="text-slate-400">0%</span>
                                            <span className="text-slate-500 uppercase tracking-wider">{tactic.type}</span>
                                            <span className="text-slate-400">200%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.4 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-white">
                                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm border border-rose-100">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="4" y="2" width="16" height="20" rx="2" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-rose-900 m-0 leading-none tracking-tight">Manual Data Adjustments</h3>
                                {isLoadingData && <span className="text-xs text-slate-400 animate-pulse ml-auto">Loading stack data...</span>}
                            </div>
                            <div className="p-6 space-y-5 bg-white">
                                {error && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium">
                                        Error connecting to database stacks: {error}
                                    </div>
                                )}
                                {!isLoadingData && tactics.length === 0 && (
                                    <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-medium">
                                        No brand stack found for this model in the database.
                                        <br />Please run 'Build Brand Stack' first.
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest pl-1">Adjustment Description</label>
                                    <textarea
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 text-sm font-medium text-slate-800 shadow-sm outline-none bg-slate-50 min-h-[100px]"
                                        placeholder="Describe the data discrepancy and the manual adjustments made..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest pl-1">Adjustment Formula</label>
                                    <input
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 text-sm text-slate-800 shadow-sm outline-none bg-slate-50 font-mono font-medium placeholder-slate-400"
                                        placeholder="e.g. Variable_X = Variable_X * 0.85 for weeks 23-26"
                                    />
                                </div>
                                <div className="pt-2">
                                    <button className="px-6 py-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-900 shadow-lg shadow-slate-200/50 hover:-translate-y-0.5 transition-all outline-none">Apply Adjustment</button>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.5 }}
                        >
                            <AutomationNote notes={step.automationNotes} />
                        </motion.div>
                    </>
                )}
            </div>
        </motion.div >
    );
}
