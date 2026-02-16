import React from 'react';
import BasePage from './BasePage';

export default function FinalModelValidation() {
    return (
        <BasePage stepId={21}>
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon green">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
                        </div>
                        Validation Summary
                    </div>
                </div>
                <div style={{ padding: '20px', background: '#f0fdf4', color: '#15803d', borderRadius: '4px', marginBottom: '20px' }}>
                    <strong>✅ Model Passed Validation</strong><br />
                    All KPIs are within acceptable ranges.
                </div>
                <button className="btn btn-primary">Proceed to Optimisation</button>
            </div>
        </BasePage>
    );
}
