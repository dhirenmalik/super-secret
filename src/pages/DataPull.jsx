import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import { motion } from 'framer-motion';
import { getApiBaseUrl } from '../api/kickoff';
import { useAuth } from '../context/AuthContext';

const step = steps.find((s) => s.id === 2);

export default function DataPull() {
    const { token } = useAuth();
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
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

    const handleDownloadAll = () => {
        setIsDownloading(true);
        setDownloadProgress(0);
        const interval = setInterval(() => {
            setDownloadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsDownloading(false);
                    return 100;
                }
                return prev + 10;
            });
        }, 300);
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
                    subtitle="Upload files from VDI to IG's cloud and download data to local systems."
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

                {/* Transfer Status */}
                <motion.div variants={itemVariants} className="card h-full">
                    <div className="card-header border-b border-slate-100 pb-4 mb-5">
                        <div className="card-title text-emerald-900">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3 border border-emerald-100">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            </div>
                            Transfer Progress
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* VDI Upload Progress */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-slate-800">VDI → IG Cloud</span>
                                <StatusBadge status="not_started" />
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-1.5">
                                <div className="h-full bg-slate-400 rounded-full" style={{ width: '0%' }} />
                            </div>
                            <div className="text-xs font-semibold text-slate-400">
                                0 of 0 files uploaded
                            </div>
                        </div>

                        {/* Cloud Download Progress */}
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-indigo-900">Cloud → Local</span>
                                {isDownloading ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] uppercase font-bold rounded">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div> In Progress
                                    </span>
                                ) : (
                                    <StatusBadge status={downloadProgress === 100 ? "completed" : "not_started"} />
                                )}
                            </div>
                            <div className="h-2 bg-indigo-100 rounded-full overflow-hidden mb-1.5">
                                <motion.div
                                    className="h-full bg-indigo-500 rounded-full relative"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${downloadProgress}%` }}
                                    transition={{ ease: "linear" }}
                                >
                                    {isDownloading && <div className="absolute inset-0 bg-white/20 w-full animate-[pulse_1s_infinite]"></div>}
                                </motion.div>
                            </div>
                            <div className="flex justify-between items-center text-xs font-semibold text-indigo-400">
                                <span>{downloadProgress === 100 ? '3 of 3 files downloaded' : '0 of 3 files downloaded'}</span>
                                <span>{downloadProgress}%</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Download List */}
            <motion.div variants={itemVariants} className="card mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-5 gap-4">
                    <div className="card-title text-amber-900">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mr-3 border border-amber-100">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </div>
                        File Download Queue
                    </div>
                    <button
                        onClick={handleDownloadAll}
                        disabled={isDownloading || downloadProgress === 100}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-2 text-sm shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDownloading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        )}
                        {downloadProgress === 100 ? 'Downloaded' : 'Download All'}
                    </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">File Name</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Source</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Size</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {['weekly_sales_fy24_fy26.csv', 'daily_transactions_fy24.csv', 'monthly_agg_fy25_fy26.csv'].map((file, i) => (
                                <tr key={file} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">{file}</td>
                                    <td className="px-6 py-4 text-slate-600">IG Cloud</td>
                                    <td className="px-6 py-4 text-slate-400">—</td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={downloadProgress === 100 ? "completed" : "not_started"} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-md text-xs font-bold transition-colors">
                                            Download
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-6">
                <AutomationNote notes={step.automationNotes} />
            </motion.div>
        </motion.div>
    );
}
