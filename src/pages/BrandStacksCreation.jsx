import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';

const step = steps.find((s) => s.slug === 'brand-stacks-creation');

export default function BrandStacksCreation() {
    return (
        <div>
            <PageHeader
                title={step.name}
                subtitle="Create total category stack and aggregated brand stacks for data prep and modeling."
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

                {/* Stack Builder Controls */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon green">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="6" width="20" height="4" rx="1" />
                                    <rect x="2" y="14" width="20" height="4" rx="1" />
                                </svg>
                            </div>
                            Stack Builder
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Stack Type</label>
                        <select className="form-input form-select">
                            <option value="">Select stack type...</option>
                            <option value="total">cleanbrand_agg</option>
                            <option value="brand">Aggregated Brand Stack</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Aggregation Level</label>
                        <select className="form-input form-select">
                            <option value="">Select level...</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Time Period</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input className="form-input" type="date" style={{ flex: 1 }} />
                            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}>to</span>
                            <input className="form-input" type="date" style={{ flex: 1 }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-primary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="6" width="20" height="4" rx="1" />
                                <rect x="2" y="14" width="20" height="4" rx="1" />
                            </svg>
                            Build Stack
                        </button>
                        <button className="btn btn-secondary">Preview Data</button>
                    </div>
                </div>
            </div>

            {/* Stack Output Preview */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon yellow">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
                        </div>
                        Stack Output Preview
                    </div>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Stack Name</th>
                                <th>Type</th>
                                <th>Records</th>
                                <th>Variables</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ fontWeight: 500 }}>cleanbrand_agg</td>
                                <td><span className="tag tag-etl">Category</span></td>
                                <td>—</td>
                                <td>—</td>
                                <td><StatusBadge status="not_started" /></td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 500 }}>Aggregated Brand Stack</td>
                                <td><span className="tag tag-eda">Brand</span></td>
                                <td>—</td>
                                <td>—</td>
                                <td><StatusBadge status="not_started" /></td>
                            </tr>
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
