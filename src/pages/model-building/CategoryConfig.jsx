import React from 'react';
import BasePage from './BasePage';

const configData = {
    'media_stack_path': '../data/Category Stacks/SOFTWARE.csv',
    'non_media_stack_path': '../data/processed_input_data/Non_media_event_variables.csv',
    'output_path': '../data/category_processed_input',
    'outcome_var': 'O_UNIT',
    'runner_settings': {
        'custom_priors_manual': {
            'M_SP_AB_CLK': 2.0, 'M_SP_KWB_CLK': 2.8, 'M_SBA_CLK': 3.1, 'M_SV_CLK': 5.3,
            'M_ON_DIS_AT_SUM_IMP': 3.3, 'M_ON_DIS_CT_SUM_IMP': 4.0, 'M_ON_DIS_CATTO_SUM_IMP': 4.5,
            'M_ON_DIS_KW_SUM_IMP': 3.1, 'M_ON_DIS_ROS_SUM_IMP': 2.5, 'M_ON_DIS_HPLO_SUM_IMP': 6.8,
            'M_ON_DIS_APP_HPLO_SUM_IMP': 6.0, 'M_ON_DIS_HPGTO_SUM_IMP': 3.4,
            'M_OFF_DIS_WN_WITHOUTCTV_SUM_IMP': 5.0, 'M_OFF_DIS_DSP_CTV_SUM_IMP': 3.8,
            'M_OFF_DIS_FB_SUM_IMP': 1.5, 'M_INSTORE_TV_WALL_SUM_IMP': 2.8
        },
        'iroas_constraints': {
            'M_SP_AB_CLK': [0.4, 7], 'M_SP_KWB_CLK': [0.4, 7], 'M_SBA_CLK': [0.4, 5],
            'M_SV_CLK': [0.4, 7], 'M_ON_DIS_AT_SUM_IMP': [0.4, 7]
        },
        'train_start': '2022-12-01', 'train_end': '2025-07-31',
        'valid_start': '2025-05-01', 'valid_end': '2025-07-31'
    }
};

export default function CategoryConfig() {
    return (
        <BasePage stepId={13}>
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon green">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                        </div>
                        Model Parameters
                    </div>
                </div>

                <div className="grid-2">
                    <div className="form-group">
                        <label className="form-label">Priors Source</label>
                        <select className="form-input form-select">
                            <option>Benchmark Model (Last Year)</option>
                            <option>Custom</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Outcome Variable</label>
                        <input className="form-input" value={configData.outcome_var} disabled />
                    </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                    <label className="form-label">Historical Constraints</label>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" defaultChecked /> <span style={{ fontSize: '14px' }}>Include COVID period</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" defaultChecked /> <span style={{ fontSize: '14px' }}>Include Promotions</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon blue">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        Path Configuration
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                        { label: 'Media Stack', path: configData.media_stack_path },
                        { label: 'Non-Media Stack', path: configData.non_media_stack_path },
                        { label: 'Output Directory', path: configData.output_path }
                    ].map((item, idx) => (
                        <div key={idx} style={{ background: 'var(--color-surface)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>{item.label}</div>
                            <code style={{ fontSize: '12px', color: 'var(--color-primary-dark)', wordBreak: 'break-all' }}>{item.path}</code>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon yellow">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        Execution Windows
                    </div>
                </div>
                <div className="grid-2">
                    <div style={{ background: 'var(--color-primary-light)', padding: '14px', borderRadius: '12px', border: '1px solid var(--color-primary-glow)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary-dark)', marginBottom: '8px' }}>Training Period</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="tag tag-etl">{configData.runner_settings.train_start}</span>
                            <span style={{ color: 'var(--color-text-light)' }}>→</span>
                            <span className="tag tag-etl">{configData.runner_settings.train_end}</span>
                        </div>
                    </div>
                    <div style={{ background: 'var(--color-success-light)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#166534', marginBottom: '8px' }}>Validation Period</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="tag tag-eda">{configData.runner_settings.valid_start}</span>
                            <span style={{ color: 'var(--color-text-light)' }}>→</span>
                            <span className="tag tag-eda">{configData.runner_settings.valid_end}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon blue">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20v-6M6 20V10M18 20V4" />
                            </svg>
                        </div>
                        Custom Priors & Constraints
                    </div>
                </div>
                <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="data-table">
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr>
                                <th style={{ backgroundColor: '#f4f7fb' }}>Media Tactic</th>
                                <th style={{ backgroundColor: '#f4f7fb', textAlign: 'center' }}>Manual Prior</th>
                                <th style={{ backgroundColor: '#f4f7fb', textAlign: 'center' }}>iRoAS Constraints</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(configData.runner_settings.custom_priors_manual).map(([tactic, prior], idx) => (
                                <tr key={idx}>
                                    <td style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text)' }}>{tactic}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{ background: 'rgba(0, 113, 220, 0.1)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '12px' }}>
                                            {prior.toFixed(1)}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {configData.runner_settings.iroas_constraints[tactic] ? (
                                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                                [{configData.runner_settings.iroas_constraints[tactic][0]}, {configData.runner_settings.iroas_constraints[tactic][1]}]
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--color-text-light)', fontSize: '12px' }}>Default</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </BasePage>
    );
}
