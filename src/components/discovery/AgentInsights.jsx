import React, { useState, useMemo } from 'react';
import { Bot, ChevronDown, ChevronUp, AlertCircle, FileText, Activity, Filter, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiBaseUrl } from '../../api/kickoff';
import MultiSelect from '../MultiSelect';
import NumberRangeFilter from '../NumberRangeFilter';

export default function AgentInsights({
    insights,
    anomaliesTable,
    isLoading,
    tacticFilter,
    setTacticFilter,
    severityFilter,
    setSeverityFilter,
    availableTactics,
    availableSeverities,
    modelId
}) {
    const { token } = useAuth();
    const [isTableExpanded, setIsTableExpanded] = useState(false);

    // Dynamic LLM State
    const [dynamicInsights, setDynamicInsights] = useState(insights || "");
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Column Filters State
    const [columnFilters, setColumnFilters] = useState({
        date: '',
        tactics: [],
        severities: [],
        reasons: [],
        zScore: { min: '', max: '' },
        spend: { min: '', max: '' },
        impClk: { min: '', max: '' },
        brands: ''
    });

    // Unique options for multiselects
    const filterOptions = useMemo(() => {
        if (!anomaliesTable) return { tactics: [], severities: [], reasons: [] };

        const getUnique = (key) => {
            const vals = [...new Set(anomaliesTable.map(r => r[key]))].filter(Boolean).sort();
            return vals.map(v => ({ value: v, label: v }));
        };

        return {
            tactics: getUnique('Tactic_Prefix'),
            severities: getUnique('Severity_Band'),
            reasons: getUnique('Reason')
        };
    }, [anomaliesTable]);

    // Reset insights or filters when switching models
    React.useEffect(() => {
        setDynamicInsights(insights || "");
        setColumnFilters({
            date: '',
            tactics: [],
            severities: [],
            reasons: [],
            zScore: { min: '', max: '' },
            spend: { min: '', max: '' },
            impClk: { min: '', max: '' },
            brands: ''
        });
    }, [insights, modelId]);

    // Auto-generate if no insights were passed from backend cache
    React.useEffect(() => {
        if (!insights && !dynamicInsights && !isRegenerating && anomaliesTable && anomaliesTable.length > 0) {
            handleRegenerate();
        }
    }, [insights, dynamicInsights, anomaliesTable, isRegenerating]);

    // The locally filtered grid
    const filteredAnomalies = useMemo(() => {
        if (!anomaliesTable) return [];
        return anomaliesTable.filter(row => {
            // Global Filters (Primary dashboard filters)
            const matchTactic = tacticFilter === 'All' || tacticFilter.replace('_SPEND', '').replace('_IMP', '').replace('_CLK', '') === row.Tactic_Prefix;
            const rowSeverity = row.Severity_Band || row.Severity;
            const matchSeverity = severityFilter === 'All' || rowSeverity === severityFilter;

            if (!matchTactic || !matchSeverity) return false;

            // Column Filters
            const dateStr = String(row['Anomaly_Date'] || row['Anomaly Date'] || '').toLowerCase();
            const tacticVal = row['Tactic_Prefix'];
            const reasonVal = row['Reason'];
            const severityVal = row['Severity_Band'] || row['Severity'];
            const brandsStr = String(row['Brands_list'] || '').toLowerCase();

            const zVal = Number(row['Z']) || 0;
            const spendVal = Number(row['Spend']) || 0;
            const impVal = Number(row['Impressions']) || 0;

            const matchColDate = !columnFilters.date || dateStr.includes(columnFilters.date.toLowerCase());
            const matchColTactic = columnFilters.tactics.length === 0 || columnFilters.tactics.includes(tacticVal);
            const matchColReason = columnFilters.reasons.length === 0 || columnFilters.reasons.includes(reasonVal);
            const matchColSeverity = columnFilters.severities.length === 0 || columnFilters.severities.includes(severityVal);
            const matchColBrands = !columnFilters.brands || brandsStr.includes(columnFilters.brands.toLowerCase());

            const rangeMatch = (val, range) => {
                if (!range || (range.min === '' && range.max === '')) return true;
                const min = range.min !== '' ? Number(range.min) : -Infinity;
                const max = range.max !== '' ? Number(range.max) : Infinity;
                return val >= min && val <= max;
            };

            const matchZ = rangeMatch(zVal, columnFilters.zScore);
            const matchSpend = rangeMatch(spendVal, columnFilters.spend);
            const matchImp = rangeMatch(impVal, columnFilters.impClk);

            return matchColDate && matchColTactic && matchColReason && matchColSeverity && matchColBrands && matchZ && matchSpend && matchImp;
        });
    }, [anomaliesTable, tacticFilter, severityFilter, columnFilters]);


    const handleRegenerate = async () => {
        if (filteredAnomalies.length === 0) return;

        setIsRegenerating(true);
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/eda/discovery/generate-insights`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ model_id: modelId, records: filteredAnomalies })
            });

            if (!response.ok) throw new Error("Failed to generate insights");

            const data = await response.json();
            setDynamicInsights(data.agent_insights);

            if (!isTableExpanded) setIsTableExpanded(true);
        } catch (error) {
            console.error("Error regenerating insights:", error);
            setDynamicInsights("An error occurred while generating customized insights. Please check if OPENAI_API_KEY is configured on the backend.");
        } finally {
            setIsRegenerating(false);
        }
    };


    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden mb-6 skeleton-shimmer">
                <div className="bg-gradient-to-r from-indigo-50 to-slate-50 p-4 border-b border-indigo-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-200"></div>
                    <div className="h-5 bg-indigo-200 rounded w-48"></div>
                </div>
                <div className="p-6">
                    <div className="space-y-3">
                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                        <div className="h-4 bg-slate-100 rounded w-11/12"></div>
                        <div className="h-4 bg-slate-100 rounded w-4/5"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!insights && (!anomaliesTable || anomaliesTable.length === 0)) {
        return null;
    }

    const formattedInsights = dynamicInsights ? dynamicInsights.split('\n').filter(line => line.trim() !== "") : [];

    return (
        <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden mb-8">
            {/* Header section */}
            <div className="bg-gradient-to-r from-indigo-50 to-slate-50 p-5 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shadow-inner">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">AI Discovery Agent</h3>
                        <p className="text-sm text-slate-500 font-medium">Automated observations & brand anomaly detection</p>
                    </div>
                </div>

                {/* Global Filters & Actions */}
                <div className="flex items-center gap-4 border border-indigo-200/60 bg-white/60 p-2 rounded-lg backdrop-blur-sm shadow-sm">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            className="bg-white border border-slate-200 text-slate-700 text-sm rounded focus:ring-indigo-500 focus:border-indigo-500 block p-1.5 font-medium"
                            value={tacticFilter}
                            onChange={(e) => setTacticFilter(e.target.value)}
                        >
                            {availableTactics.map(t => <option key={t} value={t}>{t === 'All' ? 'All Tactics' : t}</option>)}
                        </select>
                        <select
                            className="bg-white border border-slate-200 text-slate-700 text-sm rounded focus:ring-indigo-500 focus:border-indigo-500 block p-1.5 font-medium"
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                        >
                            {availableSeverities.map(s => <option key={s} value={s}>{s === 'All' ? 'All Severities' : s + ' Severity'}</option>)}
                        </select>
                    </div>
                    <div className="w-px h-6 bg-slate-200"></div>
                    <button
                        onClick={handleRegenerate}
                        disabled={isRegenerating || filteredAnomalies.length === 0}
                        className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw size={14} className={isRegenerating ? "animate-spin" : ""} />
                        {isRegenerating ? "Generating..." : "Regenerate Observations"}
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6">

                {/* AI Observations Box */}
                <div className="mb-6 relative">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText size={18} className="text-indigo-600" />
                        <h4 className="text-base font-bold text-slate-800 tracking-tight">
                            {tacticFilter !== 'All' || severityFilter !== 'All' ? 'Filtered Observations' : 'Overall Key Observations'}
                        </h4>
                    </div>
                    <div className={`bg-slate-50 border border-slate-200 rounded-lg p-5 leading-relaxed text-slate-700 font-medium min-h-[100px] transition-opacity duration-300 shadow-inner ${isRegenerating ? 'opacity-50' : 'opacity-100'}`}>
                        {isRegenerating && formattedInsights.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-6">
                                <RefreshCw size={24} className="animate-spin mb-3 text-indigo-500" />
                                <span>Generating dynamic insights from {filteredAnomalies.length} anomaly records...</span>
                            </div>
                        ) : formattedInsights.length > 0 ? (
                            formattedInsights.map((line, idx) => {
                                if (line.includes(':')) {
                                    const [tactic, ...rest] = line.split(':');
                                    return (
                                        <p key={idx} className="mb-3 last:mb-0">
                                            <span className="font-extrabold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded mr-2 border border-indigo-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-xs uppercase tracking-wider">{tactic}</span>
                                            <span className="text-[14px] leading-relaxed text-slate-700">{rest.join(':')}</span>
                                        </p>
                                    );
                                }
                                return <p key={idx} className="mb-3 last:mb-0 text-[14px] leading-relaxed">{line}</p>;
                            })
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 italic">No formatted observations returned.</div>
                        )}
                    </div>
                </div>

                {/* Anomalies Data Table Toggle */}
                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <button
                        onClick={() => setIsTableExpanded(!isTableExpanded)}
                        className="w-full bg-slate-50 hover:bg-slate-100 transition-colors p-4 flex items-center justify-between font-bold text-slate-700"
                    >
                        <div className="flex items-center gap-2">
                            <Activity size={18} className="text-indigo-600" />
                            <span>Detailed Anomaly Records ({filteredAnomalies.length} match filters)</span>
                        </div>
                        {isTableExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {/* Table Content */}
                    {isTableExpanded && (
                        <div className="overflow-x-auto border-t border-slate-200 bg-white max-h-[500px] overflow-y-auto">
                            {filteredAnomalies.length > 0 ? (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50 sticky top-0 z-10 shadow-sm border-b-2 border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 border-r border-slate-200 whitespace-nowrap">Date</th>
                                            <th className="px-4 py-3 border-r border-slate-200 whitespace-nowrap">Tactic</th>
                                            <th className="px-4 py-3 border-r border-slate-200">Reason</th>
                                            <th className="px-4 py-3 border-r border-slate-200 text-center">Severity</th>
                                            <th className="px-4 py-3 border-r border-slate-200 text-right">Z-Score</th>
                                            <th className="px-4 py-3 border-r border-slate-200 text-right">Spend ($)</th>
                                            <th className="px-4 py-3 border-r border-slate-200 text-right">IMP/CLK</th>
                                            <th className="px-4 py-3">Top Brands</th>
                                        </tr>
                                        <tr className="bg-white">
                                            <th className="px-2 py-1.5 border-r border-slate-200">
                                                <input
                                                    type="text"
                                                    placeholder="Filter..."
                                                    className="w-full px-2 py-1.5 text-[10px] border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                                                    value={columnFilters.date}
                                                    onChange={(e) => setColumnFilters({ ...columnFilters, date: e.target.value })}
                                                />
                                            </th>
                                            <th className="px-2 py-1.5 border-r border-slate-200">
                                                <MultiSelect
                                                    label="Tactic"
                                                    options={filterOptions.tactics}
                                                    selectedValues={columnFilters.tactics}
                                                    onChange={(vals) => setColumnFilters({ ...columnFilters, tactics: vals })}
                                                />
                                            </th>
                                            <th className="px-2 py-1.5 border-r border-slate-200">
                                                <MultiSelect
                                                    label="Reason"
                                                    options={filterOptions.reasons}
                                                    selectedValues={columnFilters.reasons}
                                                    onChange={(vals) => setColumnFilters({ ...columnFilters, reasons: vals })}
                                                />
                                            </th>
                                            <th className="px-2 py-1.5 border-r border-slate-200">
                                                <MultiSelect
                                                    label="Severity"
                                                    options={filterOptions.severities}
                                                    selectedValues={columnFilters.severities}
                                                    onChange={(vals) => setColumnFilters({ ...columnFilters, severities: vals })}
                                                />
                                            </th>
                                            <th className="px-2 py-1.5 border-r border-slate-200">
                                                <NumberRangeFilter
                                                    label="Z-Score"
                                                    value={columnFilters.zScore}
                                                    onChange={(val) => setColumnFilters({ ...columnFilters, zScore: val })}
                                                />
                                            </th>
                                            <th className="px-2 py-1.5 border-r border-slate-200">
                                                <NumberRangeFilter
                                                    label="Spend"
                                                    value={columnFilters.spend}
                                                    onChange={(val) => setColumnFilters({ ...columnFilters, spend: val })}
                                                />
                                            </th>
                                            <th className="px-2 py-1.5 border-r border-slate-200">
                                                <NumberRangeFilter
                                                    label="IMP/CLK"
                                                    value={columnFilters.impClk}
                                                    onChange={(val) => setColumnFilters({ ...columnFilters, impClk: val })}
                                                />
                                            </th>
                                            <th className="px-2 py-1.5">
                                                <input
                                                    type="text"
                                                    placeholder="Filter..."
                                                    className="w-full px-2 py-1.5 text-[10px] border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                                                    value={columnFilters.brands}
                                                    onChange={(e) => setColumnFilters({ ...columnFilters, brands: e.target.value })}
                                                />
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredAnomalies.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-4 py-2.5 border-r border-slate-100 font-semibold text-slate-700 whitespace-nowrap text-xs">
                                                    {row['Anomaly_Date'] || row['Anomaly Date']}
                                                </td>
                                                <td className="px-4 py-2.5 border-r border-slate-100">
                                                    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                                                        {row['Tactic_Prefix']}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 border-r border-slate-100 text-slate-600 text-xs font-medium">
                                                    {row['Reason']}
                                                </td>
                                                <td className="px-4 py-2.5 border-r border-slate-100 text-center">
                                                    {(() => {
                                                        const displaySeverity = row['Severity_Band'] || row['Severity'] || 'Low';
                                                        const classes = displaySeverity === 'Critical'
                                                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                            : displaySeverity === 'High'
                                                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                                : displaySeverity === 'Medium'
                                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-slate-100 text-slate-700 border border-slate-200';
                                                        return (
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider leading-none inline-flex shadow-sm ${classes}`}>
                                                                {displaySeverity}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-4 py-2.5 border-r border-slate-100 text-right font-medium text-xs">
                                                    <span className={`px-2 py-1 rounded shadow-sm ${row['Z'] > 3 ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                                                        {row['Z'] !== undefined ? row['Z'] : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 border-r border-slate-100 text-right text-slate-700 font-mono text-xs">
                                                    {row['Spend'] ? row['Spend'].toLocaleString() : '0'}
                                                </td>
                                                <td className="px-4 py-2.5 border-r border-slate-100 text-right text-slate-700 font-mono text-xs">
                                                    {row['Impressions'] ? row['Impressions'].toLocaleString() : '0'}
                                                </td>
                                                <td className="px-4 py-2.5 border-slate-100 text-slate-500 max-w-xs truncate text-[11px] font-medium" title={row['Brands_list']}>
                                                    {row['Brands_list'] || <span className="text-slate-400 italic">N/A</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8 text-center text-slate-400 font-medium">
                                    No anomalies match the selected filters.
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-2 font-medium">
                <AlertCircle size={14} className="text-slate-400" />
                Observations and anomaly tables are generated natively using Z-score outlier detection and LangChain GPT-4o analysis. Use the filters above to ask the AI to summarize specific combinations.
            </div>
        </div>
    );
}
