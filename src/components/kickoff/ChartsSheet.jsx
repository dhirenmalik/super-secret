import React, { useEffect, useMemo, useState } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts'
import { fetchWeeklySales } from '../../api/kickoff'

const CHART_COLORS = [
    '#1d4ed8',
    '#dc2626',
    '#059669',
    '#7c3aed',
    '#ea580c',
    '#0f766e',
    '#9333ea',
    '#b91c1c',
    '#15803d',
    '#0ea5e9',
    '#f97316',
    '#64748b',
]

const getColor = (index) => CHART_COLORS[index % CHART_COLORS.length]

const formatHalfMonth = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }
    const month = date.toLocaleString('en-US', { month: 'short' })
    const year = String(date.getFullYear()).slice(-2)
    return `${month}-${year}`
}

const ChartsSheet = ({ hasFile, fileId }) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [selected, setSelected] = useState([])
    const [search, setSearch] = useState('')
    const [metric, setMetric] = useState('sales')

    useEffect(() => {
        if (!fileId) {
            setData(null)
            return
        }

        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const response = await fetchWeeklySales(fileId, metric)
                setData(response)
                setSelected(response.l2_values?.slice(0, 3) || [])
            } catch (err) {
                setError(err.message || 'Unable to load weekly sales')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [fileId, metric])

    const filteredL2 = useMemo(() => {
        if (!data?.l2_values) {
            return []
        }
        return data.l2_values.filter((value) =>
            value.toLowerCase().includes(search.toLowerCase()),
        )
    }, [data, search])

    const chartSeries = useMemo(() => {
        if (!data?.series || selected.length === 0) {
            return []
        }
        return data.series.map((row) => {
            const filtered = { week_start_date: row.week_start_date }
            selected.forEach((key) => {
                filtered[key] = row[key] ?? 0
            })
            return filtered
        })
    }, [data, selected])

    const monthTicks = useMemo(() => {
        if (!data?.series) {
            return []
        }
        const seen = new Set()
        const ticks = []
        data.series.forEach((row) => {
            const date = new Date(row.week_start_date)
            if (Number.isNaN(date.getTime())) {
                return
            }
            const key = `${date.getFullYear()}-${date.getMonth()}`
            if (!seen.has(key)) {
                seen.add(key)
                ticks.push(row.week_start_date)
            }
        })
        return ticks
    }, [data])

    const toggleSelection = (value) => {
        setSelected((prev) =>
            prev.includes(value)
                ? prev.filter((item) => item !== value)
                : [...prev, value],
        )
    }

    if (!hasFile) {
        return (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-sm text-slate-500">
                Upload a CSV to view charts.
            </div>
        )
    }

    return (
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Charts</h2>
                    <p className="text-sm text-slate-500">
                        Weekly O_SALE trends by selected L2 values.
                    </p>
                </div>
                <div>
                    <select
                        value={metric}
                        onChange={(event) => setMetric(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                    >
                        <option value="sales">Weekly Sales</option>
                        <option value="search_spends">Weekly Search Spends</option>
                        <option value="onsite_spends">Weekly Onsite Spends</option>
                        <option value="offsite_spends">Weekly Offsite Spends</option>
                    </select>
                </div>
            </div>

            {loading && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    Loading weekly sales…
                </div>
            )}

            {error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {!loading && !error && data && (
                <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-700">
                                Select L2 values
                            </p>
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <button
                                    type="button"
                                    onClick={() => setSelected(data.l2_values || [])}
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
                            placeholder="Search L2 values"
                            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                        />
                        <div className="mt-4 max-h-[360px] overflow-auto rounded-xl border border-slate-200 bg-white">
                            {filteredL2.map((value) => (
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
                                Select at least one L2 to render the chart.
                            </div>
                        ) : (
                            <div className="h-[420px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartSeries}>
                                        <XAxis
                                            dataKey="week_start_date"
                                            tick={{ fontSize: 10 }}
                                            tickFormatter={formatHalfMonth}
                                            ticks={monthTicks}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{ fontSize: 12 }}
                                            shared={false}
                                            trigger="item"
                                        />
                                        <Legend wrapperStyle={{ fontSize: 10 }} />
                                        {selected.map((key) => (
                                            <Line
                                                key={key}
                                                type="monotone"
                                                dataKey={key}
                                                isAnimationActive={false}
                                                stroke={getColor(selected.indexOf(key))}
                                                strokeWidth={2}
                                                activeDot={{ r: 4 }}
                                                dot={false}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    )
}

export default ChartsSheet
