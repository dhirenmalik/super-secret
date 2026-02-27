import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ScatterController,
    Filler
} from 'chart.js';
import { Line, Scatter } from 'react-chartjs-2';
import { AlertCircle, Maximize2, Minimize2, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import MultiSelectDropdown from '../common/MultiSelectDropdown';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ScatterController,
    Filler
);

export default function ChartTab({ chartData, activeTacticFilter, anomaliesTable, anomalies }) {
    const [selectedCols, setSelectedCols] = useState([]);
    const [chartType, setChartType] = useState('line'); // 'line', 'scatter', 'dual_line'
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [useAnomalies, setUseAnomalies] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);

    // Timeline Animation State
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackIndex, setPlaybackIndex] = useState(0);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            chartContainerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const findMetricCol = (tactic, cols, suffixes) => {
        for (let suffix of suffixes) {
            const potentialCol = `${tactic}${suffix}`;
            if (cols.includes(potentialCol)) return potentialCol;
        }
        return null;
    };

    // Exact target columns prescribed by the user
    const TARGET_SPEND_COLS = ["M_SP_AB_SPEND", "M_SP_KWB_SPEND", "M_SBA_SPEND", "M_SV_SPEND", "M_ON_DIS_AT_SPEND", "M_ON_DIS_CT_SPEND", "M_ON_DIS_CATTO_SPEND", "M_ON_DIS_KW_SPEND", "M_ON_DIS_ROS_SPEND", "M_ON_DIS_HPLO_SPEND", "M_ON_DIS_APP_HPLO_SPEND", "M_ON_DIS_HP_SPEND", "M_ON_DIS_HPTO_SPEND", "M_ON_DIS_HPGTO_SPEND", "M_OFF_DIS_FB_SPEND", "M_OFF_DIS_PIN_SPEND", "M_OFF_DIS_WN_WITHOUTCTV_SPEND", "M_OFF_DIS_DSP_CTV_SPEND"];
    const TARGET_IMP_COLS = ["M_SP_AB_CLK", "M_SP_KWB_CLK", "M_SBA_CLK", "M_SV_CLK", "M_ON_DIS_AT_IMP", "M_ON_DIS_CT_IMP", "M_ON_DIS_CATTO_IMP", "M_ON_DIS_KW_IMP", "M_ON_DIS_ROS_IMP", "M_ON_DIS_HPLO_IMP", "M_ON_DIS_APP_HPLO_IMP", "M_ON_DIS_HP_IMP", "M_ON_DIS_HPTO_IMP", "M_ON_DIS_HPGTO_IMP", "M_OFF_DIS_FB_IMP", "M_OFF_DIS_PIN_IMP", "M_OFF_DIS_WN_WITHOUTCTV_IMP", "M_OFF_DIS_DSP_CTV_IMP"];

    // Pre-calculate prefix mapping for explicit tactic dropdowns
    const targetPrefixes = TARGET_SPEND_COLS.map(c => c.replace('_SPEND', ''));

    // Auto-select columns when tactic changes
    useEffect(() => {
        if (chartData && chartData.columns && activeTacticFilter && activeTacticFilter !== 'All') {
            let prefix = activeTacticFilter;

            // Find explicit matching spend/imp pairs if in our target list
            const spendIndex = targetPrefixes.indexOf(prefix);
            let spendCol = null;
            let impCol = null;

            if (spendIndex >= 0) {
                spendCol = TARGET_SPEND_COLS[spendIndex];
                impCol = TARGET_IMP_COLS[spendIndex];

                // Only select them if they actually exist in the current dataset's columns
                if (!chartData.columns.includes(spendCol)) spendCol = null;
                if (!chartData.columns.includes(impCol)) impCol = null;
            } else {
                // Fallback for unknown prefixes
                spendCol = findMetricCol(prefix, chartData.columns, ['_SPEND']);
                impCol = findMetricCol(prefix, chartData.columns, ['_IMP', '_CLK']);
            }

            const newSelection = [];
            if (spendCol) newSelection.push(spendCol);
            if (impCol) newSelection.push(impCol);
            setSelectedCols(newSelection);
        } else if (chartData && chartData.columns && (!activeTacticFilter || activeTacticFilter === 'All')) {
            // Default selection when not filtering by a specific tactic
            const safeCols = chartData.columns.filter(c => c !== 'date' && c !== 'INDEX' && c !== 'year_flag');

            // Find the best two columns to show by default out of the available tab columns
            let defaultCols = [];

            // 1. Try to find a Unit/Sale column first
            const primaryUnit = safeCols.find(c => c === 'O_UNIT' || c === 'O_SALE');
            if (primaryUnit) defaultCols.push(primaryUnit);

            // 2. Try to find a Spend column next
            const primarySpend = safeCols.find(c => c.includes('SPEND') || c === 'Total_spends');
            if (primarySpend) defaultCols.push(primarySpend);

            // 3. Try to find an Impression/Click column next (if we don't have 2 yet)
            if (defaultCols.length < 2) {
                const primaryImp = safeCols.find(c => c.includes('IMP') || c.includes('CLK'));
                if (primaryImp) defaultCols.push(primaryImp);
            }

            // 4. Fallback to just taking the first two columns if we still don't have 2
            if (defaultCols.length < 2) {
                const remaining = safeCols.filter(c => !defaultCols.includes(c));
                defaultCols = [...defaultCols, ...remaining].slice(0, 2);
            }

            setSelectedCols(defaultCols);

            // Set chart type based on whether we selected a unit/sale metric and a spend/imp metric
            const hasUnit = defaultCols.some(c => c === 'O_UNIT' || c === 'O_SALE');
            const hasSpend = defaultCols.some(c => c.includes('SPEND') || c === 'Total_spends');
            const hasImp = defaultCols.some(c => c.includes('IMP') || c.includes('CLK'));

            if (hasUnit && !hasSpend && !hasImp) {
                setChartType('line');
            } else {
                setChartType('dual_line');
            }
        }
    }, [chartData, activeTacticFilter]);

    const handleColumnToggle = (colRef) => {
        if (selectedCols.includes(colRef)) {
            setSelectedCols(selectedCols.filter(c => c !== colRef));
        } else {
            setSelectedCols([...selectedCols, colRef]);
        }
    };

    const hasData = chartData && chartData.time_series && chartData.time_series.length > 0;
    const availableColumns = chartData ? chartData.columns.filter(c => c !== 'date' && c !== 'INDEX') : [];

    // Filter Logic
    const filteredData = useMemo(() => {
        if (!hasData) return [];
        let data = [...chartData.time_series];
        // Sort explicitly by date to be safe
        data.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (dateRange.start) data = data.filter(d => d.date >= dateRange.start);
        if (dateRange.end) data = data.filter(d => d.date <= dateRange.end);

        // Apply playback truncation if playing
        if (isPlaying || playbackIndex > 0) {
            // we show data UP TO the playback index
            const visibleCount = Math.max(1, Math.min(playbackIndex, data.length));
            data = data.slice(0, visibleCount);
        }

        return data;
    }, [chartData, dateRange, hasData, isPlaying, playbackIndex]);


    // Playback Effect
    useEffect(() => {
        let interval;
        if (isPlaying && hasData) {
            // max index based on non-date-filtered data if we want full playback, 
            // but let's base it on the full timeline for simplicity.
            const maxIndex = chartData.time_series.length;

            interval = setInterval(() => {
                setPlaybackIndex((prev) => {
                    if (prev >= maxIndex) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1; // Increase visible points by 1 (e.g. 1 month/week)
                });
            }, 300); // 300ms per point
        }
        return () => clearInterval(interval);
    }, [isPlaying, hasData, chartData]);

    // Format Data for ChartJS
    const chartRenderData = useMemo(() => {
        if (!filteredData.length || selectedCols.length === 0) return null;

        const labels = filteredData.map(d => d.date);

        // Define premium enterprise colors (expanded palette for multi-metric charts)
        const colors = [
            'rgb(99, 102, 241)',  // Indigo 500
            'rgb(20, 184, 166)',  // Teal 500
            'rgb(245, 158, 11)', // Amber 500
            'rgb(239, 68, 68)',  // Red 500
            'rgb(34, 197, 94)',  // Green 500
            'rgb(168, 85, 247)', // Purple 500
            'rgb(236, 72, 153)', // Pink 500
            'rgb(14, 165, 233)', // Sky 500
        ];
        const bgColors = [
            'rgba(99, 102, 241, 0.08)',
            'rgba(20, 184, 166, 0.08)',
            'rgba(245, 158, 11, 0.08)',
            'rgba(239, 68, 68, 0.08)',
            'rgba(34, 197, 94, 0.08)',
            'rgba(168, 85, 247, 0.08)',
            'rgba(236, 72, 153, 0.08)',
            'rgba(14, 165, 233, 0.08)',
        ];

        if (chartType === 'scatter' && selectedCols.length >= 2) {
            // Scatter needs x and y
            const xCol = selectedCols[0];
            const yCol = selectedCols[1];

            const scatterPoints = filteredData.map(d => ({
                x: d[xCol] || 0,
                y: d[yCol] || 0,
                date: d.date // custom for tooltip
            }));

            return {
                datasets: [{
                    label: `${yCol} vs ${xCol}`,
                    data: scatterPoints,
                    backgroundColor: colors[0],
                    borderColor: colors[0],
                    pointRadius: 6,
                    pointHoverRadius: 8,
                }]
            };
        }

        // Line / Dual Line
        let datasets = selectedCols.map((col, idx) => {
            const isSpend = col.includes('SPEND');
            const isImp = col.includes('IMP') || col.includes('CLK');

            // Assign y-axis ID for dual axis
            const yAxisID = chartType === 'dual_line'
                ? (isSpend ? 'y-spend' : (col === 'O_UNIT' || col === 'O_SALE' ? 'y' : 'y-imp'))
                : 'y';

            return {
                label: col,
                data: filteredData.map(d => d[col] || 0),
                borderColor: colors[idx % colors.length],
                backgroundColor: bgColors[idx % bgColors.length],
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 5,
                tension: 0.35,
                yAxisID: yAxisID,
                spanGaps: true,
                fill: chartType === 'area'
            };
        });

        // ---------------------------------------------------------
        // ADD PEAKS & DIPS (from legacy discovery.py anomalies feed)
        // ---------------------------------------------------------
        if (anomalies && (anomalies.peaks?.length > 0 || anomalies.dips?.length > 0) && chartType !== 'scatter') {
            const peakData = filteredData.map(pt => {
                const match = anomalies.peaks?.find(p => p.date === pt.date);
                return match ? match.value : null;
            });
            const dipData = filteredData.map(pt => {
                const match = anomalies.dips?.find(p => p.date === pt.date);
                return match ? match.value : null;
            });

            if (peakData.some(v => v !== null)) {
                datasets.push({
                    type: 'scatter',
                    label: 'Peaks',
                    data: peakData,
                    backgroundColor: '#10b981', // emerald-500
                    borderColor: '#059669',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointStyle: 'triangle',
                    yAxisID: chartType === 'dual_line' ? 'y' : 'y' // ALWAYS units axis
                });
            }

            if (dipData.some(v => v !== null)) {
                datasets.push({
                    type: 'scatter',
                    label: 'Dips',
                    data: dipData,
                    backgroundColor: '#ef4444', // red-500
                    borderColor: '#dc2626',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointStyle: 'triangle',
                    rotation: 180, // upside down triangle
                    yAxisID: chartType === 'dual_line' ? 'y' : 'y'
                });
            }
        }
        // ---------------------------------------------------------

        // Add anomaly scatter overlays grouped by Reason
        if (anomaliesTable && anomaliesTable.length > 0 && chartType !== 'scatter') {
            const currentTacticPrefix = activeTacticFilter === 'All'
                ? (anomaliesTable[0]?.Tactic_Prefix || '')
                : (activeTacticFilter || '').replace(/_SPEND|_IMP|_CLK/i, '');

            if (currentTacticPrefix) {
                const reasons = Array.from(new Set(
                    anomaliesTable
                        .filter(a => a.Tactic_Prefix === currentTacticPrefix)
                        .map(a => a.Reason || 'Other')
                ));

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

                // Try to place anomaly dots on an active line
                const possibleCols = [`${currentTacticPrefix}_IMP`, `${currentTacticPrefix}_CLK`, `${currentTacticPrefix}_SPEND`];
                let plotCol = possibleCols.find(c => selectedCols.includes(c));
                if (!plotCol) {
                    plotCol = selectedCols[0]; // fallback
                }

                reasons.forEach(reason => {
                    const color = reasonColorMap[reason] || '#ef4444';

                    const anomalyMatches = filteredData.map(pt => {
                        const ptDate = pt.date ? pt.date.substring(0, 10) : '';
                        return anomaliesTable.find(a => {
                            const tableDate = a['Anomaly Date'] ? a['Anomaly Date'].substring(0, 10) : '';
                            return tableDate === ptDate &&
                                a.Tactic_Prefix === currentTacticPrefix &&
                                a.Reason === reason;
                        });
                    });

                    // Only plot if there's at least one match for this reason
                    if (anomalyMatches.some(m => m)) {
                        datasets.push({
                            type: 'scatter',
                            label: `${reason}`,
                            data: anomalyMatches.map((m, i) => {
                                if (!m) return null;
                                const pt = filteredData[i];
                                if (plotCol && pt[plotCol] !== undefined) return pt[plotCol];
                                return null;
                            }),
                            customAnomalies: anomalyMatches, // Inject for tooltip
                            backgroundColor: color,
                            borderColor: color,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            yAxisID: 'y'
                        });
                    }
                });
            } else {
                // Fallback rendering
                selectedCols.forEach(col => {
                    const tacticPrefix = col.replace('_SPEND', '').replace('_IMP', '').replace('_CLK', '');
                    const anomalyMatches = filteredData.map(pt => {
                        const ptDate = pt.date;
                        return anomaliesTable.find(a => {
                            const tableDate = a['Anomaly Date'] ? a['Anomaly Date'].substring(0, 10) : '';
                            return tableDate === ptDate && a.Tactic_Prefix === tacticPrefix;
                        });
                    });

                    if (anomalyMatches.some(m => m)) {
                        datasets.push({
                            type: 'scatter',
                            label: `${col} Anomalies`,
                            data: anomalyMatches.map((m, i) => m && filteredData[i][col] !== undefined ? filteredData[i][col] : null),
                            customAnomalies: anomalyMatches,
                            backgroundColor: '#ef4444',
                            borderColor: '#ef4444',
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            yAxisID: 'y'
                        });
                    }
                });
            }
        }

        return { labels, datasets };

    }, [filteredData, selectedCols, chartType, anomalies, anomaliesTable]);

    // ChartJS Options Configuration
    const chartOptions = useMemo(() => {
        if (!chartRenderData) return {};

        let scales = {
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
            }
        };

        if (chartType === 'scatter') {
            scales = {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: { display: true, text: selectedCols[0], font: { weight: 'bold' } },
                    grid: { color: '#f1f5f9' }
                },
                y: {
                    title: { display: true, text: selectedCols[1], font: { weight: 'bold' } },
                    grid: { color: '#f1f5f9' }
                }
            };
        } else if (chartType === 'dual_line') {
            scales['y'] = {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Units / Sales' },
                grid: { drawOnChartArea: true, color: '#f1f5f9' }
            };
            scales['y-spend'] = {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Spend / Cost' },
                grid: { drawOnChartArea: false }
            };
            scales['y-imp'] = {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Impressions / Clicks' },
                grid: { drawOnChartArea: false }
            };
        } else {
            scales.y = {
                type: 'linear',
                beginAtZero: true,
                grid: {
                    color: '#f1f5f9',
                    borderDash: [3, 3]
                },
                ticks: {
                    font: { size: 10 },
                    color: '#64748b'
                }
            };
        }

        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8,
                        font: { family: "'Inter', sans-serif", size: 12, weight: '500' },
                        generateLabels: (chart) => {
                            const originalLabels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
                            // Filter out Peaks/Dips from Legend explicitly like old/ChartTab
                            return originalLabels
                                .filter(l => l.text !== 'Peaks' && l.text !== 'Dips')
                                .map(l => ({ ...l, text: l.text.replace(/_/g, ' ') }));
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    titleColor: '#0f172a',
                    bodyColor: '#334155',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    titleFont: { family: "'Inter', sans-serif", size: 13, weight: '600' },
                    bodyFont: { family: "'Inter', sans-serif", size: 12 },
                    callbacks: {
                        label: function (context) {
                            if (context.dataset.label === 'Peaks' || context.dataset.label === 'Dips') return null;

                            let label = context.dataset.label || '';
                            if (label) {
                                label = label.replace(/_/g, ' ') + ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US').format(context.parsed.y);
                            }

                            const anomaly = context.dataset.customAnomalies ? context.dataset.customAnomalies[context.dataIndex] : null;
                            if (anomaly && anomaly.Brands_list) {
                                label += ` | Top Brands: ${anomaly.Brands_list}`;
                                if (anomaly.Contribution) {
                                    label += ` (${anomaly.Contribution})`;
                                }
                            }

                            return label;
                        }
                    }
                }
            },
            scales
        };

    }, [chartRenderData, chartType, selectedCols]);


    if (!hasData) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
                    <AlertCircle className="text-slate-400 w-8 h-8" />
                </div>
                <h3 className="text-slate-700 font-bold mb-2">No Visualization Data Available</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">Please ensure the underlying brand stack data has been generated for this model.</p>
            </div>
        );
    }

    const availableTacticGroups = [...new Set(targetPrefixes.filter(prefix =>
        // Only include tactics that have at least their spend column present in the dataset
        availableColumns.includes(`${prefix}_SPEND`)
    ))];

    return (
        <div ref={chartContainerRef} className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[600px] mb-8'}`}>

            {/* Toolbar */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 shrink-0 transition-all">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 tracking-tight">Stack Explorer</h3>
                    <div className="w-px h-5 bg-slate-300"></div>
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                        <TacticGroupSelector
                            availableTacticGroups={availableTacticGroups}
                            activeTacticFilter={activeTacticFilter}
                            chartDataColumns={chartData.columns}
                            selectedCols={selectedCols}
                            setSelectedCols={setSelectedCols}
                            findMetricCol={findMetricCol}
                        />
                    </div>
                    <div className="w-px h-5 bg-slate-300"></div>
                    <div className="z-20 w-48">
                        <MultiSelectDropdown
                            options={availableColumns}
                            selected={selectedCols}
                            onChange={setSelectedCols}
                            label=""
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Type */}
                    <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <button
                            onClick={() => setChartType('line')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${chartType === 'line' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Area
                        </button>
                        <button
                            onClick={() => setChartType('dual_line')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${chartType === 'dual_line' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Dual Axis
                        </button>
                        <button
                            onClick={() => setChartType('scatter')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${chartType === 'scatter' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Scatter
                        </button>
                    </div>

                    <div className="w-px h-5 bg-slate-300"></div>

                    {/* Date Filters */}
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            className="text-xs border border-slate-200 rounded-md py-1.5 px-2 text-slate-600 font-medium focus:ring-indigo-500 focus:border-indigo-500"
                            value={dateRange.start}
                            onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">to</span>
                        <input
                            type="date"
                            className="text-xs border border-slate-200 rounded-md py-1.5 px-2 text-slate-600 font-medium focus:ring-indigo-500 focus:border-indigo-500"
                            value={dateRange.end}
                            onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>

                    <button
                        onClick={toggleFullscreen}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors ml-2"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                </div>
            </div>

            {/* Period Aggregates Table */}
            {chartData && chartData.period_agg && Object.keys(chartData.period_agg).length > 0 && selectedCols.length > 0 && (
                <div className="mx-6 mt-6 overflow-x-auto max-h-48 shrink-0 rounded-xl border border-slate-200 shadow-sm">
                    <table className="min-w-full text-left text-sm relative">
                        <thead className="bg-slate-50 text-[10px] uppercase font-bold tracking-widest text-slate-500 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 bg-slate-50">Period</th>
                                <th className="px-4 py-3 bg-slate-50">Weeks</th>
                                {selectedCols.map(c => <th key={c} className="px-4 py-3 bg-slate-50">{c.replace(/_/g, ' ')}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {Object.entries(chartData.period_agg).map(([period, values]) => (
                                <tr key={period} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{period}</td>
                                    <td className="px-4 py-3 text-slate-500">{values.Weeks !== undefined ? values.Weeks : 52}</td>
                                    {selectedCols.map(c => {
                                        const val = values[c] || 0;
                                        const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: val > 1000 ? 0 : 2 }).format(val);
                                        return <td key={c} className="px-4 py-3 text-slate-600 font-mono text-xs">{formatted}</td>;
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Main Chart Area */}
            <div className={`flex-1 p-6 relative bg-white ${chartData?.period_agg ? 'min-h-[350px]' : ''}`}>
                {chartRenderData ? (
                    chartType === 'scatter' ? (
                        <Scatter ref={chartRef} data={chartRenderData} options={chartOptions} />
                    ) : (
                        <Line ref={chartRef} data={chartRenderData} options={chartOptions} />
                    )
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <div className="animate-pulse bg-slate-100 w-full h-full rounded-lg absolute inset-4 border-2 border-dashed border-slate-200"></div>
                        <span className="relative z-10 font-medium bg-white px-4 py-2 rounded-full shadow-sm text-sm">Select metrics to visualize</span>
                    </div>
                )}
            </div>

            {/* Timeline Playback Controls */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center gap-4 shrink-0 shadow-inner">
                <button
                    onClick={() => {
                        if (playbackIndex >= (chartData.time_series?.length || 0)) {
                            // Reset if at end
                            setPlaybackIndex(0);
                        }
                        setIsPlaying(!isPlaying);
                    }}
                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md transition-colors shadow-indigo-200"
                >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-[1px]" />}
                </button>

                <div className="flex-1">
                    <input
                        type="range"
                        min="0"
                        max={chartData.time_series ? chartData.time_series.length : 100}
                        value={playbackIndex || (chartData.time_series?.length || 100)}
                        onChange={(e) => {
                            setIsPlaying(false);
                            setPlaybackIndex(parseInt(e.target.value, 10));
                        }}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700"
                    />
                    <div className="flex justify-between mt-1 px-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {chartData.time_series && chartData.time_series[0] ? chartData.time_series[0].date : 'Start'}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded shadow-sm">
                            {filteredData.length > 0 ? filteredData[filteredData.length - 1].date : 'Timeline'}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {chartData.time_series && chartData.time_series.length > 0 ? chartData.time_series[chartData.time_series.length - 1].date : 'End'}
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
}

// Subcomponent for easier Tactic Group Selection
function TacticGroupSelector({ availableTacticGroups, activeTacticFilter, chartDataColumns, selectedCols, setSelectedCols, findMetricCol }) {

    // Quick apply entire group
    const handleGroupSelect = (e) => {
        const groupPrefix = e.target.value;
        if (!groupPrefix) return;

        const spendCol = findMetricCol(groupPrefix, chartDataColumns, ['_SPEND']);
        let impCol = findMetricCol(groupPrefix, chartDataColumns, ['_IMP']);
        if (!impCol) impCol = findMetricCol(groupPrefix, chartDataColumns, ['_CLK']);

        const newSelection = [];
        if (spendCol) newSelection.push(spendCol);
        if (impCol) newSelection.push(impCol);
        setSelectedCols(newSelection);
    };

    return (
        <select
            onChange={handleGroupSelect}
            value={activeTacticFilter !== 'All' ? activeTacticFilter : ''}
            className="text-sm border-none bg-transparent focus:ring-0 text-slate-700 font-bold focus:outline-none cursor-pointer pr-8 py-0.5 appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.2rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
        >
            <option value="" disabled>Quick Tactic Metrics...</option>
            {availableTacticGroups.map(g => (
                <option key={g} value={g}>{g.replace('M_', '').replace(/_/g, ' ')}</option>
            ))}
        </select>
    );
}
