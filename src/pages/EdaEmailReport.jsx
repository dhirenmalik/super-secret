import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ModelGallery from '../components/ModelGallery';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../api/kickoff';
import { updateStageStatus } from '../api/eda';

const mockTables = [
    'Sales Summary by Category',
    'Spend Distribution by Tactic',
    'YoY Growth Comparison',
    'Brand Contribution Analysis',
    'Variable Trend Summary',
    'Key Insights & Recommendations',
];

export default function EdaEmailReport({ mode, overrideStepSlug }) {
    const stepSlug = overrideStepSlug || 'eda-email-report';
    const step = steps.find((s) => s.slug === stepSlug);
    const { token } = useAuth();
    const location = useLocation();

    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [models, setModels] = useState([]);
    const [activeModelId, setActiveModelId] = useState(localStorage.getItem('active_model_id') || '');
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    // Force Dashboard View on Sidebar Navigation
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('dashboard') === 'true') {
            setActiveModelId('');
            localStorage.removeItem('active_model_id');
        }
    }, [location.search]);

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        setIsLoadingModels(true);
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/models`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setModels(data);
        } catch (error) {
            console.error('Error fetching models:', error);
        } finally {
            setIsLoadingModels(false);
        }
    };

    const isReadOnly = mode === 'reviewer';
    const userRole = localStorage.getItem('role') || 'modeler';
    const isModeler = userRole === 'modeler' && mode !== 'reviewer';
    const isReviewer = userRole === 'reviewer' || mode === 'reviewer';

    const handleStatusUpdate = async (newStatus) => {
        try {
            await updateStageStatus(activeModelId, 'eda_email', newStatus, token);
            await loadModels();
        } catch (err) {
            console.error(err);
            // Optionally set error state here
        }
    };

    const activeModel = models.find(m => m.model_id.toString() === activeModelId);

    const handleGenerate = () => {
        setGenerating(true);
        setTimeout(() => {
            setGenerating(false);
            setGenerated(true);
        }, 2000);
    };

    return (
        <div className="bg-slate-50 min-h-screen relative pb-20">
            <PageHeader
                title={step.name}
                subtitle="Generate all six tables and key insights in WMC fixed format using automated notebook."
                stepNumber={step.id}
                phase={step.phase}
                activeModelId={activeModelId}
                models={models}
                onModelSwitch={setActiveModelId}
                showBackButton={!!activeModelId}
                onBack={() => {
                    setActiveModelId('');
                    setGenerated(false);
                }}
            >
                {activeModel && (
                    <div className="flex items-center gap-3">
                        <StatusBadge status={activeModel.eda_email_status || 'not_started'} />

                        {/* Actions for Modeler */}
                        {isModeler && activeModel.eda_email_status !== 'in_review' && activeModel.eda_email_status !== 'approved' && generated && (
                            <button
                                onClick={() => handleStatusUpdate('in_review')}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                            >
                                Submit for Review
                            </button>
                        )}

                        {/* Actions for Reviewer */}
                        {isReviewer && activeModel.eda_email_status === 'in_review' && (
                            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 ml-1">
                                <button
                                    onClick={() => handleStatusUpdate('approved')}
                                    className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate('rejected')}
                                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </PageHeader>

            <div className="px-6 mt-6 space-y-8">
                {!activeModelId ? (
                    <ModelGallery
                        models={models}
                        onSelect={(id) => {
                            setActiveModelId(id);
                            localStorage.setItem('active_model_id', id);
                        }}
                    />
                ) : (
                    <>
                        <div className="grid-2">
                            {/* Tasks */}
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-title">
                                        <div className="card-title-icon blue">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9 11l3 3L22 4" />
                                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                            </svg>
                                        </div>
                                        Tasks
                                    </div>
                                </div>
                                <TaskList tasks={step.tasks} />
                            </div>

                            {/* Generate Controls */}
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-title">
                                        <div className="card-title-icon green">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                            </svg>
                                        </div>
                                        Report Generation
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{
                                        width: '80px', height: '80px', borderRadius: 'var(--radius-xl)',
                                        background: generated ? 'var(--color-success-light)' : 'var(--color-primary-light)',
                                        color: generated ? 'var(--color-success)' : 'var(--color-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 20px',
                                        transition: 'all 0.3s ease',
                                    }}>
                                        {generated ? (
                                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                        ) : (
                                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text)' }}>
                                        {generated ? 'Report Generated Successfully!' : 'EDA Email Report'}
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
                                        {generated
                                            ? 'All 6 tables and key insights have been populated in WMC format.'
                                            : 'Click below to auto-generate the report with all six tables and key insights.'}
                                    </div>
                                    <button
                                        className={`btn ${generated ? 'btn-success' : 'btn-primary'} btn-lg ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={handleGenerate}
                                        disabled={generating || isReadOnly}
                                        style={{ minWidth: '200px', justifyContent: 'center' }}
                                    >
                                        {generating ? (
                                            <>
                                                <span style={{
                                                    width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                                                    borderTop: '2px solid white', borderRadius: '50%',
                                                    animation: 'spin 1s linear infinite', display: 'inline-block',
                                                }} />
                                                Generating...
                                            </>
                                        ) : generated ? (
                                            <>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                                Download Report
                                            </>
                                        ) : (
                                            <>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                                Generate Report
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Report Tables Preview */}
                        <div className="card" style={{ marginTop: '20px' }}>
                            <div className="card-header">
                                <div className="card-title">
                                    <div className="card-title-icon yellow">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
                                    </div>
                                    Report Tables (6 Tables)
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                                {mockTables.map((table, i) => (
                                    <div key={i} style={{
                                        padding: '16px', borderRadius: 'var(--radius-md)',
                                        background: generated ? 'var(--color-success-light)' : 'var(--color-surface)',
                                        border: `1px solid ${generated ? 'rgba(34, 197, 94, 0.2)' : 'var(--color-border-light)'}`,
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        transition: 'all 0.3s ease',
                                    }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
                                            background: generated ? 'var(--color-success)' : 'var(--color-border)',
                                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '13px', fontWeight: 700, flexShrink: 0,
                                            transition: 'all 0.3s ease',
                                        }}>
                                            {generated ? '✓' : i + 1}
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{table}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Email Preview */}
                        <div className="card" style={{ marginTop: '20px' }}>
                            <div className="card-header">
                                <div className="card-title">
                                    <div className="card-title-icon blue">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                    </div>
                                    Email Preview
                                </div>
                            </div>
                            {generated ? (
                                <div style={{ padding: '20px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
                                    <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--color-text)' }}>Subject: EDA Report – [Category] – WMC Analysis</div>
                                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                                        To: enterprise-analytics@example.com
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.7 }}>
                                        <p>Hi Team,</p>
                                        <p style={{ marginTop: '8px' }}>Please find the attached EDA report containing all six analysis tables and key insights for the selected category. The report follows the standardized WMC format.</p>

                                        {/* Data Table */}
                                        <div style={{ marginTop: '20px', marginBottom: '20px', overflow: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', background: 'white', border: '1px solid #E2E8F0' }}>
                                                <thead>
                                                    <tr style={{ background: '#F4F7FB' }}>
                                                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #E2E8F0', fontWeight: 600 }}>Category</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', fontWeight: 600 }}>Sales</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', fontWeight: 600 }}>Spends</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', fontWeight: 600 }}>Unit</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', fontWeight: 600 }}>Sales %</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', fontWeight: 600 }}>Spends %</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>Included</td>
                                                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #F1F5F9' }}>1,707,609,887</td>
                                                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #F1F5F9' }}>24,733,072</td>
                                                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #F1F5F9' }}>87,512,304</td>
                                                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #F1F5F9', color: '#22C55E', fontWeight: 600 }}>91%</td>
                                                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #F1F5F9', color: '#22C55E', fontWeight: 600 }}>99%</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>Excluded</td>
                                                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #F1F5F9' }}>165,444,626</td>
                                                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #F1F5F9' }}>275,955</td>
                                                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #F1F5F9' }}>7,137,751</td>
                                                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #F1F5F9', color: '#EF4444' }}>9%</td>
                                                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #F1F5F9', color: '#EF4444' }}>1%</td>
                                                    </tr>
                                                    <tr style={{ background: '#F4F7FB', fontWeight: 600 }}>
                                                        <td style={{ padding: '8px' }}>Total</td>
                                                        <td style={{ padding: '8px', textAlign: 'right' }}>1,873,518,856</td>
                                                        <td style={{ padding: '8px', textAlign: 'right' }}>25,009,027</td>
                                                        <td style={{ padding: '8px', textAlign: 'right' }}>94,670,017</td>
                                                        <td style={{ padding: '8px', textAlign: 'right' }}>100%</td>
                                                        <td style={{ padding: '8px', textAlign: 'right' }}>100%</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <p style={{ marginTop: '8px' }}>Key highlights have been auto-generated and are ready for review.</p>
                                        <p style={{ marginTop: '8px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>— Generated via ETL & EDA Process Manager</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-state-icon">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                    </div>
                                    <div className="empty-state-text">No Report Generated</div>
                                    <div className="empty-state-subtext">Generate the report to preview the email content.</div>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <AutomationNote notes={step.automationNotes} />
                        </div>

                        <style>{`
                            @keyframes spin {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </>
                )}
            </div>
        </div>
    );
}
