import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import { fetchFiles, fetchLatestFile, updateReportStatus } from '../api/kickoff';
import ReportViewer from '../components/kickoff/ReportViewer';

export default function KickoffReportReview() {
    const step = steps.find((s) => s.slug === 'kickoff-report-review');
    const [fileId, setFileId] = useState('');
    const [reports, setReports] = useState([]);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const loadReports = async () => {
        try {
            const data = await fetchFiles();
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
        <div className="flex flex-col h-full bg-slate-50/30">
            <PageHeader
                title={step.name}
                subtitle="Review model groupings, discuss sub-category shifts, and finalize model groups with Walmart."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
            >
                <div className="flex items-center gap-3">
                    <StatusBadge status={currentReport?.status || 'uploaded'} />
                    {fileId && (
                        <div className="flex items-center gap-2 border-l border-slate-200 pl-3 ml-1">
                            <button
                                onClick={() => handleStatusUpdate('approved')}
                                disabled={isActionLoading}
                                className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('rejected')}
                                disabled={isActionLoading}
                                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
                            >
                                Reject
                            </button>
                        </div>
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
        </div>
    );
}
