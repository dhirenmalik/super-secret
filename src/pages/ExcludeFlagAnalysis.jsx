import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';

const step = steps.find((s) => s.id === 6);

const mockBrands = [
    { id: 1, name: 'Premium Brand A', fy24: 'Mapped', fy25: 'Mapped', fy26: 'Mapped', status: 'included', sales: '12.4%', spends: '14.2%' },
    { id: 2, name: 'Value Brand B', fy24: 'Mapped', fy25: 'Mapped', fy26: 'Mapped', status: 'included', sales: '9.8%', spends: '8.1%' },
    { id: 3, name: 'Private Label C', fy24: 'Mapped', fy25: 'Issue', fy26: 'Mapped', status: 'excluded', sales: '15.2%', spends: '0.5%' },
    { id: 4, name: 'Brand D', fy24: 'Mapped', fy25: 'Mapped', fy26: 'Mapped', status: 'included', sales: '7.5%', spends: '9.3%' },
    { id: 5, name: 'Niche Brand E', fy24: 'Missing', fy25: 'Mapped', fy26: 'Mapped', status: 'excluded', sales: '2.1%', spends: '1.8%' },
    { id: 6, name: 'Emerging Brand F', fy24: 'Mapped', fy25: 'Mapped', fy26: 'Issue', status: 'review', sales: '5.3%', spends: '6.7%' },
];

export default function ExcludeFlagAnalysis() {
    const [brands, setBrands] = useState(mockBrands);

    const toggleBrand = (id) => {
        setBrands(
            brands.map((b) =>
                b.id === id
                    ? { ...b, status: b.status === 'included' ? 'excluded' : 'included' }
                    : b
            )
        );
    };

    const included = brands.filter((b) => b.status === 'included');
    const excluded = brands.filter((b) => b.status === 'excluded');

    return (
        <div>
            <PageHeader
                title={step.name}
                subtitle="Consolidate brands using historical FY24–FY26 mappings and flag brands for exclusion."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
            >
                <StatusBadge status="not_started" />
            </PageHeader>

            {/* Summary Stats */}
            <div className="dashboard-stats" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /></svg>
                    </div>
                    <div>
                        <div className="stat-value">{brands.length}</div>
                        <div className="stat-label">Total Brands</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    </div>
                    <div>
                        <div className="stat-value">{included.length}</div>
                        <div className="stat-label">Included</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                    </div>
                    <div>
                        <div className="stat-value">{excluded.length}</div>
                        <div className="stat-label">Excluded</div>
                    </div>
                </div>
            </div>

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

                {/* Historical Mapping Summary */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="card-title-icon yellow">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 6v6l4 2" />
                                </svg>
                            </div>
                            Historical Mapping Overview
                        </div>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                            <span>FY24 Brands Mapped</span>
                            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{brands.filter(b => b.fy24 === 'Mapped').length}/{brands.length}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                            <span>FY25 Brands Mapped</span>
                            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{brands.filter(b => b.fy25 === 'Mapped').length}/{brands.length}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                            <span>FY26 Brands Mapped</span>
                            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{brands.filter(b => b.fy26 === 'Mapped').length}/{brands.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Brand Table */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-title-icon green">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                        </div>
                        Brand Include/Exclude Flags
                    </div>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Brand</th>
                                <th>FY24</th>
                                <th>FY25</th>
                                <th>FY26</th>
                                <th>Sales %</th>
                                <th>Spends %</th>
                                <th>Status</th>
                                <th>Include</th>
                            </tr>
                        </thead>
                        <tbody>
                            {brands.map((brand) => (
                                <tr key={brand.id}>
                                    <td style={{ fontWeight: 600 }}>{brand.name}</td>
                                    <td>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600,
                                            background: brand.fy24 === 'Mapped' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                                            color: brand.fy24 === 'Mapped' ? 'var(--color-success)' : 'var(--color-danger)',
                                        }}>{brand.fy24}</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600,
                                            background: brand.fy25 === 'Mapped' ? 'var(--color-success-light)' : brand.fy25 === 'Issue' ? 'var(--color-warning-light)' : 'var(--color-danger-light)',
                                            color: brand.fy25 === 'Mapped' ? 'var(--color-success)' : brand.fy25 === 'Issue' ? 'var(--color-warning)' : 'var(--color-danger)',
                                        }}>{brand.fy25}</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600,
                                            background: brand.fy26 === 'Mapped' ? 'var(--color-success-light)' : brand.fy26 === 'Issue' ? 'var(--color-warning-light)' : 'var(--color-danger-light)',
                                            color: brand.fy26 === 'Mapped' ? 'var(--color-success)' : brand.fy26 === 'Issue' ? 'var(--color-warning)' : 'var(--color-danger)',
                                        }}>{brand.fy26}</span>
                                    </td>
                                    <td>{brand.sales}</td>
                                    <td>{brand.spends}</td>
                                    <td>
                                        <StatusBadge status={brand.status === 'included' ? 'completed' : brand.status === 'review' ? 'in_progress' : 'blocked'} />
                                    </td>
                                    <td>
                                        <label className="toggle-switch">
                                            <input type="checkbox" checked={brand.status === 'included'} onChange={() => toggleBrand(brand.id)} />
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
