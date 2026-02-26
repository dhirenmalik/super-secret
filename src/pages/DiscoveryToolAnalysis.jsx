// src/pages/DiscoveryToolAnalysis.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../api/kickoff';
import PageHeader from '../components/PageHeader';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import ComparisonBarChart from '../components/charts/ComparisonBarChart';
import ModelGallery from '../components/ModelGallery';
import { CheckCircle, AlertTriangle, ChevronRight, BarChart2, TrendingUp, Target, Activity, Search } from 'lucide-react';

const step = steps.find((s) => s.slug === 'discovery-tool-analysis');

// Helper function to get color classes based on value for a premium look
const getRowHighlightClass = (value) => {
    const numValue = parseFloat(value);
    if (numValue < 5) return 'bg-rose-50/40 hover:bg-rose-50/80';
    if (numValue < 10) return 'bg-amber-50/40 hover:bg-amber-50/80';
    if (numValue < 20) return 'bg-emerald-50/40 hover:bg-emerald-50/80';
    return 'bg-teal-50/40 hover:bg-teal-50/80';
};

const thClass = "px-4 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50 border-b-2 border-slate-200 align-middle whitespace-nowrap";
const thClassPrimary = "px-4 py-3 text-[10px] font-extrabold text-white uppercase tracking-wider bg-indigo-600 border-b border-indigo-700 max-w-[200px] align-middle whitespace-nowrap shadow-sm";
const tdClass = "px-4 py-2.5 text-xs text-slate-700 border-b border-slate-100 align-middle";
const tdClassBold = "px-4 py-3 text-xs font-bold text-slate-800 border-b border-slate-100 align-middle";

