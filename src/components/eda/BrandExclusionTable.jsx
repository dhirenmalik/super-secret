import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrencyMillions } from '../../utils/formatters';
import MultiSelect from '../MultiSelect';
import NumberRangeFilter from '../NumberRangeFilter';

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

    // Toggle exclude/keep via clicking Result badge
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
        if (sortConfig.key !== col) return <span style={{ color: '#cbd5e1', fontSize: 9, marginLeft: 2 }}>⇅</span>;
        return <span style={{ color: '#2563eb', fontSize: 9, marginLeft: 2 }}>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>;
    };

    const fmt = (val) => formatCurrencyMillions(val);

    if (!data || !data.rows) return null;

    const thBase = {
        padding: '7px 10px',
        fontSize: 10,
        fontWeight: 700,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
        background: '#f8fafc',
        borderBottom: '2px solid #e2e8f0',
        cursor: 'pointer',
        userSelect: 'none',
    };

    const td = {
        padding: '6px 10px',
        fontSize: 12,
        borderBottom: '1px solid #f1f5f9',
        verticalAlign: 'middle',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: isFullScreen ? '100%' : 'auto' }}>
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: isFullScreen ? '100%' : 520, minHeight: 350 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: '155px' }} />{/* Brand */}
                        <col style={{ width: '105px' }} />{/* Sales */}
                        <col style={{ width: '120px' }} />{/* Sales % */}
                        <col style={{ width: '90px' }} />{/* Spend */}
                        <col style={{ width: '75px' }} />{/* Spend % */}
                        <col style={{ width: '48px' }} />{/* PB */}
                        <col style={{ width: '48px' }} />{/* MI */}
                        <col style={{ width: '100px' }} />{/* Group */}
                        <col style={{ width: '85px' }} />{/* Result (clickable) */}
                        <col style={{ minWidth: '130px' }} />{/* Reason */}
                    </colgroup>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr>
                            <th style={thBase} onClick={() => requestSort('brand')}>Brand <SortIcon col="brand" /></th>
                            <th style={{ ...thBase, textAlign: 'right' }} onClick={() => requestSort('sum_sales')}>Sales <SortIcon col="sum_sales" /></th>
                            <th style={thBase} onClick={() => requestSort('sales_share')}>Sales % <SortIcon col="sales_share" /></th>
                            <th style={{ ...thBase, textAlign: 'right' }} onClick={() => requestSort('sum_spend')}>Spend <SortIcon col="sum_spend" /></th>
                            <th style={{ ...thBase, textAlign: 'right' }} onClick={() => requestSort('spend_share')}>Spend % <SortIcon col="spend_share" /></th>
                            <th style={{ ...thBase, textAlign: 'center' }} onClick={() => requestSort('private_brand')}>PB <SortIcon col="private_brand" /></th>
                            <th style={{ ...thBase, textAlign: 'center' }} onClick={() => requestSort('mapping_issue')}>MI <SortIcon col="mapping_issue" /></th>
                            <th style={{ ...thBase, textAlign: 'center' }} onClick={() => requestSort('combine_flag')}>Group <SortIcon col="combine_flag" /></th>
                            <th style={{ ...thBase, textAlign: 'center', cursor: 'default' }}>Result <span style={{ color: '#94a3b8', fontSize: 8, fontWeight: 400 }}>click to toggle</span></th>
                            <th style={{ ...thBase, cursor: 'default' }}>Reason / Match</th>
                        </tr>
                        {filters && (
                            <tr>
                                <th style={{ padding: '0 4px 4px 4px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', verticalAlign: 'top' }}>
                                    <MultiSelect label="Brand" options={filterOptions?.brands || []} selectedValues={filters.brands} onChange={v => setFilters({ ...filters, brands: v })} />
                                </th>
                                <th style={{ padding: '0 4px 4px 4px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', verticalAlign: 'top' }}>
                                    <NumberRangeFilter label="Sales" value={filters.sales} onChange={v => setFilters({ ...filters, sales: v })} align="left" />
                                </th>
                                <th style={{ padding: '0 4px 4px 4px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', verticalAlign: 'top' }}>
                                    <NumberRangeFilter label="Sales %" value={filters.salesShare} onChange={v => setFilters({ ...filters, salesShare: v })} align="left" />
                                </th>
                                <th style={{ padding: '0 4px 4px 4px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', verticalAlign: 'top' }}>
                                    <NumberRangeFilter label="Spend" value={filters.spend} onChange={v => setFilters({ ...filters, spend: v })} align="right" />
                                </th>
                                <th style={{ padding: '0 4px 4px 4px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', verticalAlign: 'top' }}>
                                    <NumberRangeFilter label="Spend %" value={filters.spendShare} onChange={v => setFilters({ ...filters, spendShare: v })} align="right" />
                                </th>
                                <th style={{ padding: '0 4px 4px 4px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', verticalAlign: 'top' }}>
                                    <MultiSelect label="PB" options={[{ label: 'Yes', value: 1 }, { label: 'No', value: 0 }]} selectedValues={filters.pb} onChange={v => setFilters({ ...filters, pb: v })} align="right" />
                                </th>
                                <th style={{ padding: '0 4px 4px 4px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', verticalAlign: 'top' }}>
                                    <MultiSelect label="MI" options={[{ label: 'Yes', value: 1 }, { label: 'No', value: 0 }]} selectedValues={filters.mi} onChange={v => setFilters({ ...filters, mi: v })} align="right" />
                                </th>
                                <th style={{ padding: '0 4px 4px 4px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', verticalAlign: 'top' }}>
                                    <MultiSelect label="Group" options={filterOptions?.groups || []} selectedValues={filters.groups} onChange={v => setFilters({ ...filters, groups: v })} align="right" />
                                </th>
                                <th style={{ padding: '0 4px 4px 4px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', verticalAlign: 'top' }}>
                                    <MultiSelect label="Status" options={[{ label: 'Excluded', value: 1 }, { label: 'Included', value: 0 }]} selectedValues={filters.status} onChange={v => setFilters({ ...filters, status: v })} align="right" />
                                </th>
                                <th style={{ padding: '0 4px 4px 4px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}></th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {paginatedRows.length > 0 ? paginatedRows.map((row, i) => {
                            const isUpdating = updatingBrand === row.brand;
                            const isEditing = editingBrand === row.brand;
                            const isExcluded = row.exclude_flag === 1;

                            return (
                                <tr
                                    key={i}
                                    style={{ background: isExcluded ? '#fff8f8' : 'white', transition: 'background 0.12s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = isExcluded ? '#fff0f0' : '#f8faff'}
                                    onMouseLeave={e => e.currentTarget.style.background = isExcluded ? '#fff8f8' : 'white'}
                                >
                                    {/* Brand */}
                                    <td style={{ ...td, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.brand}>
                                        {row.brand}
                                    </td>

                                    {/* Sales */}
                                    <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                                        {fmt(row.sum_sales)}
                                    </td>

                                    {/* Sales Share bar */}
                                    <td style={td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', width: 34, textAlign: 'right' }}>
                                                {(row.sales_share || 0).toFixed(1)}%
                                            </span>
                                            <div style={{ flex: 1, height: 4, background: '#e2e8f0', borderRadius: 3 }}>
                                                <div style={{ height: '100%', width: `${Math.min(100, row.sales_share || 0)}%`, background: '#3b82f6', borderRadius: 3 }} />
                                            </div>
                                        </div>
                                    </td>

                                    {/* Spend */}
                                    <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace', color: '#64748b', fontSize: 11 }}>
                                        {fmt(row.sum_spend)}
                                    </td>

                                    {/* Spend % */}
                                    <td style={{ ...td, textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                                        {(row.spend_share || 0).toFixed(1)}%
                                    </td>

                                    {/* PB — clickable toggle */}
                                    <td style={{ ...td, textAlign: 'center' }}>
                                        <button
                                            onClick={() => { if (!isReadOnly) onUpdate({ brand: row.brand, private_brand: row.private_brand === 1 ? 0 : 1 }) }}
                                            disabled={isUpdating || isReadOnly}
                                            title={isReadOnly ? 'Locked' : (row.private_brand === 1 ? 'Mark as Non-Private' : 'Mark as Private Brand')}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                width: 24, height: 24, borderRadius: '50%', border: 'none',
                                                background: row.private_brand === 1 ? '#fee2e2' : '#f1f5f9',
                                                color: row.private_brand === 1 ? '#b91c1c' : '#94a3b8',
                                                fontSize: 8, fontWeight: 800, cursor: isUpdating ? 'wait' : isReadOnly ? 'not-allowed' : 'pointer',
                                                transition: 'opacity 0.15s',
                                                opacity: (isUpdating || isReadOnly) ? 0.5 : 1,
                                            }}
                                        >PB</button>
                                    </td>

                                    {/* MI — clickable toggle */}
                                    <td style={{ ...td, textAlign: 'center' }}>
                                        <button
                                            onClick={() => { if (!isReadOnly) onUpdate({ brand: row.brand, mapping_issue: row.mapping_issue === 1 ? 0 : 1 }) }}
                                            disabled={isUpdating || isReadOnly}
                                            title={isReadOnly ? 'Locked' : (row.mapping_issue === 1 ? 'Mark as No Mapping Issue' : 'Mark as Mapping Issue')}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                width: 24, height: 24, borderRadius: '50%', border: 'none',
                                                background: row.mapping_issue === 1 ? '#fef9c3' : '#f1f5f9',
                                                color: row.mapping_issue === 1 ? '#854d0e' : '#94a3b8',
                                                fontSize: 8, fontWeight: 800, cursor: isUpdating ? 'wait' : isReadOnly ? 'not-allowed' : 'pointer',
                                                transition: 'opacity 0.15s',
                                                opacity: (isUpdating || isReadOnly) ? 0.5 : 1,
                                            }}
                                        >MI</button>
                                    </td>

                                    {/* Group — edit pencil on row hover, no G prefix */}
                                    <td style={{ ...td, textAlign: 'center' }}>
                                        {isEditing ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                                                <input
                                                    type="number"
                                                    style={{ width: 44, height: 22, border: '1.5px solid #3b82f6', borderRadius: 4, padding: '0 4px', fontSize: 11, fontWeight: 700, outline: 'none' }}
                                                    value={editGroupValue}
                                                    onChange={e => setEditGroupValue(e.target.value)}
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleGroupSave(row.brand)}
                                                    disabled={isUpdating || isReadOnly}
                                                    style={{ background: 'none', border: 'none', cursor: (isUpdating || isReadOnly) ? 'not-allowed' : 'pointer', color: '#16a34a', padding: 2, opacity: (isUpdating || isReadOnly) ? 0.5 : 1, lineHeight: 0 }}
                                                >
                                                    {isUpdating
                                                        ? <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                    }
                                                </button>
                                                <button
                                                    onClick={() => setEditingBrand(null)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, lineHeight: 0 }}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                                                {row.combine_flag ? (
                                                    <span style={{
                                                        padding: '2px 8px', background: '#2563eb', color: '#fff',
                                                        borderRadius: 20, fontSize: 10, fontWeight: 800
                                                    }}>{row.combine_flag}</span>
                                                ) : (
                                                    <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>
                                                )}
                                                {!isReadOnly && (
                                                    <button
                                                        onClick={() => { setEditingBrand(row.brand); setEditGroupValue(row.combine_flag || ''); }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 1, lineHeight: 0 }}
                                                        title="Edit group"
                                                    >
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    {/* Result — CLICKABLE BADGE (replaces separate Action column) */}
                                    <td style={{ ...td, textAlign: 'center' }}>
                                        <button
                                            onClick={() => { if (!isReadOnly) handleExcludeToggle(row) }}
                                            disabled={isUpdating || isReadOnly}
                                            title={isReadOnly ? 'Locked' : (isExcluded ? 'Click to Keep' : 'Click to Exclude')}
                                            style={{
                                                padding: '3px 10px',
                                                borderRadius: 4,
                                                fontSize: 9,
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.06em',
                                                border: 'none',
                                                background: isExcluded ? '#fee2e2' : '#dcfce3',
                                                color: isExcluded ? '#b91c1c' : '#166534',
                                                cursor: isUpdating ? 'wait' : isReadOnly ? 'not-allowed' : 'pointer',
                                                transition: 'opacity 0.15s',
                                                opacity: (isUpdating || isReadOnly) ? 0.6 : 1,
                                            }}
                                        >
                                            {isExcluded ? 'Exclude' : 'Keep'}
                                        </button>
                                    </td>

                                    {/* Reason */}
                                    <td style={{ ...td, maxWidth: 0, overflow: 'hidden' }}>
                                        <span
                                            style={{ display: 'block', fontSize: 10, color: '#94a3b8', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                            title={row.reason_issue_type}
                                        >
                                            {row.reason_issue_type || 'No specific issues.'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="10" style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                        <p style={{ fontWeight: 700, margin: 0, fontSize: 14 }}>No brands match your filters</p>
                                        <p style={{ fontSize: 12, margin: 0 }}>Try adjusting your search or filter selection</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 14px', borderTop: '1px solid #f1f5f9', background: '#fafafa'
                }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
                        Page <strong style={{ color: '#2563eb' }}>{currentPage}</strong> of {totalPages}
                        &nbsp;·&nbsp; {sortedRows.length} results
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{ padding: '4px 7px', borderRadius: 5, border: '1px solid #e2e8f0', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.35 : 1, lineHeight: 0 }}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                        </button>
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            let p = totalPages <= 5 ? i + 1
                                : currentPage <= 3 ? i + 1
                                    : currentPage >= totalPages - 2 ? totalPages - 4 + i
                                        : currentPage - 2 + i;
                            return (
                                <button key={p} onClick={() => setCurrentPage(p)} style={{
                                    width: 28, height: 28, borderRadius: 5, border: '1px solid',
                                    borderColor: currentPage === p ? '#2563eb' : '#e2e8f0',
                                    background: currentPage === p ? '#2563eb' : 'white',
                                    color: currentPage === p ? 'white' : '#64748b',
                                    fontSize: 11, fontWeight: 700, cursor: 'pointer'
                                }}>{p}</button>
                            );
                        })}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{ padding: '4px 7px', borderRadius: 5, border: '1px solid #e2e8f0', background: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.35 : 1, lineHeight: 0 }}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrandExclusionTable;
