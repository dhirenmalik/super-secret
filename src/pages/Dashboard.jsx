import steps from '../data/steps';
import StepCard from '../components/StepCard';
import PageHeader from '../components/PageHeader';

export default function Dashboard() {
    const etlSteps = steps.filter((s) => s.phase === 'ETL');
    const edaSteps = steps.filter((s) => s.phase === 'EDA');
    const modelBuildingSteps = steps.filter((s) => s.phase === 'Model Building');
    const optimisationSteps = steps.filter((s) => s.phase === 'Optimisation');
    const reportingSteps = steps.filter((s) => s.phase === 'Reporting');
    const totalTasks = steps.reduce((sum, s) => sum + s.tasks.length, 0);

    return (
        <div>
            <PageHeader
                title="Pipeline Overview"
                subtitle="Monitor and manage all Data ETL, EDA, Model Building, Optimisation & Reporting process steps across the Walmart analytics pipeline."
                breadcrumb={['Home', 'Dashboard']}
            />

            {/* Stats Row */}
            <div className="dashboard-stats">
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 3h18v18H3z" />
                            <path d="M3 9h18" />
                            <path d="M9 21V9" />
                        </svg>
                    </div>
                    <div>
                        <div className="stat-value">{steps.length}</div>
                        <div className="stat-label">Total Steps</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <div>
                        <div className="stat-value">{totalTasks}</div>
                        <div className="stat-label">Total Tasks</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon yellow">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                        </svg>
                    </div>
                    <div>
                        <div className="stat-value">{etlSteps.length}</div>
                        <div className="stat-label">ETL Steps</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <div>
                        <div className="stat-value">{edaSteps.length}</div>
                        <div className="stat-label">EDA Steps</div>
                    </div>
                </div>
            </div>

            {/* Pipeline Progress */}
            <div className="card" style={{ marginBottom: '28px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon blue">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20v-6M6 20V10M18 20V4" />
                            </svg>
                        </div>
                        Pipeline Progress
                    </div>
                </div>
                <div className="progress-bar-container">
                    <div className="progress-bar-label">
                        <span style={{ color: 'var(--color-text-muted)' }}>Overall Completion</span>
                        <span style={{ color: 'var(--color-primary)' }}>0/{steps.length} steps</span>
                    </div>
                    <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: '0%' }} />
                    </div>
                </div>
            </div>

            {/* ETL Steps */}
            <div className="section">
                <h2 className="section-title">
                    <span className="tag tag-etl">ETL</span>
                    Extract, Transform & Load
                </h2>
                <div className="dashboard-grid">
                    {etlSteps.map((step) => (
                        <StepCard key={step.id} step={step} />
                    ))}
                </div>
            </div>

            {/* EDA Steps */}
            <div className="section">
                <h2 className="section-title">
                    <span className="tag tag-eda">EDA</span>
                    Exploratory Data Analysis
                </h2>
                <div className="dashboard-grid">
                    {edaSteps.map((step) => (
                        <StepCard key={step.id} step={step} />
                    ))}
                </div>
            </div>

            {/* Model Building Steps */}
            <div className="section">
                <h2 className="section-title">
                    <span className="tag tag-model">Model Building</span>
                    Statistical Model Development
                </h2>
                <div className="dashboard-grid">
                    {modelBuildingSteps.map((step) => (
                        <StepCard key={step.id} step={step} />
                    ))}
                </div>
            </div>

            {/* Optimisation Steps */}
            <div className="section">
                <h2 className="section-title">
                    <span className="tag tag-optimisation">Optimisation</span>
                    Budget Allocation & Scenario Planning
                </h2>
                <div className="dashboard-grid">
                    {optimisationSteps.map((step) => (
                        <StepCard key={step.id} step={step} />
                    ))}
                </div>
            </div>

            {/* Reporting Steps */}
            <div className="section">
                <h2 className="section-title">
                    <span className="tag tag-reporting">Reporting</span>
                    Documentation & Deliverables
                </h2>
                <div className="dashboard-grid">
                    {reportingSteps.map((step) => (
                        <StepCard key={step.id} step={step} />
                    ))}
                </div>
            </div>
        </div>
    );
}
