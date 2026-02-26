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
import { motion, AnimatePresence } from 'framer-motion'

export default function KickoffReport() {
    const step = steps.find((s) => s.slug === 'kickoff-report')
    const { token } = useAuth()
    const [fileId, setFileId] = useState('')
    const [reports, setReports] = useState([])
    const [isReportsLoading, setIsReportsLoading] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newReportName, setNewReportName] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [error, setError] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [models, setModels] = useState([])
    const [activeModelId, setActiveModelId] = useState(localStorage.getItem('active_model_id') || '')

    const loadModels = async () => {
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/models`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setModels(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching models:', error);
        }
    };

    useEffect(() => {
        loadModels();
    }, []);

    const loadReports = async () => {
        setIsReportsLoading(true)
        try {
            const data = await fetchFiles(true, token)
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
            const uploadResponse = await uploadCsv(selectedFile, newReportName, token, null, true)
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full bg-slate-50/30"
        >
            <PageHeader
                title={step.name}
                subtitle="Develop reports based on categories & sub-categories, their correlations, and suggest model groups."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
                activeModelId={activeModelId}
                models={models}
                onModelSwitch={() => {
                    setActiveModelId('');
                    localStorage.removeItem('active_model_id');
                }}
            >
                <StatusBadge status="in_progress" />
            </PageHeader>

            <div className="px-6 pb-12">
                <AnimatePresence mode="wait">
                    {isCreating ? (
                        <motion.div
                            key="create"
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -15 }}
                            transition={{ duration: 0.3 }}
                            className="card shadow-md border-0 bg-white"
                        >
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="12" y1="18" x2="12" y2="12" />
                                            <line x1="9" y1="15" x2="15" y2="15" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">New Category Analysis</h2>
                                        <p className="text-sm text-slate-500">Configure your report settings and upload the source dataset.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>

                            <div className="max-w-2xl space-y-8">
                                <div className="space-y-3">
                                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest pl-1">
                                        Analysis Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Grocery - Q1 2025"
                                        value={newReportName}
                                        onChange={(e) => setNewReportName(e.target.value)}
                                        className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg bg-slate-50/50 shadow-sm font-medium text-slate-800 placeholder-slate-400"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest pl-1">
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
                                            className="flex flex-col items-center justify-center w-full py-12 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/30 hover:bg-indigo-50/80 hover:border-indigo-400 transition-all cursor-pointer group"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-indigo-500 group-hover:scale-110 group-hover:text-indigo-600 transition-transform duration-300">
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="17 8 12 3 7 8" />
                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                </svg>
                                            </div>
                                            <span className="text-base font-bold text-slate-700 mb-1 group-hover:text-indigo-900 transition-colors">
                                                {selectedFile ? selectedFile.name : 'Choose CSV File...'}
                                            </span>
                                            <span className="text-sm font-medium text-slate-400">CSV files supported up to 50MB</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-3"
                                        >
                                            <span className="text-red-500">⚠️</span> {error}
                                        </motion.div>
                                    )}

                                    <button
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                        className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200/50 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:-translate-y-0.5"
                                    >
                                        {isUploading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Processing Analysis...
                                            </>
                                        ) : (
                                            <>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                </svg>
                                                Initialize Analysis
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="viewer"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ReportViewer
                                fileId={fileId}
                                setFileId={setFileId}
                                reports={reports}
                                loadReports={loadReports}
                                isReportsLoading={isReportsLoading}
                                onAction={(action) => action === 'create' && setIsCreating(true)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
