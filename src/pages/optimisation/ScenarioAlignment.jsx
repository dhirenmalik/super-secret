import React from 'react';
import BasePage from '../model-building/BasePage';

const scenarioData = [
    { name: 'M_SP_AB_SPEND', og: 10.3, s1x: 12.9, s11x: 13.7, s12x: 13.9, s13x: 14.5, s15x: 15.1, iroasOg: 2.2, iroas1x: 2.3 },
    { name: 'M_SP_KWB_SPEND', og: 6.8, s1x: 11.0, s11x: 12.1, s12x: 13.7, s13x: 13.9, s15x: 14.2, iroasOg: 2.0, iroas1x: 3.2 },
    { name: 'M_SBA_SPEND', og: 3.8, s1x: 3.2, s11x: 3.0, s12x: 2.8, s13x: 2.7, s15x: 2.6, iroasOg: 1.9, iroas1x: 1.8 },
    { name: 'M_SV_SPEND', og: 0.2, s1x: 0.2, s11x: 0.2, s12x: 0.2, s13x: 0.2, s15x: 0.2, iroasOg: 3.5, iroas1x: 3.5 },
    { separator: 'Onsite Total' },
    { name: 'M_ON_DIS_AT_SUM_SPEND', og: 14.2, s1x: 14.0, s11x: 13.8, s12x: 13.6, s13x: 13.5, s15x: 13.4, iroasOg: 3.7, iroas1x: 3.8 },
    { name: 'M_ON_DIS_CT_SUM_SPEND', og: 9.4, s1x: 7.1, s11x: 6.9, s12x: 6.7, s13x: 6.6, s15x: 6.5, iroasOg: 2.7, iroas1x: 3.0 },
    { name: 'M_ON_DIS_CATTO_SUM_SPEND', og: 1.3, s1x: 1.3, s11x: 2.7, s12x: 3.0, s13x: 3.0, s15x: 3.0, iroasOg: 1.9, iroas1x: 1.8 },
    { name: 'M_ON_DIS_KW_SUM_SPEND', og: 5.2, s1x: 7.3, s11x: 7.7, s12x: 7.9, s13x: 8.0, s15x: 8.0, iroasOg: 3.6, iroas1x: 4.0 },
    { name: 'M_ON_DIS_HPLO_SUM_SPEND', og: 3.4, s1x: 3.4, s11x: 1.9, s12x: 1.3, s13x: 1.2, s15x: 1.1, iroasOg: 3.0, iroas1x: 1.9 },
    { name: 'M_ON_DIS_APP_HPLO_SUM_SPEND', og: 4.0, s1x: 2.0, s11x: 1.8, s12x: 1.6, s13x: 1.5, s15x: 1.4, iroasOg: 3.9, iroas1x: 7.0 },
    { name: 'M_ON_DIS_HPGTO_SUM_SPEND', og: 2.5, s1x: 1.9, s11x: 1.4, s12x: 1.2, s13x: 1.2, s15x: 1.1, iroasOg: 2.1, iroas1x: 2.5 },
    { separator: 'Offsite Total' },
    { name: 'M_OFF_DIS_FB_SUM_SPEND', og: 0.5, s1x: 0.5, s11x: 0.2, s12x: 0.2, s13x: 0.2, s15x: 0.2, iroasOg: 1.0, iroas1x: 1.0 },
    { name: 'M_OFF_DIS_DSP_CTV_SUM_SPEND', og: 23.3, s1x: 23.3, s11x: 23.1, s12x: 22.9, s13x: 22.7, s15x: 22.6, iroasOg: 4.0, iroas1x: 4.0 },
    { name: 'M_OFF_DIS_WN_WITHOUTCTV_SUM_SPEND', og: 10.6, s1x: 9.4, s11x: 9.1, s12x: 8.7, s13x: 8.6, s15x: 8.5, iroasOg: 3.6, iroas1x: 3.8 },
    { name: 'M_INSTORE_TV_WALL_SUM_SPEND', og: 4.7, s1x: 2.5, s11x: 2.4, s12x: 2.3, s13x: 2.2, s15x: 2.1, iroasOg: 0.9, iroas1x: 1.8 }
];

