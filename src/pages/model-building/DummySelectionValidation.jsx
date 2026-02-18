import React from 'react';
import BasePage from './BasePage';

const dummyConfig = {
    'category_essential_vars': [
        'D_HOL_PRE_EASTER_2023', 'D_HOL_PRE_EASTER_2024', 'D_HOL_PRE_EASTER_2025',
        'D_HOL_GAME_RELEASE_2023', 'D_HOL_GAME_RELEASE_2024', 'D_HOL_PRE_CHRISTMAS_2022',
        'D_HOL_PRE_CHRISTMAS_2023', 'D_HOL_PRE_CHRISTMAS_2024', 'D_HOL_CHRISTMAS_2022',
        'D_HOL_CHRISTMAS_2023', 'D_HOL_CHRISTMAS_2024', 'D_HOL_BLACK_FRIDAY_2023',
        'D_HOL_BLACK_FRIDAY_2024', 'D_HOL_THANKSGIVING_2023', 'D_HOL_THANKSGIVING_2024',
        'D_DAY_MONDAY_2025_Q2', 'D_DAY_TUESDAY_2025_Q2', 'D_DAY_SATURDAY_2025_Q2',
        'D_DAY_MONDAY_2025_Q3', 'D_DAY_TUESDAY_2025_Q3', 'D_DAY_SATURDAY_2025_Q3'
    ],
    'exclude_non_media': [
        'D_HOL_THANKSGIVING_DAY', 'D_HOL_CHRISTMAS_DAY', 'D_HOL_THANKSGIVING',
        'D_HOL_CHRISTMAS', 'Month_12', 'D_HIGH_SALES_2023-12',
        'D_HIGH_SALES_2022-12', 'D_HIGH_SALES_2024-12', 'D_DAY_TUESDAY',
        'D_DAY_WEDNESDAY', 'D_DAY_THURSDAY', 'D_DAY_FRIDAY',
        'D_DAY_MONDAY', 'D_DAY_TUESDAY', 'D_DAY_SATURDAY', 'D_DAY_SUNDAY'
    ]
};

export default function DummySelectionValidation() {
    return (
        <BasePage stepId={16}>
            <div className="grid-2">
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon green">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                            </div>
                            Validation Metrics
                        </div>
                    </div>
                    <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="stat-card" style={{ padding: '15px' }}>
                            <div className="stat-icon blue" style={{ width: '32px', height: '32px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21H3V3" /><path d="M7 14l3-3 4 4 7-7" /></svg>
                            </div>
                            <div>
                                <div className="stat-value" style={{ fontSize: '20px' }}>0.85</div>
                                <div className="stat-label">R-Squared</div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ padding: '15px' }}>
                            <div className="stat-icon green" style={{ width: '32px', height: '32px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20" /><path d="M17 5H9.5a4.5 4.5 0 1 0 0 9h5a4.5 4.5 0 1 1 0 9H6" /></svg>
                            </div>
                            <div>
                                <div className="stat-value" style={{ fontSize: '20px' }}>12.4%</div>
                                <div className="stat-label">MAPE</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon green">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            </div>
                            Approval Actions
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            Approve Selection
                        </button>
                        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                            Request Changes
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid-2" style={{ marginTop: '20px' }}>
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon yellow">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            Validated Essential Variables
                        </div>
                    </div>
                    <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '10px' }}>
                        {dummyConfig.category_essential_vars.map((v, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)' }}></div>
                                <code style={{ fontSize: '11px', color: '#1e293b' }}>{v}</code>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon red">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            </div>
                            Excluded Variables (Validated)
                        </div>
                    </div>
                    <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '10px' }}>
                        {dummyConfig.exclude_non_media.map((v, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-danger)', opacity: 0.5 }}></div>
                                <code style={{ fontSize: '11px', color: '#64748b', textDecoration: 'line-through' }}>{v}</code>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </BasePage>
    );
}
