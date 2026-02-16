export default function AutomationNote({ notes }) {
    if (!notes || notes.length === 0) return null;

    return (
        <div className="automation-note">
            <div className="automation-note-header">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <path d="m21 15-3.086-6.172A2 2 0 0 0 16.1 7.8H7.9a2 2 0 0 0-1.814 1.172L3 15" />
                    <path d="M3.5 21h17a1.5 1.5 0 0 0 1.342-2.17L18.5 12H5.5L2.158 18.83A1.5 1.5 0 0 0 3.5 21Z" />
                </svg>
                Automation Opportunities
            </div>
            <div className="automation-note-list">
                {notes.map((note, i) => (
                    <div key={i} className="automation-note-item">
                        <span className="automation-note-bullet" />
                        <span>{note}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
