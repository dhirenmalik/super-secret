import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import { uploadCsv, fetchLatestFile } from '../api/kickoff';
import { useAuth } from '../context/AuthContext';

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

    useEffect(() => {
        FILE_TYPES.forEach(type => {
            loadLatestFile(type.category);
        });
    }, []);

    const loadLatestFile = async (category) => {
        try {
            const latest = await fetchLatestFile(category, token);
            if (latest) {
                setFiles(prev => ({ ...prev, [category]: latest }));
            }
        } catch (error) {
            console.error(`Error fetching file for ${category}:`, error);
        }
    };

    const handleFileUpload = async (event, category) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(prev => ({ ...prev, [category]: true }));
        try {
            await uploadCsv(file, category, token);
            await loadLatestFile(category);
        } catch (error) {
            console.error(`Upload failed for ${category}:`, error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setUploading(prev => ({ ...prev, [category]: false }));
        }
    };

    return (
        <div className="eda-data-hub">
            <PageHeader
                title={step.name}
                subtitle="Centralized repository for all raw data files required for EDA analytical steps."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
            >
                <StatusBadge status="in_progress" />
            </PageHeader>

            <div className="card" style={{ marginTop: '24px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon blue">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        Centralized File Management
                    </div>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Data Category</th>
                                <th>Description</th>
                                <th>Latest File</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {FILE_TYPES.map((type) => (
                                <tr key={type.id}>
                                    <td style={{ fontWeight: 600 }}>{type.name}</td>
                                    <td style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '300px' }}>{type.description}</td>
                                    <td>
                                        {files[type.category] ? (
                                            <div className="flex items-center">
                                                <svg className="mr-2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
                                                {files[type.category].file_name}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic text-sm">No file uploaded</span>
                                        )}
                                    </td>
                                    <td>
                                        <StatusBadge status={files[type.category] ? 'uploaded' : 'not_started'} />
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="flex justify-end items-center">
                                            {uploading[type.category] ? (
                                                <div className="loading-spinner-small"></div>
                                            ) : (
                                                <label className="secondary-button" style={{ cursor: 'pointer', margin: 0, padding: '6px 12px', fontSize: '13px' }}>
                                                    <svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                                    {files[type.category] ? 'Update' : 'Upload'}
                                                    <input
                                                        type="file"
                                                        accept=".csv"
                                                        onChange={(e) => handleFileUpload(e, type.category)}
                                                        style={{ display: 'none' }}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card-note" style={{ marginTop: '20px' }}>
                <div className="card-note-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
                <div>
                    <strong>Note:</strong> Uploading a new file for a category will overwrite the previous version. Subsequent EDA steps will always use the latest version available here.
                </div>
            </div>
        </div>
    );
}
