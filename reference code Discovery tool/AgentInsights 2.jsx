import React, { useState, useMemo } from 'react';
import { Bot, ChevronDown, ChevronUp, AlertCircle, FileText, Activity, Filter, RefreshCw } from 'lucide-react';

import { getApiBaseUrl } from '@/services/eda';

export default function AgentInsights({
    insights,
    anomaliesTable,
    isLoading,
    tacticFilter,
    setTacticFilter,
    severityFilter,
    setSeverityFilter,
    availableTactics,
    availableSeverities
}) {
    const [isTableExpanded, setIsTableExpanded] = useState(false);

    // Dynamic LLM State
    const [dynamicInsights, setDynamicInsights] = useState(insights || "");
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Provide initial render resilience if data is changing upstream
    React.useEffect(() => {
        if (insights && !dynamicInsights) {
            setDynamicInsights(insights);
        } else if (!insights && !dynamicInsights && anomaliesTable && anomaliesTable.length > 0) {
            // Auto-trigger generation on mount since backend no longer sends insights
            handleRegenerate();
        }
    }, [insights, anomaliesTable]);

    // The locally filtered grid
    const filteredAnomalies = useMemo(() => {
        if (!anomaliesTable) return [];
        return anomaliesTable.filter(row => {
            const matchTactic = tacticFilter === 'All' || tacticFilter.replace('_SPEND', '').replace('_IMP', '').replace('_CLK', '') === row.Tactic_Prefix;
            const rowSeverity = row.Severity_Band || row.Severity; // backend now provides Severity_Band
            const matchSeverity = severityFilter === 'All' || rowSeverity === severityFilter;
            return matchTactic && matchSeverity;
        });
    }, [anomaliesTable, tacticFilter, severityFilter]);


    const handleRegenerate = async () => {
        if (filteredAnomalies.length === 0) return;

        setIsRegenerating(true);
        try {
            const baseUrl = getApiBaseUrl ? getApiBaseUrl() : 'http://localhost:8000';
            const response = await fetch(`${baseUrl}/api/v1/discovery/generate-insights`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: filteredAnomalies })
            });

            if (!response.ok) throw new Error("Failed to generate insights");

            const data = await response.json();
            setDynamicInsights(data.agent_insights);

            if (!isTableExpanded) setIsTableExpanded(true);
        } catch (error) {
            console.error("Error regenerating insights:", error);
            setDynamicInsights("An error occurred while generating customized insights. Please try again.");
        } finally {
            setIsRegenerating(false);
        }
    };


    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden mb-6 animate-pulse">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-200"></div>
                    <div className="h-5 bg-blue-200 rounded w-48"></div>
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
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden mb-8">
            {/* Header section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">AI Discovery Agent</h3>
                        <p className="text-sm text-slate-500 font-medium">Automated observations & brand anomaly detection</p>
                    </div>
                </div>

                {/* Global Filters & Actions */}
                <div className="flex items-center gap-4 border border-blue-200/60 bg-white/60 p-2 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            className="bg-white border border-slate-200 text-slate-700 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-1.5"
                            value={tacticFilter}
                            onChange={(e) => setTacticFilter(e.target.value)}
                        >
                            {availableTactics.map(t => <option key={t} value={t}>{t === 'All' ? 'All Tactics' : t}</option>)}
                        </select>
                        <select
                            className="bg-white border border-slate-200 text-slate-700 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-1.5"
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
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <FileText size={18} className="text-blue-600" />
                        <h4 className="text-base font-semibold text-slate-800">
                            {tacticFilter !== 'All' || severityFilter !== 'All' ? 'Filtered Observations' : 'Overall Key Observations'}
                        </h4>
                    </div>
                    <div className={`bg-slate-50 border border-slate-200 rounded-lg p-5 leading-relaxed text-slate-700 font-medium min-h-[100px] transition-opacity duration-300 ${isRegenerating ? 'opacity-50' : 'opacity-100'}`}>
                        {isRegenerating && formattedInsights.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-6">
                                <RefreshCw size={24} className="animate-spin mb-3 text-blue-500" />
                                <span>Generating dynamic insights from {filteredAnomalies.length} anomaly records...</span>
                            </div>
                        ) : formattedInsights.length > 0 ? (
                            formattedInsights.map((line, idx) => {
                                if (line.includes(':')) {
                                    const [tactic, ...rest] = line.split(':');
                                    return (
                                        <p key={idx} className="mb-3 last:mb-0">
                                            <span className="font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded mr-2">{tactic}</span>
                                            {rest.join(':')}
                                        </p>
                                    );
                                }
                                return <p key={idx} className="mb-3 last:mb-0">{line}</p>;
                            })
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 italic">No formatted observations returned.</div>
                        )}
                    </div>
                </div>

                {/* Anomalies Data Table Toggle */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setIsTableExpanded(!isTableExpanded)}
                        className="w-full bg-slate-50 hover:bg-slate-100 transition-colors p-4 flex items-center justify-between font-semibold text-slate-700"
                    >
                        <div className="flex items-center gap-2">
                            <Activity size={18} className="text-indigo-600" />
                            <span>Detailed Anomaly Records ({filteredAnomalies.length} matching filters)</span>
                        </div>
                        {isTableExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {/* Table Content */}
                    {isTableExpanded && (
                        <div className="overflow-x-auto border-t border-slate-200 bg-white max-h-[500px] overflow-y-auto">
                            {filteredAnomalies.length > 0 ? (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-4 py-3 border-r border-slate-200 whitespace-nowrap">Date</th>
                                            <th className="px-4 py-3 border-r border-slate-200 whitespace-nowrap">Tactic</th>
                                            <th className="px-4 py-3 border-r border-slate-200">Reason</th>
                                            <th className="px-4 py-3 border-r border-slate-200 text-center">Severity</th>
                                            <th className="px-4 py-3 border-r border-slate-200 text-right">Z-Score</th>
                                            <th className="px-4 py-3 border-r border-slate-200 text-right">Spend ($)</th>
                                            <th className="px-4 py-3 border-r border-slate-200 text-right">IMP/CLK</th>
                                            <th className="px-4 py-3 border-r border-slate-200">Top Brands</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {filteredAnomalies.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                                <td className="px-4 py-3 border-r border-slate-200 font-medium text-slate-700 whitespace-nowrap">
                                                    {row['Anomaly Date']}
                                                </td>
                                                <td className="px-4 py-3 border-r border-slate-200">
                                                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-semibold">
                                                        {row['Tactic_Prefix']}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 border-r border-slate-200 text-slate-600">
                                                    {row['Reason']}
                                                </td>
                                                <td className="px-4 py-3 border-r border-slate-200 text-center">
                                                    {(() => {
                                                        const displaySeverity = row['Severity_Band'] || row['Severity'] || 'Low';
                                                        const classes = displaySeverity === 'Critical'
                                                            ? 'bg-red-100 text-red-700'
                                                            : displaySeverity === 'High'
                                                                ? 'bg-orange-100 text-orange-700'
                                                                : displaySeverity === 'Medium'
                                                                    ? 'bg-yellow-100 text-yellow-700'
                                                                    : 'bg-slate-100 text-slate-700';
                                                        return (
                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold leading-none inline-flex ${classes}`}>
                                                                {displaySeverity}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 border-r border-slate-200 text-right font-medium">
                                                    <span className={`px-2 py-1 rounded text-xs ${row['Z'] > 3 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {row['Z'] !== undefined ? row['Z'] : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 border-r border-slate-200 text-right text-slate-700">
                                                    {row['Spend'] ? row['Spend'].toLocaleString() : '0'}
                                                </td>
                                                <td className="px-4 py-3 border-r border-slate-200 text-right text-slate-700">
                                                    {row['Impressions'] ? row['Impressions'].toLocaleString() : '0'}
                                                </td>
                                                <td className="px-4 py-3 border-r border-slate-200 text-slate-700 max-w-xs truncate" title={row['Brands_list']}>
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

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                <AlertCircle size={14} className="text-slate-400" />
                Observations and anomaly tables are generated natively using Z-score outlier detection and LangChain GPT-4 AI analysis. Use the filters above to ask the AI to summarize specific combinations.
            </div>
        </div>
    );
}
