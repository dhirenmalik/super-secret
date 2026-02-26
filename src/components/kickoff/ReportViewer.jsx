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
import DiscussionBoard from '../eda/DiscussionBoard'
import { motion, AnimatePresence } from 'framer-motion'
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

    const mappingDirty = useMemo(() => {
        return JSON.stringify(groups) !== savedGroupsSnapshot
    }, [groups, savedGroupsSnapshot])

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
        <AnimatePresence mode="wait">
            {!fileId ? (
                <motion.div
                    key="gallery"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8 py-4"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Analysis Gallery</h2>
                            <p className="text-sm text-slate-500">Select a report to view detailed sub-category optimizations and model groups.</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-2xl font-black text-slate-800 tracking-tight">{reports.length}</div>
                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">Reports</div>
                            </div>
                            <div className="h-10 w-px bg-slate-200" />
                            {mode === 'modeler' && (
                                <button
                                    onClick={() => onAction('create')}
                                    className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200/50 flex items-center gap-2 hover:-translate-y-0.5"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    New Analysis
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {reports.map((report, index) => (
                            <motion.div
                                key={report.file_id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                onClick={() => setFileId(report.file_id.toString())}
                                className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-200 transition-all cursor-pointer hover:-translate-y-1 overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                        </svg>
                                    </div>
                                    <StatusBadge status={report.status || 'uploaded'} />
                                </div>
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-900 transition-colors">
                                        {report.file_category || 'Untitled Analysis'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-2 font-medium">
                                        Uploaded {new Date(report.uploaded_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                                    <span className="px-2.5 py-1 text-[10px] font-extrabold bg-indigo-50 text-indigo-600 rounded uppercase tracking-wider">EDA Phase</span>
                                    <span className="text-indigo-600 text-sm font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                        View <span aria-hidden="true">&rarr;</span>
                                    </span>
                                </div>

                                {mode === 'modeler' && (
                                    <button
                                        onClick={(e) => handleDeleteReport(e, report.file_id)}
                                        className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/80 backdrop-blur border border-rose-100 text-rose-500 opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-rose-500 hover:text-white"
                                        title="Delete"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                    </button>
                                )}
                            </motion.div>
                        ))}

                        {reports.length === 0 && (
                            <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-3xl">📭</div>
                                <h3 className="text-lg font-bold text-slate-800">No analyses yet</h3>
                                <p className="text-sm text-slate-500 mt-2 font-medium">Ready to start? Upload your first CSV to generate insight.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    key="report"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 min-w-0"
                >
                    <div className="card shadow-sm border-0 p-0 overflow-hidden bg-white">
                        <div className="p-8 border-b border-slate-100">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={() => setFileId('')}
                                        className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-500 hover:text-slate-800 group shadow-sm disabled:opacity-50"
                                        title="Back to Gallery"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
                                            <line x1="19" y1="12" x2="5" y2="12"></line>
                                            <polyline points="12 19 5 12 12 5"></polyline>
                                        </svg>
                                    </button>
                                    <div className="h-12 w-px bg-slate-100 hidden md:block" />
                                    <div className="flex items-center gap-5">
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                                {currentReport?.file_category || 'Analysis Details'}
                                            </h2>
                                            <p className="text-sm font-medium text-slate-500 mt-1">
                                                Subcategory research and model group optimization.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <StatusBadge status={currentReport?.status || 'uploaded'} />
                                    <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                                    <button
                                        onClick={() => handleSheetChange('discussion')}
                                        className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 hover:bg-amber-100 hover:border-amber-300 hover:shadow-md transition-all outline-none"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                                            Feedback
                                        </span>
                                    </button>
                                </div>
                            </div>
                            <SheetsTabs
                                tabs={SHEETS}
                                activeId={activeSheet}
                                onChange={handleSheetChange}
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                key={activeSheet}
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                transition={{ duration: 0.25 }}
                            >
                                {activeSheet === 'l2-summary' && (
                                    <div className="card shadow-sm border-0">
                                        <L2SummarySheet
                                            summaryProps={summaryProps}
                                            hasFile={Boolean(fileId)}
                                        />
                                    </div>
                                )}

                                {activeSheet === 'model-grouping' && (
                                    <div className="card shadow-sm border-0">
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
                                    <div className="card shadow-sm border-0">
                                        <L3AnalysisSheet
                                            hasFile={Boolean(fileId)}
                                            fileId={fileId}
                                            token={token}
                                        />
                                    </div>
                                )}

                                {activeSheet === 'correlation' && (
                                    <div className="card shadow-sm border-0">
                                        <CorrelationSheet hasFile={Boolean(fileId)} fileId={fileId} token={token} />
                                    </div>
                                )}

                                {activeSheet === 'charts' && (
                                    <div className="card shadow-sm border-0">
                                        <ChartsSheet hasFile={Boolean(fileId)} fileId={fileId} token={token} />
                                    </div>
                                )}

                                {activeSheet === 'model-group-sales' && (
                                    <div className="card shadow-sm border-0">
                                        <ModelGroupSalesSheet hasFile={Boolean(fileId)} fileId={fileId} token={token} />
                                    </div>
                                )}

                                {activeSheet === 'discussion' && (
                                    <div className="card shadow-sm border-0">
                                        <DiscussionBoard fileId={fileId} />
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
