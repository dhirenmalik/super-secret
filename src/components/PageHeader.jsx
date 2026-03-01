import ModelContextSelector from './ModelContextSelector';
import { ChevronLeft } from 'lucide-react';

export default function PageHeader({
    title,
    subtitle,
    breadcrumb,
    stepNumber,
    phase,
    activeModelId,
    models,
    onModelSwitch,
    showBackButton = false,
    onBack,
    children,
}) {
    return (
        <div className="page-header">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-2">
                <div className="flex-1">
                    {showBackButton ? (
                        <button
                            onClick={onBack}
                            className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-3 group"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Models
                        </button>
                    ) : (
                        breadcrumb && (
                            <div className="page-header-breadcrumb">
                                {breadcrumb.map((item, i) => (
                                    <span key={i}>
                                        {i > 0 && <span style={{ margin: '0 4px', color: 'var(--color-slate-300)' }}>/</span>}
                                        {item}
                                    </span>
                                ))}
                            </div>
                        )
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
                </div>

                {/* Right side Metadata / Context */}
                <div className="flex flex-col items-end gap-3">
                    {activeModelId && !showBackButton && (
                        <ModelContextSelector
                            activeModelId={activeModelId}
                            models={models}
                            onSwitch={onModelSwitch}
                        />
                    )}
                    <div className="flex items-center gap-2">
                        {phase && phase !== 'EDA' && (
                            <span className={`tag tag-${phase.toLowerCase()}`}>{phase} Phase</span>
                        )}
                        {children}
                    </div>
                </div>
            </div>
            {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
    );
}

