import React from 'react'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
} from 'recharts'

const COLORS = ['#1f2937', '#f97316', '#0ea5e9']

const SummaryCharts = ({ rows }) => {
    const chartData = rows.slice(0, 10).map((row) => ({
        subcategory: row.subcategory,
        search: row.search_spends,
        onsite: row.onsite_display_spends,
        offsite: row.offsite_display_spends,
    }))

    const totals = rows.reduce(
        (acc, row) => {
            acc.search += row.search_spends
            acc.onsite += row.onsite_display_spends
            acc.offsite += row.offsite_display_spends
            return acc
        },
        { search: 0, onsite: 0, offsite: 0 },
    )

    const pieData = [
        { name: 'Search', value: totals.search },
        { name: 'Onsite Display', value: totals.onsite },
        { name: 'Offsite Display', value: totals.offsite },
    ]

    return (
        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                            Spend Mix by Subcategory
                        </p>
                        <p className="text-sm text-slate-500">
                            Top 10 subcategories by spend
                        </p>
                    </div>
                </div>
                <div className="mt-4 h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="subcategory" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="search" stackId="a" fill={COLORS[2]} name="Search" />
                            <Bar dataKey="onsite" stackId="a" fill={COLORS[1]} name="Onsite" />
                            <Bar dataKey="offsite" stackId="a" fill={COLORS[0]} name="Offsite" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Total Spend Mix
                </p>
                <p className="text-sm text-slate-500">Search vs Onsite vs Offsite</p>
                <div className="mt-4 h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110}>
                                {pieData.map((entry, index) => (
                                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

export default SummaryCharts
