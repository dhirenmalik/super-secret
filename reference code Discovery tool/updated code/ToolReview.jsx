import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import steps from '@/data/steps';
import { useDiscoveryAnalysis } from '@/hooks/useDiscoveryAnalysis';
import AgentInsights from '@/components/discovery/AgentInsights';
import ChartTab from '@/components/discovery/ChartTab';
import Spinner from '@/components/common/Spinner';

const step = steps.find((s) => s.id === 10);

export default function ToolReview() {
    const { data, loading, error, generateAnalysis } = useDiscoveryAnalysis();

    // Lifted Filter States
    const [tacticFilter, setTacticFilter] = useState('All');
    const [severityFilter, setSeverityFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');

    const availableTactics = useMemo(() => {
        if (!data || !data.agent_anomalies) return ['All'];
        const unique = new Set();
        data.agent_anomalies.forEach(r => {
            const prefix = r.Tactic_Prefix;
            unique.add(`${prefix}_SPEND`);
            if (prefix.startsWith('M_SP') || prefix.startsWith('M_SBA') || prefix.startsWith('M_SV')) {
                unique.add(`${prefix}_CLK`);
            } else {
                unique.add(`${prefix}_IMP`);
            }
        });
        return ['All', ...Array.from(unique).sort()];
    }, [data]);

    const availableTypes = useMemo(() => {
        if (!data || !data.agent_anomalies) return ['All'];
        const unique = new Set();
        data.agent_anomalies.forEach(r => {
            const t = r.SourceFile || r.Anomaly_Type;
            if (t) unique.add(t);
        });
        return ['All', ...Array.from(unique).sort()];
    }, [data]);

    const availableSeverities = ['All', 'Critical', 'High', 'Medium', 'Low'];

    useEffect(() => {
        if (!data && !loading) {
            generateAnalysis().catch(() => { });
        }
    }, []);

    return (
        <div>
            <PageHeader
                title={step.name}
                subtitle="Review and analyze AI-generated insights and anomalies for the discovery dataset."
                breadcrumb={['Dashboard', 'EDA Phase', step.name]}
                stepNumber={step.id}
                phase={step.phase}
            >
                <StatusBadge status="not_started" />
            </PageHeader>

            {/* Analysis Loading State */}
            {loading && !data && (
                <div className="card p-12 flex flex-col items-center justify-center min-h-[400px] mt-5">
                    <Spinner className="w-10 h-10 border-blue-600 mb-4" />
                    <p className="text-slate-600 font-medium">Generating Discovery Tool Analysis...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-5 text-red-700 text-sm">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Agent Insights & Chart */}
            {data && (
                <div className="mt-5 space-y-5">
                    <div className="card overflow-hidden">
                        <div className="p-6">
                            <AgentInsights
                                insights={data.agent_insights}
                                anomaliesTable={data.agent_anomalies}
                                isLoading={loading}
                                tacticFilter={tacticFilter}
                                setTacticFilter={setTacticFilter}
                                severityFilter={severityFilter}
                                setSeverityFilter={setSeverityFilter}
                                typeFilter={typeFilter}
                                setTypeFilter={setTypeFilter}
                                availableTactics={availableTactics}
                                availableSeverities={availableSeverities}
                                availableTypes={availableTypes}
                            />
                        </div>
                    </div>
                    <div className="card p-6 min-h-[400px]">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Anomaly Detection Overlay</h3>
                        <ChartTab
                            chartData={data.charts?.all_tactics || data.charts?.units_trend}
                            events={data.events}
                            anomalies={data.anomalies}
                            activeTacticFilter={tacticFilter}
                            activeSeverityFilter={severityFilter}
                            activeTypeFilter={typeFilter}
                            setTacticFilter={setTacticFilter}
                            setSeverityFilter={setSeverityFilter}
                            setTypeFilter={setTypeFilter}
                            availableTactics={availableTactics}
                            availableSeverities={availableSeverities}
                            availableTypes={availableTypes}
                            anomaliesTable={data.agent_anomalies}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
