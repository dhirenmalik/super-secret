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
import { fetchModelGroups, fetchModelGroupWeeklyMetrics } from '../../api/kickoff'

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
    const [selected, setSelected] = useState([])
    const [search, setSearch] = useState('')
    const [metric, setMetric] = useState('sales')

    // 1. Initial Load: Model Groups
    useEffect(() => {
        if (!fileId) {
            setGroupsData(null)
            return
        }

        const loadGroups = async () => {
            try {
                const response = await fetchModelGroups(fileId)
                const groups = response.groups || []
                const groupNames = groups.map((g) => g.group_name)
                setGroupsData({ groups, groupNames })
                // Default selection
                setSelected(groupNames.slice(0, 3))
            } catch (err) {
                console.error(err)
                setError('Unable to load model groups')
            }
        }
        loadGroups()
    }, [fileId])

    // 2. Fetch Metrics when dependencies change
    useEffect(() => {
        if (!fileId || !selected.length) {
            setMetricsData(null)
            return
        }

        const loadMetrics = async () => {
            setLoading(true)
            setError('')
            try {
                const response = await fetchModelGroupWeeklyMetrics(fileId, {
                    group_names: selected,
                    metric: metric,
                    include_spends: true,
                    window_weeks: 104,
                })
                setMetricsData(response)
            } catch (err) {
                console.error(err)
                setError(err.message || 'Unable to load metrics')
            } finally {
                setLoading(false)
            }
        }

        // Debounce or just call it. React handles rapid updates reasonably well, 
        // but for text search we usually debounce. For checkbox selection, immediate is fine.
        loadMetrics()
    }, [fileId, selected, metric])


    const filteredGroups = useMemo(() => {
        if (!groupsData?.groupNames) return []
        return groupsData.groupNames.filter((value) =>
            value.toLowerCase().includes(search.toLowerCase()),
        )
    }, [groupsData, search])

    const chartSeries = useMemo(() => {
        if (!metricsData?.series) return []
        // API returns descending (latest first) usually, but Recharts prefers ascending.
        // Our service currently returns desc. Let's reverse for chart.
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

    const toggleSelection = (value) => {
        setSelected((prev) =>
            prev.includes(value)
                ? prev.filter((item) => item !== value)
                : [...prev, value],
        )
    }

    const renderYoYCard = (label, value) => {
        const isPositive = value > 0
        const isNegative = value < 0
        const formattedValue =
            value === null ? 'N/A' : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`

        // Determine color based on value
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
                                    onClick={() => setSelected(groupsData.groupNames || [])}
                                    className="rounded-full border border-slate-200 px-2 py-1 hover:bg-white"
                                >
                                    Select all
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelected([])}
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
                        <div className="mt-4 max-h-[360px] overflow-auto rounded-xl border border-slate-200 bg-white">
                            {filteredGroups.map((value) => (
                                <label
                                    key={value}
                                    className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 text-sm text-slate-600"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(value)}
                                        onChange={() => toggleSelection(value)}
                                    />
                                    <span className="flex-1">{value}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        {selected.length === 0 ? (
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
                                        No data available for the selected groups.
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
