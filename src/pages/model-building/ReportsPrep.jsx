import React from 'react';
import BasePage from './BasePage';
import IncrementalOverview from '../../components/reports/IncrementalOverview';
import DetailedTacticTable from '../../components/reports/DetailedTacticTable';
import ReportsSummaryTables from '../../components/reports/ReportsSummaryTables';
import HeadroomChart from '../../components/reports/HeadroomChart';

export default function ReportsPrep() {
    return (
        <BasePage stepId={22} hideTasks={true}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Model Finalization & Reporting</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                        Download PDF
                    </button>
                    <button className="btn btn-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                            <path d="M5 12V5a2 2 0 0 1 2-2h7l5 5v4" />
                            <path d="M9 15h6M9 19h6" />
                        </svg>
                        Generate PPTX
                    </button>
                </div>
            </div>

            <IncrementalOverview />

            <DetailedTacticTable />

            <ReportsSummaryTables />

            <HeadroomChart />

            <div className="card" style={{ marginTop: '24px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon green">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                        </div>
                        Available Reports
                    </div>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Report Name</th>
                                <th>Format</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ fontWeight: '600' }}>Model Review & Performance Report</td>
                                <td>PDF</td>
                                <td><span className="badge badge-success">Ready</span></td>
                                <td style={{ textAlign: 'right' }}><button className="btn btn-secondary btn-sm">Download</button></td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: '600' }}>Executive Summary - Media Tactics</td>
                                <td>PPTX</td>
                                <td><span className="badge badge-warning">Generating...</span></td>
                                <td style={{ textAlign: 'right' }}><button className="btn btn-secondary btn-sm" disabled>Download</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </BasePage>
    );
}
