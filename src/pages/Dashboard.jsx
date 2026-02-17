import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchFiles } from '../api/kickoff';
import steps from '../data/steps';
import StepCard from '../components/StepCard';
import PageHeader from '../components/PageHeader';
import { NavLink } from 'react-router-dom';

export default function Dashboard() {
    const { user, token } = useAuth();
    const [pendingItems, setPendingItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user && (user.role === 'reviewer' || user.role === 'admin')) {
            loadPendingItems();
        }
    }, [user]);

    const loadPendingItems = async () => {
        setIsLoading(true);
        try {
            const files = await fetchFiles(token);
            // Filter for items that need review/approval
            const pending = files.filter(f => f.status === 'pending');
            setPendingItems(pending);
        } catch (error) {
            console.error('Failed to load pending items:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const etlSteps = steps.filter((s) => s.phase === 'ETL');
    const edaSteps = steps.filter((s) => s.phase === 'EDA');
    const modelBuildingSteps = steps.filter((s) => s.phase === 'Model Building');
    const optimisationSteps = steps.filter((s) => s.phase === 'Optimisation');
    const reportingSteps = steps.filter((s) => s.phase === 'Reporting');
    const totalTasks = steps.reduce((sum, s) => sum + s.tasks.length, 0);

    const isModeler = user?.role === 'modeler';
    const isReviewerOrAdmin = user?.role === 'reviewer' || user?.role === 'admin';

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <PageHeader
                    title={`Welcome, ${user?.user_name || 'User'}`}
                    subtitle={isModeler
                        ? "Monitor and manage all Data ETL, EDA, Model Building, Optimisation & Reporting process steps."
                        : "Review and approve pending process milestones across the pipeline."
                    }
                    breadcrumb={['Home', 'Dashboard']}
                />
                <div className="mb-8 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg hidden md:block">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Role: {user?.role}</span>
                </div>
            </div>

            {isReviewerOrAdmin && (
                <div className="section">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="section-title m-0">
                            <span className="tag tag-eda">ACTION REQUIRED</span>
                            Pending Reviews & Approvals
                        </h2>
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                            {pendingItems.length} items awaiting action
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="flex py-20 items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : pendingItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingItems.map((item) => (
                                <NavLink
                                    key={item.id}
                                    to={`/step/kickoff-report-review`}
                                    className="block group"
                                >
                                    <div className="card h-full border-l-4 border-l-amber-400 group-hover:shadow-lg transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="card-title-icon blue">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                                    <polyline points="10 9 9 9 8 9"></polyline>
                                                </svg>
                                            </div>
                                            <span className="status-badge in-progress">
                                                <span className="status-badge-dot"></span>
                                                Pending Review
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 mb-1">{item.filename}</h3>
                                        <p className="text-xs text-slate-500 mb-4">
                                            Uploaded {new Date(item.upload_date).toLocaleDateString()}
                                        </p>
                                        <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                            Start Review
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                <polyline points="12 5 19 12 12 19"></polyline>
                                            </svg>
                                        </div>
                                    </div>
                                </NavLink>
                            ))}
                        </div>
                    ) : (
                        <div className="card py-16 text-center border-dashed">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <svg className="text-slate-300" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </div>
                            <h3 className="font-bold text-slate-800">No Action Required</h3>
                            <p className="text-sm text-slate-500">All reports are up to date. Check back later for new submissions.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modelers see full stats and pipeline */}
            {isModeler && (
                <>
                    <div className="dashboard-stats">
                        <div className="stat-card">
                            <div className="stat-icon blue">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 3h18v18H3z" />
                                    <path d="M3 9h18" />
                                    <path d="M9 21V9" />
                                </svg>
                            </div>
                            <div>
                                <div className="stat-value">{steps.length}</div>
                                <div className="stat-label">Total Steps</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <div>
                                <div className="stat-value">{totalTasks}</div>
                                <div className="stat-label">Total Tasks</div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <div className="card-title-icon blue">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 20v-6M6 20V10M18 20V4" />
                                    </svg>
                                </div>
                                Pipeline Progress
                            </div>
                        </div>
                        <div className="progress-bar-container">
                            <div className="progress-bar-label">
                                <span style={{ color: 'var(--color-text-muted)' }}>Overall Completion</span>
                                <span style={{ color: 'var(--color-primary)' }}>0/{steps.length} steps</span>
                            </div>
                            <div className="progress-bar-track">
                                <div className="progress-bar-fill" style={{ width: '0%' }} />
                            </div>
                        </div>
                    </div>

                    <div className="section">
                        <h2 className="section-title">
                            <span className="tag tag-etl">ETL</span>
                            Extract, Transform & Load
                        </h2>
                        <div className="dashboard-grid">
                            {etlSteps.map((step) => (
                                <StepCard key={step.id} step={step} />
                            ))}
                        </div>
                    </div>

                    <div className="section">
                        <h2 className="section-title">
                            <span className="tag tag-eda">EDA</span>
                            Exploratory Data Analysis
                        </h2>
                        <div className="dashboard-grid">
                            {edaSteps.map((step) => (
                                <StepCard key={step.id} step={step} />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
