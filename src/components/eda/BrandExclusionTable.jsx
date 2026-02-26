import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrencyMillions } from '../../utils/formatters';
import MultiSelect from '../MultiSelect';
import NumberRangeFilter from '../NumberRangeFilter';
import { motion, AnimatePresence } from 'framer-motion';

const BrandExclusionTable = ({ data, onUpdate, isReadOnly, filters, setFilters, filterOptions, isFullScreen }) => {
    const [sortConfig, setSortConfig] = useState({ key: 'sum_sales', direction: 'descending' });
    const [currentPage, setCurrentPage] = useState(1);
    const [editingBrand, setEditingBrand] = useState(null);
    const [editGroupValue, setEditGroupValue] = useState('');
    const [updatingBrand, setUpdatingBrand] = useState(null);
    const pageSize = 50;

    useEffect(() => { setCurrentPage(1); }, [data?.rows?.length]);

    const sortedRows = useMemo(() => {
        if (!data || !data.rows) return [];
        return [...data.rows].sort((a, b) => {
            let aVal = a[sortConfig.key], bVal = b[sortConfig.key];
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            return sortConfig.direction === 'ascending'
                ? (aVal < bVal ? -1 : aVal > bVal ? 1 : 0)
                : (aVal > bVal ? -1 : aVal < bVal ? 1 : 0);
        });
    }, [data, sortConfig]);

    const totalPages = Math.ceil(sortedRows.length / pageSize);
    const paginatedRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleExcludeToggle = async (row) => {
        setUpdatingBrand(row.brand);
        try {
            await onUpdate({ brand: row.brand, exclude_flag: row.exclude_flag === 1 ? 0 : 1 });
        } finally {
            setUpdatingBrand(null);
        }
    };

    const handleGroupSave = async (brand) => {
        if (editGroupValue === '') return;
        setUpdatingBrand(brand);
        try {
            await onUpdate({ brand, combine_flag: parseInt(editGroupValue) || null });
            setEditingBrand(null);
        } finally {
            setUpdatingBrand(null);
        }
    };

    const requestSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
        }));
    };

    const SortIcon = ({ col }) => {
        if (sortConfig.key !== col) return <span className="text-slate-300 text-[10px] ml-1">⇅</span>;
        return <span className="text-indigo-600 text-[10px] ml-1">{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>;
    };

    const fmt = (val) => formatCurrencyMillions(val);

    if (!data || !data.rows) return null;

    const thClasses = "px-3 py-2.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50/90 backdrop-blur-sm border-b-2 border-slate-200 cursor-pointer select-none transition-colors hover:bg-slate-100";
    const tdClasses = "px-3 py-2.5 text-xs text-slate-700 border-b border-slate-100 align-middle";

    return (
        <div className={`flex flex-col overflow-hidden ${isFullScreen ? 'h-full' : 'auto'}`}>
            <div className={`overflow-x-auto overflow-y-auto ${isFullScreen ? 'h-full' : 'max-h-[520px] min-h-[350px]'} custom-scrollbar`}>
                <table className="w-full border-collapse table-fixed min-w-[1000px]">
                    <colgroup>
                        <col style={{ width: '155px' }} />
                        <col style={{ width: '105px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '90px' }} />
                        <col style={{ width: '75px' }} />
                        <col style={{ width: '48px' }} />
                        <col style={{ width: '48px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '85px' }} />
                        <col style={{ minWidth: '130px' }} />
                    </colgroup>
                    <thead className="sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className={thClasses} onClick={() => requestSort('brand')}>Brand <SortIcon col="brand" /></th>
                            <th className={`${thClasses} text-right`} onClick={() => requestSort('sum_sales')}>Sales <SortIcon col="sum_sales" /></th>
                            <th className={thClasses} onClick={() => requestSort('sales_share')}>Sales % <SortIcon col="sales_share" /></th>
                            <th className={`${thClasses} text-right`} onClick={() => requestSort('sum_spend')}>Spend <SortIcon col="sum_spend" /></th>
                            <th className={`${thClasses} text-right`} onClick={() => requestSort('spend_share')}>Spend % <SortIcon col="spend_share" /></th>
                            <th className={`${thClasses} text-center`} onClick={() => requestSort('private_brand')}>PB <SortIcon col="private_brand" /></th>
                            <th className={`${thClasses} text-center`} onClick={() => requestSort('mapping_issue')}>MI <SortIcon col="mapping_issue" /></th>
                            <th className={`${thClasses} text-center`} onClick={() => requestSort('combine_flag')}>Group <SortIcon col="combine_flag" /></th>
                            <th className={`${thClasses} text-center cursor-default hover:bg-slate-50`} title="Click badge to toggle">Result <span className="text-[8px] text-slate-400 font-normal ml-1">(click)</span></th>
                            <th className={`${thClasses} cursor-default hover:bg-slate-50`}>Reason / Match</th>
                        </tr>
                        {filters && (
                            <tr>
                                <th className="px-1 py-1 bg-slate-50 border-b-2 border-slate-200 align-top">
                                    <MultiSelect label="Brand" options={filterOptions?.brands || []} selectedValues={filters.brands} onChange={v => setFilters({ ...filters, brands: v })} />
                                </th>
                                <th className="px-1 py-1 bg-slate-50 border-b-2 border-slate-200 align-top">
                                    <NumberRangeFilter label="Sales" value={filters.sales} onChange={v => setFilters({ ...filters, sales: v })} align="left" />
                                </th>
                                <th className="px-1 py-1 bg-slate-50 border-b-2 border-slate-200 align-top">
                                    <NumberRangeFilter label="Sales %" value={filters.salesShare} onChange={v => setFilters({ ...filters, salesShare: v })} align="left" />
                                </th>
                                <th className="px-1 py-1 bg-slate-50 border-b-2 border-slate-200 align-top">
                                    <NumberRangeFilter label="Spend" value={filters.spend} onChange={v => setFilters({ ...filters, spend: v })} align="right" />
                                </th>
                                <th className="px-1 py-1 bg-slate-50 border-b-2 border-slate-200 align-top">
                                    <NumberRangeFilter label="Spend %" value={filters.spendShare} onChange={v => setFilters({ ...filters, spendShare: v })} align="right" />
                                </th>
                                <th className="px-1 py-1 bg-slate-50 border-b-2 border-slate-200 align-top">
                                    <MultiSelect label="PB" options={[{ label: 'Yes', value: 1 }, { label: 'No', value: 0 }]} selectedValues={filters.pb} onChange={v => setFilters({ ...filters, pb: v })} align="right" />
                                </th>
                                <th className="px-1 py-1 bg-slate-50 border-b-2 border-slate-200 align-top">
                                    <MultiSelect label="MI" options={[{ label: 'Yes', value: 1 }, { label: 'No', value: 0 }]} selectedValues={filters.mi} onChange={v => setFilters({ ...filters, mi: v })} align="right" />
                                </th>
                                <th className="px-1 py-1 bg-slate-50 border-b-2 border-slate-200 align-top">
                                    <MultiSelect label="Group" options={filterOptions?.groups || []} selectedValues={filters.groups} onChange={v => setFilters({ ...filters, groups: v })} align="right" />
                                </th>
                                <th className="px-1 py-1 bg-slate-50 border-b-2 border-slate-200 align-top">
                                    <MultiSelect label="Status" options={[{ label: 'Excluded', value: 1 }, { label: 'Included', value: 0 }]} selectedValues={filters.status} onChange={v => setFilters({ ...filters, status: v })} align="right" />
                                </th>
                                <th className="bg-slate-50 border-b-2 border-slate-200"></th>
                            </tr>
                        )}
                    </thead>
                    <tbody className="bg-white">
                        <AnimatePresence>
                            {paginatedRows.length > 0 ? paginatedRows.map((row, i) => {
                                const isUpdating = updatingBrand === row.brand;
                                const isEditing = editingBrand === row.brand;
                                const isExcluded = row.exclude_flag === 1;

                                return (
                                    <motion.tr
                                        key={`${row.brand}-${i}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: i * 0.01 }}
                                        className={`transition-colors duration-150 ${isExcluded ? 'bg-rose-50/30 hover:bg-rose-50/70' : 'bg-white hover:bg-slate-50'}`}
                                    >
                                        <td className={`${tdClasses} font-bold text-slate-800 overflow-hidden text-ellipsis whitespace-nowrap`} title={row.brand}>
                                            {row.brand}
                                        </td>
                                        <td className={`${tdClasses} text-right font-mono font-bold text-slate-700`}>
                                            {fmt(row.sum_sales)}
                                        </td>
                                        <td className={tdClasses}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold text-slate-600 w-9 text-right">
                                                    {(row.sales_share || 0).toFixed(1)}%
                                                </span>
                                                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, row.sales_share || 0)}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`${tdClasses} text-right font-mono text-[11px] text-slate-500`}>
                                            {fmt(row.sum_spend)}
                                        </td>
                                        <td className={`${tdClasses} text-right text-[11px] font-bold text-slate-500`}>
                                            {(row.spend_share || 0).toFixed(1)}%
                                        </td>
                                        <td className={`${tdClasses} text-center`}>
                                            <button
                                                onClick={() => { if (!isReadOnly) onUpdate({ brand: row.brand, private_brand: row.private_brand === 1 ? 0 : 1 }) }}
                                                disabled={isUpdating || isReadOnly}
                                                title={isReadOnly ? 'Locked' : (row.private_brand === 1 ? 'Mark as Non-Private' : 'Mark as Private Brand')}
                                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[8px] font-extrabold transition-all duration-200 ${(isUpdating || isReadOnly) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${row.private_brand === 1 ? 'bg-rose-100 text-rose-700 shadow-sm border border-rose-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                            >PB</button>
                                        </td>
                                        <td className={`${tdClasses} text-center`}>
                                            <button
                                                onClick={() => { if (!isReadOnly) onUpdate({ brand: row.brand, mapping_issue: row.mapping_issue === 1 ? 0 : 1 }) }}
                                                disabled={isUpdating || isReadOnly}
                                                title={isReadOnly ? 'Locked' : (row.mapping_issue === 1 ? 'Mark as No Mapping Issue' : 'Mark as Mapping Issue')}
                                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[8px] font-extrabold transition-all duration-200 ${(isUpdating || isReadOnly) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${row.mapping_issue === 1 ? 'bg-amber-100 text-amber-700 shadow-sm border border-amber-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                            >MI</button>
                                        </td>
                                        <td className={`${tdClasses} text-center`}>
                                            {isEditing ? (
                                                <div className="flex items-center justify-center gap-1">
                                                    <input
                                                        type="number"
                                                        className="w-11 h-6 border-[1.5px] border-indigo-500 rounded outline-none px-1 text-[11px] font-bold"
                                                        value={editGroupValue}
                                                        onChange={e => setEditGroupValue(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleGroupSave(row.brand)}
                                                        disabled={isUpdating || isReadOnly}
                                                        className={`p-0.5 text-emerald-600 hover:text-emerald-700 transition-colors ${(isUpdating || isReadOnly) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    >
                                                        {isUpdating ? <div className="w-3 h-3 border border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                                                    </button>
                                                    <button onClick={() => setEditingBrand(null)} className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {row.combine_flag ? (
                                                        <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-extrabold shadow-sm">{row.combine_flag}</span>
                                                    ) : (
                                                        <span className="text-slate-300 text-[11px]">—</span>
                                                    )}
                                                    {!isReadOnly && (
                                                        <button
                                                            onClick={() => { setEditingBrand(row.brand); setEditGroupValue(row.combine_flag || ''); }}
                                                            className="p-0.5 text-slate-300 hover:text-indigo-500 transition-colors focus:outline-none"
                                                            title="Edit group"
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className={`${tdClasses} text-center`}>
                                            <button
                                                onClick={() => { if (!isReadOnly) handleExcludeToggle(row) }}
                                                disabled={isUpdating || isReadOnly}
                                                title={isReadOnly ? 'Locked' : (isExcluded ? 'Click to Keep' : 'Click to Exclude')}
                                                className={`px-3 py-1 rounded text-[9px] font-extrabold uppercase tracking-widest transition-all duration-200 ${(isUpdating || isReadOnly) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm hover:-translate-y-[1px]'} ${isExcluded ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}
                                            >
                                                {isUpdating ? '...' : (isExcluded ? 'Exclude' : 'Keep')}
                                            </button>
                                        </td>
                                        <td className={`${tdClasses} max-w-0`}>
                                            <span className="block text-[10px] text-slate-500 italic truncate" title={row.reason_issue_type}>
                                                {row.reason_issue_type || 'No specific issues.'}
                                            </span>
                                        </td>
                                    </motion.tr>
                                );
                            }) : (
                                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <td colSpan="10" className="py-16 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                            <p className="font-bold text-slate-800 m-0">No brands match your filters</p>
                                            <p className="text-xs m-0">Try adjusting your search or filter selection</p>
                                        </div>
                                    </td>
                                </motion.tr>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                    <span className="text-[11px] font-semibold text-slate-500">
                        Page <strong className="text-indigo-600">{currentPage}</strong> of {totalPages}
                        <span className="mx-2 text-slate-300">•</span>
                        {sortedRows.length} results
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`p-1.5 rounded-md border text-slate-500 transition-colors ${currentPage === 1 ? 'border-slate-200 bg-slate-100/50 opacity-50 cursor-not-allowed' : 'border-slate-200 bg-white hover:bg-slate-100 cursor-pointer'}`}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                        </button>
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            let p = totalPages <= 5 ? i + 1
                                : currentPage <= 3 ? i + 1
                                    : currentPage >= totalPages - 2 ? totalPages - 4 + i
                                        : currentPage - 2 + i;
                            return (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-8 h-8 rounded-md border text-[11px] font-extrabold transition-all cursor-pointer ${currentPage === p ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`p-1.5 rounded-md border text-slate-500 transition-colors ${currentPage === totalPages ? 'border-slate-200 bg-slate-100/50 opacity-50 cursor-not-allowed' : 'border-slate-200 bg-white hover:bg-slate-100 cursor-pointer'}`}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrandExclusionTable;
