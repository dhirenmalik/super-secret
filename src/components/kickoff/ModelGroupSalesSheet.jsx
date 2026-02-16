import React, { useEffect, useMemo, useState } from 'react'
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts'
import { fetchModelGroups, fetchModelGroupWeeklyMetrics, fetchL2Values } from '../../api/kickoff'

const CHART_COLORS = {
    sales: '#0f172a',
    units: '#0f172a',
    search: '#3b82f6', // blue-500
    online: '#10b981', // emerald-500
    offline: '#f59e0b', // amber-500
}

const formatHalfMonth = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }
    const month = date.toLocaleString('en-US', { month: 'short' })
    const year = String(date.getFullYear()).slice(-2)
    return `${month}-${year}`
}

const formatYAxisTick = (value) =>
    Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })

const ModelGroupSalesSheet = ({ hasFile, fileId }) => {
    const [groupsData, setGroupsData] = useState(null)
    const [metricsData, setMetricsData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Selection State
    // activeL2s: Set of all selected L2 strings
    const [activeL2s, setActiveL2s] = useState(new Set())
    // expandedGroups: Set of expanded group names
    const [expandedGroups, setExpandedGroups] = useState(new Set())

    const [search, setSearch] = useState('')
    const [metric, setMetric] = useState('sales')

    // 1. Initial Load: Model Groups
    useEffect(() => {
        if (!fileId) {
            setGroupsData(null)
            setActiveL2s(new Set())
            return
        }

        const loadData = async () => {
            try {
                const response = await fetchModelGroups(fileId)
                const groups = response.groups || []

                // Map L2s for easy lookup
                // groups structure: [{ group_name, l2_values: [] }]
                setGroupsData(groups)

                // Default selection: First 3 groups, all their L2s
                const initialL2s = new Set()
                groups.slice(0, 3).forEach(g => {
                    g.l2_values.forEach(l2 => initialL2s.add(l2))
                })
                setActiveL2s(initialL2s)

                // Expand first group by default
                if (groups.length > 0) {
                    setExpandedGroups(new Set([groups[0].group_name]))
                }

            } catch (err) {
                console.error(err)
                setError('Unable to load model groups')
            }
        }
        loadData()
    }, [fileId])

    // Derived: List of selected group names (based on whether ANY of their L2s are selected)
    const selectedGroupNames = useMemo(() => {
        if (!groupsData) return []
        return groupsData
            .filter(g => g.l2_values.some(l2 => activeL2s.has(l2)))
            .map(g => g.group_name)
    }, [groupsData, activeL2s])

    // 2. Fetch Metrics when dependencies change
    useEffect(() => {
        if (!fileId || selectedGroupNames.length === 0) {
            setMetricsData(null)
            return
        }

        const loadMetrics = async () => {
            setLoading(true)
            setError('')
            try {
                const response = await fetchModelGroupWeeklyMetrics(fileId, {
                    group_names: selectedGroupNames,
                    metric: metric,
                    include_spends: true,
                    window_weeks: 104,
                    l2_values: Array.from(activeL2s),
                })
                setMetricsData(response)
            } catch (err) {
                console.error(err)
                setError(err.message || 'Unable to load metrics')
            } finally {
                setLoading(false)
            }
        }
        loadMetrics()
    }, [fileId, selectedGroupNames, activeL2s, metric])


    const filteredGroups = useMemo(() => {
        if (!groupsData) return []
        return groupsData.filter((g) =>
            g.group_name.toLowerCase().includes(search.toLowerCase()),
        )
    }, [groupsData, search])

    const chartSeries = useMemo(() => {
        if (!metricsData?.series) return []
        return [...metricsData.series].reverse()
    }, [metricsData])

    const monthTicks = useMemo(() => {
        if (!chartSeries.length) return []
        const seen = new Set()
        const ticks = []
        chartSeries.forEach((row) => {
            const date = new Date(row.week_start_date)
            if (Number.isNaN(date.getTime())) return
            const key = `${date.getFullYear()}-${date.getMonth()}`
            if (!seen.has(key)) {
                seen.add(key)
                ticks.push(row.week_start_date)
            }
        })
        return ticks
    }, [chartSeries])

    const lineMax = useMemo(() => {
        if (!chartSeries.length) return 0
        return Math.max(...chartSeries.map((d) => d.metric_value))
    }, [chartSeries])

    const spendsMax = useMemo(() => {
        if (!chartSeries.length) return 0
        return Math.max(
            ...chartSeries.map(
                (d) => d.search_spend + d.onsite_spend + d.offsite_spend,
            ),
        )
    }, [chartSeries])

    // Interactions
    const toggleExpand = (groupName) => {
        const next = new Set(expandedGroups)
        if (next.has(groupName)) {
            next.delete(groupName)
        } else {
            next.add(groupName)
        }
        setExpandedGroups(next)
    }

    const toggleGroupSelection = (group) => {
        const groupL2s = group.l2_values
        const allSelected = groupL2s.every(l2 => activeL2s.has(l2))

        const next = new Set(activeL2s)
        if (allSelected) {
            // Deselect all
            groupL2s.forEach(l2 => next.delete(l2))
        } else {
            // Select all
            groupL2s.forEach(l2 => next.add(l2))
        }
        setActiveL2s(next)
    }

    const toggleL2Selection = (l2) => {
        const next = new Set(activeL2s)
        if (next.has(l2)) {
            next.delete(l2)
        } else {
            next.add(l2)
        }
        setActiveL2s(next)
    }

    const selectAll = () => {
        if (!groupsData) return
        const allL2s = new Set()
        groupsData.forEach(g => {
            g.l2_values.forEach(l2 => allL2s.add(l2))
        })
        setActiveL2s(allL2s)
    }

    const clearAll = () => {
        setActiveL2s(new Set())
    }

    const renderYoYCard = (label, value) => {
        const isPositive = value > 0
        const isNegative = value < 0
        const formattedValue =
            value === null ? 'N/A' : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`

        let colorClass = 'text-slate-900'
        if (isPositive) colorClass = 'text-emerald-600'
        if (isNegative) colorClass = 'text-red-600'

        return (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {label} (YoY)
                </p>
                <p className={`mt-2 text-base font-semibold ${colorClass}`}>
                    {formattedValue}
                </p>
            </div>
        )
    }

    if (!hasFile) {
        return (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-sm text-slate-500">
                Upload a CSV to view model group sales.
            </div>
        )
    }

    return (
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                        Model Group Weekly Spends vs {metric === 'sales' ? 'Sales' : 'Units'}
                    </h2>
                </div>
                <div>
                    <select
                        value={metric}
                        onChange={(event) => setMetric(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-slate-400"
                    >
                        <option value="sales">Sales ($)</option>
                        <option value="units">Units (#)</option>
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            {metricsData?.yoy && (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {renderYoYCard('Sales', metricsData.yoy.sales_yoy_pct)}
                    {renderYoYCard('Units', metricsData.yoy.units_yoy_pct)}
                    {renderYoYCard('Spends', metricsData.yoy.spends_yoy_pct)}
                </div>
            )}

            {loading && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    Loading metrics…
                </div>
            )}

            {error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {!error && groupsData && (
                <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-700">
                                Select model groups
                            </p>
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <button
                                    type="button"
                                    onClick={selectAll}
                                    className="rounded-full border border-slate-200 px-2 py-1 hover:bg-white"
                                >
                                    Select all
                                </button>
                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="rounded-full border border-slate-200 px-2 py-1 hover:bg-white"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search model groups"
                            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                        />
                        <div className="mt-4 max-h-[480px] overflow-auto rounded-xl border border-slate-200 bg-white">
                            {filteredGroups.map((group) => {
                                const isExpanded = expandedGroups.has(group.group_name)
                                const allL2Selected = group.l2_values.every(l2 => activeL2s.has(l2))
                                const someL2Selected = !allL2Selected && group.l2_values.some(l2 => activeL2s.has(l2))

                                return (
                                    <div key={group.group_name} className="border-b border-slate-100 last:border-0">
                                        <div className="flex items-center px-3 py-2 hover:bg-slate-50">
                                            <button
                                                onClick={() => toggleExpand(group.group_name)}
                                                className="p-1 text-slate-400 hover:text-slate-600 mr-2"
                                            >
                                                <svg
                                                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                            <div
                                                className="flex-1 flex items-center gap-3 cursor-pointer"
                                                onClick={() => toggleGroupSelection(group)}
                                            >
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={allL2Selected}
                                                        readOnly
                                                        className="peer h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    {someL2Selected && (
                                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                            <div className="h-2 w-2 rounded-sm bg-blue-600"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 select-none">
                                                    {group.group_name}
                                                </span>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="bg-slate-50 px-4 py-2 space-y-1">
                                                {group.l2_values.map(l2 => (
                                                    <label key={l2} className="flex items-center gap-3 py-1 cursor-pointer pl-6 hover:bg-slate-100 rounded-lg">
                                                        <input
                                                            type="checkbox"
                                                            checked={activeL2s.has(l2)}
                                                            onChange={() => toggleL2Selection(l2)}
                                                            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-xs text-slate-600 select-none truncate">
                                                            {l2}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        {selectedGroupNames.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                Select at least one model group to render the chart.
                            </div>
                        ) : (
                            <div className="h-[420px]">
                                {!loading && chartSeries.length > 0 && (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={chartSeries}>
                                            <XAxis
                                                dataKey="week_start_date"
                                                tick={{ fontSize: 10 }}
                                                tickFormatter={formatHalfMonth}
                                                ticks={monthTicks}
                                                angle={-45}
                                                textAnchor="end"
                                                height={60}
                                            />
                                            <YAxis
                                                yAxisId="lineMetric"
                                                tick={{ fontSize: 10 }}
                                                tickFormatter={formatYAxisTick}
                                                domain={[0, Math.max(1, lineMax * 1.1)]}
                                                label={{
                                                    value: metric === 'sales' ? 'Sales ($)' : 'Units (#)',
                                                    angle: -90,
                                                    position: 'insideLeft',
                                                    style: { fontSize: 10, fill: '#64748b' },
                                                    dx: -6,
                                                }}
                                                width={72}
                                            />
                                            <YAxis
                                                yAxisId="spends"
                                                orientation="right"
                                                tick={{ fontSize: 10 }}
                                                tickFormatter={formatYAxisTick}
                                                domain={[0, Math.max(1, spendsMax * 1.1)]}
                                                label={{
                                                    value: 'Spends ($)',
                                                    angle: 90,
                                                    position: 'insideRight',
                                                    style: { fontSize: 10, fill: '#64748b' },
                                                    dx: 6,
                                                }}
                                                width={72}
                                            />
                                            <Tooltip
                                                contentStyle={{ fontSize: 12 }}
                                                shared={false}
                                                trigger="item"
                                                formatter={(value, name) => [
                                                    Number(value).toLocaleString('en-US', {
                                                        maximumFractionDigits: 0,
                                                    }),
                                                    name,
                                                ]}
                                            />
                                            <Legend wrapperStyle={{ fontSize: 10 }} />

                                            <Bar
                                                name="Search Spend"
                                                dataKey="search_spend"
                                                stackId="spends"
                                                yAxisId="spends"
                                                fill={CHART_COLORS.search}
                                                isAnimationActive={false}
                                            />
                                            <Bar
                                                name="Online Spend"
                                                dataKey="onsite_spend"
                                                stackId="spends"
                                                yAxisId="spends"
                                                fill={CHART_COLORS.online}
                                                isAnimationActive={false}
                                            />
                                            <Bar
                                                name="Offline Spend"
                                                dataKey="offsite_spend"
                                                stackId="spends"
                                                yAxisId="spends"
                                                fill={CHART_COLORS.offline}
                                                isAnimationActive={false}
                                            />

                                            <Line
                                                type="monotone"
                                                dataKey="metric_value"
                                                name={metric === 'sales' ? 'Total Sales' : 'Total Units'}
                                                yAxisId="lineMetric"
                                                stroke={CHART_COLORS.sales}
                                                strokeWidth={2}
                                                dot={false}
                                                isAnimationActive={false}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                                {!loading && chartSeries.length === 0 && (
                                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                        No data available for the selected groups and filters.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    )
}

export default ModelGroupSalesSheet
