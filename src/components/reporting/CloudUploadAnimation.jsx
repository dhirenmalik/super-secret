import React, { useState, useEffect } from 'react';

export default function CloudUploadAnimation({ onComplete }) {
    const [status, setStatus] = useState('idle'); // idle, uploading, success
    const [progress, setProgress] = useState(0);

    const startUpload = () => {
        setStatus('uploading');
        setProgress(0);
    };

    useEffect(() => {
        if (status === 'uploading') {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            setStatus('success');
                            if (onComplete) onComplete();
                        }, 500);
                        return 100;
                    }
                    return prev + 2;
                });
            }, 30);
            return () => clearInterval(interval);
        }
    }, [status, onComplete]);

    return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 24px' }}>
                {/* Cloud Background */}
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke={status === 'success' ? '#16a34a' : '#0071dc'} strokeWidth="1" style={{ opacity: 0.1, position: 'absolute', top: 0, left: 0, transform: 'scale(5)' }}>
                    <path d="M17.5 19c.3 0 .5 0 .8-.1a5.5 5.5 0 0 0 1.2-10.7A8 8 0 1 0 5 13.3a5.5 5.5 0 0 0 0 10.7c.3.1.5.1.8.1H17.5z" />
                </svg>

                {/* Animated Arrow/Icon */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2
                }}>
                    {status === 'idle' && (
                        <div style={{ animation: 'bounce 2s infinite' }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#0071dc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 19V5M5 12l7-7 7 7" />
                            </svg>
                        </div>
                    )}
                    {status === 'uploading' && (
                        <div style={{ width: '80px', height: '80px', position: 'relative' }}>
                            <svg width="80" height="80" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="#0071dc"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${progress * 2.82} 282`}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dasharray 0.03s linear' }}
                                    transform="rotate(-90 50 50)"
                                />
                            </svg>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: '800', color: '#0071dc', fontSize: '14px' }}>
                                {progress}%
                            </div>
                        </div>
                    )}
                    {status === 'success' && (
                        <div style={{ animation: 'scaleIn 0.5s ease-out' }}>
                            <div style={{
                                background: '#16a34a',
                                padding: '15px',
                                borderRadius: '50%',
                                boxShadow: '0 0 20px rgba(22, 163, 74, 0.4)'
                            }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                {status === 'idle' && 'Ready to Secure'}
                {status === 'uploading' && 'Syncing Deliverables...'}
                {status === 'success' && 'Secured in Enterprise Cloud'}
            </h4>
            <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '300px', margin: '0 auto 24px' }}>
                {status === 'idle' && 'Upload final documentation pack to the Enterprise Cloud repository.'}
                {status === 'uploading' && 'Encrypting and transferring 4 core assets to the Category storage.'}
                {status === 'success' && 'All documents successfully stored and versioned at FY26_V1.0.'}
            </p>

            {status === 'idle' && (
                <button className="btn btn-primary" onClick={startUpload} style={{ padding: '12px 32px' }}>
                    Push to Cloud
                </button>
            )}

            {status === 'success' && (
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Version Control Active
                </div>
            )}

            <style>{`
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
                    40% {transform: translateY(-10px);}
                    60% {transform: translateY(-5px);}
                }
                @keyframes scaleIn {
                    0% {transform: scale(0); opacity: 0;}
                    100% {transform: scale(1); opacity: 1;}
                }
            `}</style>
        </div>
    );
}
