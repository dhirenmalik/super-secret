import React, { useEffect, useState } from 'react'
import { fetchCorrelation } from '../../api/kickoff'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const getHeatColor = (value) => {
    const v = clamp(value, -1, 1)
    const deepBlue = [30, 64, 175]
    const lightBlue = [191, 219, 254]
    const neutral = [255, 255, 255]
    const lightRed = [254, 202, 202]
    const deepRed = [185, 28, 28]

    const lerp = (a, b, t) => Math.round(a + (b - a) * t)

    if (v < 0) {
        const t = Math.abs(v)
        const from = t < 0.5 ? lightBlue : deepBlue
        const to = t < 0.5 ? neutral : lightBlue
        const localT = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5
        return `rgb(${lerp(from[0], to[0], 1 - localT)}, ${lerp(
            from[1],
            to[1],
            1 - localT,
        )}, ${lerp(from[2], to[2], 1 - localT)})`
    }

    if (v > 0) {
        const t = v
        const from = t < 0.5 ? neutral : lightRed
        const to = t < 0.5 ? lightRed : deepRed
        const localT = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5
        return `rgb(${lerp(from[0], to[0], localT)}, ${lerp(
            from[1],
            to[1],
            localT,
        )}, ${lerp(from[2], to[2], localT)})`
    }

    return `rgb(${neutral[0]}, ${neutral[1]}, ${neutral[2]})`
}

const CorrelationSheet = ({ hasFile, fileId }) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [minCorrelation, setMinCorrelation] = useState(0)

    useEffect(() => {
        if (!fileId) {
            setData(null)
            return
        }

        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const response = await fetchCorrelation(fileId)
                setData(response)
            } catch (err) {
                setError(err.message || 'Unable to load correlation')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [fileId])

    if (!hasFile) {
        return (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-sm text-slate-500">
                Upload a CSV to view the correlation sheet.
            </div>
        )
    }

    return (
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Correlation</h2>
                    <p className="text-sm text-slate-500">
                        Pearson correlation of O_SALE across L2 values.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Min Correlation: {Math.round(minCorrelation * 100)}%
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={minCorrelation}
                        onChange={(e) => setMinCorrelation(parseFloat(e.target.value))}
                        className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                </div>
            </div>

            {loading && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    Loading correlation matrix…
                </div>
            )}

            {error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {!loading && !error && data && data.l2_values?.length > 0 && (
                <div className="mt-6 overflow-auto rounded-2xl border border-slate-200">
                    <table className="min-w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-100 text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                                <th className="px-3 py-2 font-medium bg-slate-100 sticky left-0 z-10 border-r border-slate-200">L2</th>
                                {data.l2_values.map((label) => (
                                    <th key={label} className="px-3 py-2 font-medium text-right whitespace-nowrap">
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.l2_values.map((rowLabel, rowIndex) => (
                                <tr key={rowLabel}>
                                    <td className="px-3 py-2 text-slate-600 font-medium bg-slate-50 sticky left-0 z-10 border-r border-slate-200 whitespace-nowrap">
                                        {rowLabel}
                                    </td>
                                    {data.matrix[rowIndex]?.map((value, colIndex) => {
                                        const isVisible = Math.abs(value) >= minCorrelation || rowLabel === data.l2_values[colIndex];
                                        return (
                                            <td
                                                key={`${rowLabel}-${colIndex}`}
                                                className="px-3 py-2 text-right text-slate-800 transition-colors duration-200"
                                                style={{
                                                    backgroundColor: isVisible ? getHeatColor(value) : '#f8fafc',
                                                    color: isVisible ? 'inherit' : '#cbd5e1'
                                                }}
                                            >
                                                {isVisible ? value.toFixed(3) : '-'}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && !error && data && data.l2_values?.length === 0 && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No correlation data available.
                </div>
            )}
        </section>
    )
}

export default CorrelationSheet
