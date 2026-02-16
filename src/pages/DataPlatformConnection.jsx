import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';

const step = steps.find((s) => s.id === 3);

export default function DataPlatformConnection() {
    return (
        <div>
            <PageHeader
                title={step.name}
                subtitle="Configure database connections to streamline data access and reduce manual upload/download cycles."
                breadcrumb={['Dashboard', 'ETL Phase', step.name]}
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

                {/* Connection Config */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon green">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                    <path d="M11 18H5a2 2 0 0 1-2-2V8" />
                                    <path d="M13 18h6a2 2 0 0 0 2-2V8" />
                                </svg>
                            </div>
                            Connection Configuration
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Connection Type</label>
                        <select className="form-input form-select">
                            <option value="">Select type...</option>
                            <option value="snowflake">Snowflake</option>
                            <option value="bigquery">BigQuery</option>
                            <option value="redshift">Redshift</option>
                            <option value="postgres">PostgreSQL</option>
                            <option value="mysql">MySQL</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Host / Server</label>
                        <input className="form-input" type="text" placeholder="e.g. xyz.snowflakecomputing.com" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Database Name</label>
                        <input className="form-input" type="text" placeholder="Enter database name" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input className="form-input" type="text" placeholder="Enter username" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" placeholder="Enter password" />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-secondary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                            Test Connection
                        </button>
                        <button className="btn btn-primary">Save Configuration</button>
                    </div>
                </div>
            </div>

            {/* Connection Status */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon yellow">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <ellipse cx="12" cy="5" rx="9" ry="3" />
                                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                            </svg>
                        </div>
                        Connection Status
                    </div>
                </div>
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <ellipse cx="12" cy="5" rx="9" ry="3" />
                            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                        </svg>
                    </div>
                    <div className="empty-state-text">No Active Connection</div>
                    <div className="empty-state-subtext">Configure and test a database connection above to begin.</div>
                </div>
            </div>

            <div style={{ marginTop: '20px' }}>
                <AutomationNote notes={step.automationNotes} />
            </div>
        </div>
    );
}
