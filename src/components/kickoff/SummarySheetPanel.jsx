import React from 'react'
import SummaryCharts from './SummaryCharts'
import SummaryTable from './SummaryTable'

const SummarySheetPanel = ({
    title,
    subtitle,
    summary,
    summaryError,
    isSummaryLoading,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    onApplyDateRange,
    onResetDateRange,
    onQuickRange,
    showAutoBucket,
    autoBucket,
    onAutoBucketToggle,
    formatCompact,
    formatFull,
    emptyMessage,
}) => {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                </div>
                {showAutoBucket && (
                    <label className="flex items-center gap-2 text-xs text-slate-500">
                        <input type="checkbox" checked={autoBucket} onChange={onAutoBucketToggle} />
                        Auto-bucket unassigned
                    </label>
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
                        onChange={(event) => onStartDateChange(event.target.value)}
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
                        onChange={(event) => onEndDateChange(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600"
                    />
                </div>
                <button
                    type="button"
                    onClick={onApplyDateRange}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                    Apply
                </button>
                <button
                    type="button"
                    onClick={onResetDateRange}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                >
                    Reset
                </button>
            </div>

            {summary?.date_bounds?.max && (
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                    <button
                        type="button"
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
                        onClick={() => onQuickRange(12, 12)}
                    >
                        Latest Year
                    </button>
                    <button
                        type="button"
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
                        onClick={() => onQuickRange(24, 12)}
                    >
                        Previous Year
                    </button>
                    <button
                        type="button"
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
                        onClick={() => onQuickRange(32, 32)}
                    >
                        32 Months
                    </button>
                    <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-2">
                        CSV Range: {summary.date_bounds.min} → {summary.date_bounds.max}
                    </span>
                </div>
            )}

            {isSummaryLoading && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    Computing summary...
                </div>
            )}

            {summaryError && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {summaryError}
                </div>
            )}

            {summary && !isSummaryLoading && !summaryError && (
                <>
                    <div className="mt-6 grid gap-4 text-sm text-slate-600 md:grid-cols-5">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                Total Sales
                            </p>
                            <p
                                className="mt-2 text-base font-semibold text-slate-900"
                                title={formatFull(summary.totals.sales)}
                            >
                                {formatCompact(summary.totals.sales)}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                Total Units
                            </p>
                            <p
                                className="mt-2 text-base font-semibold text-slate-900"
                                title={formatFull(summary.totals.units)}
                            >
                                {formatCompact(summary.totals.units)}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                Total Spends
                            </p>
                            <p
                                className="mt-2 text-base font-semibold text-slate-900"
                                title={formatFull(summary.totals.total_spends)}
                            >
                                {formatCompact(summary.totals.total_spends)}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                Average Price
                            </p>
                            <p
                                className="mt-2 text-base font-semibold text-slate-900"
                                title={formatFull(
                                    summary.totals.sales / (summary.totals.units || 1),
                                )}
                            >
                                {formatCompact(
                                    summary.totals.sales / (summary.totals.units || 1),
                                )}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                WMC Penetration
                            </p>
                            <p
                                className="mt-2 text-base font-semibold text-slate-900"
                                title={formatFull(
                                    summary.totals.total_spends / (summary.totals.sales || 1),
                                )}
                            >
                                {formatCompact(
                                    summary.totals.total_spends / (summary.totals.sales || 1),
                                )}
                            </p>
                        </div>
                    </div>
                    {summary.rows.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                            {emptyMessage}
                        </div>
                    ) : (
                        <>
                            <SummaryCharts rows={summary.rows} />
                            <SummaryTable summary={summary} />
                        </>
                    )}
                </>
            )}
        </section>
    )
}

export default SummarySheetPanel
