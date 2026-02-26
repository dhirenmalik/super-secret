import React from 'react';

const getHeatmapColor = (val, type) => {
    if (type === 'share') {
        if (val > 30) return '#22c55e'; // Deep green
        if (val > 15) return '#86efac'; // Light green
        if (val > 5) return '#fef08a';  // Yellow
        if (val > 1) return '#fed7aa';  // Orange
        return '#fca5a5';              // Red
    }
    if (type === 'iroas') {
        if (val > 5) return '#22c55e';
        if (val > 3.5) return '#86efac';
        if (val > 2.5) return '#fef08a';
        if (val > 1.5) return '#fed7aa';
        return '#fca5a5';
    }
    return 'transparent';
};

const data = [
    { name: 'Search Total', contri: 14.1, spend: 21.0, iroas: 2.3, eff: 2.7, isHeader: true },
    { name: 'Sponsored Products Automatic', contri: 7.2, spend: 10.3, iroas: 2.4, eff: 2.9 },
    { name: 'Sponsored Products Manual', contri: 4.4, spend: 6.8, iroas: 2.2, eff: 2.4 },
    { name: 'Sponsored Brands', contri: 2.3, spend: 3.8, iroas: 2.0, eff: 2.6 },
    { name: 'Sponsored Video', contri: 0.2, spend: 0.2, iroas: 3.8, eff: 3.4 },
    { name: 'Onsite Display Total', contri: 42.1, spend: 39.9, iroas: 3.6, eff: 28.9, isHeader: true },
    { name: 'Onsite Display Audience Targeting', contri: 17.1, spend: 14.2, iroas: 4.1, eff: 36.6 },
    { name: 'Onsite Display Contextual Targeting', contri: 8.1, spend: 9.4, iroas: 2.9, eff: 28.9 },
    { name: 'Onsite Display Category Takeover', contri: 0.8, spend: 1.3, iroas: 2.1, eff: 29.0 },
    { name: 'Onsite Display Keyword', contri: 6.1, spend: 5.2, iroas: 4.0, eff: 47.0 },
    { name: 'Onsite Display Run-of-site', contri: 0.0, spend: 0.0, iroas: 0.0, eff: 0.0 },
    { name: 'Onsite Display Total HPLO', contri: 8.3, spend: 7.3, iroas: 3.8, eff: 23.7 },
    { name: 'Onsite Display Homepage Gallery Takeover', contri: 1.7, spend: 2.5, iroas: 2.3, eff: 8.3 },
    { name: 'Offsite Display Total', contri: 42.4, spend: 34.4, iroas: 4.2, eff: 39.3, isHeader: true },
    { name: 'Offsite Display Facebook', contri: 0.2, spend: 0.5, iroas: 1.1, eff: 4.4 },
    { name: 'Offsite Enterprise Network - Preroll & Display', contri: 12.1, spend: 10.6, iroas: 3.9, eff: 14.5 },
    { name: 'Offsite Display Enterprise DSP CTV', contri: 30.1, spend: 23.3, iroas: 4.4, eff: 145.7 },
    { name: 'Instore TV Wall', contri: 1.4, spend: 4.7, iroas: 1.0, eff: 0.7, isHeader: true }
];

export default function DetailedTacticTable() {
    return (
        <div className="card" style={{ marginTop: '24px' }}>
            <div className="card-header" style={{ background: '#004f91', color: 'white', borderRadius: '8px 8px 0 0' }}>
                <div style={{ fontSize: '14px', fontWeight: '800' }}>Latest Year: Aug'24 - Jul'25</div>
            </div>
            <div className="table-container">
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ textAlign: 'left', padding: '12px' }}>Variables</th>
                            <th style={{ textAlign: 'right', padding: '12px' }}>Contribution share</th>
                            <th style={{ textAlign: 'right', padding: '12px' }}>Spends share</th>
                            <th style={{ textAlign: 'right', padding: '12px' }}>iRoAS</th>
                            <th style={{ textAlign: 'right', padding: '12px' }}>Effectiveness (iRPC/iRPM)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ background: '#f1f5f9', fontWeight: '900' }}>
                            <td style={{ padding: '12px' }}>Total incremental</td>
                            <td style={{ textAlign: 'right', padding: '12px' }}>5.3%</td>
                            <td style={{ textAlign: 'right', padding: '12px' }}>100.0%</td>
                            <td style={{ textAlign: 'right', padding: '12px' }}>$3.4</td>
                            <td style={{ textAlign: 'right', padding: '12px' }}>-</td>
                        </tr>
                        <tr style={{ background: '#f8fafc', fontWeight: '700' }}>
                            <td style={{ padding: '8px 12px', color: '#1e293b' }}>Base</td>
                            <td colSpan="4"></td>
                        </tr>
                        {data.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px 12px', paddingLeft: row.isHeader ? '12px' : '24px', fontWeight: row.isHeader ? '700' : '400', color: row.isHeader ? '#1e293b' : '#64748b' }}>
                                    {row.name}
                                </td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', background: getHeatmapColor(row.contri, 'share'), fontWeight: '700' }}>{row.contri}%</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', background: getHeatmapColor(row.spend, 'share'), fontWeight: '700' }}>{row.spend}%</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', background: getHeatmapColor(row.iroas, 'iroas'), fontWeight: '700' }}>${row.iroas}</td>
                                <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '700' }}>{row.eff > 0 ? row.eff.toFixed(1) : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
