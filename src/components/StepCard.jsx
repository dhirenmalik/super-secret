import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function StepCard({ step, status = 'not_started' }) {
    const navigate = useNavigate();

    return (
        <div className="step-card" onClick={() => navigate(`/step/${step.slug}`)}>
            <div className="step-card-header">
                <div className="step-card-number">{step.id}</div>
                <StatusBadge status={status} />
            </div>
            <div className="step-card-title">{step.name}</div>
            <div className="step-card-tasks">
                {step.tasks.length} task{step.tasks.length !== 1 ? 's' : ''} ·{' '}
                {step.automationNotes.length > 0
                    ? `${step.automationNotes.length} automation note${step.automationNotes.length !== 1 ? 's' : ''}`
                    : 'No notes'}
            </div>
            <div className="step-card-footer">
                <span className={`tag tag-${step.phase.toLowerCase()}`}>
                    {step.phase}
                </span>
                <span
                    style={{
                        fontSize: '13px',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                    }}
                >
                    View →
                </span>
            </div>
        </div>
    );
}
