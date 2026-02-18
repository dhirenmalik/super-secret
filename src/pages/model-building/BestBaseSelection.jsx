import React from 'react';
import BasePage from './BasePage';

export default function BestBaseSelection() {
    return (
        <BasePage stepId={17} hideTasks={true}>
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon green">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        </div>
                        Top 10 Candidate Bases
                    </div>
                </div>
                <div style={{ padding: '0 10px' }}>
                    <div style={{ padding: '16px', fontSize: '13px', color: 'var(--color-text-light)', borderBottom: '1px solid var(--color-border)' }}>
                        Review and select the best performing base model based on R² and MAPE metrics.
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Base ID</th>
                                <th>R² Score</th>
                                <th>MAPE (%)</th>
                                <th style={{ textAlign: 'right' }}>Selection</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map(i => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Base_00{i}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {(0.88 + i * 0.005).toFixed(3)}
                                            <div style={{ width: '60px', height: '4px', background: '#eee', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: `${(0.88 + i * 0.005) * 100}%`, height: '100%', background: 'var(--color-success)' }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{(15.3 - i * 0.2).toFixed(2)}%</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className={`btn btn-sm ${i === 1 ? 'btn-primary' : 'btn-secondary'}`}>
                                            {i === 1 ? 'Current Base' : 'Select Base'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button className="btn btn-primary">Confirm Selection & Proceed</button>
            </div>
        </BasePage>
    );
}
