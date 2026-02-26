import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip as ChartTooltip,
    Legend as ChartLegend,
    ScatterController
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ScatterController,
    Title,
    ChartTooltip,
    ChartLegend
);
import MultiSelectDropdown from '../common/MultiSelectDropdown';
import { CHART_COLORS } from '../../constants/charts';
import { fmtN } from '../../utils/formatters';

export default function ChartTab({
    chartData,
    anomalies,
    activeTacticFilter = 'All',
    activeSeverityFilter = 'All',
    setTacticFilter,
    setSeverityFilter,
    availableTactics = [],
    availableSeverities = [],
    anomaliesTable = []
}) {
    const [selectedCols, setSelectedCols] = useState([]);

    // Helper to find the first matching metric column for a prefix
    const findMetricCol = (prefix, cols, suffixes) => {
        const targets = suffixes.map(s => `${prefix}${s}`);
        // exact match first
        for (const t of targets) {
            if (cols.includes(t)) return t;
        }
        // loose match fallback (handles variations like extra underscores)
        const regexes = suffixes.map(s => new RegExp(`^${prefix}(?:_|)${s.replace(/^_/, '')}$`, 'i'));
        for (const r of regexes) {
            const m = cols.find(c => r.test(c));
            if (m) return m;
        }
        return null;
    };

    // Initialize selection when data changes or filters change
    useEffect(() => {
        if (chartData && chartData.columns) {
            // If we are on the Anomaly Page with specific filtering
            if (activeTacticFilter !== 'All') {
                // Auto-pair SPEND and volume (IMP or CLK variants) for the selected tactic/prefix
                const prefix = activeTacticFilter.replace(/_(SPEND|IMP|IMPS|IMPR|IMPRESSION|IMPRESSIONS|CLK)$/i, '');
                const spendCol = findMetricCol(prefix, chartData.columns, ['_SPEND', '_SPENDS', '_SPND']);
                const impCol = findMetricCol(prefix, chartData.columns, ['_IMP', '_IMPS', '_IMPR', '_IMPRESSION', '_IMPRESSIONS'])
                    || findMetricCol(prefix, chartData.columns, ['_CLK', '_CLKS', '_CLICKS']);
                const colsToSelect = [spendCol, impCol].filter(Boolean);
                if (colsToSelect.length > 0) {
                    setSelectedCols(colsToSelect);
                    return;
                } else {
                    // Fallback: try exact match
                    const exact = chartData.columns.filter(c => c === activeTacticFilter);
                    if (exact.length > 0) {
                        setSelectedCols(exact);
                        return;
                    }
                }
            } else if (anomaliesTable && anomaliesTable.length > 0) {
                // If 'All' is selected, auto-show the first anomaly from the table
                const topAnomaly = anomaliesTable[0];
                const p = topAnomaly.Tactic_Prefix;
                const tacticSpend = findMetricCol(p, chartData.columns, ['_SPEND', '_SPENDS', '_SPND']);
                const tacticImp = findMetricCol(p, chartData.columns, ['_IMP', '_IMPS', '_IMPR', '_IMPRESSION', '_IMPRESSIONS']);
                const tacticClk = tacticImp ? null : findMetricCol(p, chartData.columns, ['_CLK', '_CLKS', '_CLICKS']);
                const primaryVol = tacticImp || tacticClk;
                const colsToSelect = [tacticSpend, primaryVol].filter(Boolean);
                if (colsToSelect.length > 0) {
                    setSelectedCols(colsToSelect);
                    return;
                }
            }

            // Fallback for Step 9 where no anomaly syncing occurs
            const safeCols = chartData.columns.filter(c => c !== 'date' && c !== 'INDEX');
            if (safeCols.includes('O_UNIT')) {
                setSelectedCols(['O_UNIT']);
            } else if (safeCols.length > 0) {
                setSelectedCols([safeCols[0]]);
            }
        }
    }, [chartData, activeTacticFilter, anomaliesTable]);


    if (!chartData || !chartData.time_series || chartData.time_series.length === 0) {
        return <div className="text-center p-10 text-slate-400">No chart data available for this tab.</div>;
    }

    const allCols = chartData.columns || [];
    const displayCols = allCols.filter(c => selectedCols.includes(c));

    const timeSeriesData = chartData.time_series;

    const formatDate = (d) => {
        if (!d) return '';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return d;
        return `${dt.toLocaleString('default', { month: 'short' })}'${String(dt.getFullYear()).slice(2)}`;
    };

    const formatTooltipDate = (d) => {
        if (!d || d === 'auto') return '';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return d;
        return dt.toLocaleDateString();
    };

    const chartJsData = {
        labels: timeSeriesData.map(d => formatDate(d.date)),
        datasets: [
            ...displayCols.map((c) => {
                const color = CHART_COLORS[allCols.indexOf(c) % CHART_COLORS.length];
                const isSpend = /_(SPEND|SPENDS|SPND)$/i.test(c);
                const isImp = /_(IMP|IMPS|IMPR|IMPRESSION|IMPRESSIONS|CLK|CLKS|CLICKS)$/i.test(c);
                const isUnit = c === 'O_UNIT' || c === 'O_SALE';
                return {
                    type: 'line',
                    label: c,
                    data: timeSeriesData.map(d => d[c] !== undefined ? d[c] : null),
                    borderColor: color,
                    backgroundColor: color,
                    borderWidth: isUnit ? 2 : 1.5,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    yAxisID: isImp ? 'y' : isSpend ? 'y1' : (isUnit ? 'y' : 'y1'),
                    tension: 0.1,
                    spanGaps: true,
                    fill: false
                };
            }),
            // Build reason-based scatter datasets (one legend entry per Reason, colored)
            ...(function buildReasonDatasets() {
                // Determine the current tactic prefix being shown on the graph
                const currentTacticPrefix = activeTacticFilter === 'All'
                    ? (anomaliesTable?.[0]?.Tactic_Prefix || '')
                    : activeTacticFilter.replace(/_(SPEND|SPENDS|SPND|IMP|IMPS|IMPR|IMPRESSION|IMPRESSIONS|CLK|CLKS|CLICKS)$/i, '');

                if (!currentTacticPrefix) {
                    // Fallback to previous per-column markers if no tactic is available
                    return displayCols.filter(c => c !== 'O_UNIT' && c !== 'O_SALE').map((c) => {
                        const tacticPrefix = c.replace(/_(SPEND|SPENDS|SPND|IMP|IMPS|IMPR|IMPRESSION|IMPRESSIONS|CLK|CLKS|CLICKS)$/i, '');
                        return {
                            type: 'scatter',
                            label: `${c} Anomalies`,
                            data: timeSeriesData.map(pt => {
                                const ptDate = pt.date ? (typeof pt.date === 'string' ? pt.date.substring(0, 10) : pt.date) : '';
                                const matchingAnomaly = anomaliesTable?.find(a => {
                                    const tableDate = a['Anomaly Date'] ? a['Anomaly Date'].substring(0, 10) : '';
                                    const aSeverity = a.Severity_Band || a.Severity;
                                    return tableDate === ptDate &&
                                        a.Tactic_Prefix === tacticPrefix &&
                                        (activeTacticFilter === 'All' || activeTacticFilter === tacticPrefix) &&
                                        (activeSeverityFilter === 'All' || aSeverity === activeSeverityFilter);
                                });
                                return matchingAnomaly && pt[c] !== undefined ? pt[c] : null;
                            }),
                            backgroundColor: '#ef4444',
                            borderColor: '#ef4444',
                            pointRadius: 5,
                            pointHoverRadius: 7,
                            yAxisID: /_(IMP|IMPS|IMPR|IMPRESSION|IMPRESSIONS|CLK|CLKS|CLICKS)$/i.test(c) ? 'y' : 'y1'
                        };
                    });
                }

                // Unique reasons for the currently selected tactic
                const reasons = Array.from(new Set((anomaliesTable || [])
                    .filter(a => a.Tactic_Prefix === currentTacticPrefix)
                    .filter(a => activeSeverityFilter === 'All' || (a.Severity_Band || a.Severity) === activeSeverityFilter)
                    .map(a => a.Reason || 'Other')));

                const reasonColorMap = {
                    'Spend spike only': '#ef4444',
                    'Impression spike only': '#f97316',
                    'High Spend spike': '#dc2626',
                    'High Impression spike': '#f59e0b',
                    'No Spend with added value Impressions': '#6366f1',
                    'High Spend, Low IMP': '#9333ea',
                    'High IMP, Low Spend': '#06b6d4',
                    'Spike in Spend & IMP': '#10b981',
                    'Drop in IMP & Spend': '#ef4444',
                    'Other': '#94a3b8'
                };

                // Choose a sensible column to plot for the tactic.
                // Prefer the currently displayed column (IMP/CLK/SPEND) so anomaly markers align with the chart.
                let plotCol = null;
                const impCol = `${currentTacticPrefix}_IMP`;
                const clkCol = `${currentTacticPrefix}_CLK`;
                const spendCol = `${currentTacticPrefix}_SPEND`;

                if (displayCols.includes(impCol)) plotCol = impCol;
                else if (displayCols.includes(clkCol)) plotCol = clkCol;
                else if (displayCols.includes(spendCol)) plotCol = spendCol;
                else {
                    const colCandidates = [impCol, clkCol, spendCol];
                    plotCol = colCandidates.find(cc => allCols.includes(cc));
                }

                return reasons.map(reason => {
                    const color = reasonColorMap[reason] || '#ef4444';
                    const axisForReason = /_(IMP|IMPS|IMPR|IMPRESSION|IMPRESSIONS|CLK|CLKS|CLICKS)$/i.test(plotCol || '') ? 'y' : 'y1';
                    return {
                        type: 'scatter',
                        label: `${reason}`,
                        data: timeSeriesData.map(pt => {
                            const ptDate = pt.date ? (typeof pt.date === 'string' ? pt.date.substring(0, 10) : pt.date) : '';
                            const matchingAnomaly = anomaliesTable?.find(a => {
                                const tableDate = a['Anomaly Date'] ? a['Anomaly Date'].substring(0, 10) : '';
                                const aSeverity = a.Severity_Band || a.Severity;
                                return tableDate === ptDate &&
                                    a.Tactic_Prefix === currentTacticPrefix &&
                                    a.Reason === reason &&
                                    (activeSeverityFilter === 'All' || aSeverity === activeSeverityFilter);
                            });
                            if (!matchingAnomaly) return null;
                            if (plotCol && pt[plotCol] !== undefined) return pt[plotCol];
                            // fallback to any column value for the tactic if available
                            if (pt[`${currentTacticPrefix}_SPEND`] !== undefined) return pt[`${currentTacticPrefix}_SPEND`];
                            if (pt[`${currentTacticPrefix}_IMP`] !== undefined) return pt[`${currentTacticPrefix}_IMP`];
                            if (pt[`${currentTacticPrefix}_CLK`] !== undefined) return pt[`${currentTacticPrefix}_CLK`];
                            return null;
                        }),
                        backgroundColor: color,
                        borderColor: color,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        yAxisID: axisForReason,
                        showLine: false
                    };
                });
            })()
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            x: {
                ticks: {
                    maxRotation: 35,
                    minRotation: 35,
                    font: { size: 10 },
                    color: '#64748b',
                    autoSkip: true,
                    maxTicksLimit: 30
                },
                grid: {
                    color: '#f1f5f9',
                    borderDash: [3, 3]
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Impressions' },
                ticks: {
                    font: { size: 10 },
                    color: '#64748b',
                    callback: function (value) { return fmtN(value); }
                },
                grid: {
                    color: '#f1f5f9',
                    borderDash: [3, 3]
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Spend' },
                grid: {
                    drawOnChartArea: false, // Don't show grid lines for the secondary Y-axis to avoid overlap
                },
                ticks: {
                    font: { size: 10 },
                    color: '#64748b',
                    callback: function (value) { return fmtN(value); }
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    font: { size: 11 },
                    usePointStyle: true,
                    generateLabels: (chart) => {
                        const originalLabels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
                        // Filter out 'Peaks' and 'Dips' from the legend since they are decorators
                        return originalLabels.filter(l => l.text !== 'Peaks' && l.text !== 'Dips').map(l => ({
                            ...l,
                            text: l.text.replace(/_/g, ' ')
                        }));
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#334155',
                bodyColor: '#334155',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                callbacks: {
                    title: (context) => {
                        if (!context.length) return '';
                        const dateStr = timeSeriesData[context[0].dataIndex].date;
                        return formatTooltipDate(dateStr);
                    },
                    label: (context) => {
                        if (context.dataset.label === 'Peaks' || context.dataset.label === 'Dips') return null;
                        let label = context.dataset.label || '';
                        if (label) {
                            label = label.replace(/_/g, ' ') + ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += fmtN(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <select
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-1.5"
                        value={activeTacticFilter}
                        onChange={(e) => setTacticFilter && setTacticFilter(e.target.value)}
                    >
                        {availableTactics.map(t => <option key={t} value={t}>{t === 'All' ? 'All Tactics' : t}</option>)}
                    </select>
                    <select
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-1.5"
                        value={activeSeverityFilter}
                        onChange={(e) => setSeverityFilter && setSeverityFilter(e.target.value)}
                    >
                        {availableSeverities.map(s => <option key={s} value={s}>{s === 'All' ? 'All Severities' : s + ' Severity'}</option>)}
                    </select>
                </div>

                {(!anomaliesTable || anomaliesTable.length === 0) ? (
                    <MultiSelectDropdown
                        options={allCols.filter(c => c !== 'date' && c !== 'INDEX')}
                        selected={selectedCols}
                        onChange={setSelectedCols}
                    />
                ) : (
                    <div className="text-sm font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Graph automatically isolated to: <span className="text-blue-700 font-bold">{activeTacticFilter === 'All' ? (anomaliesTable[0]?.Tactic_Prefix || 'Tactics') : activeTacticFilter}</span>
                    </div>
                )}
            </div>

            {/* Period Aggregates Table */}
            {chartData.period_agg && Object.keys(chartData.period_agg).length > 0 && (
                <div className="overflow-x-auto mb-8 rounded-2xl border border-slate-200">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-100 text-xs uppercase tracking-widest text-slate-500">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Period</th>
                                <th className="px-4 py-3 font-semibold">Weeks</th>
                                {displayCols.map(c => <th key={c} className="px-4 py-3 font-semibold">{c.replace(/_/g, ' ')}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {Object.entries(chartData.period_agg).map(([period, values]) => (
                                <tr key={period}>
                                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{period}</td>
                                    <td className="px-4 py-3 text-slate-500">{values.Weeks !== undefined ? values.Weeks : 52}</td>
                                    {displayCols.map(c => <td key={c} className="px-4 py-3 text-slate-600">{fmtN(values[c] || 0)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {/* Composed Chart */}
            <div className="h-[500px] w-full bg-white rounded-2xl border border-slate-200 p-4">
                <div className="w-full h-full relative relative">
                    <Chart type="line" data={chartJsData} options={chartOptions} />
                </div>
            </div>
        </div>
    );
}
