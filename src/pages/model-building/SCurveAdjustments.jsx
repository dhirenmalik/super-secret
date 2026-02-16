import React from 'react';
import BasePage from './BasePage';
import ResponseCurveChart from '../../components/charts/ResponseCurveChart';
import MediaTimeSeriesWithBounds from '../../components/charts/MediaTimeSeriesWithBounds';

export default function SCurveAdjustments() {
    const tactics = [
        {
            name: 'M_OFF_DIS_WN_WITHOUTCTV_IMP',
            displayName: 'Offsite WN - Display & Preroll',
            timeSeries: { base: 200000, noise: 400000, spikes: [{ start: 40, end: 45, magnitude: 4000000 }] },
            bounds: { thres: 500000, sat: 3000000, inf: 1800000 },
            curve: { alpha: 3.5, gamma: 500000, maxVal: 5000000, maxVC: 400000000, metrics: { thres: [500000, 50000000], inf: [1800000, 180000000], avg: [1200000, 120000000], sat: [3000000, 320000000] } }
        },
        {
            name: 'M_OFF_DIS_DSP_CTV_IMP',
            displayName: 'Offsite Display Walmart DSP CTV',
            timeSeries: { base: 100000, noise: 200000, spikes: [{ start: 80, end: 85, magnitude: 2000000 }] },
            bounds: { thres: 300000, sat: 1500000, inf: 800000 },
            curve: { alpha: 4.2, gamma: 300000, maxVal: 2000000, maxVC: 200000000, metrics: { thres: [300000, 30000000], inf: [800000, 80000000], avg: [600000, 60000000], sat: [1500000, 160000000] } }
        },
        {
            name: 'M_SP_AB_CLK',
            displayName: 'Sponsored Products - Automated Bidding',
            timeSeries: { base: 50000, noise: 100000, spikes: [{ start: 20, end: 30, magnitude: 500000 }] },
            bounds: { thres: 100000, sat: 600000, inf: 300000 },
            curve: { alpha: 2.8, gamma: 200000, maxVal: 1000000, maxVC: 100000000, metrics: { thres: [100000, 10000000], inf: [300000, 30000000], avg: [250000, 25000000], sat: [600000, 70000000] } }
        }
    ];

    return (
        <BasePage stepId={18} hideTasks={true}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {tactics.map((tactic, idx) => (
                    <div key={idx} className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <div className="card-title-icon blue">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                                </div>
                                {tactic.displayName} <span style={{ fontSize: '11px', color: 'var(--color-text-light)', marginLeft: '8px' }}>({tactic.name})</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                            <div style={{ borderRight: '1px solid var(--color-border)', paddingRight: '20px' }}>
                                <MediaTimeSeriesWithBounds
                                    title="Campaign Performance - Time Series"
                                    dataConfig={tactic.timeSeries}
                                    bounds={tactic.bounds}
                                />
                            </div>
                            <div>
                                <ResponseCurveChart
                                    title="Tuned Response Curve (S-Curve)"
                                    alpha={tactic.curve.alpha}
                                    gamma={tactic.curve.gamma}
                                    maxVal={tactic.curve.maxVal}
                                    maxVC={tactic.curve.maxVC}
                                    metrics={tactic.curve.metrics}
                                />
                            </div>
                        </div>

                        <div className="grid-2" style={{ background: 'var(--color-surface)', margin: '10px 20px 20px 20px', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                    <span>Alpha (Shape)</span>
                                    <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{tactic.curve.alpha}</span>
                                </label>
                                <input type="range" min="0" max="5" step="0.1" defaultValue={tactic.curve.alpha} style={{ width: '100%' }} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                    <span>Gamma (Scale)</span>
                                    <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{(tactic.curve.gamma / 1000).toFixed(0)}k</span>
                                </label>
                                <input type="range" min="0" max={tactic.curve.maxVal} step="10000" defaultValue={tactic.curve.gamma} style={{ width: '100%' }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn btn-secondary">Reset to Defaults</button>
                <button className="btn btn-primary">Apply All S-Curve Adjustments</button>
            </div>
        </BasePage>
    );
}
