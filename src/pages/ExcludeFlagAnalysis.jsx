import { useState, useEffect, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import { fetchExcludeAnalysis, updateRelevance, fetchBrandExclusion } from '../api/eda';
import { fetchLatestFile, getApiBaseUrl } from '../api/kickoff';
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
    const [models, setModels] = useState([]);
    const [activeModelId, setActiveModelId] = useState(() => localStorage.getItem('active_model_id') || '');

    useEffect(() => {
        loadModels();
    }, []);

    useEffect(() => {
        if (activeModelId) {
            init();
        } else {
            setLoading(false);
        }
    }, [viewMode, activeModelId]);

    const loadModels = async () => {
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/models`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setModels(data);
        } catch (error) {
            console.error('Failed to fetch models:', error);
        }
    };

    const init = async () => {
        try {
            setLoading(true);
            const file = await fetchLatestFile('exclude_flags_raw', token, activeModelId);
            setLatestFile(file);

            if (viewMode === 'subcategory') {
                await loadSubcategoryData();
            } else {
                await loadBrandData(file?.file_id);
            }
            setError(null);
        } catch (err) {
            console.error("Initialization failed:", err);
            setError("Failed to initialize analysis. Please ensure a file is uploaded for this model.");
        } finally {
            setLoading(false);
        }
    };

    const loadSubcategoryData = async () => {
        const data = await fetchExcludeAnalysis('L3', token, activeModelId);
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
        const data = await fetchBrandExclusion(fileId, token, activeModelId);
        setBrandData(data);
    };

    const toggleBrand = async (brand) => {
        const newStatus = brand.status === 'included' ? 'excluded' : 'included';
        const isRelevant = newStatus === 'included';

        setBrands(prev => prev.map(b =>
            b.id === brand.id ? { ...b, status: newStatus } : b
        ));

        try {
            await updateRelevance(brand.name, isRelevant, token, activeModelId);
        } catch (err) {
            console.error("Failed to update relevance:", err);
            setBrands(prev => prev.map(b =>
                b.id === brand.id ? { ...b, status: brand.status } : b
            ));
            alert("Failed to update status. Please try again.");
        }
    };

    const handleModelChange = (e) => {
        const id = e.target.value;
        setActiveModelId(id);
        localStorage.setItem('active_model_id', id);
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
                    {activeModelId && (
                        <>
                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Model:</span>
                                <span className="text-sm font-semibold text-blue-700">
                                    {models.find(m => String(m.model_id) === String(activeModelId))?.model_name || 'Selected Model'}
                                </span>
                                <button
                                    onClick={() => setActiveModelId('')}
                                    className="ml-2 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                                    title="Switch Model"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M4 4l5 5" />
                                    </svg>
                                </button>
                            </div>

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
                        </>
                    )}
                    <StatusBadge status={activeModelId ? "in_progress" : "not_started"} />
                </div>
            </PageHeader>

            {error && <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

            {!activeModelId ? (
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="section-title m-0">
                            <span className="tag tag-blue">SELECT PROJECT</span>
                            Model Gallery
                        </h2>
                    </div>

                    {models.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {models.map((model) => (
                                <div
                                    key={model.model_id}
                                    onClick={() => {
                                        setActiveModelId(model.model_id);
                                        localStorage.setItem('active_model_id', model.model_id);
                                    }}
                                    className="card h-full cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border-t-4 border-t-blue-500 group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="card-title-icon blue">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                            </svg>
                                        </div>
                                        <span className={`status-badge success`}>
                                            <span className="status-badge-dot"></span>
                                            READY
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{model.model_name}</h3>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                                            Type: {model.model_type}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            Created {new Date(model.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="text-blue-600 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Analyze
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card py-16 text-center border-dashed">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <svg className="text-slate-300" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                </svg>
                            </div>
                            <h3 className="font-bold text-slate-800">No Projects Found</h3>
                            <p className="text-sm text-slate-500">Please create a model from the dashboard first.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease-in-out' }}>
                    {loading && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 overflow-hidden z-50">
                            <div className="w-full h-full bg-blue-300 animate-pulse"></div>
                        </div>
                    )}
                    {/* Summary Stats */}
                    <div className="dashboard-stats" style={{ marginBottom: '24px' }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="stat-card">
                                {loading ? (
                                    <div className="animate-pulse flex items-center space-x-4 w-full">
                                        <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                                        <div className="flex-1 space-y-2 py-1">
                                            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                                            <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`stat-icon ${i === 1 ? 'blue' : i === 2 ? 'green' : 'red'}`}>
                                            {i === 1 ? (
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /></svg>
                                            ) : i === 2 ? (
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                            ) : (
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                            )}
                                        </div>
                                        <div>
                                            <div className="stat-value">
                                                {i === 1 ? (viewMode === 'subcategory' ? brands.length : (brandData?.rows?.length || 0)) :
                                                    i === 2 ? (viewMode === 'subcategory' ? included.length : (brandData?.rows?.filter(r => r.exclude_flag === 0)?.length || 0)) :
                                                        (viewMode === 'subcategory' ? excluded.length : (brandData?.rows?.filter(r => r.exclude_flag === 1)?.length || 0))}
                                            </div>
                                            <div className="stat-label">
                                                {i === 1 ? (viewMode === 'subcategory' ? 'Total Subcategories' : 'Total Brands') :
                                                    i === 2 ? 'Included' : 'Excluded'}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
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
            )}
        </div>
    );
}
