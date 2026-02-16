import React from 'react';
import BasePage from '../model-building/BasePage';

const organic_bounds = {
    "M_SP_AB_SPEND": [2.2049, 2.205],
    "M_SP_KWB_SPEND": [3.1187, 3.1188],
    "M_SBA_SPEND": [1.0365, 1.0366],
    "M_SV_SPEND": [1.8084, 1.8085],
    "M_ON_DIS_AT_SUM_SPEND": [1.4181, 1.4182],
    "M_ON_DIS_CT_SUM_SPEND": [1.0382, 1.0383],
    "M_ON_DIS_CATTO_SUM_SPEND": [3.4253, 3.4254],
    "M_ON_DIS_KW_SUM_SPEND": [2.3152, 2.3153],
    "M_ON_DIS_HPLO_SUM_SPEND": [0.4872, 0.4873],
    "M_ON_DIS_APP_HPLO_SUM_SPEND": [0.5303, 0.5304],
    "M_ON_DIS_HPGTO_SUM_SPEND": [0.6652, 0.6653],
    "M_OFF_DIS_FB_SUM_SPEND": [0.6192, 0.6193],
    "M_OFF_DIS_DSP_CTV_SUM_SPEND": [1.4539, 1.454],
    "M_OFF_DIS_WN_WITHOUTCTV_SUM_SPEND": [1.2073, 1.2074],
    "M_INSTORE_TV_WALL_SUM_SPEND": [0.6678, 0.6679]
};

export default function InputPrepOptimisation() {
    return (
        <BasePage stepId={23} hideTasks={true}>
            <div className="grid-2">
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon green">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                            </div>
                            Scenario Configuration
                        </div>
                    </div>
                    <div className="form-group" style={{ padding: '0 10px' }}>
                        <label className="form-label" style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>Spend Multiplier Range</label>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginBottom: '4px' }}>Minimum</div>
                                <input className="form-input" type="number" defaultValue="1.0" step="0.1" />
                            </div>
                            <div style={{ alignSelf: 'center', marginTop: '15px', color: 'var(--color-text-light)' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginBottom: '4px' }}>Maximum</div>
                                <input className="form-input" type="number" defaultValue="1.75" step="0.1" />
                            </div>
                        </div>
                        <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--color-text-light)', background: 'var(--color-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            Adjust the spend multiplier range to run multiple optimization scenarios and identify the most efficient allocation.
                        </div>
                    </div>
                    <div style={{ padding: '20px', borderTop: '1px solid var(--color-border)', marginTop: '10px' }}>
                        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}><polygon points="5 3 19 12 5 21 5 3" /></svg>
                            Initialize Scenario Run
                        </button>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon blue">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                            </div>
                            Organic Variables: Spend Range
                        </div>
                    </div>
                    <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr style={{ backgroundColor: '#f4f7fb' }}>
                                    <th style={{ textAlign: 'left' }}>Variable</th>
                                    <th style={{ textAlign: 'right' }}>Min Spend</th>
                                    <th style={{ textAlign: 'right' }}>Max Spend</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(organic_bounds).map((key) => (
                                    <tr key={key}>
                                        <td style={{ fontSize: '11px', fontWeight: '600' }}>{key}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <code style={{
                                                background: 'rgba(0, 113, 220, 0.05)',
                                                color: 'var(--color-primary-dark)',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '11px'
                                            }}>
                                                {organic_bounds[key][0]}
                                            </code>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <code style={{
                                                background: 'rgba(22, 163, 74, 0.05)',
                                                color: '#16a34a',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '11px'
                                            }}>
                                                {organic_bounds[key][1]}
                                            </code>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </BasePage>
    );
}
