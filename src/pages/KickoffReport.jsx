import React, { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import steps from '../data/steps'
import {
    uploadCsv,
    fetchLatestFile,
    fetchFiles,
} from '../api/kickoff'
import { useAuth } from '../context/AuthContext'
import ReportViewer from '../components/kickoff/ReportViewer'

export default function KickoffReport() {
    const step = steps.find((s) => s.id === 4)
    const { token } = useAuth()
    const [fileId, setFileId] = useState('')
    const [reports, setReports] = useState([])
    const [isReportsLoading, setIsReportsLoading] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newReportName, setNewReportName] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [error, setError] = useState('')
    const [isUploading, setIsUploading] = useState(false)

    const loadReports = async () => {
        setIsReportsLoading(true)
        try {
            const data = await fetchFiles(token)
            setReports(data || [])
        } catch (err) {
            console.error('Failed to load reports:', err)
        } finally {
            setIsReportsLoading(false)
        }
    }

    // Restore state from backend if localStorage is empty or just to verify
    useEffect(() => {
        loadReports()
    }, [])



    const handleFileChange = (event) => {
        const file = event.target.files?.[0] || null
        setSelectedFile(file)
        setError('')
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Select a CSV file before uploading.')
            return
        }

        if (!newReportName.trim()) {
            setError('Please enter an analysis name.')
            return
        }

        setIsUploading(true)
        setError('')
        try {
            const uploadResponse = await uploadCsv(selectedFile, newReportName, token)
            const newId = uploadResponse.file_id.toString()
            setFileId(newId)
            setNewReportName('')
            setIsCreating(false)
            setSelectedFile(null)
            await loadReports()
        } catch (uploadError) {
            setError(uploadError.message || 'Upload failed.')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/30">
            <PageHeader
                title={step.name}
                subtitle="Develop reports based on categories & sub-categories, their correlations, and suggest model groups."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
            >
                <StatusBadge status="in_progress" />
            </PageHeader>

            <div className="px-6 pb-12">
                {isCreating ? (
                    <div className="card slide-in">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">New Category Analysis</h2>
                                <p className="text-sm text-slate-500">Configure your report settings and upload the source dataset.</p>
                            </div>
                            <button
                                onClick={() => setIsCreating(false)}
                                className="text-sm text-slate-400 hover:text-slate-600 font-medium"
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="max-w-2xl space-y-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest">
                                    Analysis Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Grocery - Q1 2025"
                                    value={newReportName}
                                    onChange={(e) => setNewReportName(e.target.value)}
                                    className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-lg bg-slate-50/30"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest">
                                    Data Source
                                </label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        id="file-upload"
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="flex flex-col items-center justify-center w-full py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 group-hover:bg-white group-hover:border-blue-300 transition-all cursor-pointer"
                                    >
                                        <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">📄</span>
                                        <span className="text-sm font-bold text-slate-700 mb-1">
                                            {selectedFile ? selectedFile.name : 'Choose CSV File...'}
                                        </span>
                                        <span className="text-xs text-slate-400">CSV files supported up to 50MB</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4">
                                {error && (
                                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3">
                                        <span>⚠️</span> {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Processing Analysis...
                                        </>
                                    ) : (
                                        'Initialize Analysis'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <ReportViewer
                        fileId={fileId}
                        setFileId={setFileId}
                        reports={reports}
                        loadReports={loadReports}
                        isReportsLoading={isReportsLoading}
                        onAction={(action) => action === 'create' && setIsCreating(true)}
                    />
                )}
            </div>
        </div>
    )
}
