import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchFiles, fetchLatestFile, getApiBaseUrl } from '../api/kickoff';
import steps from '../data/steps';
import StepCard from '../components/StepCard';
import PageHeader from '../components/PageHeader';
import { NavLink } from 'react-router-dom';

export default function Dashboard() {
    const { user, token } = useAuth();
    const [pendingItems, setPendingItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [stepStatuses, setStepStatuses] = useState({});
    const [models, setModels] = useState([]);

    useEffect(() => {
        loadDashboardData();
        loadModels();
    }, [user]);

    const loadModels = async () => {
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/models`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setModels(data);
        } catch (error) {
            console.error('Failed to fetch models:', error);
        }
    };

    const handleDeleteModel = async (modelId) => {
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/models/${modelId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                // Refresh list
                loadModels();
            } else {
                alert('Failed to delete model');
            }
        } catch (error) {
            console.error('Error deleting model:', error);
            alert('Error deleting model');
        }
    };

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const statuses = {};

            // Load pending items for reviewers
            if (user && (user.role === 'reviewer' || user.role === 'admin')) {
                const files = await fetchFiles(true, token);
                const pending = files.filter(f => ['pending', 'in_review', 'approved', 'rejected'].includes(f.status));
                setPendingItems(pending);
            }

            // Fetch Kickoff Report Status
            try {
                const latestKickoff = await fetchLatestFile('kickoff_report', token);
                if (latestKickoff) {
                    const statusMap = {
                        'pending': 'uploaded',
                        'approved': 'approved',
                        'rejected': 'rejected'
                    };
                    statuses['kickoff-report'] = statusMap[latestKickoff.status] || latestKickoff.status;
                } else {
                    statuses['kickoff-report'] = 'not_started';
                }
            } catch (err) {
                console.error('Failed to fetch kickoff status:', err);
            }

            // Fetch EDA Data Hub Status (check if any raw file exists)
            try {
                const latestHub = await fetchLatestFile('exclude_flags_raw', token);
                if (latestHub) {
                    statuses['eda-data-hub'] = 'uploaded';
                } else {
                    statuses['eda-data-hub'] = 'not_started';
                }
            } catch (err) {
                console.error('Failed to fetch hub status:', err);
            }

            setStepStatuses(statuses);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
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
                <div className="flex gap-3 mb-8">
                    <NavLink
                        to="/create-model"
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Create New Model
                    </NavLink>
                    <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg hidden md:block">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Role: {user?.role}</span>
                    </div>
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
                            {pendingItems.map((item) => {
                                const category = item.category || item.file_category;
                                const isExcludeFlag = category === 'exclude_flags_raw';
                                const targetRoute = isExcludeFlag ? '/step/exclude-flag-review' : '/step/kickoff-report-review';
                                const titlePrefix = isExcludeFlag ? 'Exclude Flag Review' : 'Kickoff Report';

                                let badgeClass = "in-progress";
                                let badgeText = "Pending Review";
                                if (item.status === 'approved') {
                                    badgeClass = "completed";
                                    badgeText = "Approved";
                                } else if (item.status === 'rejected') {
                                    badgeClass = "error border border-red-200";
                                    badgeText = "Rejected";
                                }

                                const fileName = item.filename || item.file_name;
                                const uploadDate = item.upload_date || item.uploaded_at;

                                return (
                                    <NavLink
                                        key={item.file_id || item.id}
                                        to={targetRoute}
                                        onClick={() => {
                                            if (item.model_id) {
                                                localStorage.setItem('active_model_id', item.model_id);
                                            }
                                        }}
                                        className="block group"
                                    >
                                        <div className={`card h-full border-l-4 ${item.status === 'approved' ? 'border-l-green-500' : item.status === 'rejected' ? 'border-l-red-500' : 'border-l-amber-400'} group-hover:shadow-lg transition-all`}>
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
                                                <span className={`status-badge ${badgeClass}`}>
                                                    <span className="status-badge-dot"></span>
                                                    {badgeText}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 mb-1">{titlePrefix} - {fileName}</h3>
                                            <p className="text-xs text-slate-500 mb-4">
                                                Uploaded {uploadDate ? new Date(uploadDate).toLocaleDateString() : 'Unknown Date'}
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
                                )
                            })}
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
                    <div className="section">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="section-title m-0">
                                <span className="tag tag-blue">ACTIVE MODELS</span>
                                Your Modeling Projects
                            </h2>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                {models.length} Projects
                            </span>
                        </div>

                        {models.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {models.map((model) => (
                                    <div key={model.model_id} className="relative group">
                                        <NavLink
                                            to={`/step/eda-data-hub`}
                                            onClick={() => localStorage.setItem('active_model_id', model.model_id)}
                                            className="block"
                                        >
                                            <div className="card h-full group-hover:shadow-lg transition-all border-l-4 border-l-blue-500">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="card-title-icon blue">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                                        </svg>
                                                    </div>
                                                    <span className={`status-badge ${model.status === 'draft' ? 'not-started' : 'success'}`}>
                                                        <span className="status-badge-dot"></span>
                                                        {model.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-slate-800 mb-1">{model.model_name}</h3>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                                                        Type: {model.model_type}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mb-4 truncate">
                                                    Created {new Date(model.created_at).toLocaleDateString()}
                                                </p>
                                                <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Go to EDA Data Hub
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                        <polyline points="12 5 19 12 12 19"></polyline>
                                                    </svg>
                                                </div>
                                            </div>
                                        </NavLink>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (window.confirm(`Are you sure you want to delete "${model.model_name}"?`)) {
                                                    handleDeleteModel(model.model_id);
                                                }
                                            }}
                                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                                            title="Delete Model"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="card py-16 text-center border-dashed">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <svg className="text-slate-300" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                    </svg>
                                </div>
                                <h3 className="font-bold text-slate-800">No Models Created</h3>
                                <p className="text-sm text-slate-500 mb-6">Start by creating a new modeling project to begin the ETL/EDA process.</p>
                                <NavLink to="/create-model" className="btn btn-primary">
                                    Create First Model
                                </NavLink>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
