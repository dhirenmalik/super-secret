import React from 'react';
import BasePage from '../model-building/BasePage';
import GMVChart from '../../components/charts/GMVChart';
import TableauShell from '../../components/reporting/TableauShell';

export default function TableauPopulation() {
    return (
        <BasePage stepId={29}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Tableau Server Integration - Moved to Top */}
                <div className="card" style={{ borderLeft: '4px solid #0071dc' }}>
                    <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <div style={{ background: '#d0ebff', padding: '6px', borderRadius: '4px', color: '#0071dc' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Tableau Server Integration</h3>
                            </div>
                            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Live Tableau workspace for final category review and sign-off.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn btn-secondary">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download Workbook
                            </button>
                            <button className="btn btn-primary">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                                Open in Desktop
                            </button>
                        </div>
                    </div>
                </div>

                {/* Simulated Tableau Interface */}
                <TableauShell>
                    <GMVChart />
                </TableauShell>
            </div>
        </BasePage>
    );
}
