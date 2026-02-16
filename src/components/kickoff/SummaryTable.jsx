import React, { useMemo, useState } from 'react'

const numberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

const formatNumber = (value) => numberFormatter.format(value || 0)
const formatPercent = (value) => `${percentFormatter.format(value || 0)}%`

const SORTABLE_COLUMNS = [
    { key: 'subcategory', label: 'Subcategory', align: 'left' },
    { key: 'sales', label: 'Sales', align: 'right' },
    { key: 'units', label: 'Units', align: 'right' },
    { key: 'avg_price', label: 'Avg Price', align: 'right' },
    { key: 'total_spends', label: 'Total Spends', align: 'right' },
    { key: 'search_spends', label: 'Search Spends', align: 'right' },
    { key: 'onsite_display_spends', label: 'Onsite Display Spends', align: 'right' },
    { key: 'offsite_display_spends', label: 'Offsite Display Spends', align: 'right' },
    { key: 'spends_per_sales', label: 'Spends/Sales', align: 'right' },
    { key: 'sales_share_pct', label: 'Sales Share %', align: 'right' },
    { key: 'unit_share_pct', label: 'Unit Share %', align: 'right' },
    { key: 'total_spends_pct', label: 'Total Spends %', align: 'right' },
    { key: 'search_spends_pct', label: 'Search Spends %', align: 'right' },
    { key: 'onsite_display_spends_pct', label: 'Onsite Display %', align: 'right' },
    { key: 'offsite_display_spends_pct', label: 'Offsite Display %', align: 'right' },
]

const PERCENT_COLUMNS = new Set([
    'sales_share_pct',
    'unit_share_pct',
    'total_spends_pct',
    'search_spends_pct',
    'onsite_display_spends_pct',
    'offsite_display_spends_pct',
])

const SummaryTable = ({ summary }) => {
    const [sortConfig, setSortConfig] = useState({
        key: 'sales',
        direction: 'desc',
    })

    const percentBounds = useMemo(() => {
        const bounds = {}
        PERCENT_COLUMNS.forEach((key) => {
            const values = summary.rows.map((row) => row[key]).filter((val) => val != null)
            const min = values.length ? Math.min(...values) : 0
            const max = values.length ? Math.max(...values) : 0
            bounds[key] = { min, max }
        })
        return bounds
    }, [summary.rows])

    const sortedRows = useMemo(() => {
        const rows = [...summary.rows]
        const { key, direction } = sortConfig
        rows.sort((a, b) => {
            const valueA = a[key]
            const valueB = b[key]
            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return direction === 'asc' ? valueA - valueB : valueB - valueA
            }
            return direction === 'asc'
                ? String(valueA).localeCompare(String(valueB))
                : String(valueB).localeCompare(String(valueA))
        })
        return rows
    }, [summary.rows, sortConfig])

    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return {
                    key,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc',
                }
            }
            return { key, direction: 'desc' }
        })
    }

    const renderSortIndicator = (key) => {
        if (sortConfig.key !== key) {
            return '↕'
        }
        return sortConfig.direction === 'asc' ? '↑' : '↓'
    }

    const getPercentStyle = (key, value) => {
        if (!PERCENT_COLUMNS.has(key)) {
            return {}
        }
        const bounds = percentBounds[key]
        if (!bounds) {
            return {}
        }
        const range = bounds.max - bounds.min
        const normalized = range === 0 ? 0.5 : (value - bounds.min) / range
        const hue = 120 * normalized
        return {
            backgroundColor: `hsl(${hue}, 70%, 92%)`,
        }
    }

    return (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="max-h-[520px] overflow-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-widest text-slate-500">
                        <tr>
                            {SORTABLE_COLUMNS.map((column) => (
                                <th
                                    key={column.key}
                                    className={`px-4 py-3 font-medium ${column.align === 'right' ? 'text-right' : 'text-left'
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleSort(column.key)}
                                        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500"
                                    >
                                        {column.label}
                                        <span className="text-[10px] text-slate-400">
                                            {renderSortIndicator(column.key)}
                                        </span>
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedRows.map((row) => (
                            <tr key={row.subcategory}>
                                <td className="px-4 py-3 font-medium text-slate-700">
                                    {row.subcategory}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                    {formatNumber(row.sales)}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                    {formatNumber(row.units)}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                    {formatNumber(row.avg_price)}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                    {formatNumber(row.total_spends)}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                    {formatNumber(row.search_spends)}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                    {formatNumber(row.onsite_display_spends)}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                    {formatNumber(row.offsite_display_spends)}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                    {formatNumber(row.spends_per_sales)}
                                </td>
                                <td
                                    className="px-4 py-3 text-right text-slate-600"
                                    style={getPercentStyle('sales_share_pct', row.sales_share_pct)}
                                >
                                    {formatPercent(row.sales_share_pct)}
                                </td>
                                <td
                                    className="px-4 py-3 text-right text-slate-600"
                                    style={getPercentStyle('unit_share_pct', row.unit_share_pct)}
                                >
                                    {formatPercent(row.unit_share_pct)}
                                </td>
                                <td
                                    className="px-4 py-3 text-right text-slate-600"
                                    style={getPercentStyle('total_spends_pct', row.total_spends_pct)}
                                >
                                    {formatPercent(row.total_spends_pct)}
                                </td>
                                <td
                                    className="px-4 py-3 text-right text-slate-600"
                                    style={getPercentStyle('search_spends_pct', row.search_spends_pct)}
                                >
                                    {formatPercent(row.search_spends_pct)}
                                </td>
                                <td
                                    className="px-4 py-3 text-right text-slate-600"
                                    style={getPercentStyle(
                                        'onsite_display_spends_pct',
                                        row.onsite_display_spends_pct,
                                    )}
                                >
                                    {formatPercent(row.onsite_display_spends_pct)}
                                </td>
                                <td
                                    className="px-4 py-3 text-right text-slate-600"
                                    style={getPercentStyle(
                                        'offsite_display_spends_pct',
                                        row.offsite_display_spends_pct,
                                    )}
                                >
                                    {formatPercent(row.offsite_display_spends_pct)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default SummaryTable
