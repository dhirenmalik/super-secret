import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';

const step = steps.find((s) => s.id === 1);

export default function DataStaging() {
    return (
        <div>
            <PageHeader
                title={step.name}
                subtitle="Login to VDI, run category-specific queries, and download data files from Walmart cloud."
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

                {/* Query Runner (Placeholder) */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon green">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="16 18 22 12 16 6" />
                                    <polyline points="8 6 2 12 8 18" />
                                </svg>
                            </div>
                            Query Runner
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select className="form-input form-select">
                            <option value="">Select category...</option>
                            <option value="grocery">Grocery</option>
                            <option value="electronics">Electronics</option>
                            <option value="apparel">Apparel</option>
                            <option value="home">Home & Garden</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Query</label>
                        <textarea
                            className="form-input form-textarea"
                            placeholder="-- Enter SQL query for the selected category...&#10;SELECT * FROM sales_data&#10;WHERE category = 'grocery'&#10;AND date BETWEEN '2024-01-01' AND '2026-01-01'"
                            style={{ fontFamily: 'monospace', fontSize: '13px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-primary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            Run Query
                        </button>
                        <button className="btn btn-secondary">Split Period</button>
                    </div>
                </div>
            </div>

            {/* File Upload Area */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon yellow">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        Data Files
                    </div>
                </div>
                <div className="upload-area">
                    <div className="upload-area-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <div className="upload-area-text">Drop data files here or click to browse</div>
                    <div className="upload-area-subtext">Supports CSV, Excel, and Parquet files • Weekly, Daily, Monthly</div>
                </div>

                {/* File Status Indicators */}
                <div style={{ marginTop: '20px' }}>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>File Type</th>
                                    <th>Period</th>
                                    <th>Status</th>
                                    <th>Size</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Weekly Sales Data</td>
                                    <td>FY24–FY26</td>
                                    <td><StatusBadge status="not_started" /></td>
                                    <td>—</td>
                                </tr>
                                <tr>
                                    <td>Daily Transaction Data</td>
                                    <td>FY24–FY26</td>
                                    <td><StatusBadge status="not_started" /></td>
                                    <td>—</td>
                                </tr>
                                <tr>
                                    <td>Monthly Aggregate Data</td>
                                    <td>FY24–FY26</td>
                                    <td><StatusBadge status="not_started" /></td>
                                    <td>—</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Automation Notes */}
            <div style={{ marginTop: '20px' }}>
                <AutomationNote notes={step.automationNotes} />
            </div>
        </div>
    );
}
