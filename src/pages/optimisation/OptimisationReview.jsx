import React from 'react';
import BasePage from '../model-building/BasePage';
import OptimizationScenariosChart from '../../components/optimisation/OptimizationScenariosChart';
import OptimizationResultsTable from '../../components/optimisation/OptimizationResultsTable';

export default function OptimisationReview() {
    return (
        <BasePage stepId={26} hideTasks={true}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Optimization Review & Finalization</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                        Export Selection
                    </button>
                </div>
            </div>

            <OptimizationScenariosChart />

            <OptimizationResultsTable />

            <div className="card" style={{ marginTop: '24px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon green">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </div>
                        Approval & Feedback
                    </div>
                </div>
                <div style={{ padding: '20px' }}>
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: '700' }}>Review Status</label>
                        <select className="form-input form-select" style={{ maxWidth: '300px' }}>
                            <option>Select Status...</option>
                            <option>Approve Optimization Scenarios</option>
                            <option>Request Scenario Refresh</option>
                            <option>Reject & Restart Optimization</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginTop: '16px' }}>
                        <label className="form-label" style={{ fontWeight: '700' }}>Comments / Instructions</label>
                        <textarea className="form-input form-textarea" rows={4} placeholder="Enter feedback on optimization results for the data science team..."></textarea>
                    </div>
                    <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                        <button className="btn btn-primary" style={{ padding: '10px 24px' }}>Submit Final Approval</button>
                        <button className="btn btn-secondary" style={{ padding: '10px 24px' }}>Save as Draft</button>
                    </div>
                </div>
            </div>
        </BasePage>
    );
}
