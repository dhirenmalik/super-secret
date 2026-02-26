import { useState, useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import AutomationNote from '@/components/common/AutomationNote';
import StatusBadge from '@/components/common/StatusBadge';
import steps from '@/data/steps';
import Spinner from '@/components/common/Spinner';
import FileUploadCard from '@/components/common/FileUploadCard';
import InputTab from '@/components/discovery/InputTab';
import SummaryTab from '@/components/discovery/SummaryTab';
import ChartTab from '@/components/discovery/ChartTab';
import { useDiscoveryAnalysis } from '@/hooks/useDiscoveryAnalysis';

const step = steps.find((s) => s.id === 9);

// Removed unused imports

const TABS = [
    { key: 'input', label: 'Input' },
    { key: 'summary', label: 'Summary' },
    { key: 'units_trend', label: 'Units Trend' },
    { key: 'units_vs_spends', label: 'Units vs Spends' },
    { key: 'spends_vs_imps', label: 'Spends vs Imps' },
    { key: 'units_vs_search', label: 'Units vs Search' },
    { key: 'units_vs_onsite', label: 'Units vs Onsite Display' },
    { key: 'units_vs_offsite', label: 'Units vs Offsite Display' },
    { key: 'units_vs_instore', label: 'Units vs Instore' },
];

function TabBar({ active, setActive }) {
    return (
        <div className="mb-6 border-b border-slate-200">
            <div className="flex gap-6 overflow-x-auto">
                {TABS.map((t) => {
                    const isActive = t.key === active;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setActive(t.key)}
                            className={`whitespace-nowrap pb-3 text-sm font-semibold transition border-b-2 ${isActive
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}



export default function DiscoveryToolAnalysis() {
    const [activeTab, setActiveTab] = useState('summary');
    const { data, loading, error, generateAnalysis } = useDiscoveryAnalysis();

    useEffect(() => {
        // Auto-run analysis when the component mounts if not already loaded
        if (!data && !loading) {
            generateAnalysis().catch(() => { });
        }
    }, []);

    const renderTab = () => {
        if (!data) return null;
        switch (activeTab) {
            case 'input': return <InputTab input_sheet={data.input_sheet} />;
            case 'summary': return <SummaryTab data={data} />;
            case 'units_trend': return <ChartTab chartData={data.charts?.units_trend} events={data.events} anomalies={data.anomalies} />;
            case 'units_vs_spends': return <ChartTab chartData={data.charts?.units_vs_spends} events={data.events} />;
            case 'spends_vs_imps': return <ChartTab chartData={data.charts?.spends_vs_imps} events={data.events} />;
            case 'units_vs_search': return <ChartTab chartData={data.charts?.units_vs_search} events={data.events} />;
            case 'units_vs_onsite': return <ChartTab chartData={data.charts?.units_vs_onsite} events={data.events} />;
            case 'units_vs_offsite': return <ChartTab chartData={data.charts?.units_vs_offsite} events={data.events} />;
            case 'units_vs_instore': return <ChartTab chartData={data.charts?.units_vs_instore} events={data.events} />;
            default: return null;
        }
    };



    return (
        <div>
            <PageHeader title={step.name} subtitle="Create reports with trends, charts, and comparisons at total and variable level."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]} stepNumber={step.id} phase={step.phase}>
                <StatusBadge status={data ? 'completed' : 'not_started'} />
            </PageHeader>

            {loading && !data && (
                <div className="card p-12 flex flex-col items-center justify-center min-h-[400px]">
                    <Spinner className="w-10 h-10 border-blue-600 mb-4" />
                    <p className="text-slate-600 font-medium">Generating Discovery Tool Analysis...</p>
                    <p className="text-slate-400 text-sm mt-2">Loading and preparing modeling dataset metrics.</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-sm">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {data && (
                <div className="card overflow-hidden">
                    <TabBar active={activeTab} setActive={setActiveTab} />
                    <div className="min-h-[400px]">
                        {renderTab()}
                    </div>
                </div>
            )}

            <div className="mt-5"><AutomationNote notes={step.automationNotes} /></div>
        </div>
    );
}
