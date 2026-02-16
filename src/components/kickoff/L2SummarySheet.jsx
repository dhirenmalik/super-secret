import React from 'react'
import SummarySheetPanel from './SummarySheetPanel'

const L2SummarySheet = ({ summaryProps, hasFile }) => {
    return (
        <div className="min-w-0">
            {hasFile ? (
                <SummarySheetPanel
                    title="L2 Summary"
                    subtitle="Aggregated metrics across all subcategories."
                    emptyMessage="No data available for this date range."
                    showAutoBucket={false}
                    {...summaryProps}
                />
            ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-sm text-slate-500">
                    Upload a CSV to view the L2 Summary sheet.
                </div>
            )}
        </div>
    )
}

export default L2SummarySheet
