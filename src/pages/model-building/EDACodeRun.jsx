import React from 'react';
import BasePage from './BasePage';
import OUnitPacingChart from '../../components/charts/OUnitPacingChart';
import MediaTacticsTable from '../../components/MediaTacticsTable';

export default function EDACodeRun() {
    return (
        <BasePage stepId={12} hideTasks={true}>
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon blue">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 11l3 3L22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                        </div>
                        Media Tactics Summary
                    </div>
                </div>
                <MediaTacticsTable />
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon green">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 3v18h18" />
                                <path d="m19 9-5 5-4-4-3 3" />
                            </svg>
                        </div>
                        O_UNIT Pacing Analysis
                    </div>
                </div>
                <OUnitPacingChart />
            </div>

            {/* Notebook Runner */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon blue">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6" /><path d="M12 19h8" /></svg>
                        </div>
                        Notebook Runner
                    </div>
                </div>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ marginBottom: '16px', color: '#666' }}>Preliminary requirements check notebook</div>
                    <button className="btn btn-primary">Run Notebook</button>
                </div>
            </div>
        </BasePage>
    );
}
