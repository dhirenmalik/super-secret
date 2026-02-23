import { useState, useEffect, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import TaskList from '../components/TaskList';
import AutomationNote from '../components/AutomationNote';
import StatusBadge from '../components/StatusBadge';
import steps from '../data/steps';
import { fetchExcludeAnalysis, updateRelevance, fetchBrandExclusion } from '../api/eda';
import { fetchLatestFile, getApiBaseUrl, updateBrandExclusion, updateReportStatus } from '../api/kickoff';
import { useAuth } from '../context/AuthContext';
import BrandExclusionTable from '../components/eda/BrandExclusionTable';
import SummarySheet from '../components/eda/SummarySheet';
import { formatCurrencyMillions } from '../utils/formatters';
import TopExcludedSheet from '../components/eda/TopExcludedSheet';
import DiscussionBoard from '../components/eda/DiscussionBoard';

export default function ExcludeFlagAnalysis({ mode = 'modeler', overrideStepSlug = null }) {
    const { token } = useAuth();
    const stepSlug = overrideStepSlug || 'exclude-flag-analysis';
    const step = steps.find((s) => s.slug === stepSlug);

    const [viewMode, setViewMode] = useState('subcategory'); // 'subcategory' or 'brand'
    const [currentPhase, setCurrentPhase] = useState(1); // 1: Candidate Selection, 2: Brand Analysis
    const [brands, setBrands] = useState([]);
    const [brandData, setBrandData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'sales', direction: 'desc' });
    const [latestFile, setLatestFile] = useState(null);
    const [models, setModels] = useState([]);
    const [activeModelId, setActiveModelId] = useState(() => localStorage.getItem('active_model_id') || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPB, setFilterPB] = useState('all');
    const [filterMI, setFilterMI] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isActionLoading, setIsActionLoading] = useState(false);

    const isReadOnly = useMemo(() => {
        if (mode === 'reviewer') return true;
        return false;
    }, [mode, latestFile]);

    const filteredBrandData = useMemo(() => {
        if (!brandData || !brandData.rows) return null;

        const filteredRows = brandData.rows.filter(row => {
            const matchesSearch = row.brand?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPB = filterPB === 'all' || (filterPB === 'yes' ? row.private_brand === 1 : row.private_brand === 0);
            const matchesMI = filterMI === 'all' || (filterMI === 'yes' ? row.mapping_issue === 1 : row.mapping_issue === 0);
            const matchesStatus = filterStatus === 'all' || (filterStatus === 'excluded' ? row.exclude_flag === 1 : row.exclude_flag === 0);
            return matchesSearch && matchesPB && matchesMI && matchesStatus;
        });

        const getBucket = (rows, label, filterFn) => {
            const bRows = rows.filter(filterFn);
            const s = bRows.reduce((acc, r) => acc + (r.sum_sales || 0), 0);
            const sp = bRows.reduce((acc, r) => acc + (r.sum_spend || 0), 0);
            const u = bRows.reduce((acc, r) => acc + (r.sum_units || 0), 0);
            const tS = filteredRows.reduce((acc, r) => acc + (r.sum_sales || 0), 0);
            const tSp = filteredRows.reduce((acc, r) => acc + (r.sum_spend || 0), 0);
            const tU = filteredRows.reduce((acc, r) => acc + (r.sum_units || 0), 0);
            return {
                type: label,
                sales: s,
                spends: sp,
                units: u,
                sales_pct: tS > 0 ? (s / tS * 100) : 0,
                spends_pct: tSp > 0 ? (sp / tSp * 100) : 0,
                units_pct: tU > 0 ? (u / tU * 100) : 0
            };
        };

        const tSales = filteredRows.reduce((acc, r) => acc + (r.sum_sales || 0), 0);
        const tSpend = filteredRows.reduce((acc, r) => acc + (r.sum_spend || 0), 0);
        const tUnits = filteredRows.reduce((acc, r) => acc + (r.sum_units || 0), 0);

        const summary = {
            total_sales: tSales,
            total_spends: tSpend,
            total_units: tUnits,
            part2: [
                getBucket(filteredRows, "Included", r => (r.original_exclude_flag || 0) === 0),
                getBucket(filteredRows, "Excluded", r => (r.original_exclude_flag || 0) === 1)
            ],
            part3: [
                getBucket(filteredRows, "Included", r => r.exclude_flag === 0),
                getBucket(filteredRows, "Excluded", r => r.exclude_flag === 1),
                getBucket(filteredRows, "Private Brand", r => r.private_brand === 1),
                getBucket(filteredRows, "Mapping Issue", r => r.mapping_issue === 1),
                getBucket(filteredRows, "Excluded - Zero Spend With Sales", r => r.exclude_flag === 1 && r.sum_spend === 0 && r.sum_sales > 0),
                getBucket(filteredRows, "Excluded - Zero Sales With Spend", r => r.exclude_flag === 1 && r.sum_sales === 0 && r.sum_spend > 0),
                getBucket(filteredRows, "Other Issue", r => r.exclude_flag === 1 && r.private_brand === 0 && r.mapping_issue === 0 && r.sum_spend !== 0 && r.sum_sales !== 0)
            ],
            combine_flag_count: filteredRows.filter(r => !!r.combine_flag).length,
            exclude_flag_count: filteredRows.filter(r => r.exclude_flag === 1).length,
            issue_counts: {
                private_brand: filteredRows.filter(r => r.private_brand === 1).length,
                mapping_issue: filteredRows.filter(r => r.mapping_issue === 1).length
            }
        };

        return { ...brandData, rows: filteredRows, summary };
    }, [brandData, searchTerm, filterPB, filterMI, filterStatus]);

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
            } else if (viewMode === 'brand') {
                await loadBrandData(file?.file_id);
                setCurrentPhase(2);
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
        setLoading(true);
        try {
            console.log("Fetching Brand Exclusion Data with params:", { fileId, tokenSnippet: token ? token.substring(0, 10) + '...' : null, activeModelId });
            const data = await fetchBrandExclusion(fileId, token, activeModelId);
            setBrandData(data);
            setCurrentPhase(2);
            setViewMode('brand');
        } catch (err) {
            console.error("Failed to fetch brand exclusion:", err);
            setError("Analysis failed. Please ensure Phase 1 selections are saved.");
        } finally {
            setLoading(false);
        }
    };

    const runSpecializedAnalysis = () => {
        loadBrandData(latestFile?.file_id);
    };

    const handleBrandUpdate = async (payload) => {
        try {
            if (!latestFile) return;
            const res = await updateBrandExclusion({
                file_id: latestFile.file_id,
                model_id: activeModelId,
                ...payload
            }, token);

            if (res.file_status && latestFile) {
                setLatestFile(prev => ({ ...prev, status: res.file_status }));
            }

            // Re-fetch brand data to ensure summary and table are perfectly in sync
            // Alternatively, we could do a local update, but the backend re-calculates summary components.
            const data = await fetchBrandExclusion(latestFile.file_id, token, activeModelId);
            setBrandData(data);
        } catch (err) {
            console.error("Failed to update brand:", err);
            alert("Failed to update brand grouping/exclusion.");
        }
    };

    const toggleBrand = async (brand) => {
        if (isReadOnly) return;

        const newStatus = brand.status === 'included' ? 'excluded' : 'included';
        const isRelevant = newStatus === 'included';

        setBrands(prev => prev.map(b =>
            b.id === brand.id ? { ...b, status: newStatus } : b
        ));

        try {
            const res = await updateRelevance(brand.name, isRelevant, token, activeModelId);
            if (res.file_status && latestFile) {
                setLatestFile(prev => ({ ...prev, status: res.file_status }));
            }
        } catch (err) {
            console.error("Failed to update relevance:", err);
            setBrands(prev => prev.map(b =>
                b.id === brand.id ? { ...b, status: brand.status } : b
            ));
            alert("Failed to update status. Please try again.");
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!latestFile) return;
        setIsActionLoading(true);
        try {
            await updateReportStatus(latestFile.file_id, newStatus, token);
            setLatestFile(prev => ({ ...prev, status: newStatus }));
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update report status. Please try again.');
        } finally {
            setIsActionLoading(false);
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

                            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                                <button
                                    className={`px - 4 py - 1.5 rounded - md text - sm font - bold transition - all flex items - center gap - 2 ${currentPhase === 1 ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'} `}
                                    onClick={() => {
                                        setCurrentPhase(1);
                                        setViewMode('subcategory');
                                    }}
                                >
                                    <span className={`w - 5 h - 5 rounded - full flex items - center justify - center text - [10px] ${currentPhase === 1 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-white'} `}>1</span>
                                    Phase 1: Candidates
                                </button>
                                <div className="w-4 h-px bg-slate-300 mx-1"></div>
                                <button
                                    className={`px - 4 py - 1.5 rounded - md text - sm font - bold transition - all flex items - center gap - 2 ${currentPhase === 2 ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700 opacity-50 cursor-not-allowed'} `}
                                    onClick={() => brandData && setCurrentPhase(2)}
                                    disabled={!brandData}
                                >
                                    <span className={`w - 5 h - 5 rounded - full flex items - center justify - center text - [10px] ${currentPhase === 2 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-white'} `}>2</span>
                                    Phase 2: Analysis
                                </button>
                            </div>
                        </>
                    )}

                    {latestFile && (
                        <div className="flex items-center gap-3">
                            <StatusBadge status={latestFile.status || 'uploaded'} />

                            {/* Actions for Modeler */}
                            {mode === 'modeler' && (!latestFile.status || latestFile.status === 'uploaded' || latestFile.status === 'rejected') && (
                                <button
                                    onClick={() => handleStatusUpdate('in_review')}
                                    disabled={isActionLoading || brands.length === 0}
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                                >
                                    Submit for Review
                                </button>
                            )}

                            {/* Actions for Reviewer */}
                            {mode === 'reviewer' && (
                                <div className="flex items-center gap-2 border-l border-slate-200 pl-3 ml-1">
                                    <button
                                        onClick={() => handleStatusUpdate('approved')}
                                        disabled={isActionLoading}
                                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate('rejected')}
                                        disabled={isActionLoading}
                                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
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
                                        <span className={`status - badge success`}>
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
                    <div className="dashboard-stats mb-6 relative">
                        {currentPhase === 2 && filteredBrandData?.summary ? (
                            <>
                                <div className="stat-card border-l-4 border-l-blue-500 hover:shadow-lg transition-all">
                                    <div className="stat-icon blue">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                    </div>
                                    <div>
                                        <div className="stat-value">{filteredBrandData.summary.combine_flag_count}</div>
                                        <div className="stat-label">Grouped Brands</div>
                                    </div>
                                    <div className="ml-auto text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">AUTO</div>
                                </div>
                                <div className="stat-card border-l-4 border-l-red-500 hover:shadow-lg transition-all">
                                    <div className="stat-icon red">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                    </div>
                                    <div>
                                        <div className="stat-value">{filteredBrandData.summary.exclude_flag_count}</div>
                                        <div className="stat-label">Excluded Brands</div>
                                    </div>
                                    <div className="ml-auto text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">AUTO</div>
                                </div>
                                <div className="stat-card border-l-4 border-l-amber-500 hover:shadow-lg transition-all">
                                    <div className="stat-icon yellow">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                    </div>
                                    <div>
                                        <div className="stat-value">{filteredBrandData.summary.issue_counts.private_brand + filteredBrandData.summary.issue_counts.mapping_issue}</div>
                                        <div className="stat-label">Critical Issues</div>
                                    </div>
                                    <div className="ml-auto flex flex-col gap-1">
                                        <span className="text-[9px] font-bold text-red-600 px-1 py-0.5 bg-red-50 rounded">PB: {filteredBrandData.summary.issue_counts.private_brand}</span>
                                        <span className="text-[9px] font-bold text-amber-600 px-1 py-0.5 bg-amber-50 rounded">MI: {filteredBrandData.summary.issue_counts.mapping_issue}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // Phase 1 Stats
                            <>
                                <div className="stat-card border-l-4 border-l-slate-400">
                                    <div className="stat-icon blue">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /></svg>
                                    </div>
                                    <div>
                                        <div className="stat-value">{brands.length}</div>
                                        <div className="stat-label">Total Subcategories</div>
                                    </div>
                                </div>
                                <div className="stat-card border-l-4 border-l-blue-600">
                                    <div className="stat-icon green">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                    </div>
                                    <div>
                                        <div className="stat-value">{included.length}</div>
                                        <div className="stat-label">Included Candidates</div>
                                    </div>
                                </div>
                                <div className="stat-card border-l-4 border-l-slate-300">
                                    <div className="stat-icon red">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                    </div>
                                    <div>
                                        <div className="stat-value">{excluded.length}</div>
                                        <div className="stat-label">Excluded Candidates</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {currentPhase === 1 && (
                        <div className="card bg-blue-50 border-blue-100 flex items-center justify-between p-6 mt-2">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-blue-900 m-0">Ready for Specialized Analysis?</h3>
                                    <p className="text-sm text-blue-700 m-0">Analyze <strong>{included.length}</strong> selected subcategories using historic brand mapping &amp; NLP logic.</p>
                                </div>
                            </div>
                            <button
                                className={`px-6 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-2 ${isReadOnly ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:-translate-y-0.5 active:translate-y-0' : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0'}`}
                                onClick={runSpecializedAnalysis}
                                disabled={loading || included.length === 0}
                            >
                                {loading ? 'Running...' : (isReadOnly ? 'View Analysis' : 'Run Analysis')}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                        </div>
                    )}

                    {/* Analysis Table */}
                    <div className="card mt-4">
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

                        {currentPhase === 1 ? (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort('name')} style={thStyle}>Subcategory <SortIcon column="name" /></th>
                                            <th onClick={() => handleSort('sales')} style={thStyle}>Total Sales <SortIcon column="sales" /></th>
                                            <th onClick={() => handleSort('salesShare')} style={thStyle}>Sales % <SortIcon column="salesShare" /></th>
                                            <th onClick={() => handleSort('unitsShare')} style={thStyle}>Units % <SortIcon column="unitsShare" /></th>
                                            <th onClick={() => handleSort('searchSpendShare')} style={thStyle}>Search Spend % <SortIcon column="searchSpendShare" /></th>
                                            <th onClick={() => handleSort('status')} style={thStyle}>Status <SortIcon column="status" /></th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedBrands.map((brand) => (
                                            <tr key={brand.id} className={brand.status === 'excluded' ? 'bg-slate-50/50' : ''}>
                                                <td style={{ fontWeight: 600 }}>{brand.name}</td>
                                                <td className="font-mono text-sm text-slate-600">{formatCurrencyMillions(brand.sales)}</td>
                                                <td>{(brand.salesShare || 0).toFixed(1)}%</td>
                                                <td>{(brand.unitsShare || 0).toFixed(1)}%</td>
                                                <td>{(brand.searchSpendShare || 0).toFixed(1)}%</td>
                                                <td>
                                                    <span className={`status - badge - mini ${brand.status === 'included' ? 'success' : 'neutral'} `}>
                                                        {brand.status === 'included' ? 'Selected' : 'Skipped'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <button
                                                        onClick={() => toggleBrand(brand)}
                                                        className={`p - 2 rounded - full transition - all ${isReadOnly ? 'opacity-50 cursor-not-allowed' : (brand.status === 'included' ? 'text-red-500 hover:bg-red-50' : 'text-blue-500 hover:bg-blue-50')} `}
                                                        title={isReadOnly ? 'Locked' : (brand.status === 'included' ? 'Exclude from Analysis' : 'Include in Analysis')}
                                                        disabled={isReadOnly}
                                                    >
                                                        {brand.status === 'included' ? (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                                        ) : (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 8 12 12 16 14" /><path d="M12 2a10 10 0 1 0 10 10" /></svg>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="animate-in slide-in-from-bottom duration-500 p-0">
                                <SummarySheet summary={filteredBrandData?.summary} />
                                <TopExcludedSheet data={filteredBrandData} />

                                {/* Filter Bar */}
                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
                                    <div className="relative" style={{ minWidth: 220 }}>
                                        <input
                                            type="text"
                                            placeholder="Search brands..."
                                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <svg className="absolute left-2.5 top-2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-semibold text-slate-400">PB</span>
                                        <select
                                            className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={filterPB}
                                            onChange={(e) => setFilterPB(e.target.value)}
                                        >
                                            <option value="all">All PB</option>
                                            <option value="yes">Private Only</option>
                                            <option value="no">Non-Private</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-semibold text-slate-400">MI</span>
                                        <select
                                            className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={filterMI}
                                            onChange={(e) => setFilterMI(e.target.value)}
                                        >
                                            <option value="all">All MI</option>
                                            <option value="yes">Issues Only</option>
                                            <option value="no">No Issues</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-semibold text-slate-400">Status</span>
                                        <select
                                            className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                        >
                                            <option value="all">All Status</option>
                                            <option value="excluded">Excluded Only</option>
                                            <option value="included">Included Only</option>
                                        </select>
                                    </div>

                                    <div className="ml-auto text-[11px] font-semibold text-slate-400">
                                        Showing <strong className="text-slate-600">{filteredBrandData?.rows?.length || 0}</strong> brands
                                    </div>
                                </div>
                                <BrandExclusionTable data={filteredBrandData} onUpdate={handleBrandUpdate} isReadOnly={isReadOnly} />
                            </div>
                        )}
                    </div>

                    {latestFile && (
                        <div className="mt-8">
                            <DiscussionBoard fileId={latestFile.file_id} />
                        </div>
                    )}
                    <div className="mt-4">
                        <AutomationNote notes={step.automationNotes} />
                    </div>
                </div>
            )}
        </div>
    );
}
