import React, { useState } from 'react';
import BasePage from '../model-building/BasePage';
import StatusBadge from '../../components/StatusBadge';

export default function AutomationCode() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [generatedFiles, setGeneratedFiles] = useState([]);

    const handleGenerate = () => {
        setIsGenerating(true);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsGenerating(false);
                    setGeneratedFiles([
                        { name: 'D05 VG Software - Category WAMM Results_.pptx', size: '18.7 MB', date: 'Just now', primary: true }
                    ]);
                    return 100;
                }
                return prev + 10;
            });
        }, 300);
    };

    return (
        <BasePage stepId={28}>
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon green">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></svg>
                        </div>
                        Automation Code
                    </div>
                </div>
                <div style={{ padding: '32px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-text-light)', marginBottom: '32px', fontSize: '15px', maxWidth: '600px', margin: '0 auto 32px' }}>
                        Run the automated reporting code to generate final presentation decks and standardized result summaries.
                    </p>

                    {!isGenerating && generatedFiles.length === 0 && (
                        <button className="btn btn-primary" onClick={handleGenerate} style={{ padding: '16px 48px', fontSize: '16px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px' }}>
                                <path d="M12 2v20M5 5l7 7 7-7" />
                            </svg>
                            Run Automation
                        </button>
                    )}

                    {isGenerating && (
                        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', fontWeight: '700' }}>
                                <span style={{ color: '#16a34a' }}>Running automation...</span>
                                <span>{progress}%</span>
                            </div>
                            <div style={{ background: '#f1f5f9', height: '12px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                <div style={{ background: '#16a34a', width: `${progress}%`, height: '100%', transition: 'width 0.3s ease' }} />
                            </div>
                        </div>
                    )}

                    {generatedFiles.length > 0 && !isGenerating && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#16a34a', fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                                <div style={{ background: '#dcfce7', padding: '8px', borderRadius: '50%' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                </div>
                                Automation Complete
                            </div>
                            <button className="btn btn-secondary btn-sm" onClick={() => { setGeneratedFiles([]); setProgress(0); }}>
                                Restart Process
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {(generatedFiles.length > 0 || isGenerating) && (
                <div className="card" style={{ marginTop: '32px' }}>
                    <div className="card-header" style={{ padding: '20px 24px' }}>
                        <div className="card-title" style={{ fontSize: '18px' }}>
                            <div className="card-title-icon yellow" style={{ width: '36px', height: '36px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            </div>
                            File Download Queue
                        </div>
                    </div>
                    <div className="table-container">
                        <table className="data-table" style={{ fontSize: '14px' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ textAlign: 'left', padding: '16px' }}>File Name</th>
                                    <th style={{ textAlign: 'right', padding: '16px' }}>Size</th>
                                    <th style={{ textAlign: 'right', padding: '16px' }}>Status</th>
                                    <th style={{ textAlign: 'center', padding: '16px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isGenerating && (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '48px', color: '#64748b', fontStyle: 'italic' }}>
                                            Preparing files for download...
                                        </td>
                                    </tr>
                                )}
                                {generatedFiles.map((file, i) => (
                                    <tr key={i} style={file.primary ? { background: '#f0f9ff', borderLeft: '4px solid #16a34a' } : {}}>
                                        <td style={{ padding: '16px', fontWeight: '700', color: file.primary ? '#16a34a' : '#1e293b' }}>
                                            {file.name}
                                            {file.primary && <span style={{ marginLeft: '12px', fontSize: '11px', background: '#16a34a', color: 'white', padding: '2px 8px', borderRadius: '12px', verticalAlign: 'middle', fontWeight: '800' }}>AUTOMATED DECK</span>}
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '16px', color: '#64748b' }}>{file.size}</td>
                                        <td style={{ textAlign: 'right', padding: '16px' }}>
                                            <StatusBadge status="completed" />
                                        </td>
                                        <td style={{ textAlign: 'center', padding: '16px' }}>
                                            <button className={`btn ${file.primary ? 'btn-primary' : 'btn-secondary'} btn-sm`} style={{ minWidth: '100px' }}>
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </BasePage>
    );
}
