import React, { useMemo } from 'react';
import { formatCurrencyMillions } from '../../utils/formatters';

const TopExcludedSheet = ({ data }) => {
    const excludedRows = useMemo(() => {
        if (!data || !data.rows) return [];
        return data.rows.filter(row => row.exclude_flag === 1);
    }, [data]);

    const topBySpend = useMemo(() => {
        return [...excludedRows].sort((a, b) => (b.sum_spend || 0) - (a.sum_spend || 0)).slice(0, 5);
    }, [excludedRows]);

    const topBySales = useMemo(() => {
        return [...excludedRows].sort((a, b) => (b.sum_sales || 0) - (a.sum_sales || 0)).slice(0, 5);
    }, [excludedRows]);

    const topMI = useMemo(() => {
        return excludedRows
            .filter(r => r.mapping_issue === 1)
            .sort((a, b) => (b.sum_sales || 0) - (a.sum_sales || 0))
            .slice(0, 5);
    }, [excludedRows]);

    const topPB = useMemo(() => {
        return excludedRows
            .filter(r => r.private_brand === 1)
            .sort((a, b) => (b.sum_sales || 0) - (a.sum_sales || 0))
            .slice(0, 5);
    }, [excludedRows]);

    const topCombines = useMemo(() => {
        const groups = {};
        excludedRows.forEach(row => {
            if (row.combine_flag) {
                if (!groups[row.combine_flag]) {
                    groups[row.combine_flag] = { brands: [], totalSales: 0, totalSpend: 0 };
                }
                groups[row.combine_flag].brands.push(row.brand);
                groups[row.combine_flag].totalSales += (row.sum_sales || 0);
                groups[row.combine_flag].totalSpend += (row.sum_spend || 0);
            }
        });

        return Object.values(groups)
            .filter(g => g.brands.length > 1) // Only show actual groups
            .sort((a, b) => b.totalSales - a.totalSales)
            .slice(0, 5);
    }, [excludedRows]);

    if (!data || !data.rows || excludedRows.length === 0) return null;

    const ListCard = ({ title, items, renderItem }) => (
        <div style={{ flex: 1, minWidth: 260, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#334155' }}>{title}</h4>
            </div>
            <div style={{ padding: '8px 0' }}>
                {items.length > 0 ? items.map((item, i) => (
                    <div key={i} style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        {renderItem(item)}
                    </div>
                )) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>None found</div>
                )}
            </div>
        </div>
    );

    return (
        <div style={{ width: '100%', marginBottom: 30 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16, paddingLeft: 4 }}>Top Excluded Brands Analysis</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>

                <ListCard
                    title="Top 5 by Spend"
                    items={topBySpend}
                    renderItem={(item) => (
                        <>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 140 }} title={item.brand}>{item.brand}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                                <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#059669', title: 'Sales' }}>Sale: {formatCurrencyMillions(item.sum_sales)}</span>
                                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#dc2626', title: 'Spend', fontWeight: 600 }}>Spnd: {formatCurrencyMillions(item.sum_spend)}</span>
                            </div>
                        </>
                    )}
                />

                <ListCard
                    title="Top 5 by Sales"
                    items={topBySales}
                    renderItem={(item) => (
                        <>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 140 }} title={item.brand}>{item.brand}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                                <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#059669', title: 'Sales', fontWeight: 600 }}>Sale: {formatCurrencyMillions(item.sum_sales)}</span>
                                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#dc2626', title: 'Spend' }}>Spnd: {formatCurrencyMillions(item.sum_spend)}</span>
                            </div>
                        </>
                    )}
                />

                <ListCard
                    title="Top 5 Mapping Issues (MI)"
                    items={topMI}
                    renderItem={(item) => (
                        <>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 140 }} title={item.brand}>{item.brand}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                                <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#059669', title: 'Sales' }}>Sale: {formatCurrencyMillions(item.sum_sales)}</span>
                                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#dc2626', title: 'Spend' }}>Spnd: {formatCurrencyMillions(item.sum_spend)}</span>
                            </div>
                        </>
                    )}
                />

                <ListCard
                    title="Top 5 Private Brands (PB)"
                    items={topPB}
                    renderItem={(item) => (
                        <>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 140 }} title={item.brand}>{item.brand}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                                <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#059669', title: 'Sales' }}>Sale: {formatCurrencyMillions(item.sum_sales)}</span>
                                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#dc2626', title: 'Spend' }}>Spnd: {formatCurrencyMillions(item.sum_spend)}</span>
                            </div>
                        </>
                    )}
                />

                <ListCard
                    title="Top 5 Excluded Grouped Pairs"
                    items={topCombines}
                    renderItem={(group) => (
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {group.brands.map((b, i) => (
                                    <span key={i} style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{b}</span>
                                ))}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'flex', justifyContent: 'flex-end', gap: 12, fontFamily: 'monospace' }}>
                                <span>Sales: <span style={{ color: '#059669', fontWeight: 600 }}>{formatCurrencyMillions(group.totalSales)}</span></span>
                                <span>Spend: <span style={{ color: '#dc2626', fontWeight: 600 }}>{formatCurrencyMillions(group.totalSpend)}</span></span>
                            </div>
                        </div>
                    )}
                />

            </div>
        </div>
    );
};

export default TopExcludedSheet;
