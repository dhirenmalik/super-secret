// src/pages/DiscoveryToolAnalysis.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../api/kickoff';
import PageHeader from '../components/PageHeader';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import ModelGallery from '../components/ModelGallery';
import MediaTacticsTable from '../components/discovery/MediaTacticsTable';
import AgentInsights from '../components/discovery/AgentInsights';
import ChartTab from '../components/discovery/ChartTab';
import { Target, Search, Loader2, Activity, TrendingUp, BarChart2, Layers, ArrowRight, Bot, Layout, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const step = steps.find((s) => s.slug === 'discovery-tool-analysis');

// Skeleton shimmer cell — used to preserve layout during data loading
const Sk = ({ w = 'w-20', h = 'h-4' }) => (
    <div className={`${w} ${h} bg-slate-200 rounded animate-pulse inline-block`} />
);

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

    // Discovery Tool State
    const [discoveryData, setDiscoveryData] = useState(null);
    const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false);
    const [discoveryError, setDiscoveryError] = useState(null);
    const [yoyShowNumbers, setYoyShowNumbers] = useState(false);
    const [selectedL2s, setSelectedL2s] = useState([]);
    const [activeTab, setActiveTab] = useState('analysis'); // 'analysis', 'observations', 'summary'
    const [tacticFilter, setTacticFilter] = useState('All');
    const [severityFilter, setSeverityFilter] = useState('All');
    const [chartTabActive, setChartTabActive] = useState('units_trend');
    const navigate = useNavigate();

    const CHART_TABS = [
        { key: 'units_trend', label: 'Units Trend' },
        { key: 'units_vs_spends', label: 'Units vs Spends' },
        { key: 'spends_vs_imps', label: 'Spends vs Imps' },
        { key: 'units_vs_search', label: 'Units vs Search' },
        { key: 'units_vs_onsite', label: 'Units vs Onsite Display' },
        { key: 'units_vs_offsite', label: 'Units vs Offsite Display' },
        { key: 'units_vs_instore', label: 'Units vs Instore' },
    ];

    // Reset L2 selection whenever a new model is loaded
    useEffect(() => {
        const l2s = discoveryData?.metadata?.l2_list || [];
        setSelectedL2s(l2s); // default: all selected
    }, [discoveryData]);

    const toggleL2 = (l2) => {
        setSelectedL2s(prev =>
            prev.includes(l2) ? prev.filter(x => x !== l2) : [...prev, l2]
        );
    };

    const allL2s = discoveryData?.metadata?.l2_list || [];

    const metrics = React.useMemo(() => {
        if (!discoveryData || !discoveryData.time_series || discoveryData.time_series.length === 0) return null;

        const ts = discoveryData.time_series;
        const sorted = [...ts].sort((a, b) => new Date(a.date) - new Date(b.date));
        const firstDate = new Date(sorted[0].date);
        const lastDate = new Date(sorted[sorted.length - 1].date);

        const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const periodStr = `${formatDate(firstDate)} - ${formatDate(lastDate)}`;

        let totalSales = 0;
        let totalOnlineSales = 0;
        let totalUnits = 0;
        let totalOnlineUnits = 0;
        let totalSpend = 0;

        sorted.forEach(row => {
            totalSales += Number(row.O_SALE || 0);
            totalOnlineSales += (Number(row.O_SALE_ONLINE || 0) || Number(row.O_SALE_DOTCOM || 0) + Number(row.O_SALE_OG || 0));
            totalUnits += Number(row.O_UNIT || 0);
            totalOnlineUnits += (Number(row.O_UNIT_ONLINE || 0) || Number(row.O_UNIT_DOTCOM || 0) + Number(row.O_UNIT_OG || 0));

            Object.keys(row).forEach(k => {
                if (k.endsWith('_SPEND')) {
                    totalSpend += Number(row[k] || 0);
                }
            });
        });

        const wmcPen = totalSales > 0 ? (totalSpend / totalSales) * 100 : 0;
        const avgPrice = totalUnits > 0 ? (totalSales / totalUnits) : 0;
        const unitOnlinePct = totalUnits > 0 ? (totalOnlineUnits / totalUnits) * 100 : 0;
        const salesOnlinePct = totalSales > 0 ? (totalOnlineSales / totalSales) * 100 : 0;

        // Split into 3 periods for the table
        const chunkSize = Math.ceil(sorted.length / 3);
        const periods = [];

        // Exact target columns prescribed by the user
        const TARGET_SPEND_COLS = ["M_SP_AB_SPEND", "M_SP_KWB_SPEND", "M_SBA_SPEND", "M_SV_SPEND", "M_ON_DIS_AT_SPEND", "M_ON_DIS_CT_SPEND", "M_ON_DIS_CATTO_SPEND", "M_ON_DIS_KW_SPEND", "M_ON_DIS_ROS_SPEND", "M_ON_DIS_HPLO_SPEND", "M_ON_DIS_APP_HPLO_SPEND", "M_ON_DIS_HP_SPEND", "M_ON_DIS_HPTO_SPEND", "M_ON_DIS_HPGTO_SPEND", "M_OFF_DIS_FB_SPEND", "M_OFF_DIS_PIN_SPEND", "M_OFF_DIS_WN_WITHOUTCTV_SPEND", "M_OFF_DIS_DSP_CTV_SPEND", "M_INSTORE_TV_WALL_SUM_SPEND"];
        const TARGET_IMP_COLS = ["M_SP_AB_CLK", "M_SP_KWB_CLK", "M_SBA_CLK", "M_SV_CLK", "M_ON_DIS_AT_IMP", "M_ON_DIS_CT_IMP", "M_ON_DIS_CATTO_IMP", "M_ON_DIS_KW_IMP", "M_ON_DIS_ROS_IMP", "M_ON_DIS_HPLO_IMP", "M_ON_DIS_APP_HPLO_IMP", "M_ON_DIS_HP_IMP", "M_ON_DIS_HPTO_IMP", "M_ON_DIS_HPGTO_IMP", "M_OFF_DIS_FB_IMP", "M_OFF_DIS_PIN_IMP", "M_OFF_DIS_WN_WITHOUTCTV_IMP", "M_OFF_DIS_DSP_CTV_IMP", "M_INSTORE_TV_WALL_SUM_IMP"];

        // Tactic tracking
        const tacticsMap = {}; // prefix -> { name, spends: [0,0,0], actions: [0,0,0], isCpc: false, spendKey, actionKey }

        TARGET_SPEND_COLS.forEach((spendKey, index) => {
            const actionKey = TARGET_IMP_COLS[index];
            const prefix = spendKey.replace('_SPEND', '');
            const isCpc = actionKey.endsWith('_CLK');

            tacticsMap[prefix] = {
                name: prefix.replace(/_/g, ' '),
                spends: [0, 0, 0],
                actions: [0, 0, 0],
                isCpc,
                spendKey,
                actionKey
            };
        });

        let totalSpendPerPeriod = [0, 0, 0];

        for (let i = 0; i < 3; i++) {
            const chunk = sorted.slice(i * chunkSize, (i + 1) * chunkSize);
            if (chunk.length === 0) continue;

            const cStart = new Date(chunk[0].date);
            const cEnd = new Date(chunk[chunk.length - 1].date);

            let cSales = 0, cOnlineSales = 0, cUnits = 0, cOnlineUnits = 0, cSpend = 0;
            chunk.forEach(row => {
                cSales += Number(row.O_SALE || 0);
                cOnlineSales += (Number(row.O_SALE_ONLINE || 0) || Number(row.O_SALE_DOTCOM || 0) + Number(row.O_SALE_OG || 0));
                cUnits += Number(row.O_UNIT || 0);
                cOnlineUnits += (Number(row.O_UNIT_ONLINE || 0) || Number(row.O_UNIT_DOTCOM || 0) + Number(row.O_UNIT_OG || 0));

                Object.values(tacticsMap).forEach(tactic => {
                    const spendVal = Number(row[tactic.spendKey] || 0);
                    cSpend += spendVal;
                    tactic.spends[i] += spendVal;
                    totalSpendPerPeriod[i] += spendVal;

                    tactic.actions[i] += Number(row[tactic.actionKey] || 0);
                });
            });

            periods.push({
                name: `${formatDate(cStart)} - ${formatDate(cEnd)}`,
                unitOnlinePct: cUnits > 0 ? (cOnlineUnits / cUnits) * 100 : 0,
                salesOnlinePct: cSales > 0 ? (cOnlineSales / cSales) * 100 : 0,
                wmcPen: cSales > 0 ? (cSpend / cSales) * 100 : 0,
                price: cUnits > 0 ? (cSales / cUnits) : 0,
                rawSales: cSales,
                rawUnits: cUnits,
                rawSpend: cSpend
            });
        }

        // Calculate Media Tactics Rows
        const mediaTactics = Object.values(tacticsMap).map(t => {
            const share1 = totalSpendPerPeriod[0] > 0 ? (t.spends[0] / totalSpendPerPeriod[0]) * 100 : 0;
            const share2 = totalSpendPerPeriod[1] > 0 ? (t.spends[1] / totalSpendPerPeriod[1]) * 100 : 0;
            const share3 = totalSpendPerPeriod[2] > 0 ? (t.spends[2] / totalSpendPerPeriod[2]) * 100 : 0;

            const spendYoy = t.spends[1] > 0 ? ((t.spends[2] - t.spends[1]) / t.spends[1]) * 100 : 0;

            // Cost Per Action for latest period (P3)
            let cpa = 0;
            if (t.actions[2] > 0) {
                cpa = t.isCpc ? (t.spends[2] / t.actions[2]) : ((t.spends[2] / t.actions[2]) * 1000);
            }

            // Cost Per Action for prev period (P2)
            let prevCpa = 0;
            if (t.actions[1] > 0) {
                prevCpa = t.isCpc ? (t.spends[1] / t.actions[1]) : ((t.spends[1] / t.actions[1]) * 1000);
            }

            const cpaYoy = prevCpa > 0 ? ((cpa - prevCpa) / prevCpa) * 100 : 0;

            return {
                name: t.name,
                shares: [share1, share2, share3],
                spends: [...t.spends],
                spendYoy,
                cpa,
                cpaYoy,
                isCpc: t.isCpc
            };
        }).filter(t => t.shares.some(s => s > 0)); // Only keep tactics that actually have spend

        // Sort by total spend share in latest period descending
        mediaTactics.sort((a, b) => b.shares[2] - a.shares[2]);

        // YOY Change is Period 3 vs Period 2
        let yoy = { sales: 0, units: 0, spend: 0, price: 0, wmcPen: 0, unitOnline: 0, salesOnline: 0 };
        if (periods.length >= 2) {
            const pLast = periods[periods.length - 1];
            const pPrev = periods[periods.length - 2];

            const calcChange = (curr, prev) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;
            yoy.sales = calcChange(pLast.rawSales, pPrev.rawSales);
            yoy.units = calcChange(pLast.rawUnits, pPrev.rawUnits);
            yoy.spend = calcChange(pLast.rawSpend, pPrev.rawSpend);
            yoy.price = calcChange(pLast.price, pPrev.price);
            yoy.wmcPen = calcChange(pLast.wmcPen, pPrev.wmcPen);
            yoy.unitOnline = calcChange(pLast.unitOnlinePct, pPrev.unitOnlinePct);
            yoy.salesOnline = calcChange(pLast.salesOnlinePct, pPrev.salesOnlinePct);
        }

        return {
            periodStr,
            wmcPen,
            avgPrice,
            unitOnlinePct,
            salesOnlinePct,
            periods,
            yoy,
            mediaTactics
        };
    }, [discoveryData]);

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
            // Only show models that have a completed brand stack build
            setModels(Array.isArray(data) ? data.filter(m => m.stack_built === true) : []);
        } catch (error) {
            console.error('Error fetching models:', error);
        } finally {
            setIsLoadingModels(false);
        }
    };

    useEffect(() => {
        if (activeModelId) {
            loadDiscoveryData(activeModelId);
        } else {
            setDiscoveryData(null);
        }
    }, [activeModelId]);

    const loadDiscoveryData = async (modelId) => {
        setIsLoadingDiscovery(true);
        setDiscoveryError(null);
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/eda/discovery/${modelId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Modeling stack not built yet for this model. Please build the stack in Exclude Flag Analysis first.");
                }
                throw new Error("Failed to load discovery data.");
            }
            const data = await response.json();
            setDiscoveryData(data);
        } catch (error) {
            console.error('Error fetching discovery data:', error);
            setDiscoveryError(error.message);
        } finally {
            setIsLoadingDiscovery(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <PageHeader
                title={step.name}
                subtitle="High-level category trends and year-over-year performance overview."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
                activeModelId={activeModelId}
                models={models}
                onModelSwitch={() => setShowGallery(true)}
            >
                <div className="flex items-center gap-3">
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-indigo-100 shadow-sm">
                        EDA Phase
                    </span>
                    <StatusBadge status="not-started" />
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

                        {/* Premium Tab Navigation */}
                        <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 w-fit backdrop-blur-sm shadow-sm">
                            {[
                                { id: 'analysis', label: 'Analysis Trends', icon: Activity },
                                { id: 'observations', label: 'AI Observations', icon: Bot },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`relative flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive
                                            ? 'text-indigo-700 shadow-md translate-y-0'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTabBg"
                                                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-indigo-100"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <Icon size={18} className={`relative z-10 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <span className="relative z-10">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                {activeTab === 'analysis' && (
                                    <div className="space-y-6">
                                        <div className="flex flex-col gap-6">
                                            {/* Card 1: Discovery Tool Details */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, delay: 0.1 }}
                                                className="card shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <div className="p-6 space-y-6">
                                                    {/* Category Info */}
                                                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                                        <table className="w-full text-sm">
                                                            <tbody>
                                                                <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                                    <td className="w-1/3 px-4 py-3 font-bold text-slate-600 bg-slate-50/50 border-r border-slate-100 text-[11px] uppercase tracking-wider">Category</td>
                                                                    <td className="px-4 py-3 font-semibold text-slate-800">
                                                                        {activeModelId && Array.isArray(models) ? (models.find(m => String(m.model_id) === String(activeModelId))?.model_name || 'Selected Model') : 'Unknown Category'}
                                                                    </td>
                                                                </tr>
                                                                <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                                    <td className="w-1/3 px-4 py-3 font-bold text-slate-600 bg-slate-50/50 border-r border-slate-100 text-[11px] uppercase tracking-wider">Modeling Time Period</td>
                                                                    <td className="px-4 py-3 font-semibold text-slate-800">
                                                                        {isLoadingDiscovery ? <Sk w="w-48" /> : (metrics?.periodStr || 'N/A')}
                                                                    </td>
                                                                </tr>
                                                                <tr className="border-b border-slate-100 last:border-0">
                                                                    <td className="w-1/3 px-4 py-3 font-bold text-slate-600 bg-slate-50/50 border-r border-slate-100 text-[11px] uppercase tracking-wider align-top pt-4">Subcategories</td>
                                                                    <td className="px-3 py-3">
                                                                        {isLoadingDiscovery ? (
                                                                            <div className="flex gap-2"><Sk w="w-16" /><Sk w="w-20" /><Sk w="w-12" /></div>
                                                                        ) : allL2s.length > 0 ? (
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                <button
                                                                                    onClick={() => setSelectedL2s(allL2s)}
                                                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${selectedL2s.length === allL2s.length
                                                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                                                        : 'bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50'
                                                                                        }`}
                                                                                >All</button>
                                                                                {allL2s.map(l2 => (
                                                                                    <button
                                                                                        key={l2}
                                                                                        onClick={() => toggleL2(l2)}
                                                                                        title={l2}
                                                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all max-w-[120px] truncate ${selectedL2s.includes(l2)
                                                                                            ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                                                                                            : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                                                                                            }`}
                                                                                    >{l2}</button>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-xs text-slate-500 italic">Mixed</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* YOY Change */}
                                                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th colSpan="3" className="px-4 py-3 text-xs font-extrabold text-white bg-indigo-600 uppercase tracking-wider text-center shadow-inner">
                                                                        <div className="flex items-center justify-center gap-3">
                                                                            <span>YOY Change</span>
                                                                            <div className="flex rounded-lg overflow-hidden border border-indigo-400 text-[10px] font-bold">
                                                                                <button
                                                                                    onClick={() => setYoyShowNumbers(false)}
                                                                                    className={`px-2 py-0.5 transition-colors ${!yoyShowNumbers ? 'bg-white text-indigo-700' : 'bg-indigo-500 text-white hover:bg-indigo-400'}`}
                                                                                >%</button>
                                                                                <button
                                                                                    onClick={() => setYoyShowNumbers(true)}
                                                                                    className={`px-2 py-0.5 transition-colors ${yoyShowNumbers ? 'bg-white text-indigo-700' : 'bg-indigo-500 text-white hover:bg-indigo-400'}`}
                                                                                >#</button>
                                                                            </div>
                                                                        </div>
                                                                    </th>
                                                                </tr>
                                                                <tr className="bg-slate-50">
                                                                    <th className={thClass + " text-center"}>{yoyShowNumbers ? 'Omni Unit Sales' : 'Omni Unit Sales'}</th>
                                                                    <th className={thClass + " text-center"}>Omni GMV ($)</th>
                                                                    <th className={thClass + " text-center"}>WMC Spends ($)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr className="hover:bg-slate-50 transition-colors">
                                                                    {isLoadingDiscovery ? (
                                                                        <><td className={`${tdClass} text-center`}><Sk /></td><td className={`${tdClass} text-center`}><Sk /></td><td className={`${tdClass} text-center`}><Sk /></td></>
                                                                    ) : yoyShowNumbers ? (
                                                                        <>
                                                                            <td className={`${tdClass} text-center font-mono font-medium text-slate-700`}>
                                                                                {metrics?.periods?.at(-1)?.rawUnits
                                                                                    ? (metrics.periods.at(-1).rawUnits >= 1e6 ? `${(metrics.periods.at(-1).rawUnits / 1e6).toFixed(2)}M` : metrics.periods.at(-1).rawUnits >= 1e3 ? `${(metrics.periods.at(-1).rawUnits / 1e3).toFixed(1)}K` : metrics.periods.at(-1).rawUnits.toFixed(0))
                                                                                    : 'N/A'}
                                                                            </td>
                                                                            <td className={`${tdClass} text-center font-mono font-medium text-slate-700`}>
                                                                                {metrics?.periods?.at(-1)?.rawSales
                                                                                    ? `$${metrics.periods.at(-1).rawSales >= 1e6 ? `${(metrics.periods.at(-1).rawSales / 1e6).toFixed(2)}M` : metrics.periods.at(-1).rawSales >= 1e3 ? `${(metrics.periods.at(-1).rawSales / 1e3).toFixed(1)}K` : metrics.periods.at(-1).rawSales.toFixed(0)}`
                                                                                    : 'N/A'}
                                                                            </td>
                                                                            <td className={`${tdClass} text-center font-mono font-medium text-slate-700`}>
                                                                                {metrics?.periods?.at(-1)?.rawSpend
                                                                                    ? `$${metrics.periods.at(-1).rawSpend >= 1e6 ? `${(metrics.periods.at(-1).rawSales / 1e6).toFixed(2)}M` : metrics.periods.at(-1).rawSpend >= 1e3 ? `${(metrics.periods.at(-1).rawSpend / 1e3).toFixed(1)}K` : metrics.periods.at(-1).rawSpend.toFixed(0)}`
                                                                                    : 'N/A'}
                                                                            </td>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <td className={`${tdClass} text-center font-mono font-medium ${(metrics?.yoy?.units ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{(metrics?.yoy?.units ?? 0) > 0 ? '+' : ''}{(metrics?.yoy?.units ?? 0).toFixed(1)}%</td>
                                                                            <td className={`${tdClass} text-center font-mono font-medium ${(metrics?.yoy?.sales ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{(metrics?.yoy?.sales ?? 0) > 0 ? '+' : ''}{(metrics?.yoy?.sales ?? 0).toFixed(1)}%</td>
                                                                            <td className={`${tdClass} text-center font-mono font-medium ${(metrics?.yoy?.spend ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{(metrics?.yoy?.spend ?? 0) > 0 ? '+' : ''}{(metrics?.yoy?.spend ?? 0).toFixed(1)}%</td>
                                                                        </>
                                                                    )}
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
                                                                    <th className={thClass + " text-center"}>Brands in Final Stack</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr className="hover:bg-slate-50 transition-colors">
                                                                    <td className={tdClass + " text-center font-mono"}>{isLoadingDiscovery ? <Sk /> : `${(metrics?.wmcPen ?? 0).toFixed(2)}%`}</td>
                                                                    <td className={tdClass + " text-center font-mono"}>{isLoadingDiscovery ? <Sk /> : `$${(metrics?.avgPrice ?? 0).toFixed(2)}`}</td>
                                                                    <td className={tdClass + " text-center font-mono"}>{isLoadingDiscovery ? <Sk /> : `${(metrics?.unitOnlinePct ?? 0).toFixed(1)}%`}</td>
                                                                    <td className={tdClass + " text-center font-mono"}>{isLoadingDiscovery ? <Sk /> : `${(metrics?.salesOnlinePct ?? 0).toFixed(1)}%`}</td>
                                                                    <td className={tdClass + " text-center font-mono font-extrabold text-indigo-700 text-base"}>{isLoadingDiscovery ? <Sk w="w-8" /> : (discoveryData?.metadata?.num_brands || 0)}</td>
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
                                                                {isLoadingDiscovery ? (
                                                                    [0, 1, 2].map(i => (
                                                                        <tr key={i} className="hover:bg-slate-50">
                                                                            <td className={tdClassBold}><Sk w="w-32" /></td>
                                                                            <td className={tdClass + " text-center"}><Sk /></td>
                                                                            <td className={tdClass + " text-center"}><Sk /></td>
                                                                            <td className={tdClass + " text-center"}><Sk /></td>
                                                                            <td className={tdClass + " text-center"}><Sk /></td>
                                                                        </tr>
                                                                    ))
                                                                ) : metrics?.periods.map((p, i) => (
                                                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                                        <td className={tdClassBold}>{p.name}</td>
                                                                        <td className={tdClass + " text-center font-mono"}>{p.unitOnlinePct.toFixed(1)}%</td>
                                                                        <td className={tdClass + " text-center font-mono"}>{p.salesOnlinePct.toFixed(1)}%</td>
                                                                        <td className={tdClass + " text-center font-mono"}>{p.wmcPen.toFixed(2)}%</td>
                                                                        <td className={tdClass + " text-center font-mono"}>${p.price.toFixed(2)}</td>
                                                                    </tr>
                                                                ))}
                                                                <tr className="bg-slate-50/80 hover:bg-slate-100 transition-colors">
                                                                    <td className="px-4 py-3 text-xs font-extrabold text-slate-800 uppercase tracking-wider">Change YOY %</td>
                                                                    <td className={`${tdClass} text-center font-mono font-semibold ${(metrics?.yoy?.unitOnline ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{isLoadingDiscovery ? <Sk /> : `${(metrics?.yoy?.unitOnline ?? 0) > 0 ? '+' : ''}${(metrics?.yoy?.unitOnline ?? 0).toFixed(1)}%`}</td>
                                                                    <td className={`${tdClass} text-center font-mono font-semibold ${(metrics?.yoy?.salesOnline ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{isLoadingDiscovery ? <Sk /> : `${(metrics?.yoy?.salesOnline ?? 0) > 0 ? '+' : ''}${(metrics?.yoy?.salesOnline ?? 0).toFixed(1)}%`}</td>
                                                                    <td className={`${tdClass} text-center font-mono font-semibold ${(metrics?.yoy?.wmcPen ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{isLoadingDiscovery ? <Sk /> : `${(metrics?.yoy?.wmcPen ?? 0) > 0 ? '+' : ''}${(metrics?.yoy?.wmcPen ?? 0).toFixed(1)}%`}</td>
                                                                    <td className={`${tdClass} text-center font-mono font-semibold ${(metrics?.yoy?.price ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{isLoadingDiscovery ? <Sk /> : `${(metrics?.yoy?.price ?? 0) > 0 ? '+' : ''}${(metrics?.yoy?.price ?? 0).toFixed(1)}%`}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>

                                        <div className="mt-8">
                                            <MediaTacticsTable metrics={isLoadingDiscovery ? null : metrics} isLoading={isLoadingDiscovery} oadRows={discoveryData?.on_air_analysis} />
                                        </div>

                                        {/* Chart Explorer */}
                                        {discoveryData && !isLoadingDiscovery && (
                                            <div className="mt-8 card shadow-sm p-6">
                                                <h3 className="text-lg font-bold text-slate-800 mb-6">Comparative Charts</h3>
                                                <div className="mb-6 border-b border-slate-200">
                                                    <div className="flex gap-6 overflow-x-auto">
                                                        {CHART_TABS.map((t) => (
                                                            <button
                                                                key={t.key}
                                                                type="button"
                                                                onClick={() => setChartTabActive(t.key)}
                                                                className={`whitespace-nowrap pb-3 text-sm font-semibold transition border-b-2 ${chartTabActive === t.key
                                                                    ? 'border-indigo-600 text-indigo-600'
                                                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                                                    }`}
                                                            >
                                                                {t.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <ChartTab
                                                    key={chartTabActive}
                                                    chartData={discoveryData?.charts?.[chartTabActive] || {
                                                        columns: discoveryData?.columns || [],
                                                        time_series: discoveryData?.time_series || [],
                                                        period_agg: {}
                                                    }}
                                                    activeTacticFilter={tacticFilter}
                                                    anomaliesTable={discoveryData?.anomalies}
                                                    anomalies={discoveryData?.anomalies}
                                                />
                                            </div>
                                        )}

                                        {/* Media Mix */}
                                        {discoveryData?.media_mix?.length > 0 && (
                                            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="mt-8 card shadow-sm">
                                                <div className="p-6">
                                                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr><th colSpan="5" className="px-4 py-3 text-xs font-extrabold text-white bg-indigo-600 uppercase tracking-wider text-center shadow-inner">Media Mix (%)</th></tr>
                                                                <tr className="bg-slate-50">
                                                                    <th className={thClass}>Period</th>
                                                                    <th className={thClass + " text-center"}>Search</th>
                                                                    <th className={thClass + " text-center"}>Onsite Display</th>
                                                                    <th className={thClass + " text-center"}>Offsite Display</th>
                                                                    <th className={thClass + " text-center"}>TV Wall</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {discoveryData.media_mix.map((row, i) => (
                                                                    <tr key={i} className={row.period === 'Change YOY %' ? 'bg-slate-50/80 font-semibold' : 'hover:bg-slate-50 transition-colors'}>
                                                                        <td className={tdClassBold}>{row.period}</td>
                                                                        <td className={tdClass + " text-center font-mono"}>{row.search}%</td>
                                                                        <td className={tdClass + " text-center font-mono"}>{row.onsite_display}%</td>
                                                                        <td className={tdClass + " text-center font-mono"}>{row.offsite_display}%</td>
                                                                        <td className={tdClass + " text-center font-mono"}>{row.tv_wall}%</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Value Added */}
                                        {discoveryData?.value_added?.length > 0 && (
                                            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="mt-8 card shadow-sm">
                                                <div className="p-6">
                                                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr><th colSpan="5" className="px-4 py-3 text-xs font-extrabold text-white bg-emerald-600 uppercase tracking-wider text-center shadow-inner">Value Added Impressions (Zero Spend)</th></tr>
                                                                <tr className="bg-slate-50">
                                                                    <th className={thClass}>Tactic</th>
                                                                    <th className={thClass + " text-center"}>Total Impressions</th>
                                                                    <th className={thClass + " text-center"}>Added Value Imp.</th>
                                                                    <th className={thClass + " text-center"}>% Added Value</th>
                                                                    <th className={thClass + " text-center"}>Days</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {discoveryData.value_added.map((row, i) => (
                                                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                                        <td className={tdClassBold}>{row.tactic}</td>
                                                                        <td className={tdClass + " text-center font-mono"}>{row.total_imp >= 1e6 ? `${(row.total_imp / 1e6).toFixed(1)}M` : row.total_imp >= 1e3 ? `${(row.total_imp / 1e3).toFixed(0)}K` : row.total_imp}</td>
                                                                        <td className={tdClass + " text-center font-mono text-emerald-600 font-semibold"}>{row.av_imp >= 1e6 ? `${(row.av_imp / 1e6).toFixed(1)}M` : row.av_imp >= 1e3 ? `${(row.av_imp / 1e3).toFixed(0)}K` : row.av_imp}</td>
                                                                        <td className={tdClass + " text-center font-mono"}>{row.pct_av}%</td>
                                                                        <td className={tdClass + " text-center font-mono"}>{row.num_days}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'observations' && (
                                    <AgentInsights
                                        modelId={activeModelId}
                                        insights={discoveryData?.metadata?.agent_insights || null}
                                        anomaliesTable={discoveryData?.anomalies}
                                        isLoading={isLoadingDiscovery}
                                        tacticFilter={tacticFilter}
                                        setTacticFilter={setTacticFilter}
                                        severityFilter={severityFilter}
                                        setSeverityFilter={setSeverityFilter}
                                        availableTactics={['All', ...new Set(discoveryData?.anomalies?.map(a => a.Tactic_Prefix) || [])]}
                                        availableSeverities={['All', 'Critical', 'High', 'Medium', 'Low']}
                                    />
                                )}



                                {/* Action Bar */}
                                <div className="flex justify-end pt-8 pb-8 border-t border-slate-100">
                                    <button
                                        onClick={() => navigate('/step/tool-review')}
                                        className="group flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 transition-all hover:-translate-y-1 active:scale-95"
                                    >
                                        <span>Proceed to Tool Review</span>
                                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <AutomationNote notes={step.automationNotes} />
                    </motion.div>
                )}
            </div>
        </motion.div >
    );
}
