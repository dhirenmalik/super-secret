import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import { motion } from 'framer-motion';
import { getApiBaseUrl } from '../api/kickoff';
import { useAuth } from '../context/AuthContext';

const step = steps.find((s) => s.id === 1);

export default function DataStaging() {
    const { token } = useAuth();
    const [isQueryRunning, setIsQueryRunning] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [models, setModels] = useState([]);
    const [activeModelId, setActiveModelId] = useState(localStorage.getItem('active_model_id') || '');

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/models`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setModels(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching models:', error);
        }
    };


    const handleRunQuery = () => {
        setIsQueryRunning(true);
        setTimeout(() => setIsQueryRunning(false), 2000);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-6">
            <motion.div variants={itemVariants}>
                <PageHeader
                    title={step.name}
                    subtitle="Login to VDI, run category-specific queries, and download data files from Enterprise cloud."
                    breadcrumb={['Dashboard', 'ETL Phase', step.name]}
                    stepNumber={step.id}
                    phase={step.phase}
                    activeModelId={activeModelId}
                    models={models}
                    onModelSwitch={() => {
                        setActiveModelId('');
                        localStorage.removeItem('active_model_id');
                    }}
                >
                    <StatusBadge status="not_started" />
                </PageHeader>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tasks */}
                <motion.div variants={itemVariants} className="card h-full">
                    <div className="card-header border-b border-slate-100 pb-4 mb-4">
                        <div className="card-title text-indigo-900">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 border border-indigo-100">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 11l3 3L22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                </svg>
                            </div>
                            Tasks
                        </div>
                    </div>
                    <TaskList tasks={step.tasks} />
                </motion.div>

                {/* Query Runner */}
                <motion.div variants={itemVariants} className="card h-full">
                    <div className="card-header border-b border-slate-100 pb-4 mb-5">
                        <div className="card-title text-emerald-900">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3 border border-emerald-100">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="16 18 22 12 16 6" />
                                    <polyline points="8 6 2 12 8 18" />
                                </svg>
                            </div>
                            Query Runner
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="form-group">
                            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Category</label>
                            <select className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all">
                                <option value="">Select category...</option>
                                <option value="grocery">Grocery</option>
                                <option value="electronics">Electronics</option>
                                <option value="apparel">Apparel</option>
                                <option value="home">Home & Garden</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Query</label>
                            <textarea
                                className="w-full bg-slate-900 text-slate-100 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm leading-relaxed"
                                rows="4"
                                placeholder="-- Enter SQL query&#10;SELECT * FROM sales_data&#10;WHERE category = 'grocery'"
                                defaultValue="-- Enter SQL query for the selected category...&#10;SELECT * FROM sales_data&#10;WHERE category = 'grocery'&#10;AND date BETWEEN '2024-01-01' AND '2026-01-01'"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleRunQuery}
                                disabled={isQueryRunning}
                                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all outline-none"
                            >
                                {isQueryRunning ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Executing...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="5 3 19 12 5 21 5 3" />
                                        </svg>
                                        Run Query
                                    </>
                                )}
                            </button>
                            <button className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-all outline-none border border-slate-200">
                                Split Period
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* File Upload Area */}
            <motion.div variants={itemVariants} className="card mt-6">
                <div className="card-header border-b border-slate-100 pb-4 mb-5">
                    <div className="card-title text-amber-900">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mr-3 border border-amber-100">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        Data Files
                    </div>
                </div>

                <motion.div
                    whileHover={{ scale: 1.01, borderColor: '#818cf8', backgroundColor: '#eef2ff' }}
                    className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl p-10 text-center cursor-pointer transition-colors mb-6"
                    onClick={() => { setIsUploading(true); setTimeout(() => setIsUploading(false), 1500); }}
                >
                    <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center mx-auto mb-4">
                        {isUploading ? (
                            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        )}
                    </div>
                    <div className="text-slate-800 font-bold mb-1">{isUploading ? 'Uploading...' : 'Drop data files here or click to browse'}</div>
                    <div className="text-slate-500 text-sm">Supports CSV, Excel, and Parquet files • Weekly, Daily, Monthly</div>
                </motion.div>

                {/* File Status Indicators */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">File Type</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Period</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Size</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">Weekly Sales Data</td>
                                <td className="px-6 py-4 text-slate-600">FY24–FY26</td>
                                <td className="px-6 py-4"><StatusBadge status="not_started" /></td>
                                <td className="px-6 py-4 text-slate-400">—</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">Daily Transaction Data</td>
                                <td className="px-6 py-4 text-slate-600">FY24–FY26</td>
                                <td className="px-6 py-4"><StatusBadge status="not_started" /></td>
                                <td className="px-6 py-4 text-slate-400">—</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">Monthly Aggregate Data</td>
                                <td className="px-6 py-4 text-slate-600">FY24–FY26</td>
                                <td className="px-6 py-4"><StatusBadge status="not_started" /></td>
                                <td className="px-6 py-4 text-slate-400">—</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Automation Notes */}
            <motion.div variants={itemVariants} className="mt-6">
                <AutomationNote notes={step.automationNotes} />
            </motion.div>
        </motion.div>
    );
}
