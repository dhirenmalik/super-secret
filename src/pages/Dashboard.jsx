import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchFiles, fetchLatestFile, getApiBaseUrl } from '../api/kickoff';
import steps from '../data/steps';
import PageHeader from '../components/PageHeader';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

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
                const pendingFiles = files.filter(f => ['pending', 'in_review', 'approved', 'rejected'].includes(f.status));

                // Fetch models to check for EDA stage reviews
                const modelsResponse = await fetch(`${getApiBaseUrl()}/api/v1/models`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const allModels = await modelsResponse.json();

                const pendingModelTasks = [];
                allModels.forEach(model => {
                    const stages = [
                        { key: 'brand_status', label: 'Brand Stacks Review', route: '/step/brand-stacks-review' },
                        { key: 'discovery_status', label: 'Discovery Tool Review', route: '/step/discovery-tool-review' },
                        { key: 'eda_email_status', label: 'EDA Email Review', route: '/step/eda-email-review' }
                    ];

                    stages.forEach(stage => {
                        if (model[stage.key] === 'in_review') {
                            pendingModelTasks.push({
                                id: `${model.model_id}_${stage.key}`,
                                model_id: model.model_id,
                                filename: model.model_name,
                                category: stage.label,
                                status: 'in_review',
                                upload_date: model.created_at,
                                customRoute: stage.route
                            });
                        }
                    });
                });

                setPendingItems([...pendingFiles, ...pendingModelTasks]);
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

            // Fetch EDA Data Hub Status
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

    const isModeler = user?.role === 'modeler';
    const isReviewerOrAdmin = user?.role === 'reviewer' || user?.role === 'admin';

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-end">
                <PageHeader
                    title={`Welcome, ${user?.user_name || 'User'}`}
                    subtitle={isModeler
                        ? "Monitor and manage all Data ETL, EDA, Model Building, Optimisation & Reporting process steps."
                        : "Review and approve pending process milestones across the pipeline."
                    }
                    breadcrumb={['Home', 'Dashboard']}
                />
                <div className="flex gap-4 mb-8">
                    <NavLink
                        to="/create-model"
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Create New Model
                    </NavLink>
                    <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl hidden md:flex items-center">
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Role: {user?.role}</span>
                    </div>
                </div>
            </div>

            {isReviewerOrAdmin && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="section relative z-10"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3 m-0">
                            <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-[10px] uppercase tracking-wider font-extrabold rounded-md shadow-sm">Action Required</span>
                            Pending Reviews
                        </h2>
                        <span className="bg-amber-100/80 text-amber-800 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm border border-amber-200/50">
                            {pendingItems.length} items awaiting action
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="flex py-24 items-center justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : pendingItems.length > 0 ? (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {pendingItems.map((item) => {
                                const category = item.category || item.file_category;
                                const isExcludeFlag = category === 'exclude_flags_raw';
                                const targetRoute = item.customRoute || (isExcludeFlag ? '/step/exclude-flag-review' : '/step/kickoff-report-review');
                                const titlePrefix = item.customRoute ? category : (isExcludeFlag ? 'Exclude Flag Review' : 'Kickoff Report');

                                let badgeClass = "bg-sky-100 text-sky-700";
                                let badgeText = "Pending Review";
                                let borderClass = "border-t-sky-500";
                                let dotClass = "bg-sky-500";

                                if (item.status === 'approved') {
                                    badgeClass = "bg-emerald-100 text-emerald-700";
                                    badgeText = "Approved";
                                    borderClass = "border-t-emerald-500";
                                    dotClass = "bg-emerald-500";
                                } else if (item.status === 'rejected') {
                                    badgeClass = "bg-rose-100 text-rose-700";
                                    badgeText = "Rejected";
                                    borderClass = "border-t-rose-500";
                                    dotClass = "bg-rose-500";
                                }

                                const fileName = item.filename || item.file_name;
                                const uploadDate = item.upload_date || item.uploaded_at;

                                return (
                                    <motion.div variants={itemVariants} key={item.file_id || item.id}>
                                        <NavLink
                                            to={targetRoute}
                                            onClick={() => {
                                                if (item.model_id) {
                                                    localStorage.setItem('active_model_id', item.model_id);
                                                }
                                            }}
                                            className="block group outline-none h-full"
                                        >
                                            <motion.div
                                                whileHover={{ y: -4, scale: 1.05 }}
                                                className={`bg-white rounded-2xl p-6 h-full border border-slate-200 border-t-4 ${borderClass} shadow-sm hover:shadow-2xl transition-shadow relative overflow-hidden`}
                                            >
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-50 to-transparent -z-0 rounded-bl-full"></div>
                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-5">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                                <polyline points="10 9 9 9 8 9"></polyline>
                                                            </svg>
                                                        </div>
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeClass}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${dotClass} animate-pulse`}></span>
                                                            {badgeText}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">{titlePrefix} - {fileName}</h3>
                                                    <p className="text-sm text-slate-500 mb-6">
                                                        Uploaded {uploadDate ? new Date(uploadDate).toLocaleDateString() : 'Unknown Date'}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-indigo-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-200">
                                                        Start Review
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                                            <polyline points="12 5 19 12 12 19"></polyline>
                                                        </svg>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </NavLink>
                                    </motion.div>
                                )
                            })}
                        </motion.div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-20 text-center shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-100 shadow-sm">
                                <svg className="text-slate-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">No Action Required</h3>
                            <p className="text-slate-500">All reports are up to date. Check back later for new submissions.</p>
                        </div>
                    )}
                </motion.div>
            )}

            {isModeler && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="section relative z-10"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3 m-0">
                            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[10px] uppercase tracking-wider font-extrabold rounded-md shadow-sm">Active Models</span>
                            Your Modeling Projects
                        </h2>
                        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                            {models.length} Projects
                        </span>
                    </div>

                    {models.length > 0 ? (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {models.map((model) => (
                                <motion.div variants={itemVariants} key={model.model_id} className="relative group outline-none h-full">
                                    <NavLink
                                        to={`/step/eda-data-hub`}
                                        onClick={() => localStorage.setItem('active_model_id', model.model_id)}
                                        className="block h-full outline-none"
                                    >
                                        <motion.div
                                            whileHover={{ y: -4, scale: 1.05 }}
                                            className="bg-white rounded-2xl p-6 h-full border border-slate-200 border-t-4 border-t-indigo-500 shadow-sm hover:shadow-2xl transition-shadow relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50/50 to-transparent -z-0 rounded-bl-full"></div>
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-5">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                                        </svg>
                                                    </div>
                                                    {(() => {
                                                        const getActiveStageInfo = (model) => {
                                                            if (model.eda_email_status === 'in_progress' || model.eda_email_status === 'in_review' || model.eda_email_status === 'rejected') {
                                                                return { name: 'Email Report', status: model.eda_email_status };
                                                            }
                                                            if (model.discovery_status === 'in_progress' || model.discovery_status === 'in_review' || model.discovery_status === 'rejected') {
                                                                return { name: 'Discovery Tool', status: model.discovery_status };
                                                            }
                                                            if (model.brand_status === 'in_progress' || model.brand_status === 'in_review' || model.brand_status === 'rejected') {
                                                                return { name: 'Brand Stacks', status: model.brand_status };
                                                            }
                                                            if (model.exclude_status === 'in_progress' || model.exclude_status === 'in_review' || model.exclude_status === 'rejected') {
                                                                return { name: 'Exclude Flag', status: model.exclude_status };
                                                            }
                                                            if (model.eda_email_status === 'approved') {
                                                                return { name: 'Completed', status: 'completed' }
                                                            }
                                                            return { name: 'Exclude Flag', status: model.exclude_status || 'not_started' };
                                                        };

                                                        const stageInfo = getActiveStageInfo(model);

                                                        let badgeClass = 'bg-slate-100 text-slate-600';
                                                        let dotClass = 'bg-slate-400';
                                                        let label = stageInfo.status;

                                                        if (stageInfo.status === 'approved' || stageInfo.status === 'completed') {
                                                            badgeClass = 'bg-emerald-100 text-emerald-700';
                                                            dotClass = 'bg-emerald-500';
                                                            label = 'APPROVED';
                                                        } else if (stageInfo.status === 'in_review') {
                                                            badgeClass = 'bg-amber-100 text-amber-700';
                                                            dotClass = 'bg-amber-500 animate-pulse';
                                                            label = 'UNDER REVIEW';
                                                        } else if (stageInfo.status === 'rejected') {
                                                            badgeClass = 'bg-rose-100 text-rose-700';
                                                            dotClass = 'bg-rose-500';
                                                            label = 'REJECTED';
                                                        } else if (stageInfo.status === 'in_progress') {
                                                            badgeClass = 'bg-blue-100 text-blue-700';
                                                            dotClass = 'bg-blue-500 animate-pulse';
                                                            label = 'IN PROGRESS';
                                                        } else {
                                                            label = 'DRAFT';
                                                        }

                                                        return (
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
                                                                {stageInfo.name} - {label}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">{model.model_name}</h3>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    <span className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                        Type: {model.model_type}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 mb-6 truncate">
                                                    Created {new Date(model.created_at).toLocaleDateString()}
                                                </p>
                                                <div className="flex items-center gap-2 text-indigo-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-200">
                                                    Open Data Hub
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                        <polyline points="12 5 19 12 12 19"></polyline>
                                                    </svg>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </NavLink>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (window.confirm(`Are you sure you want to delete "${model.model_name}"?`)) {
                                                handleDeleteModel(model.model_id);
                                            }
                                        }}
                                        className="absolute top-4 right-4 p-2.5 bg-white/80 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20 shadow-sm border border-transparent hover:border-rose-100 backdrop-blur-sm"
                                        title="Delete Model"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-20 text-center shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-100 shadow-sm">
                                <svg className="text-slate-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">No Models Created</h3>
                            <p className="text-slate-500 mb-6">Start by creating a new modeling project to begin the ETL & EDA process.</p>
                            <NavLink to="/create-model" className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 transition-all duration-200">
                                Create First Model
                            </NavLink>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
