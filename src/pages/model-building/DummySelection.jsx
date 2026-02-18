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

export default function DummySelection() {
    return (
        <BasePage stepId={15}>
            <div className="grid-2">
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon yellow">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            Category Essential Variables
                        </div>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px' }}>
                        <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '12px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '4px' }}>
                                Essential Features ({dummyConfig.category_essential_vars.length})
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-light)' }}>These variables are forced into the model selection.</div>
                        </div>
                        {dummyConfig.category_essential_vars.map((v, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                                <input type="checkbox" defaultChecked />
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
                            Exclude Non-Media
                        </div>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px' }}>
                        <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '700', marginBottom: '4px' }}>
                                Excluded Variables ({dummyConfig.exclude_non_media.length})
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-light)' }}>These non-media variables will be ignored during selection.</div>
                        </div>
                        {dummyConfig.exclude_non_media.map((v, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                                <input type="checkbox" defaultChecked />
                                <code style={{ fontSize: '11px', color: '#1e293b' }}>{v}</code>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </BasePage>
    );
}
