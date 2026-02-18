export default function StatusBadge({ status = 'not_started' }) {
    const labels = {
        not_started: 'Not Started',
        in_progress: 'In Progress',
        completed: 'Completed',
        blocked: 'Blocked',
        uploaded: 'Uploaded',
        pending: 'Pending Review',
        approved: 'Approved',
        rejected: 'Rejected',
    };

    const className = status.replace('_', '-');

    return (
        <span className={`status-badge ${className}`}>
            <span className="status-badge-dot" />
            {labels[status] || status}
        </span>
    );
}
