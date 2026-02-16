import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import steps from '../data/steps';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [collapsedPhases, setCollapsedPhases] = useState({});
    const location = useLocation();

    const togglePhase = (phase) => {
        if (isCollapsed) return; // Don't toggle expansion when sidebar is collapsed
        setCollapsedPhases(prev => ({
            ...prev,
            [phase]: !prev[phase]
        }));
    };

    const closeMobile = () => setIsMobileOpen(false);

    return (
        <>
            <button
                className="sidebar-toggle"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Toggle mobile menu"
            >
                {isMobileOpen ? '✕' : '☰'}
            </button>

            {isMobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}

            <aside className={`sidebar ${isMobileOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <NavLink to="/" className="sidebar-logo" onClick={closeMobile}>
                        <div className="sidebar-logo-icon">W</div>
                        {!isCollapsed && (
                            <div className="sidebar-logo-text">
                                <span className="sidebar-logo-title">Walmart</span>
                                <span className="sidebar-logo-subtitle">Process Manager</span>
                            </div>
                        )}
                    </NavLink>
                    <button
                        className="collapse-desktop-toggle"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `sidebar-nav-item ${isActive ? 'active' : ''}`
                        }
                        end
                        onClick={closeMobile}
                        title={isCollapsed ? "Dashboard" : ""}
                    >
                        <span className="sidebar-step-number" style={{ fontSize: '14px' }}>
                            ◉
                        </span>
                        {!isCollapsed && "Dashboard"}
                    </NavLink>

                    {['ETL', 'EDA', 'Model Building', 'Optimisation', 'Reporting'].map(phase => {
                        const phaseSteps = steps.filter(s => s.phase === phase);
                        if (phaseSteps.length === 0) return null;

                        const isPhaseCollapsed = collapsedPhases[phase] || isCollapsed;

                        return (
                            <div key={phase}>
                                {!isCollapsed && (
                                    <div
                                        className="sidebar-phase-label"
                                        onClick={() => togglePhase(phase)}
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                    >
                                        {phase} Phase
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ transform: isPhaseCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </div>
                                )}
                                <div style={{ height: isPhaseCollapsed && !isCollapsed ? '0' : 'auto', overflow: 'hidden', transition: 'height 0.3s ease' }}>
                                    {phaseSteps.map((step) => (
                                        <NavLink
                                            key={step.id}
                                            to={`/step/${step.slug}`}
                                            className={({ isActive }) =>
                                                `sidebar-nav-item ${isActive ? 'active' : ''}`
                                            }
                                            onClick={closeMobile}
                                            title={isCollapsed ? step.name : ""}
                                        >
                                            <span className="sidebar-step-number">{step.id}</span>
                                            {!isCollapsed && step.name}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <p className="sidebar-footer-text">{isCollapsed ? "v1.0" : "Walmart Process Guide v1.0"}</p>
                </div>
            </aside>
        </>
    );
}
