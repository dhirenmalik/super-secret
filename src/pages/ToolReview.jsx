import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../api/kickoff';

const step = steps.find((s) => s.slug === 'tool-review');

const mockTactics = [
    { id: 1, name: 'TV Linear', type: 'Media', cappingValue: 100 },
    { id: 2, name: 'Digital Display', type: 'Media', cappingValue: 100 },
    { id: 3, name: 'Social Media', type: 'Media', cappingValue: 100 },
    { id: 4, name: 'Search SEM', type: 'Media', cappingValue: 100 },
    { id: 5, name: 'In-Store Display', type: 'Trade', cappingValue: 100 },
    { id: 6, name: 'Feature / Flyer', type: 'Trade', cappingValue: 100 },
];

export default function ToolReview() {
    const { token } = useAuth();
    const [tactics, setTactics] = useState(mockTactics);
    const [models, setModels] = useState([]);
    const [activeModelId, setActiveModelId] = useState(localStorage.getItem('active_model_id') || '');
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        setIsLoadingModels(true);
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/models`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setModels(data);
            if (data.length > 0 && !activeModelId) {
                setActiveModelId(data[0].model_id.toString());
                localStorage.setItem('active_model_id', data[0].model_id);
            }
        } catch (error) {
            console.error('Error fetching models:', error);
        } finally {
            setIsLoadingModels(false);
        }
    };

    const updateCapping = (id, value) => {
        setTactics(tactics.map((t) => (t.id === id ? { ...t, cappingValue: value } : t)));
    };

    return (
        <div>
            <PageHeader
                title={step.name}
                subtitle="Customise tactics — merge, remove, adjust capping, and rectify irregular trends at tactic level."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
            >
                <StatusBadge status="not_started" />
            </PageHeader>

            <div className="grid-2">
                {/* Tasks */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon blue">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 11l3 3L22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                </svg>
                            </div>
                            Tasks
                        </div>
                    </div>
                    <TaskList tasks={step.tasks} />
                </div>

                {/* Merge/Remove Controls */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon green">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                            </div>
                            Tactic Controls
                        </div>
                    </div>
                    {/* Model Selector */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
                        <span className="text-sm font-medium text-slate-700">Active Model:</span>
                        <div className="w-64">
                            <select
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                                value={activeModelId}
                                onChange={(e) => {
                                    setActiveModelId(e.target.value);
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
                    </div>
                    <div className="form-group">
                        <label className="form-label">Action</label>
                        <select className="form-input form-select">
                            <option value="">Select action...</option>
                            <option value="merge">Merge Tactics</option>
                            <option value="remove">Remove Tactic</option>
                            <option value="adjust">Adjust Data</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Select Tactics</label>
                        <select className="form-input form-select" multiple style={{ minHeight: '120px' }}>
                            {tactics.map((t) => (
                                <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-primary btn-sm">Apply</button>
                        <button className="btn btn-secondary btn-sm">Reset</button>
                    </div>
                </div>
            </div>

            {/* Capping Sliders */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon yellow">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20v-6M6 20V10M18 20V4" />
                            </svg>
                        </div>
                        Variable Peak Capping
                    </div>
                    <button className="btn btn-secondary btn-sm">Reset All to 100%</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {tactics.map((tactic) => (
                        <div key={tactic.id} style={{ padding: '16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                            <div className="slider-container">
                                <div className="slider-label">
                                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{tactic.name}</span>
                                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{tactic.cappingValue}%</span>
                                </div>
                                <input
                                    type="range"
                                    className="slider-input"
                                    min="0"
                                    max="200"
                                    value={tactic.cappingValue}
                                    onChange={(e) => updateCapping(tactic.id, parseInt(e.target.value))}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-light)' }}>
                                    <span>0%</span>
                                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{tactic.type}</span>
                                    <span>200%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Manual Calculations */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon red">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="4" y="2" width="16" height="20" rx="2" />
                                <line x1="8" y1="6" x2="16" y2="6" />
                                <line x1="16" y1="14" x2="16" y2="18" />
                                <line x1="8" y1="10" x2="8" y2="10.01" />
                                <line x1="12" y1="10" x2="12" y2="10.01" />
                                <line x1="16" y1="10" x2="16" y2="10.01" />
                                <line x1="8" y1="14" x2="8" y2="14.01" />
                                <line x1="12" y1="14" x2="12" y2="14.01" />
                                <line x1="8" y1="18" x2="8" y2="18.01" />
                                <line x1="12" y1="18" x2="12" y2="18.01" />
                            </svg>
                        </div>
                        Manual Data Adjustments
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Adjustment Description</label>
                    <textarea className="form-input form-textarea" placeholder="Describe the data discrepancy and the manual adjustments made..." />
                </div>
                <div className="form-group">
                    <label className="form-label">Adjustment Formula</label>
                    <input className="form-input" placeholder="e.g. Variable_X = Variable_X * 0.85 for weeks 23-26" style={{ fontFamily: 'monospace' }} />
                </div>
                <button className="btn btn-primary btn-sm">Apply Adjustment</button>
            </div>

            <div style={{ marginTop: '20px' }}>
                <AutomationNote notes={step.automationNotes} />
            </div>
        </div>
    );
}
