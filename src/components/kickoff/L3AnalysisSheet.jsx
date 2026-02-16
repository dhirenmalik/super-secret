import React, { useEffect, useState } from 'react'
import { fetchL3Analysis } from '../../api/kickoff'

const numberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

const L3AnalysisSheet = ({ hasFile, fileId }) => {
    const [data, setData] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    useEffect(() => {
        if (!fileId) {
            setData(null)
            return
        }

        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const response = await fetchL3Analysis(fileId, {
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                })
                setData(response)
            } catch (err) {
                setError(err.message || 'Unable to load L3 analysis')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [fileId, startDate, endDate])

    const handleReset = () => {
        setStartDate('')
        setEndDate('')
    }

    const handleQuickRange = (monthsBack, monthsWindow = null) => {
        if (!data?.date_bounds?.max) {
            return
        }
        const maxDate = new Date(data.date_bounds.max)
        const start = new Date(maxDate)
        start.setMonth(start.getMonth() - monthsBack)

        let end = maxDate
        if (monthsWindow !== null) {
            end = new Date(maxDate)
            end.setMonth(end.getMonth() - monthsBack + monthsWindow)
        }

        const startIso = start.toISOString().slice(0, 10)
        const endIso = end.toISOString().slice(0, 10)

        setStartDate(startIso)
        setEndDate(endIso)
    }

    return (
        <div className="min-w-0">
            {hasFile ? (
                <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">
                                L3 Analysis
                            </h2>
                            <p className="text-sm text-slate-500">
                                Aggregated metrics by L2 and L3.
                            </p>
                        </div>
                        {data && (
                            <div className="text-xs text-slate-500">
                                {data.meta.unique_l2} L2 • {data.meta.unique_l3} L3 •{' '}
                                {data.meta.row_count} rows
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-end gap-3">
                        <div>
                            <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                Start date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(event) => setStartDate(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                End date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(event) => setEndDate(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                        >
                            Reset
                        </button>
                    </div>

                    {data?.date_bounds?.max && (
                        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                            <button
                                type="button"
                                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
                                onClick={() => handleQuickRange(12, 12)}
                            >
                                Latest Year
                            </button>
                            <button
                                type="button"
                                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
                                onClick={() => handleQuickRange(24, 12)}
                            >
                                Previous Year
                            </button>
                            <button
                                type="button"
                                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
                                onClick={() => handleQuickRange(32, 32)}
                            >
                                32 Months
                            </button>
                            <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-2">
                                CSV Range: {data.date_bounds.min} → {data.date_bounds.max}
                            </span>
                        </div>
                    )}

                    {loading && (
                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                            Loading L3 analysis...
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {data && !loading && !error && (
                        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                            <div className="max-h-[540px] overflow-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-widest text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">L2</th>
                                            <th className="px-4 py-3 font-medium">L3</th>
                                            <th className="px-4 py-3 text-right font-medium">Sales</th>
                                            <th className="px-4 py-3 text-right font-medium">Total Spends</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.rows.map((row, idx) => {
                                            const nextRow = data.rows[idx + 1]
                                            const isGroupEnd = !nextRow || nextRow.l2 !== row.l2
                                            const endBorder = isGroupEnd
                                                ? 'border-b-2 border-slate-300'
                                                : ''
                                            return (
                                                <tr key={`${row.l2}-${row.l3}-${idx}`}>
                                                    <td className={`px-4 py-3 text-slate-700 ${endBorder}`}>{row.l2}</td>
                                                    <td className={`px-4 py-3 text-slate-600 ${endBorder}`}>{row.l3}</td>
                                                    <td className={`px-4 py-3 text-right text-slate-600 ${endBorder}`}>
                                                        {numberFormatter.format(row.sales)}
                                                    </td>
                                                    <td className={`px-4 py-3 text-right text-slate-600 ${endBorder}`}>
                                                        {numberFormatter.format(row.total)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-sm text-slate-500">
                    Upload a CSV to view the L3 Analysis sheet.
                </div>
            )}
        </div>
    )
}

export default L3AnalysisSheet
