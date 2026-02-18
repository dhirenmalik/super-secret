import React from 'react';
import BasePage from './BasePage';
import ActualVsPredictedChart from '../../components/charts/ActualVsPredictedChart';

export default function ModelFitOverall() {
    const metrics = [
        { label: 'MAPE', model: '10.548065', validation: '16.523957' },
        { label: 'R Square', model: '0.920278', validation: '0.718326' }
    ];

    return (
        <BasePage stepId={20} hideTasks={true}>
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon green">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
                        </div>
                        Model Performance Metrics
                    </div>
                </div>
                <div className="table-container" style={{ padding: '10px' }}>
                    <table className="data-table">
                        <thead>
                            <tr style={{ backgroundColor: '#f4f7fb' }}>
                                <th style={{ width: '40px' }}>#</th>
                                <th style={{ textAlign: 'left' }}>Metric</th>
                                <th style={{ textAlign: 'right' }}>Model Fit</th>
                                <th style={{ textAlign: 'right' }}>Validation Fit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.map((m, i) => (
                                <tr key={i}>
                                    <td style={{ color: 'var(--color-text-light)', fontSize: '12px' }}>{i}</td>
                                    <td style={{ fontWeight: '700', fontSize: '13px' }}>{m.label}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--color-primary)', fontWeight: '600' }}>{m.model}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#16a34a', fontWeight: '600' }}>{m.validation}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon blue">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 21H3V3" /><path d="M7 14l3-3 4 4 7-7" />
                            </svg>
                        </div>
                        Model Fit: Actual vs Predicted Modeling Period
                    </div>
                </div>
                <ActualVsPredictedChart height={450} />
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn btn-secondary">Export Results</button>
                <button className="btn btn-primary">Proceed to Media Validation</button>
            </div>
        </BasePage>
    );
}
