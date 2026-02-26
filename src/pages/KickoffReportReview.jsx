import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import { fetchFiles, fetchLatestFile, updateReportStatus } from '../api/kickoff';
import ReportViewer from '../components/kickoff/ReportViewer';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function KickoffReportReview() {
    const { token } = useAuth();
    const step = steps.find((s) => s.slug === 'kickoff-report-review');
    const [fileId, setFileId] = useState('');
    const [reports, setReports] = useState([]);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const loadReports = async () => {
        try {
            const data = await fetchFiles(true, token);
            setReports(data || []);
        } catch (err) {
            console.error('Failed to load reports:', err);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const handleStatusUpdate = async (status) => {
        if (!fileId) return;
        setIsActionLoading(true);
        try {
            await updateReportStatus(fileId, status);
            await loadReports();
        } catch (err) {
            alert(err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const currentReport = reports.find(r => r.file_id.toString() === fileId.toString());

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full bg-slate-50/30"
        >
            <PageHeader
                title={step.name}
                subtitle="Review model groupings, discuss sub-category shifts, and finalize model groups with Enterprise."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
            >
                <div className="flex items-center gap-4">
                    <StatusBadge status={currentReport?.status || 'uploaded'} />
                    {fileId && (
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 border-l border-slate-200 pl-4"
                        >
                            <button
                                onClick={() => handleStatusUpdate('approved')}
                                disabled={isActionLoading}
                                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200/50 hover:-translate-y-0.5 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isActionLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                )}
                                Approve
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('rejected')}
                                disabled={isActionLoading}
                                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-rose-600 text-sm font-bold hover:bg-rose-50 hover:border-rose-200 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                Reject
                            </button>
                        </motion.div>
                    )}
                </div>
            </PageHeader>

            <div className="px-6 pb-12">
                <ReportViewer
                    fileId={fileId}
                    setFileId={setFileId}
                    reports={reports}
                    loadReports={loadReports}
                    mode="reviewer"
                />
            </div>
        </motion.div>
    );
}