export default function DiscoveryToolAnalysis() {
    const { token } = useAuth();
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

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <PageHeader
                title={step.name}
                subtitle="Create reports with trends, charts, and comparisons at total and variable level."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
            >
                <div className="flex items-center gap-4">
                    {activeModelId && (
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Model:</span>
                            <span className="text-sm font-semibold text-indigo-700">
                                {models.find(m => String(m.model_id) === String(activeModelId))?.model_name || 'Selected Model'}
                            </span>
                            <button
                                onClick={() => {
                                    setActiveModelId('');
                                    localStorage.removeItem('active_model_id');
                                }}
                                className="ml-2 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Switch Model"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M4 4l5 5" />
                                </svg>
                            </button>
                        </div>
                    )}
                    <StatusBadge status="not_started" />
                </div>
            </PageHeader>

            <div className="px-6 mt-6 space-y-6">
                {!activeModelId ? (
                    <ModelGallery
                        models={models}
                        onSelect={(id) => {
                            setActiveModelId(id);
                            localStorage.setItem('active_model_id', id);
                        }}
                    />
                ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                            {/* Card 1: Discovery Tool Details */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                                className="card shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="card-header border-b border-slate-100 bg-white rounded-t-xl px-6 py-5">
                                    <div className="card-title text-indigo-900 m-0">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 shadow-sm border border-indigo-100">
                                            <Search className="w-4 h-4" />
                                        </div>
                                        Discovery Tool Details
                                    </div>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* Category Info */}
                                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                        <table className="w-full text-sm">
                                            <tbody>
                                                <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                    <td className="w-1/3 px-4 py-3 font-bold text-slate-600 bg-slate-50/50 border-r border-slate-100 text-[11px] uppercase tracking-wider">Category</td>
                                                    <td className="px-4 py-3 font-semibold text-slate-800">D05 VG SOFTWARE</td>
                                                </tr>
                                                <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                    <td className="w-1/3 px-4 py-3 font-bold text-slate-600 bg-slate-50/50 border-r border-slate-100 text-[11px] uppercase tracking-wider">Modeling Time Period</td>
                                                    <td className="px-4 py-3 font-semibold text-slate-800">Dec'22 - Jul'25</td>
                                                </tr>
                                                <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                    <td className="w-1/3 px-4 py-3 font-bold text-slate-600 bg-slate-50/50 border-r border-slate-100 text-[11px] uppercase tracking-wider">Subcategories Included</td>
                                                    <td className="px-4 py-3 font-semibold text-slate-800">SOFTWARE</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* YOY Change */}
                                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr>
                                                    <th colSpan="3" className="px-4 py-3 text-xs font-extrabold text-white bg-indigo-600 uppercase tracking-wider text-center shadow-inner">YOY Change %</th>
                                                </tr>
                                                <tr className="bg-slate-50">
                                                    <th className={thClass + " text-center"}>Omni Unit Sales</th>
                                                    <th className={thClass + " text-center"}>Omni GMV ($)</th>
                                                    <th className={thClass + " text-center"}>WMC Spends ($)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="hover:bg-slate-50 transition-colors">
                                                    <td className={tdClass + " text-center font-mono font-medium text-rose-600"}>-6%</td>
                                                    <td className={tdClass + " text-center font-mono font-medium text-rose-600"}>-20%</td>
                                                    <td className={tdClass + " text-center font-mono font-medium text-rose-600"}>-24%</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Overall Period */}
                                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr>
                                                    <th colSpan="5" className="px-4 py-3 text-xs font-extrabold text-white bg-indigo-600 uppercase tracking-wider text-center shadow-inner">Overall period</th>
                                                </tr>
                                                <tr className="bg-slate-50">
                                                    <th className={thClass + " text-center"}>WMC Pen. (%)</th>
                                                    <th className={thClass + " text-center"}>Price</th>
                                                    <th className={thClass + " text-center"}>Unit Sales Online</th>
                                                    <th className={thClass + " text-center"}>GMV Sales Online</th>
                                                    <th className={thClass + " text-center"}>#Brands in final stack</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="hover:bg-slate-50 transition-colors">
                                                    <td className={tdClass + " text-center font-mono"}>1.51%</td>
                                                    <td className={tdClass + " text-center font-mono"}>$19.3</td>
                                                    <td className={tdClass + " text-center font-mono"}>10%</td>
                                                    <td className={tdClass + " text-center font-mono"}>18%</td>
                                                    <td className={tdClass + " text-center font-mono"}>30</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Metrics Summary */}
                                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr>
                                                    <th colSpan="5" className="px-4 py-3 text-xs font-extrabold text-white bg-indigo-600 uppercase tracking-wider text-center shadow-inner">Key Metrics Summary</th>
                                                </tr>
                                                <tr className="bg-slate-50">
                                                    <th className={thClass}>Period</th>
                                                    <th className={thClass + " text-center"}>Unit Sales Online (%)</th>
                                                    <th className={thClass + " text-center"}>GMV Sales Online (%)</th>
                                                    <th className={thClass + " text-center"}>WMC Penetration(%)</th>
                                                    <th className={thClass + " text-center"}>Price</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="hover:bg-slate-50 transition-colors">
                                                    <td className={tdClassBold}>Dec'22 - Jul'23</td>
                                                    <td className={tdClass + " text-center font-mono"}>8.9%</td>
                                                    <td className={tdClass + " text-center font-mono"}>16.2%</td>
                                                    <td className={tdClass + " text-center font-mono"}>1.0%</td>
                                                    <td className={tdClass + " text-center font-mono"}>$20.5</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50 transition-colors">
                                                    <td className={tdClassBold}>Aug'23 - Jul'24</td>
                                                    <td className={tdClass + " text-center font-mono"}>10.2%</td>
                                                    <td className={tdClass + " text-center font-mono"}>18.2%</td>
                                                    <td className={tdClass + " text-center font-mono"}>1.8%</td>
                                                    <td className={tdClass + " text-center font-mono"}>$20.4</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50 transition-colors">
                                                    <td className={tdClassBold}>Aug'24 - Jul'25</td>
                                                    <td className={tdClass + " text-center font-mono"}>9.3%</td>
                                                    <td className={tdClass + " text-center font-mono"}>20.1%</td>
                                                    <td className={tdClass + " text-center font-mono"}>1.7%</td>
                                                    <td className={tdClass + " text-center font-mono"}>$17.3</td>
                                                </tr>
                                                <tr className="bg-slate-50/80 hover:bg-slate-100 transition-colors">
                                                    <td className="px-4 py-3 text-xs font-extrabold text-slate-800 uppercase tracking-wider">Change YOY %</td>
                                                    <td className={tdClass + " text-center font-mono text-rose-600 font-semibold"}>-8%</td>
                                                    <td className={tdClass + " text-center font-mono text-rose-600 font-semibold"}>-12%</td>
                                                    <td className={tdClass + " text-center font-mono text-rose-600 font-semibold"}>-5%</td>
                                                    <td className={tdClass + " text-center font-mono text-rose-600 font-semibold"}>-15%</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all shadow-indigo-200">
                                            <Activity className="w-4 h-4" />
                                            Generate Discovery Report
                                        </button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Card 2: Key Metrics - Media Tactics */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className="card shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="card-header border-b border-slate-100 bg-white rounded-t-xl px-6 py-5">
                                    <div className="card-title text-emerald-900 m-0">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3 shadow-sm border border-emerald-100">
                                            <Target className="w-4 h-4" />
                                        </div>
                                        Key Metrics - Media Tactics
                                    </div>
                                </div>
                                <div className="p-6 overflow-x-auto">
                                    <div className="min-w-[700px] overflow-hidden rounded-xl border border-slate-200 shadow-sm inline-block">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr>
                                                    <th rowSpan="2" className={thClassPrimary + " bg-emerald-600 border-emerald-700 w-[200px]"}></th>
                                                    <th colSpan="3" className="px-4 py-2 text-[10px] font-extrabold text-white bg-emerald-600 border-b border-r border-emerald-700 uppercase tracking-wider text-center shadow-inner">Spend Share</th>
                                                    <th rowSpan="2" className="px-4 py-2 text-[10px] font-extrabold text-white bg-emerald-600 border-b border-r border-emerald-700 uppercase tracking-wider text-center shadow-inner">Change YOY %</th>
                                                    <th colSpan="2" className="px-4 py-2 text-[10px] font-extrabold text-white bg-emerald-600 border-b border-emerald-700 uppercase tracking-wider text-center shadow-inner">CPC/CPM/CPD Aug'24 - Jul'25</th>
                                                </tr>
                                                <tr>
                                                    <th className="px-3 py-2 text-[9px] font-bold text-white bg-emerald-500/90 border-b border-r border-emerald-600 uppercase tracking-wider text-center w-[80px]">Dec'22 - Jul'23</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold text-white bg-emerald-500/90 border-b border-r border-emerald-600 uppercase tracking-wider text-center w-[80px]">Aug'23 - Jul'24</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold text-white bg-emerald-500/90 border-b border-r border-emerald-600 uppercase tracking-wider text-center w-[80px]">Aug'24 - Jul'25</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold text-white bg-emerald-500/90 border-b border-r border-emerald-600 uppercase tracking-wider text-center w-[80px]">CPC/CPM/CPD</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold text-white bg-emerald-500/90 border-b border-emerald-600 uppercase tracking-wider text-center w-[80px]">YOY change %</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-[11px]">
                                                {/* Data mapping - taking a sample from original */}
                                                <tr className="bg-slate-50 hover:bg-slate-100 transition-colors border-b-2 border-slate-200">
                                                    <td className={tdClassBold}>Search Total</td>
                                                    <td className={tdClass + " text-center font-mono font-medium"}>18.5%</td>
                                                    <td className={tdClass + " text-center font-mono font-medium"}>11.3%</td>
                                                    <td className={tdClass + " text-center font-mono font-medium"}>21.0%</td>
                                                    <td className={tdClass + " text-center font-mono font-medium text-emerald-600"}>42%</td>
                                                    <td className={tdClass + " text-center font-mono font-medium"}>1.2</td>
                                                    <td className={tdClass + " text-center font-mono font-medium text-emerald-600"}>63%</td>
                                                </tr>
                                                <tr className={getRowHighlightClass('7.9') + " border-b border-slate-100"}>
                                                    <td className={tdClass + " pl-6 font-medium"}>Sponsored Products Auto</td>
                                                    <td className={tdClass + " text-center font-mono"}>7.9%</td>
                                                    <td className={tdClass + " text-center font-mono"}>4.4%</td>
                                                    <td className={tdClass + " text-center font-mono"}>10.3%</td>
                                                    <td className={tdClass + " text-center font-mono text-emerald-600 font-medium"}>75%</td>
                                                    <td className={tdClass + " text-center font-mono"}>1.2</td>
                                                    <td className={tdClass + " text-center font-mono text-emerald-600 font-medium"}>108%</td>
                                                </tr>
                                                <tr className={getRowHighlightClass('6.8') + " border-b border-slate-100"}>
                                                    <td className={tdClass + " pl-6 font-medium"}>Sponsored Products Manual</td>
                                                    <td className={tdClass + " text-center font-mono"}>6.8%</td>
                                                    <td className={tdClass + " text-center font-mono"}>3.3%</td>
                                                    <td className={tdClass + " text-center font-mono"}>6.8%</td>
                                                    <td className={tdClass + " text-center font-mono text-emerald-600 font-medium"}>55%</td>
                                                    <td className={tdClass + " text-center font-mono"}>1.1</td>
                                                    <td className={tdClass + " text-center font-mono text-emerald-600 font-medium"}>76%</td>
                                                </tr>
                                                <tr className="bg-slate-50 hover:bg-slate-100 transition-colors border-b-2 border-slate-200 mt-2">
                                                    <td className={tdClassBold}>Onsite Display Total</td>
                                                    <td className={tdClass + " text-center font-mono font-medium"}>64.2%</td>
                                                    <td className={tdClass + " text-center font-mono font-medium"}>53.6%</td>
                                                    <td className={tdClass + " text-center font-mono font-medium"}>39.9%</td>
                                                    <td className={tdClass + " text-center font-mono font-medium text-rose-600"}>-44%</td>
                                                    <td className={tdClass + " text-center font-mono font-medium"}>8.0</td>
                                                    <td className={tdClass + " text-center font-mono font-medium text-rose-600"}>-16%</td>
                                                </tr>
                                                <tr className={getRowHighlightClass('26.9') + " border-b border-slate-100"}>
                                                    <td className={tdClass + " pl-6 font-medium"}>Onsite Display Audience</td>
                                                    <td className={tdClass + " text-center font-mono"}>26.9%</td>
                                                    <td className={tdClass + " text-center font-mono"}>15.7%</td>
                                                    <td className={tdClass + " text-center font-mono"}>14.2%</td>
                                                    <td className={tdClass + " text-center font-mono text-rose-600 font-medium"}>-32%</td>
                                                    <td className={tdClass + " text-center font-mono"}>8.9</td>
                                                    <td className={tdClass + " text-center font-mono text-rose-600 font-medium"}>-31%</td>
                                                </tr>
                                                <tr className={getRowHighlightClass('20.2') + " border-b border-slate-100"}>
                                                    <td className={tdClass + " pl-6 font-medium"}>Onsite Display Contextual</td>
                                                    <td className={tdClass + " text-center font-mono"}>20.2%</td>
                                                    <td className={tdClass + " text-center font-mono"}>16.0%</td>
                                                    <td className={tdClass + " text-center font-mono"}>9.4%</td>
                                                    <td className={tdClass + " text-center font-mono text-rose-600 font-medium"}>-55%</td>
                                                    <td className={tdClass + " text-center font-mono"}>9.9</td>
                                                    <td className={tdClass + " text-center font-mono text-rose-600 font-medium"}>-25%</td>
                                                </tr>
                                                <tr className="bg-slate-50 hover:bg-slate-100 transition-colors border-b-2 border-slate-200 mt-2">
                                                    <td className={tdClassBold}>Offsite Display Total</td>
                                                    <td className={tdClass + " text-center font-mono font-medium"}>12.2%</td>
                                                    <td className={tdClass + " text-center font-mono font-medium"}>17.1%</td>
                                                    <td className={tdClass + " text-center font-mono font-medium"}>34.4%</td>
                                                    <td className={tdClass + " text-center font-mono font-medium text-emerald-600"}>52%</td>
                                                    <td className={tdClass + " text-center font-mono font-medium"}>9.4</td>
                                                    <td className={tdClass + " text-center font-mono font-medium text-emerald-600"}>107%</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.3 }}
                                className="card shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="card-header border-b border-slate-100 bg-white rounded-t-xl px-6 py-5">
                                    <div className="card-title text-amber-900 m-0">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mr-3 shadow-sm border border-amber-100">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        Key Events - GMV Sales
                                    </div>
                                </div>
                                <div className="p-6">
                                    <TimeSeriesChart height={300} type="area" />
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.4 }}
                                className="card shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="card-header border-b border-slate-100 bg-white rounded-t-xl px-6 py-5">
                                    <div className="card-title text-blue-900 m-0">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3 shadow-sm border border-blue-100">
                                            <BarChart2 className="w-4 h-4" />
                                        </div>
                                        Spend vs Impressions
                                    </div>
                                </div>
                                <div className="p-6">
                                    <ComparisonBarChart
                                        title="Media Performance Analysis"
                                        data={[
                                            { date: 'Variable A', spend: 3500, impressions: 4200 },
                                            { date: 'Variable B', spend: 2200, impressions: 1800 },
                                            { date: 'Variable C', spend: 3800, impressions: 2800 },
                                            { date: 'Variable D', spend: 2400, impressions: 9800 },
                                            { date: 'Variable E', spend: 4800, impressions: 5200 },
                                        ]}
                                        dataKey1="spend"
                                        dataKey2="impressions"
                                        color1="#FFA726"
                                        color2="#0071DC"
                                        height={300}
                                    />
                                </div>
                            </motion.div>
                        </div>

                        <AutomationNote notes={step.automationNotes} />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
