import React from 'react'

const AutoGroupingPanel = ({
    onPreview,
    onApply,
    loading,
    error,
    unassignedCount,
    warnings,
    successMessage,
}) => {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Auto Grouping</h3>
                    <p className="text-sm text-slate-500">
                        Build model groups from the reference mapping file.
                    </p>
                </div>
                {successMessage && (
                    <span className="text-xs font-medium text-emerald-600">
                        {successMessage}
                    </span>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={onPreview}
                    disabled={loading}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? 'Loading…' : 'Auto Grouping'}
                </button>
                <button
                    type="button"
                    onClick={onApply}
                    disabled={loading}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                    {loading ? 'Saving…' : 'Apply & Save'}
                </button>
            </div>

            {(error || typeof unassignedCount === 'number' || warnings?.length) && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                    {error && <p className="text-red-600">{error}</p>}
                    {typeof unassignedCount === 'number' && (
                        <p className="mt-1">Unassigned L2 values: {unassignedCount}</p>
                    )}
                    {warnings?.length > 0 && (
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-500">
                            {warnings.map((warning) => (
                                <li key={warning}>{warning}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </section>
    )
}

export default AutoGroupingPanel
