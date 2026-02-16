import React from 'react';

const SummaryTable = ({ title, columns, rows }) => (
    <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ background: '#004f91', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: '800', textAlign: 'center' }}>{title}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}></th>
                    {columns.map((col, i) => <th key={i} style={{ padding: '8px', textAlign: 'right' }}>{col}</th>)}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', color: '#475569', fontWeight: '600' }}>{row.label}</td>
                        {row.values.map((val, j) => (
                            <td key={j} style={{ padding: '8px', textAlign: 'right', fontWeight: '700' }}>{val}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default function ReportsSummaryTables() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
                <SummaryTable
                    title="Writing"
                    columns={["Aug'23 - Jul'24", "Aug'24 - Jul'25"]}
                    rows={[
                        { label: 'WMC Incremental % for Advertisers Only', values: ['6.5%', '5.8%'] },
                        { label: 'WMC Incremental % (Including Pvt Labels)', values: ['6.5%', '5.8%'] },
                        { label: 'WMC Incremental % (Including Everything)', values: ['6.0%', '5.3%'] },
                        { label: 'iROAS', values: ['$ 3.6', '$ 3.4'] }
                    ]}
                />
                <SummaryTable
                    title="Sales"
                    columns={["Aug'23 - Jul'24", "Aug'24 - Jul'25"]}
                    rows={[
                        { label: 'WMC Sales Advertisers Only', values: ['$ 584,361,353', '$ 466,280,719'] },
                        { label: 'WMC Sales Including Private Labels', values: ['$ 584,366,821', '$ 466,285,054'] },
                        { label: 'WMS Sales Including Everything', values: ['$ 626,481,905', '$ 513,032,685'] }
                    ]}
                />
            </div>
            <div style={{ width: '50%' }}>
                <SummaryTable
                    title="Actual Incremental ($)"
                    columns={["Aug'23 - Jul'24", "Aug'24 - Jul'25"]}
                    rows={[
                        { label: 'WMC Incremental $ for Advertisers Only', values: ['$ 37,764,134', '$ 27,005,333'] },
                        { label: 'Spends', values: ['$ 10,462,279', '$ 7,932,916'] }
                    ]}
                />
            </div>
        </div>
    );
}
