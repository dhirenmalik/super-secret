import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';

const step = steps.find((s) => s.slug === 'exclude-flag-review');

const confirmationBrands = [
    { id: 1, name: 'Premium Brand A', action: 'Include', salesCoverage: '35.2%', spendsCoverage: '38.5%' },
    { id: 2, name: 'Value Brand B', action: 'Include', salesCoverage: '28.4%', spendsCoverage: '25.1%' },
    { id: 3, name: 'Brand D', action: 'Include', salesCoverage: '22.7%', spendsCoverage: '24.3%' },
    { id: 4, name: 'Emerging Brand F', action: 'Include', salesCoverage: '12.7%', spendsCoverage: '11.2%' },
    { id: 5, name: 'Private Label C', action: 'Exclude', salesCoverage: '0.8%', spendsCoverage: '0.5%' },
    { id: 6, name: 'Niche Brand E', action: 'Exclude', salesCoverage: '0.2%', spendsCoverage: '0.4%' },
];

export default function ExcludeFlagReview() {
    const totalSales = confirmationBrands
        .filter((b) => b.action !== 'Exclude')
        .reduce((sum, b) => sum + parseFloat(b.salesCoverage), 0)
        .toFixed(1);

    return (
        <div>
            <PageHeader
                title={step.name}
                subtitle="Confirm brands to be considered, combined, or excluded for sales & spends coverage."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
            >
                <StatusBadge status="not_started" />
            </PageHeader>

            {/* Coverage Metrics */}
            <div className="dashboard-stats" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    </div>
                    <div>
                        <div className="stat-value">{totalSales}%</div>
                        <div className="stat-label">Sales Coverage (Included)</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /></svg>
                    </div>
                    <div>
                        <div className="stat-value">{confirmationBrands.filter((b) => b.action !== 'Exclude').length}</div>
                        <div className="stat-label">Brands Included</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                    </div>
                    <div>
                        <div className="stat-value">{confirmationBrands.filter((b) => b.action === 'Exclude').length}</div>
                        <div className="stat-label">Brands Excluded</div>
                    </div>
                </div>
            </div>

            <div className="grid-2">
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

                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon green">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            </div>
                            Approval Actions
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            Approve & Finalize Brands
                        </button>
                        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                            Request Changes
                        </button>
                        <button className="btn btn-danger btn-sm" style={{ width: '100%', justifyContent: 'center', opacity: 0.8 }}>
                            Reject & Restart Analysis
                        </button>
                    </div>
                </div>
            </div>

            {/* Brand Confirmation List */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon yellow">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        </div>
                        Brand Confirmation List
                    </div>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Brand</th>
                                <th>Action</th>
                                <th>Sales Coverage</th>
                                <th>Spends Coverage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {confirmationBrands.map((brand) => (
                                <tr key={brand.id}>
                                    <td style={{ fontWeight: 600 }}>{brand.name}</td>
                                    <td>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600,
                                            background: brand.action === 'Include' ? 'var(--color-success-light)' : brand.action === 'Combine' ? 'var(--color-info-light)' : 'var(--color-danger-light)',
                                            color: brand.action === 'Include' ? 'var(--color-success)' : brand.action === 'Combine' ? 'var(--color-info)' : 'var(--color-danger)',
                                        }}>{brand.action}</span>
                                    </td>
                                    <td>{brand.salesCoverage}</td>
                                    <td>{brand.spendsCoverage}</td>
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
