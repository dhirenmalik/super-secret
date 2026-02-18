import React from 'react';
import BasePage from './BasePage';
import ActualVsPredictedChart from '../../components/charts/ActualVsPredictedChart';

const MediaValidationTable = ({ title, dateRange, totalInc, iroas, data }) => {
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

    return (
        <div style={{ minWidth: '400px', flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
            <div style={{ background: '#f8fafc', padding: '10px 15px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>{title}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>{dateRange}</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ textAlign: 'left', padding: '8px 12px', color: '#475569' }}>Variables</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px', color: '#475569' }}>Contri share</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px', color: '#475569' }}>Spends share</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px', color: '#475569' }}>iRoAS</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ background: '#f1f5f9', fontWeight: '800' }}>
                        <td style={{ padding: '8px 12px' }}>Total incremental</td>
                        <td style={{ textAlign: 'right', padding: '8px 12px' }}>{totalInc}%</td>
                        <td style={{ textAlign: 'right', padding: '8px 12px' }}>100%</td>
                        <td style={{ textAlign: 'right', padding: '8px 12px' }}>$ {iroas}</td>
                    </tr>
                    {data.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '6px 12px', color: row.isHeader ? '#1e293b' : '#64748b', fontWeight: row.isHeader ? '700' : '400', paddingLeft: row.isHeader ? '12px' : '20px' }}>
                                {row.name}
                            </td>
                            <td style={{ textAlign: 'right', padding: '6px 12px', background: getHeatmapColor(row.contri, 'share'), fontWeight: '600' }}>{row.contri}%</td>
                            <td style={{ textAlign: 'right', padding: '6px 12px', background: getHeatmapColor(row.spend, 'share'), fontWeight: '600' }}>{row.spend}%</td>
                            <td style={{ textAlign: 'right', padding: '6px 12px', background: getHeatmapColor(row.iroas, 'iroas'), fontWeight: '600' }}>$ {row.iroas}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default function ModelValidationMedia() {
    const metrics = [
        { label: 'MAPE', model: '10.548065', validation: '16.523957' },
        { label: 'R Square', model: '0.920278', validation: '0.718326' }
    ];

    const mediaData = [
        { name: 'Search Total', contri: 18.7, spend: 16.1, iroas: 4.11, isHeader: true },
        { name: 'Sponsored Products Automatic', contri: 8.1, spend: 7.1, iroas: 4.51 },
        { name: 'Sponsored Products Manual', contri: 6.5, spend: 5.2, iroas: 4.38 },
        { name: 'Onsite Display Total', contri: 42.6, spend: 50.9, iroas: 2.96, isHeader: true },
        { name: 'Onsite Display Audience Targeting', contri: 14.0, spend: 16.2, iroas: 3.06 },
        { name: 'Onsite Display Contextual Targeting', contri: 7.3, spend: 14.5, iroas: 1.78 },
        { name: 'Offsite Display Total', contri: 22.8, spend: 22.2, iroas: 3.64, isHeader: true },
        { name: 'Offsite Walmart Network', contri: 11.0, spend: 11.3, iroas: 3.44 },
        { name: 'Instore TV Wall', contri: 15.9, spend: 10.9, iroas: 5.14, isHeader: true }
    ];

    return (
        <BasePage stepId={21} hideTasks={true}>
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon green">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
                        </div>
                        Consolidated Model Performance
                    </div>
                </div>
                <div className="grid-2" style={{ padding: '0 10px' }}>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr style={{ backgroundColor: '#f4f7fb' }}>
                                    <th style={{ textAlign: 'left' }}>Metric</th>
                                    <th style={{ textAlign: 'right' }}>Model Fit</th>
                                    <th style={{ textAlign: 'right' }}>Validation Fit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.map((m, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: '700', fontSize: '13px' }}>{m.label}</td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--color-primary)', fontWeight: '600' }}>{m.model}</td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#16a34a', fontWeight: '600' }}>{m.validation}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                    <ActualVsPredictedChart height={350} />
                </div>
            </div>

            <div className="card" style={{ marginTop: '24px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon blue">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
                        </div>
                        Media Validation Decomposition
                    </div>
                </div>
                <div style={{ padding: '0 20px 20px 20px' }}>
                    <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '15px' }}>
                        <MediaValidationTable
                            title="Overall time"
                            dateRange="Dec '22 - Jul '25 (Adjusted)"
                            totalInc="5.4"
                            iroas="3.5"
                            data={mediaData}
                        />
                        <MediaValidationTable
                            title="Latest 12 months"
                            dateRange="Aug '24 - Jul '25 (Adjusted)"
                            totalInc="5.3"
                            iroas="3.4"
                            data={mediaData.map(d => ({ ...d, contri: (d.contri * 0.95).toFixed(1), iroas: (d.iroas * 0.92).toFixed(2) }))}
                        />
                        <MediaValidationTable
                            title="Previous 12 months"
                            dateRange="Aug '23 - Jul '24 (Adjusted)"
                            totalInc="6.9"
                            iroas="3.8"
                            data={mediaData.map(d => ({ ...d, contri: (d.contri * 1.1).toFixed(1), iroas: (d.iroas * 1.05).toFixed(2) }))}
                        />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn btn-secondary">Request Model Refresh</button>
                <button className="btn btn-primary">Approve Model & Finalize</button>
            </div>
        </BasePage>
    );
}
