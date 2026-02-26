import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import { uploadCsv, fetchLatestFile, getApiBaseUrl } from '../api/kickoff';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const FILE_TYPES = [
    { id: 'exclude_flags', name: 'Exclude Flags Raw Data', category: 'exclude_flags_raw', description: 'Raw data for subcategory inclusion/exclusion analysis.' },
    { id: 'brand_stacks', name: 'Brand Stacks Raw Data', category: 'brand_stacks_raw', description: 'Raw data for creating aggregated brand stacks.' },
    { id: 'discovery_tool', name: 'Discovery Tool Raw Data', category: 'discovery_tool_raw', description: 'Raw data for trend analysis and comparison.' },
    { id: 'tool_review', name: 'Tool Review Raw Data', category: 'tool_review_raw', description: 'Raw data for tactic merging and capping adjustments.' },
    { id: 'email_report', name: 'Email Report Raw Data', category: 'email_report_raw', description: 'Raw data for generating the final EDA summary report.' },
];

export default function EdaDataHub() {
    const step = steps.find((s) => s.slug === 'eda-data-hub');
    const { token } = useAuth();
    const [files, setFiles] = useState({});
    const [uploading, setUploading] = useState({});
    const [models, setModels] = useState([]);
    const [selectedModelId, setSelectedModelId] = useState(localStorage.getItem('active_model_id') || '');
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    useEffect(() => {
        loadModels();
    }, []);

    useEffect(() => {
        if (selectedModelId) {
            FILE_TYPES.forEach(type => {
                loadLatestFile(type.category);
            });
        }
    }, [selectedModelId]);

    const loadModels = async () => {
        setIsLoadingModels(true);
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/models`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setModels(data);
            if (data.length > 0 && !selectedModelId) {
                setSelectedModelId(data[0].model_id.toString());
                localStorage.setItem('active_model_id', data[0].model_id);
            }
        } catch (error) {
            console.error('Error fetching models:', error);
        } finally {
            setIsLoadingModels(false);
        }
    };

    const loadLatestFile = async (category) => {
        try {
            const latest = await fetchLatestFile(category, token, selectedModelId);
            if (latest) {
                setFiles(prev => ({ ...prev, [category]: latest }));
            }
        } catch (error) {
            console.error(`Error fetching file for ${category}:`, error);
        }
    };

    const handleFileUpload = async (event, category) => {
        const filesToUpload = Array.from(event.target.files);
        if (filesToUpload.length === 0) return;

        setUploading(prev => ({ ...prev, [category]: true }));
        try {
            // Upload all selected files sequentially or in parallel
            for (const file of filesToUpload) {
                await uploadCsv(file, category, token, selectedModelId);
            }
            await loadLatestFile(category);

            // Allow success message if multiple files were uploaded
            if (filesToUpload.length > 1) {
                alert(`Successfully uploaded ${filesToUpload.length} files for ${category}.`);
            }
        } catch (error) {
            console.error(`Upload failed for ${category}:`, error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setUploading(prev => ({ ...prev, [category]: false }));
            // Reset the input value so the same file(s) can be selected again if needed
            event.target.value = '';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full bg-slate-50/30"
        >
            <PageHeader
                title={step.name}
                subtitle="Centralized repository for all raw data files required for EDA analytical steps."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
            >
                <StatusBadge status="in_progress" />
            </PageHeader>

            <div className="px-6 pb-12 space-y-6 mt-6">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="card shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="card-header border-b border-slate-100 bg-white rounded-t-xl px-6 py-5">
                        <div className="card-title text-emerald-900 m-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3 shadow-sm border border-emerald-100">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                                </svg>
                            </div>
                            Select Active Model
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center rounded-b-xl shadow-inner">
                        <div className="w-full md:w-80">
                            <select
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold text-slate-700 shadow-sm bg-white cursor-pointer transition-all outline-none"
                                value={selectedModelId}
                                onChange={(e) => {
                                    setSelectedModelId(e.target.value);
                                    localStorage.setItem('active_model_id', e.target.value);
                                }}
                                disabled={isLoadingModels}
                            >
                                <option value="">-- Select Model --</option>
                                {models.map(m => (
                                    <option key={m.model_id} value={m.model_id}>{m.model_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            {selectedModelId ? "Currently uploading for the selected model." : "Please select a model to see previously uploaded files."}
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="card shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="card-header border-b border-slate-100 bg-white rounded-t-xl px-6 py-5">
                        <div className="card-title text-indigo-900 m-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 shadow-sm border border-indigo-100">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                            </div>
                            Centralized File Management
                        </div>
                    </div>

                    <div className="overflow-x-auto p-0">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50 border-b-2 border-slate-200">Data Category</th>
                                    <th className="px-6 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50 border-b-2 border-slate-200">Description</th>
                                    <th className="px-6 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50 border-b-2 border-slate-200">Latest File</th>
                                    <th className="px-6 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50 border-b-2 border-slate-200">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50 border-b-2 border-slate-200 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {FILE_TYPES.map((type, index) => (
                                    <motion.tr
                                        key={type.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: 0.3 + (index * 0.05) }}
                                        className="hover:bg-slate-50/80 transition-colors group"
                                    >
                                        <td className="px-6 py-4 font-bold text-slate-800 text-sm">{type.name}</td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-normal max-w-xs leading-relaxed">{type.description}</td>
                                        <td className="px-6 py-4">
                                            {files[type.category] ? (
                                                <div className="flex items-center text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg w-fit border border-slate-200">
                                                    <svg className="mr-2 text-indigo-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
                                                    {files[type.category].file_name}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic text-sm font-medium">No file uploaded</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={files[type.category] ? 'uploaded' : 'not_started'} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center">
                                                {uploading[type.category] ? (
                                                    <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                                        <div className="w-3.5 h-3.5 border-2 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
                                                        Uploading...
                                                    </div>
                                                ) : (
                                                    <label className="inline-flex items-center justify-center px-4 py-2 bg-white border-2 border-slate-200 hover:border-indigo-400 text-slate-700 hover:text-indigo-700 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm hover:bg-indigo-50 group-hover:shadow group-hover:-translate-y-0.5 outline-none">
                                                        <svg className="mr-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                                        {files[type.category] ? 'Update Data' : 'Upload Data'}
                                                        <input
                                                            type="file"
                                                            accept={type.category === 'brand_stacks_raw' ? ".parquet,.csv" : ".csv"}
                                                            multiple={type.category === 'brand_stacks_raw'}
                                                            onChange={(e) => handleFileUpload(e, type.category)}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm shadow-sm"
                >
                    <div className="mt-0.5 text-amber-500">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    </div>
                    <div>
                        <strong className="font-extrabold block mb-0.5">Note on Data Uploads</strong>
                        Uploading a new file for a category will overwrite the previous version. Subsequent EDA steps will always use the latest version available here.
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
