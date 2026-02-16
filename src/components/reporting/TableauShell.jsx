import React from 'react';

export default function TableauShell({ children }) {
    const sheets = [
        'Online vs Instore', 'Online vs Instore_units', 'YoY Spend Mix overall',
        'Media Spend Time', 'Omni Sales vs Media Spends', 'Media Spend Price Summary',
        'Session Slide', 'Model Performance'
    ];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '800px',
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>
            {/* Top Menu Bar */}
            <div style={{
                height: '24px',
                background: '#f3f4f6',
                borderBottom: '1px solid #d1d5db',
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                fontSize: '11px',
                color: '#374151',
                gap: '15px'
            }}>
                <span>File</span><span>Data</span><span>Worksheet</span><span>Dashboard</span><span>Story</span><span>Analysis</span><span>Map</span><span>Format</span><span>Server</span><span>Window</span><span>Help</span>
            </div>

            {/* Toolbar */}
            <div style={{
                height: '36px',
                background: '#f9fafb',
                borderBottom: '1px solid #d1d5db',
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                gap: '10px'
            }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                    {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ width: '20px', height: '20px', background: '#e5e7eb', borderRadius: '2px' }} />)}
                </div>
                <div style={{ borderLeft: '1px solid #d1d5db', height: '20px', margin: '0 5px' }} />
                <div style={{ background: '#e5e7eb', height: '22px', width: '150px', borderRadius: '2px' }} />
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left Sidebar */}
                <div style={{
                    width: '220px',
                    background: '#f9fafb',
                    borderRight: '1px solid #d1d5db',
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: '12px'
                }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #d1d5db', fontWeight: 'bold' }}>Dashboard</div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '10px', marginBottom: '8px', fontWeight: 'bold' }}>Size</div>
                            <div style={{ padding: '5px', border: '1px solid #d1d5db', background: 'white' }}>Desktop (1000 x 800)</div>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '10px', marginBottom: '8px', fontWeight: 'bold' }}>Sheets</div>
                            {sheets.map((s, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
                                    <div style={{ width: '14px', height: '14px', border: '1px solid #9ca3af', borderRadius: '2px' }} />
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</span>
                                </div>
                            ))}
                        </div>
                        <div>
                            <div style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '10px', marginBottom: '8px', fontWeight: 'bold' }}>Objects</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                                {['Horizontal', 'Vertical', 'Text', 'Image', 'Web Page', 'Blank'].map(o => (
                                    <div key={o} style={{ padding: '4px', border: '1px solid #d1d5db', background: 'white', fontSize: '10px', textAlign: 'center' }}>{o}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Canvas Area */}
                <div style={{ flex: 1, background: '#e5e7eb', padding: '20px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '1000px', height: 'fit-content' }}>
                        {children}
                    </div>
                </div>
            </div>

            {/* Bottom Tabs */}
            <div style={{
                height: '30px',
                background: '#f3f4f6',
                borderTop: '1px solid #d1d5db',
                display: 'flex',
                alignItems: 'center',
                padding: '0 5px',
                fontSize: '11px',
                color: '#4b5563',
                overflowX: 'auto'
            }}>
                <div style={{ padding: '0 10px', borderRight: '1px solid #d1d5db', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '12px', height: '12px', background: '#9ca3af' }} /> Data Source
                </div>
                {sheets.map((s, i) => (
                    <div
                        key={i}
                        style={{
                            padding: '0 15px',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            background: i === 0 ? 'white' : 'transparent',
                            borderTop: i === 0 ? '2px solid #0071dc' : 'none',
                            whiteSpace: 'nowrap',
                            borderRight: '1px solid #d1d5db'
                        }}
                    >
                        {s}
                    </div>
                ))}
            </div>
        </div>
    );
}
