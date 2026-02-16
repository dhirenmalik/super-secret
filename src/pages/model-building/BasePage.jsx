import React from 'react';
import PageHeader from '../../components/PageHeader';
import TaskList from '../../components/TaskList';
import AutomationNote from '../../components/AutomationNote';
import StatusBadge from '../../components/StatusBadge';
import steps from '../../data/steps';

export default function BasePage({ stepId, children, hideTasks = false }) {
    const step = steps.find((s) => s.id === stepId);

    if (!step) return <div>Step not found</div>;

    return (
        <div>
            <PageHeader
                title={step.name}
                subtitle={step.tasks[0] || "Step description"}
                breadcrumb={['Dashboard', step.phase, step.name]}
                stepNumber={step.id}
                phase={step.phase}
            >
                <StatusBadge status="not_started" />
            </PageHeader>

            <AutomationNote notes={step.automationNotes} />

            <div className={hideTasks ? "" : "grid-2"} style={{ marginTop: '20px' }}>
                {/* Tasks */}
                {!hideTasks && (
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
                )}
                {children}
            </div>
        </div>
    );
}
