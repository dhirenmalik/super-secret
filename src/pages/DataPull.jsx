import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';

const step = steps.find((s) => s.id === 2);

export default function DataPull() {
    return (
        <div>
            <PageHeader
                title={step.name}
                subtitle="Upload files from VDI to IG's cloud and download data to local systems."
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

                {/* Transfer Status */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon green">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            </div>
                            Transfer Progress
                        </div>
                    </div>

                    {/* VDI Upload Progress */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>VDI → IG Cloud</span>
                            <StatusBadge status="not_started" />
                        </div>
                        <div className="progress-bar-track">
                            <div className="progress-bar-fill" style={{ width: '0%' }} />
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                            0 of 0 files uploaded
                        </div>
                    </div>

                    {/* Cloud Download Progress */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Cloud → Local</span>
                            <StatusBadge status="not_started" />
                        </div>
                        <div className="progress-bar-track">
                            <div className="progress-bar-fill" style={{ width: '0%' }} />
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                            0 of 0 files downloaded
                        </div>
                    </div>
                </div>
            </div>

            {/* Download List */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon yellow">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </div>
                        File Download Queue
                    </div>
                    <button className="btn btn-primary btn-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download All
                    </button>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>File Name</th>
                                <th>Source</th>
                                <th>Size</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ fontWeight: 500 }}>weekly_sales_fy24_fy26.csv</td>
                                <td>IG Cloud</td>
                                <td>—</td>
                                <td><StatusBadge status="not_started" /></td>
                                <td><button className="btn btn-secondary btn-sm">Download</button></td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 500 }}>daily_transactions_fy24.csv</td>
                                <td>IG Cloud</td>
                                <td>—</td>
                                <td><StatusBadge status="not_started" /></td>
                                <td><button className="btn btn-secondary btn-sm">Download</button></td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 500 }}>monthly_agg_fy25_fy26.csv</td>
                                <td>IG Cloud</td>
                                <td>—</td>
                                <td><StatusBadge status="not_started" /></td>
                                <td><button className="btn btn-secondary btn-sm">Download</button></td>
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
