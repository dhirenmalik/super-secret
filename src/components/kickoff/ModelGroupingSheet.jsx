import React from 'react'
import SummarySheetPanel from './SummarySheetPanel'
import ModelGroupBuilder from './ModelGroupBuilder'
import AutoGroupingPanel from './AutoGroupingPanel'

const ModelGroupingSheet = ({
    summaryProps,
    hasFile,
    mappingProps,
    mappingError,
    autoGroupingProps,
}) => {
    return (
        <div className="min-w-0 space-y-6">
            {hasFile ? (
                <>
                    <SummarySheetPanel
                        title="Model Group Summary"
                        subtitle="Aggregated metrics across your model groups."
                        emptyMessage="No data available for this date range."
                        showAutoBucket
                        {...summaryProps}
                    />
                    <AutoGroupingPanel {...autoGroupingProps} />
                    <ModelGroupBuilder {...mappingProps} />
                    {mappingError && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {mappingError}
                        </div>
                    )}
                </>
            ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-sm text-slate-500">
                    Upload a CSV to configure model groups.
                </div>
            )}
        </div>
    )
}

export default ModelGroupingSheet
