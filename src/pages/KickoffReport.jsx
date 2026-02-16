import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import steps from '../data/steps'
import {
    fetchSubcategorySummary,
    uploadCsv,
    fetchL2Values,
    fetchModelGroups,
    saveModelGroups,
    previewAutoModelGroups,
    applyAutoModelGroups,
} from '../api/kickoff'
import SheetsTabs from '../components/kickoff/SheetsTabs'
import L2SummarySheet from '../components/kickoff/L2SummarySheet'
import ModelGroupingSheet from '../components/kickoff/ModelGroupingSheet'
import L3AnalysisSheet from '../components/kickoff/L3AnalysisSheet'
import CorrelationSheet from '../components/kickoff/CorrelationSheet'
import ChartsSheet from '../components/kickoff/ChartsSheet'
import ModelGroupSalesSheet from '../components/kickoff/ModelGroupSalesSheet'

const SHEETS = [
    { id: 'l2-summary', label: 'L2 Summary' },
    { id: 'model-grouping', label: 'Model Grouping' },
    { id: 'l3-analysis', label: 'L3 Analysis' },
    { id: 'correlation', label: 'Correlation' },
    { id: 'charts', label: 'Charts' },
    { id: 'model-group-sales', label: 'Model Group Sales' },
]

export default function KickoffReport() {
    const step = steps.find((s) => s.id === 4)
    const [searchParams, setSearchParams] = useSearchParams()
    const activeSheet = SHEETS.some((sheet) => sheet.id === searchParams.get('sheet'))
        ? searchParams.get('sheet')
        : 'l2-summary'

    const [selectedFile, setSelectedFile] = useState(null)
    const [fileId, setFileId] = useState('')
    const [error, setError] = useState('')
    const [isUploading, setIsUploading] = useState(false)
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
                    fetchL2Values(fileId),
                    fetchModelGroups(fileId),
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

    const handleFileChange = (event) => {
        const file = event.target.files?.[0] || null
        setSelectedFile(file)
        setFileId('')
        setError('')
        setSummary(null)
        setSummaryError('')
        setL2Values([])
        setGroups([])
        setMappingError('')
        setMappingSavedMessage('')
        setHistoricalGroups([])
        setAutoGroupingStatus({
            loading: false,
            error: '',
            successMessage: '',
            unassigned: [],
            warnings: [],
        })
    }

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
            })
            setSummary(summaryResponse)
        } catch (summaryError) {
            setSummaryError(summaryError.message || 'Summary failed.')
            setSummary(null)
        } finally {
            setIsSummaryLoading(false)
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Select a CSV file before uploading.')
            return
        }

        if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
            setError('Only .csv files are supported.')
            return
        }

        setIsUploading(true)
        setError('')
        setSummary(null)
        setSummaryError('')
        try {
            const uploadResponse = await uploadCsv(selectedFile)
            setFileId(uploadResponse.file_id)
            await fetchSummary(uploadResponse.file_id, {}, groupBy)
        } catch (uploadError) {
            setError(uploadError.message || 'Upload failed.')
            setSummary(null)
        } finally {
            setIsUploading(false)
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
            const saved = await saveModelGroups(fileId, groups)
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
            const response = await previewAutoModelGroups(fileId, autoGroupingPath)
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
            const response = await applyAutoModelGroups(fileId, autoGroupingPath, true)
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

    return (
        <div>
            <PageHeader
                title={step.name}
                subtitle="Develop reports based on categories & sub-categories, their correlations, and suggest model groups."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
            >
                <StatusBadge status="in_progress" />
            </PageHeader>

            <div className="space-y-6">
                <div className="card">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div>
                            <p className="text-sm uppercase tracking-[0.1em] text-muted-foreground font-bold mb-2" style={{ color: 'var(--color-text-muted)' }}>EDA</p>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ color: 'var(--color-text)' }}>
                                Subcategory Analysis
                            </h2>
                            <p className="text-sm text-slate-500 max-w-2xl mb-6" style={{ color: 'var(--color-text-muted)' }}>
                                Upload a CSV file to kick off the subcategory analysis workflow.
                            </p>

                            <SheetsTabs
                                tabs={SHEETS}
                                activeId={activeSheet}
                                onChange={handleSheetChange}
                            />
                        </div>

                        <div className="flex flex-col gap-4 min-w-[300px]">
                            <div className="p-5 rounded-xl border border-dashed border-2 flex flex-col gap-3 items-center justify-center bg-slate-50/50" style={{ borderColor: 'var(--color-border)' }}>
                                <label className="cursor-pointer flex flex-col items-center gap-2 w-full">
                                    <span className="text-sm font-medium text-slate-600 mb-1">Source File</span>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white shadow-sm w-full justify-center transition hover:bg-slate-50" style={{ borderColor: 'var(--color-border)' }}>
                                        <span className="text-sm truncate max-w-[200px]">{selectedFile ? selectedFile.name : 'Choose CSV File...'}</span>
                                    </div>
                                </label>

                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="w-full py-2 px-4 rounded-lg text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    style={{ background: 'var(--color-primary)' }}
                                >
                                    {isUploading ? (
                                        <>
                                            <span className="animate-spin">⟳</span> Uploading...
                                        </>
                                    ) : (
                                        <>Upload & Process</>
                                    )}
                                </button>
                            </div>

                            {error && (
                                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100 flex items-center gap-2">
                                    <span>⚠️</span> {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

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
                        />
                    </div>
                )}

                {activeSheet === 'correlation' && (
                    <div className="card">
                        <CorrelationSheet hasFile={Boolean(fileId)} fileId={fileId} />
                    </div>
                )}

                {activeSheet === 'charts' && (
                    <div className="card">
                        <ChartsSheet hasFile={Boolean(fileId)} fileId={fileId} />
                    </div>
                )}

                {activeSheet === 'model-group-sales' && (
                    <div className="card">
                        <ModelGroupSalesSheet hasFile={Boolean(fileId)} fileId={fileId} />
                    </div>
                )}
            </div>
        </div>
    )
}
