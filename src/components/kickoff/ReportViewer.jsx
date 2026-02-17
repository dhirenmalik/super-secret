import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../StatusBadge'
import SheetsTabs from './SheetsTabs'
import L2SummarySheet from './L2SummarySheet'
import ModelGroupingSheet from './ModelGroupingSheet'
import L3AnalysisSheet from './L3AnalysisSheet'
import CorrelationSheet from './CorrelationSheet'
import ChartsSheet from './ChartsSheet'
import ModelGroupSalesSheet from './ModelGroupSalesSheet'
import {
    fetchSubcategorySummary,
    fetchL2Values,
    fetchModelGroups,
    saveModelGroups,
    previewAutoModelGroups,
    applyAutoModelGroups,
    fetchFiles,
    deleteFile,
} from '../../api/kickoff'

const SHEETS = [
    { id: 'l2-summary', label: 'L2 Summary' },
    { id: 'model-grouping', label: 'Model Grouping' },
    { id: 'l3-analysis', label: 'L3 Analysis' },
    { id: 'correlation', label: 'Correlation' },
    { id: 'charts', label: 'Charts' },
    { id: 'model-group-sales', label: 'Model Group Sales' },
    { id: 'discussion', label: 'Discussion' },
]

export default function ReportViewer({
    fileId,
    setFileId,
    reports,
    loadReports,
    mode = 'modeler', // 'modeler' or 'reviewer'
    onAction = () => { }
}) {
    const { token } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const activeSheet = SHEETS.some((sheet) => sheet.id === searchParams.get('sheet'))
        ? searchParams.get('sheet')
        : 'l2-summary'

    const [summary, setSummary] = useState(null)
    const [summaryError, setSummaryError] = useState('')
    const [isSummaryLoading, setIsSummaryLoading] = useState(false)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [groupBy, setGroupBy] = useState('l2')
    const [autoBucket, setAutoBucket] = useState(false)

    const [l2Values, setL2Values] = useState([])
    const [groups, setGroups] = useState([])
    const [mappingError, setMappingError] = useState('')
    const [mappingSaving, setMappingSaving] = useState(false)
    const [mappingSavedMessage, setMappingSavedMessage] = useState('')
    const [savedGroupsSnapshot, setSavedGroupsSnapshot] = useState('[]')
    const [historicalGroups, setHistoricalGroups] = useState([])
    const [autoGroupingStatus, setAutoGroupingStatus] = useState({
        loading: false,
        error: '',
        successMessage: '',
        unassigned: [],
        warnings: [],
    })
    const autoGroupingPath = 'data/Subcat Output/Subcat_Output.csv'

    const [comments, setComments] = useState([])
    const [isCommentsLoading, setIsCommentsLoading] = useState(false)
    const [newComment, setNewComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const mappingDirty = useMemo(() => {
        return JSON.stringify(groups) !== savedGroupsSnapshot
    }, [groups, savedGroupsSnapshot])

    const loadComments = async (id) => {
        if (!id) return;
        setIsCommentsLoading(true)
        try {
            const { fetchComments } = await import('../../api/kickoff')
            const data = await fetchComments(id, token)
            setComments(data || [])
        } catch (err) {
            console.error('Failed to load comments:', err)
        } finally {
            setIsCommentsLoading(false)
        }
    }

    const handleAddComment = async () => {
        if (!fileId || !newComment.trim()) return
        setIsSubmitting(true)
        try {
            const { addComment } = await import('../../api/kickoff')
            await addComment(fileId, newComment, token)
            setNewComment('')
            await loadComments(fileId)
        } catch (err) {
            console.error('Failed to add comment:', err)
        } finally {
            setIsSubmitting(false)
        }
    }

    useEffect(() => {
        if (!fileId) {
            return
        }

        const loadMappingData = async () => {
            try {
                const [l2Response, mappingResponse] = await Promise.all([
                    fetchL2Values(fileId, token),
                    fetchModelGroups(fileId, token),
                ])
                setL2Values(l2Response.l2_values || [])
                setGroups(mappingResponse.groups || [])
                setSavedGroupsSnapshot(JSON.stringify(mappingResponse.groups || []))
                setMappingError('')
            } catch (err) {
                setMappingError(err.message || 'Unable to load model groups.')
            }
        }

        loadMappingData()
        loadComments(fileId)
    }, [fileId])

    useEffect(() => {
        const desiredGroupBy = activeSheet === 'model-grouping' ? 'model_group' : 'l2'
        setGroupBy(desiredGroupBy)
        if (fileId) {
            fetchSummary(fileId, {}, desiredGroupBy)
        }
    }, [activeSheet])

    const fetchSummary = async (
        uploadedFileId,
        range = {},
        groupOverride,
        autoBucketOverride,
    ) => {
        if (!uploadedFileId) {
            return
        }
        const targetGroupBy = groupOverride ?? groupBy
        const targetAutoBucket = autoBucketOverride ?? autoBucket
        setIsSummaryLoading(true)
        setSummaryError('')
        try {
            const summaryResponse = await fetchSubcategorySummary(uploadedFileId, {
                startDate: (range.startDate ?? startDate) || undefined,
                endDate: (range.endDate ?? endDate) || undefined,
                groupBy: targetGroupBy,
                autoBucket: targetGroupBy === 'model_group' ? targetAutoBucket : false,
            }, token)
            setSummary(summaryResponse)
        } catch (summaryError) {
            setSummaryError(summaryError.message || 'Summary failed.')
            setSummary(null)
        } finally {
            setIsSummaryLoading(false)
        }
    }

    const handleDeleteReport = async (e, id) => {
        e.stopPropagation()
        if (!window.confirm('Are you sure you want to delete this analysis? All data will be permanently removed.')) {
            return
        }

        try {
            await deleteFile(id, token)
            if (fileId === id.toString()) {
                setFileId('')
                setSummary(null)
            }
            await loadReports()
        } catch (err) {
            console.error('Failed to delete report:', err)
        }
    }

    const handleApplyDateRange = async () => {
        if (!fileId) {
            setSummaryError('Upload a CSV before applying a date range.')
            return
        }
        await fetchSummary(fileId)
    }

    const handleResetDateRange = async () => {
        setStartDate('')
        setEndDate('')
        if (fileId) {
            await fetchSummary(fileId, { startDate: undefined, endDate: undefined })
        }
    }

    const handleQuickRange = async (monthsBack, monthsWindow = null) => {
        if (!summary?.date_bounds?.max) {
            setSummaryError('Date bounds unavailable for quick range.')
            return
        }
        const maxDate = new Date(summary.date_bounds.max)
        const start = new Date(maxDate)
        start.setMonth(start.getMonth() - monthsBack)

        let end = maxDate
        if (monthsWindow !== null) {
            end = new Date(maxDate)
            end.setMonth(end.getMonth() - monthsBack + monthsWindow)
        }

        const startIso = start.toISOString().slice(0, 10)
        const endIso = end.toISOString().slice(0, 10)

        setStartDate(startIso)
        setEndDate(endIso)
        await fetchSummary(fileId, { startDate: startIso, endDate: endIso })
    }

    const handleSaveGroups = async () => {
        if (!fileId) {
            return
        }
        setMappingSaving(true)
        setMappingSavedMessage('')
        try {
            const saved = await saveModelGroups(fileId, groups, token)
            setGroups(saved.groups || [])
            setSavedGroupsSnapshot(JSON.stringify(saved.groups || []))
            setMappingSavedMessage('Saved')
            await fetchSummary(fileId, {}, groupBy)
        } catch (err) {
            setMappingError(err.message || 'Unable to save model groups')
        } finally {
            setMappingSaving(false)
            setTimeout(() => setMappingSavedMessage(''), 2000)
        }
    }

    const handleAutoBucketToggle = async () => {
        const next = !autoBucket
        setAutoBucket(next)
        if (fileId && groupBy === 'model_group') {
            await fetchSummary(fileId, {}, 'model_group', next)
        }
    }

    const handleAutoGroupingPreview = async () => {
        if (!fileId) {
            return
        }
        setAutoGroupingStatus((prev) => ({
            ...prev,
            loading: true,
            error: '',
            successMessage: '',
        }))
        try {
            const response = await previewAutoModelGroups(fileId, autoGroupingPath, token)
            setGroups(response.groups || [])
            setHistoricalGroups(response.historical_groups || [])
            setAutoGroupingStatus((prev) => ({
                ...prev,
                loading: false,
                unassigned: response.unassigned_l2 || [],
                warnings: response.warnings || [],
            }))
        } catch (err) {
            setAutoGroupingStatus((prev) => ({
                ...prev,
                loading: false,
                error: err.message || 'Auto grouping failed',
            }))
        }
    }

    const handleAutoGroupingApply = async () => {
        if (!fileId) {
            return
        }
        setAutoGroupingStatus((prev) => ({
            ...prev,
            loading: true,
            error: '',
            successMessage: '',
        }))
        try {
            const response = await applyAutoModelGroups(fileId, autoGroupingPath, true, token)
            setGroups(response.groups || [])
            setSavedGroupsSnapshot(JSON.stringify(response.groups || []))
            setHistoricalGroups(response.historical_groups || [])
            setAutoGroupingStatus((prev) => ({
                ...prev,
                loading: false,
                unassigned: response.unassigned_l2 || [],
                warnings: response.warnings || [],
                successMessage: 'Applied & saved',
            }))
            await fetchSummary(fileId, {}, 'model_group')
            setTimeout(
                () =>
                    setAutoGroupingStatus((prev) => ({
                        ...prev,
                        successMessage: '',
                    })),
                2000,
            )
        } catch (err) {
            setAutoGroupingStatus((prev) => ({
                ...prev,
                loading: false,
                error: err.message || 'Auto grouping failed',
            }))
        }
    }

    const handleSheetChange = (sheetId) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.set('sheet', sheetId)
            return next
        })
    }

    const formatCompact = (value) => {
        const absValue = Math.abs(value)
        if (absValue >= 1_000_000_000) {
            return `${(value / 1_000_000_000).toFixed(2)} Bil`
        }
        if (absValue >= 1_000_000) {
            return `${(value / 1_000_000).toFixed(2)} Mil`
        }
        if (absValue >= 1_000) {
            return `${(value / 1_000).toFixed(2)} K`
        }
        return value.toFixed(2)
    }

    const formatFull = (value) =>
        value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })

    const summaryProps = {
        summary,
        summaryError,
        isSummaryLoading,
        startDate,
        endDate,
        onStartDateChange: setStartDate,
        onEndDateChange: setEndDate,
        onApplyDateRange: handleApplyDateRange,
        onResetDateRange: handleResetDateRange,
        onQuickRange: handleQuickRange,
        autoBucket,
        onAutoBucketToggle: handleAutoBucketToggle,
        formatCompact,
        formatFull,
    }

    const mappingProps = {
        l2Values,
        groups,
        historicalGroups,
        onGroupsChange: setGroups,
        onSave: handleSaveGroups,
        isSaving: mappingSaving,
        isDirty: mappingDirty,
        saveMessage: mappingSavedMessage,
    }

    const autoGroupingProps = {
        onPreview: handleAutoGroupingPreview,
        onApply: handleAutoGroupingApply,
        loading: autoGroupingStatus.loading,
        error: autoGroupingStatus.error,
        unassignedCount: autoGroupingStatus.unassigned.length,
        warnings: autoGroupingStatus.warnings,
        successMessage: autoGroupingStatus.successMessage,
    }

    const currentReport = reports.find(r => r.file_id.toString() === fileId.toString())

    return (
        <div className="space-y-6">

            {/* Main Content Area */}
            <div className="space-y-6 min-w-0">
                {!fileId ? (
                    <div className="space-y-8 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Analysis Gallery</h2>
                                <p className="text-sm text-slate-500">Select a report to view detailed sub-category optimizations and model groups.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-slate-900">{reports.length}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reports</div>
                                </div>
                                <div className="h-10 w-px bg-slate-200" />
                                {mode === 'modeler' && (
                                    <button
                                        onClick={() => onAction('create')}
                                        className="p-3 px-6 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200/50 flex items-center gap-2"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                        New Analysis
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="dashboard-grid">
                            {reports.map((report) => (
                                <div
                                    key={report.file_id}
                                    onClick={() => setFileId(report.file_id.toString())}
                                    className="step-card group"
                                >
                                    <div className="step-card-header">
                                        <div className="step-card-number">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                            </svg>
                                        </div>
                                        <StatusBadge status={report.status || 'uploaded'} />
                                    </div>
                                    <div className="step-card-title">{report.file_category || 'Untitled Analysis'}</div>
                                    <div className="step-card-tasks">
                                        Uploaded {new Date(report.uploaded_at).toLocaleDateString()}
                                    </div>
                                    <div className="step-card-footer">
                                        <span className="tag tag-eda">EDA</span>
                                        <span className="text-[13px] color-primary font-bold group-hover:translate-x-1 transition-transform" style={{ color: 'var(--color-primary)' }}>
                                            View Report →
                                        </span>
                                    </div>
                                    {mode === 'modeler' && (
                                        <button
                                            onClick={(e) => handleDeleteReport(e, report.file_id)}
                                            className="absolute top-4 right-4 p-2 rounded-xl bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition shadow-sm border border-red-100 hover:bg-red-500 hover:text-white"
                                            title="Delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                                        </button>
                                    )}
                                </div>
                            ))}

                            {reports.length === 0 && (
                                <div className="col-span-full card text-center py-20 border-dashed bg-slate-50/50 border-2 border-slate-200">
                                    <div className="text-4xl mb-4">📭</div>
                                    <h3 className="text-lg font-bold text-slate-900">No analyses yet</h3>
                                    <p className="text-sm text-slate-500 mt-1">Ready to start? Upload your first CSV to generate insight.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="card p-0 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 bg-white">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => setFileId('')}
                                            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition group"
                                            title="Back to Gallery"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
                                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                                <polyline points="12 19 5 12 12 5"></polyline>
                                            </svg>
                                        </button>
                                        <div className="h-10 w-px bg-slate-100" />
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-900">
                                                    {currentReport?.file_category || 'Analysis Details'}
                                                </h2>
                                                <p className="text-sm text-slate-500">
                                                    Subcategory research and model group optimization.
                                                </p>
                                            </div>
                                            {comments.length > 0 && (
                                                <button
                                                    onClick={() => handleSheetChange('discussion')}
                                                    className="px-3 py-1 bg-amber-50 border border-amber-100 rounded-full flex items-center gap-2 hover:bg-amber-100 transition shadow-sm shadow-amber-100/50"
                                                >
                                                    <span className="text-amber-600">💬</span>
                                                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                                        {comments.length} Feedback
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={currentReport?.status || 'uploaded'} />
                                    </div>
                                </div>
                                <SheetsTabs
                                    tabs={SHEETS}
                                    activeId={activeSheet}
                                    onChange={handleSheetChange}
                                />
                            </div>
                        </div>

                        <div className="slide-in">
                            {activeSheet === 'l2-summary' && (
                                <div className="card">
                                    <L2SummarySheet
                                        summaryProps={summaryProps}
                                        hasFile={Boolean(fileId)}
                                    />
                                </div>
                            )}

                            {activeSheet === 'model-grouping' && (
                                <div className="card">
                                    <ModelGroupingSheet
                                        summaryProps={summaryProps}
                                        hasFile={Boolean(fileId)}
                                        mappingProps={mappingProps}
                                        mappingError={mappingError}
                                        autoGroupingProps={autoGroupingProps}
                                    />
                                </div>
                            )}

                            {activeSheet === 'l3-analysis' && (
                                <div className="card">
                                    <L3AnalysisSheet
                                        hasFile={Boolean(fileId)}
                                        fileId={fileId}
                                        token={token}
                                    />
                                </div>
                            )}

                            {activeSheet === 'correlation' && (
                                <div className="card">
                                    <CorrelationSheet hasFile={Boolean(fileId)} fileId={fileId} token={token} />
                                </div>
                            )}

                            {activeSheet === 'charts' && (
                                <div className="card">
                                    <ChartsSheet hasFile={Boolean(fileId)} fileId={fileId} token={token} />
                                </div>
                            )}

                            {activeSheet === 'model-group-sales' && (
                                <div className="card">
                                    <ModelGroupSalesSheet hasFile={Boolean(fileId)} fileId={fileId} token={token} />
                                </div>
                            )}

                            {activeSheet === 'discussion' && (
                                <div className="card p-8 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-slate-900">Review Discussion</h3>
                                        <div className="text-sm text-slate-500">
                                            {comments.length} message{comments.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Add your reply or requested change..."
                                            className="w-full p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm bg-slate-50/30 min-h-[120px] resize-none"
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleAddComment}
                                                disabled={isSubmitting || !newComment.trim()}
                                                className="px-6 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition disabled:opacity-50"
                                            >
                                                {isSubmitting ? 'Posting...' : 'Post Reply'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-4 border-l-2 border-slate-100 pl-8 ml-4">
                                        {isCommentsLoading ? (
                                            <div className="text-center py-12">
                                                <div className="inline-block w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                                            </div>
                                        ) : comments.length === 0 ? (
                                            <div className="text-center py-12 text-slate-400 italic text-sm">
                                                No discussion started yet.
                                            </div>
                                        ) : (
                                            comments.map((comment) => (
                                                <div key={comment.comment_id} className="relative">
                                                    <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-white border-4 border-blue-500 shadow-sm shadow-blue-200"></div>
                                                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-2 hover:border-slate-200 transition">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-bold text-slate-900">{comment.user_name}</span>
                                                            <span className="text-xs text-slate-400">
                                                                {new Date(comment.created_at).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                            {comment.comment_text}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
