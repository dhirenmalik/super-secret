import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
        } catch (err) {
            setError(err.message || 'Failed to login. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                    <div className="p-8 bg-blue-600 text-white text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold">Walmart Process Management</h1>
                        <p className="text-blue-100 text-sm mt-1">Sign in to your portal</p>
                    </div>

                    <div className="p-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-3">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="form-group">
                                <label className="form-label text-slate-700 font-semibold mb-2 block">Email Address</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        className="form-input w-full"
                                        style={{ paddingLeft: '3.5rem' }}
                                        placeholder="admin@walmart.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                    />
                                    <svg className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label text-slate-700 font-semibold mb-2 block">Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        className="form-input w-full"
                                        style={{ paddingLeft: '3.5rem' }}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                    />
                                    <svg className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-[0px] transition-all"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-8 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Demo Accounts</h3>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                    <div className="font-bold text-slate-700">Modeler</div>
                                    <div className="text-slate-500">abhishek@walmart.com</div>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                    <div className="font-bold text-slate-700">Reviewer</div>
                                    <div className="text-slate-500">reviewer@walmart.com</div>
                                </div>
                            </div>
                            <div className="mt-3 text-[10px] text-center text-slate-400">
                                Password: <span className="font-mono bg-slate-100 px-1 rounded">walmart123</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
