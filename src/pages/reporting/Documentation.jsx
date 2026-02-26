import React from 'react';
import BasePage from '../model-building/BasePage';
import CloudUploadAnimation from '../../components/reporting/CloudUploadAnimation';

export default function Documentation() {
    return (
        <BasePage stepId={30}>
            <div className="grid-2">
                {/* Deliverables List */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon green">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                            </div>
                            Final Deliverables
                        </div>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ textAlign: 'left' }}>Document Name</th>
                                    <th style={{ textAlign: 'center' }}>Type</th>
                                    <th style={{ textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: '600' }}>Process Flow & Key Decisions</td>
                                    <td style={{ textAlign: 'center' }}><span className="badge badge-blue">PDF</span></td>
                                    <td style={{ textAlign: 'center' }}><button className="btn btn-secondary btn-sm">Download</button></td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: '600' }}>Variable & Dummies Description</td>
                                    <td style={{ textAlign: 'center' }}><span className="badge badge-purple">DOCX</span></td>
                                    <td style={{ textAlign: 'center' }}><button className="btn btn-secondary btn-sm">Download</button></td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: '600' }}>Final Stack & Optimisation Results</td>
                                    <td style={{ textAlign: 'center' }}><span className="badge badge-green">XLSX</span></td>
                                    <td style={{ textAlign: 'center' }}><button className="btn btn-secondary btn-sm">Download</button></td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: '600' }}>Model Coefficient Summary</td>
                                    <td style={{ textAlign: 'center' }}><span className="badge badge-blue">PDF</span></td>
                                    <td style={{ textAlign: 'center' }}><button className="btn btn-secondary btn-sm">Download</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Animated Cloud Sync Card */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon blue">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                            </div>
                            Enterprise Cloud Sync
                        </div>
                    </div>
                    <CloudUploadAnimation />
                </div>
            </div>
        </BasePage>
    );
}
