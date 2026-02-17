import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import steps from '../data/steps';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
    const { user, logout } = useAuth();
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
                                <span className="sidebar-logo-subtitle">Process Management</span>
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

                <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '20px 0', marginTop: 'auto' }}>
                    {user && (
                        <div className="user-profile" style={{ padding: '0 24px 15px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}>
                                    {user.user_name?.charAt(0) || user.email?.charAt(0)}
                                </div>
                                {!isCollapsed && (
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>Welcome back,</div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.user_name}</div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'capitalize' }}>{user.role}</div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={logout}
                                className="sidebar-nav-item logout-btn"
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,59,48,0.1)',
                                    color: '#ff3b30',
                                    border: 'none',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                                {!isCollapsed && "Logout"}
                            </button>
                        </div>
                    )}
                    <p className="sidebar-footer-text" style={{ padding: '0 24px', opacity: 0.5 }}>{isCollapsed ? "v1.0" : "Walmart Process Guide v1.0"}</p>
                </div>
            </aside>
        </>
    );
}
