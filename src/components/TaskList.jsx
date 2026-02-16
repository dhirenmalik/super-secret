import { useState } from 'react';

export default function TaskList({ tasks, onTaskToggle }) {
    const [completed, setCompleted] = useState(new Set());

    const toggleTask = (index) => {
        const next = new Set(completed);
        if (next.has(index)) {
            next.delete(index);
        } else {
            next.add(index);
        }
        setCompleted(next);
        onTaskToggle?.(index, next.has(index));
    };

    const progress = tasks.length > 0 ? (completed.size / tasks.length) * 100 : 0;

    return (
        <div>
            <div className="progress-bar-container" style={{ marginBottom: '20px' }}>
                <div className="progress-bar-label">
                    <span style={{ color: 'var(--color-text-muted)' }}>Progress</span>
                    <span style={{ color: 'var(--color-primary)' }}>
                        {completed.size}/{tasks.length} tasks
                    </span>
                </div>
                <div className="progress-bar-track">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="task-list">
                {tasks.map((task, i) => {
                    const isChecked = completed.has(i);
                    return (
                        <div key={i} className="task-item" onClick={() => toggleTask(i)}>
                            <div className={`task-checkbox ${isChecked ? 'checked' : ''}`}>
                                {isChecked && (
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </div>
                            <span className={`task-text ${isChecked ? 'completed' : ''}`}>
                                {task}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