const categorySummary = [
    { label: 'Search Total', og: 21.0, s1x: 27.3, s11x: 29.0, s12x: 30.6, s13x: 31.3, s15x: 32.1 },
    { label: 'Onsite Total', og: 39.9, s1x: 37.0, s11x: 36.2, s12x: 35.3, s13x: 35.0, s15x: 34.5 },
    { label: 'Offsite Total', og: 34.4, s1x: 33.2, s11x: 32.4, s12x: 31.8, s13x: 31.5, s15x: 31.3 },
    { label: 'TV Wall', og: 4.7, s1x: 2.5, s11x: 2.4, s12x: 2.3, s13x: 2.2, s15x: 2.1 }
];

export default function ScenarioAlignment() {
    const getHeatmapColor = (val, ogVal) => {
        if (!ogVal) return 'transparent';
        const diff = val - ogVal;
        if (diff > 2) return '#dcfce7'; // Light green
        if (diff > 0.5) return '#f0fdf4'; // Very light green
        if (diff < -2) return '#fee2e2'; // Light red
        if (diff < -0.5) return '#fff1f1'; // Very light red
        return 'transparent';
    };

    const getIRoasColor = (val) => {
        if (val >= 3.5) return '#dcfce7';
        if (val >= 2.5) return '#fef9c3';
        return '#fee2e2';
    };

    return (
        <BasePage stepId={25} hideTasks={true}>
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon green">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        </div>
                        Scenario Comparison Matrix
                    </div>
                </div>
                <div className="table-container" style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th rowSpan="2" style={{ textAlign: 'left', padding: '12px', border: '1px solid #e2e8f0' }}>Variable</th>
                                <th colSpan="6" style={{ textAlign: 'center', padding: '8px', border: '1px solid #e2e8f0' }}>Spend Share</th>
                                <th colSpan="2" style={{ textAlign: 'center', padding: '8px', border: '1px solid #e2e8f0' }}>iRoAS</th>
                            </tr>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ textAlign: 'right', padding: '8px', border: '1px solid #e2e8f0' }}>og</th>
                                <th style={{ textAlign: 'right', padding: '8px', border: '1px solid #e2e8f0' }}>1x</th>
                                <th style={{ textAlign: 'right', padding: '8px', border: '1px solid #e2e8f0' }}>1.1x</th>
                                <th style={{ textAlign: 'right', padding: '8px', border: '1px solid #e2e8f0' }}>1.2x</th>
                                <th style={{ textAlign: 'right', padding: '8px', border: '1px solid #e2e8f0' }}>1.3x</th>
                                <th style={{ textAlign: 'right', padding: '8px', border: '1px solid #e2e8f0' }}>1.5x</th>
                                <th style={{ textAlign: 'right', padding: '8px', border: '1px solid #e2e8f0' }}>Og</th>
                                <th style={{ textAlign: 'right', padding: '8px', border: '1px solid #e2e8f0' }}>1x</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scenarioData.map((row, i) => (
                                row.separator ? (
                                    <tr key={i} style={{ background: '#f1f5f9' }}>
                                        <td colSpan="9" style={{ padding: '8px 12px', fontWeight: '800', color: '#1e293b' }}>{row.separator}</td>
                                    </tr>
                                ) : (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '8px 12px', color: '#64748b', fontWeight: '500' }}>{row.name}</td>
                                        <td style={{ textAlign: 'right', padding: '8px', fontWeight: '700' }}>{row.og.toFixed(1)}</td>
                                        <td style={{ textAlign: 'right', padding: '8px', fontWeight: '700', background: getHeatmapColor(row.s1x, row.og) }}>{row.s1x.toFixed(1)}</td>
                                        <td style={{ textAlign: 'right', padding: '8px', fontWeight: '700', background: getHeatmapColor(row.s11x, row.og) }}>{row.s11x.toFixed(1)}</td>
                                        <td style={{ textAlign: 'right', padding: '8px', fontWeight: '700', background: getHeatmapColor(row.s12x, row.og) }}>{row.s12x.toFixed(1)}</td>
                                        <td style={{ textAlign: 'right', padding: '8px', fontWeight: '700', background: getHeatmapColor(row.s13x, row.og) }}>{row.s13x.toFixed(1)}</td>
                                        <td style={{ textAlign: 'right', padding: '8px', fontWeight: '700', background: getHeatmapColor(row.s15x, row.og) }}>{row.s15x.toFixed(1)}</td>
                                        <td style={{ textAlign: 'right', padding: '8px', fontWeight: '700' }}>${row.iroasOg.toFixed(1)}</td>
                                        <td style={{ textAlign: 'right', padding: '8px', fontWeight: '700', background: getIRoasColor(row.iroas1x) }}>${row.iroas1x.toFixed(1)}</td>
                                    </tr>
                                )
                            ))}
                            <tr style={{ background: '#f8fafc', fontWeight: '900' }}>
                                <td style={{ padding: '12px', borderTop: '2px solid #e2e8f0' }}>iRoAS Summary</td>
                                <td style={{ textAlign: 'right', padding: '12px', borderTop: '2px solid #e2e8f0' }}>$3.10</td>
                                <td style={{ textAlign: 'right', padding: '12px', borderTop: '2px solid #e2e8f0' }}>$3.36</td>
                                <td style={{ textAlign: 'right', padding: '12px', borderTop: '2px solid #e2e8f0' }}>$3.45</td>
                                <td style={{ textAlign: 'right', padding: '12px', borderTop: '2px solid #e2e8f0' }}>$3.50</td>
                                <td style={{ textAlign: 'right', padding: '12px', borderTop: '2px solid #e2e8f0' }}>$3.45</td>
                                <td style={{ textAlign: 'right', padding: '12px', borderTop: '2px solid #e2e8f0' }}>$3.30</td>
                                <td colSpan="2"></td>
                            </tr>
                            <tr style={{ background: '#f8fafc', fontWeight: '900' }}>
                                <td style={{ padding: '12px' }}>Lift %</td>
                                <td></td>
                                <td style={{ textAlign: 'right', padding: '12px', color: '#16a34a' }}>9%</td>
                                <td style={{ textAlign: 'right', padding: '12px', color: '#16a34a' }}>11%</td>
                                <td style={{ textAlign: 'right', padding: '12px', color: '#16a34a' }}>13%</td>
                                <td style={{ textAlign: 'right', padding: '12px', color: '#16a34a' }}>11%</td>
                                <td style={{ textAlign: 'right', padding: '12px', color: '#16a34a' }}>7%</td>
                                <td colSpan="2"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card" style={{ marginTop: '24px' }}>
                <div className="card-header">
                    <div className="card-title">
                        Category Spend Share Summary
                    </div>
                </div>
                <div className="table-container">
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Category</th>
                                <th style={{ textAlign: 'right', padding: '12px' }}>og</th>
                                <th style={{ textAlign: 'right', padding: '12px' }}>1x</th>
                                <th style={{ textAlign: 'right', padding: '12px' }}>1.1x</th>
                                <th style={{ textAlign: 'right', padding: '12px' }}>1.2x</th>
                                <th style={{ textAlign: 'right', padding: '12px' }}>1.3x</th>
                                <th style={{ textAlign: 'right', padding: '12px' }}>1.5x</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categorySummary.map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px 12px', fontWeight: '700' }}>{row.label}</td>
                                    <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '700' }}>{row.og.toFixed(1)}</td>
                                    <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '700', background: getHeatmapColor(row.s1x, row.og) }}>{row.s1x.toFixed(1)}</td>
                                    <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '700', background: getHeatmapColor(row.s11x, row.og) }}>{row.s11x.toFixed(1)}</td>
                                    <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '700', background: getHeatmapColor(row.s12x, row.og) }}>{row.s12x.toFixed(1)}</td>
                                    <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '700', background: getHeatmapColor(row.s13x, row.og) }}>{row.s13x.toFixed(1)}</td>
                                    <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '700', background: getHeatmapColor(row.s15x, row.og) }}>{row.s15x.toFixed(1)}</td>
                                </tr>
                            ))}
                            <tr style={{ background: '#f8fafc', fontWeight: '900' }}>
                                <td style={{ padding: '12px', borderTop: '2px solid #e2e8f0' }}>TOTAL</td>
                                <td style={{ textAlign: 'right', padding: '12px', borderTop: '2px solid #e2e8f0' }}>100.0</td>
                                <td style={{ textAlign: 'right', padding: '12px', borderTop: '2px solid #e2e8f0' }}>100.0</td>
                                <td style={{ textAlign: 'right', padding: '12px', borderTop: '2px solid #e2e8f0' }}>100.0</td>
                                <td style={{ textAlign: 'right', padding: '12px', borderTop: '2px solid #e2e8f0' }}>100.0</td>
                                <td style={{ textAlign: 'right', padding: '12px', borderTop: '2px solid #e2e8f0' }}>100.0</td>
                                <td style={{ textAlign: 'right', padding: '12px', borderTop: '2px solid #e2e8f0' }}>100.0</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn btn-secondary">Download Selection CSV</button>
                <button className="btn btn-primary">Proceed to Final Review</button>
            </div>
        </BasePage>
    );
}
