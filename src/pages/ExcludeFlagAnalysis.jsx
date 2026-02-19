import { useState, useEffect, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import { fetchExcludeAnalysis, updateRelevance, fetchBrandExclusion } from '../api/eda';
import { fetchLatestFile } from '../api/kickoff';
import { useAuth } from '../context/AuthContext';
import BrandExclusionTable from '../components/eda/BrandExclusionTable';

const step = steps.find((s) => s.slug === 'exclude-flag-analysis');

export default function ExcludeFlagAnalysis() {
    const { token } = useAuth();
    const [viewMode, setViewMode] = useState('subcategory'); // 'subcategory' or 'brand'
    const [brands, setBrands] = useState([]);
    const [brandData, setBrandData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'sales', direction: 'desc' });
    const [latestFile, setLatestFile] = useState(null);

    useEffect(() => {
        init();
    }, [viewMode]);

    const init = async () => {
        try {
            setLoading(true);
            const file = await fetchLatestFile('exclude_flags_raw', token);
            setLatestFile(file);

            if (viewMode === 'subcategory') {
                await loadSubcategoryData();
            } else {
                await loadBrandData(file?.file_id);
            }
            setError(null);
        } catch (err) {
            console.error("Initialization failed:", err);
            setError("Failed to initialize analysis. Please ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const loadSubcategoryData = async () => {
        const data = await fetchExcludeAnalysis('L3');
        const mappedBrands = data.data.map((item, index) => ({
            id: index,
            name: item.Category,
            status: item.Relevant === 'YES' ? 'included' : 'excluded',
            sales: item.Total_Sales,
            salesShare: item.Sales_Share_Percentage,
            unitsShare: item.Unit_Share_Percentage,
            avgPrice: item.AVG_PRICE,
            searchSpendShare: item.Search_Spend_Share_Percentage,
            offDisplaySpendShare: item.OFFDisplay_Spend_Share_Percentage,
            onDisplaySpendShare: item.ONDisplay_Spend_Share_Percentage,
        }));
        setBrands(mappedBrands);
    };

    const loadBrandData = async (fileId) => {
        if (!fileId) return;
        const data = await fetchBrandExclusion(fileId);
        setBrandData(data);
    };

    const toggleBrand = async (brand) => {
        const newStatus = brand.status === 'included' ? 'excluded' : 'included';
        const isRelevant = newStatus === 'included';

        setBrands(prev => prev.map(b =>
            b.id === brand.id ? { ...b, status: newStatus } : b
        ));

        try {
            await updateRelevance(brand.name, isRelevant);
        } catch (err) {
            console.error("Failed to update relevance:", err);
            setBrands(prev => prev.map(b =>
                b.id === brand.id ? { ...b, status: brand.status } : b
            ));
            alert("Failed to update status. Please try again.");
        }
    };

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedBrands = useMemo(() => {
        const sorted = [...brands];
        if (sortConfig.key) {
            sorted.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sorted;
    }, [brands, sortConfig]);

    const included = brands.filter((b) => b.status === 'included');
    const excluded = brands.filter((b) => b.status === 'excluded');

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <span className="text-slate-300 ml-1">⇅</span>;
        return <span className="text-blue-600 ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    const thStyle = { cursor: 'pointer', userSelect: 'none' };

    if (loading) {
        return <div className="p-8 text-center">Loading analysis data...</div>;
    }

    return (
        <div>
            <PageHeader
                title={step.name}
                subtitle="Analyze and flag subcategories (L3) or specific brands for inclusion based on key metrics."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
            >
                <div className="flex items-center gap-4">
                    <div className="toggle-group p-1 bg-slate-100 rounded-lg flex">
                        <button
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'subcategory' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                            onClick={() => setViewMode('subcategory')}
                        >
                            Subcategory View
                        </button>
                        <button
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'brand' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                            onClick={() => setViewMode('brand')}
                        >
                            Brand View
                        </button>
                    </div>
                    <StatusBadge status="in_progress" />
                </div>
            </PageHeader>

            {error && <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

            {/* Summary Stats */}
            <div className="dashboard-stats" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /></svg>
                    </div>
                    <div>
                        <div className="stat-value">{viewMode === 'subcategory' ? brands.length : (brandData?.rows?.length || 0)}</div>
                        <div className="stat-label">{viewMode === 'subcategory' ? 'Total Subcategories' : 'Total Brands'}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    </div>
                    <div>
                        <div className="stat-value">{viewMode === 'subcategory' ? included.length : (brandData?.rows?.filter(r => r.exclude_flag === 0)?.length || 0)}</div>
                        <div className="stat-label">Included</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                    </div>
                    <div>
                        <div className="stat-value">{viewMode === 'subcategory' ? excluded.length : (brandData?.rows?.filter(r => r.exclude_flag === 1)?.length || 0)}</div>
                        <div className="stat-label">Excluded</div>
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
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                </svg>
                            </div>
                            Tasks
                        </div>
                    </div>
                    <TaskList tasks={step.tasks} />
                </div>

                {viewMode === 'brand' && brandData && (
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <div className="card-title-icon yellow">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                </div>
                                Brand View Summary
                            </div>
                        </div>
                        <div className="grid-2" style={{ gap: '10px' }}>
                            <div className="p-3 bg-slate-50 rounded flex items-center justify-between">
                                <span className="text-sm text-slate-600">Combine Flags</span>
                                <span className="font-bold text-blue-600 text-lg ml-2">{brandData.summary.combine_flag_count}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded flex items-center justify-between">
                                <span className="text-sm text-slate-600">Low Share Issues</span>
                                <span className="font-bold text-amber-600 text-lg ml-2">{brandData.summary.issue_counts.low_share}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Analysis Table */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header flex justify-between items-center">
                    <div className="card-title">
                        <div className="card-title-icon green">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                        </div>
                        {viewMode === 'subcategory' ? 'Subcategory Inclusion/Exclusion' : 'Brand-Level Exclusion Analysis'}
                    </div>
                    {viewMode === 'brand' && latestFile && (
                        <div className="text-xs text-slate-500 italic">
                            Analyzing latest file: {latestFile.file_name}
                        </div>
                    )}
                </div>

                {viewMode === 'subcategory' ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('name')} style={thStyle}>Subcategory <SortIcon column="name" /></th>
                                    <th onClick={() => handleSort('sales')} style={thStyle}>Total Sales <SortIcon column="sales" /></th>
                                    <th onClick={() => handleSort('avgPrice')} style={thStyle}>Avg Price <SortIcon column="avgPrice" /></th>
                                    <th onClick={() => handleSort('salesShare')} style={thStyle}>Sales % <SortIcon column="salesShare" /></th>
                                    <th onClick={() => handleSort('unitsShare')} style={thStyle}>Units % <SortIcon column="unitsShare" /></th>
                                    <th onClick={() => handleSort('searchSpendShare')} style={thStyle}>Search Spend % <SortIcon column="searchSpendShare" /></th>
                                    <th onClick={() => handleSort('offDisplaySpendShare')} style={thStyle}>Off-Display % <SortIcon column="offDisplaySpendShare" /></th>
                                    <th onClick={() => handleSort('onDisplaySpendShare')} style={thStyle}>On-Display % <SortIcon column="onDisplaySpendShare" /></th>
                                    <th onClick={() => handleSort('status')} style={thStyle}>Status <SortIcon column="status" /></th>
                                    <th>Include</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedBrands.map((brand) => (
                                    <tr key={brand.id}>
                                        <td style={{ fontWeight: 600 }}>{brand.name}</td>
                                        <td>${(brand.sales || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        <td>${(brand.avgPrice || 0).toFixed(2)}</td>
                                        <td>{(brand.salesShare || 0).toFixed(2)}%</td>
                                        <td>{(brand.unitsShare || 0).toFixed(2)}%</td>
                                        <td>{(brand.searchSpendShare || 0).toFixed(2)}%</td>
                                        <td>{(brand.offDisplaySpendShare || 0).toFixed(2)}%</td>
                                        <td>{(brand.onDisplaySpendShare || 0).toFixed(2)}%</td>
                                        <td>
                                            <StatusBadge status={brand.status === 'included' ? 'completed' : 'blocked'} />
                                        </td>
                                        <td>
                                            <label className="toggle-switch">
                                                <input type="checkbox" checked={brand.status === 'included'} onChange={() => toggleBrand(brand)} />
                                                <span className="toggle-slider" />
                                            </label>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <BrandExclusionTable data={brandData} />
                )}
            </div>

            <div style={{ marginTop: '20px' }}>
                <AutomationNote notes={step.automationNotes} />
            </div>
        </div>
    );
}
