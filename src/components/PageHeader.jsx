export default function PageHeader({
    title,
    subtitle,
    breadcrumb,
    stepNumber,
    phase,
    children,
}) {
    return (
        <div className="page-header">
            {breadcrumb && (
                <div className="page-header-breadcrumb">
                    {breadcrumb.map((item, i) => (
                        <span key={i}>
                            {i > 0 && <span style={{ margin: '0 2px' }}>/</span>}
                            {item}
                        </span>
                    ))}
                </div>
            )}
            <h1 className="page-header-title">
                {stepNumber && (
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '38px',
                            height: '38px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-primary-light)',
                            color: 'var(--color-primary)',
                            fontSize: '16px',
                            fontWeight: 800,
                            marginRight: '12px',
                            verticalAlign: 'middle',
                        }}
                    >
                        {stepNumber}
                    </span>
                )}
                {title}
            </h1>
            {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
            {(phase || children) && (
                <div className="page-header-meta">
                    {phase && (
                        <span className={`tag tag-${phase.toLowerCase()}`}>{phase} Phase</span>
                    )}
                    {children}
                </div>
            )}
        </div>
    );
}
