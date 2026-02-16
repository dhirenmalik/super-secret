import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';

const step = steps.find((s) => s.id === 5);

const mockModelGroups = [
    { id: 1, name: 'Grocery – Staples', subcategories: ['Rice', 'Flour', 'Oil'], status: 'included' },
    { id: 2, name: 'Grocery – Snacks', subcategories: ['Chips', 'Cookies', 'Crackers'], status: 'included' },
    { id: 3, name: 'Grocery – Beverages', subcategories: ['Soft Drinks', 'Juice', 'Water'], status: 'excluded' },
    { id: 4, name: 'Health – OTC', subcategories: ['Pain Relief', 'Cold & Flu', 'Vitamins'], status: 'included' },
];

export default function KickoffReportReview() {
    const [groups, setGroups] = useState(mockModelGroups);

    const toggleGroup = (id) => {
        setGroups(
            groups.map((g) =>
                g.id === id
                    ? { ...g, status: g.status === 'included' ? 'excluded' : 'included' }
                    : g
            )
        );
    };

    return (
        <div>
            <PageHeader
                title={step.name}
                subtitle="Review model groupings, discuss sub-category shifts, and finalize model groups with Walmart."
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

                {/* Comments & Feedback */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon green">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            Review Comments
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Add Review Comment</label>
                        <textarea
                            className="form-input form-textarea"
                            placeholder="Enter feedback or discussion notes about model groupings..."
                            rows={4}
                        />
                    </div>
                    <button className="btn btn-primary btn-sm">Submit Comment</button>

                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border-light)' }}>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
                            No comments yet. Add your review notes above.
                        </div>
                    </div>
                </div>
            </div>

            {/* Model Group Toggles */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon yellow">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                        </div>
                        Model Group Review
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                            {groups.filter((g) => g.status === 'included').length} of {groups.length} included
                        </span>
                    </div>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Model Group</th>
                                <th>Sub-Categories (L2/L3)</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((group) => (
                                <tr key={group.id}>
                                    <td style={{ fontWeight: 600 }}>{group.name}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {group.subcategories.map((sc) => (
                                                <span key={sc} style={{
                                                    padding: '2px 8px',
                                                    background: 'var(--color-surface)',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: '12px',
                                                    color: 'var(--color-text-muted)',
                                                }}>
                                                    {sc}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <StatusBadge status={group.status === 'included' ? 'completed' : 'blocked'} />
                                    </td>
                                    <td>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={group.status === 'included'}
                                                onChange={() => toggleGroup(group.id)}
                                            />
                                            <span className="toggle-slider" />
                                        </label>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginTop: '20px' }}>
                <AutomationNote notes={step.automationNotes} />
            </div>
        </div>
    );
}
