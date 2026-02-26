import React from 'react';

export default function ModelGallery({ models, onSelect, activeModelId }) {
    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="section-title m-0 flex items-center gap-3">
                    <span className="tag tag-blue">SELECT PROJECT</span>
                    Model Gallery
                </h2>
            </div>

            {Array.isArray(models) && models.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {models.map((model) => (
                        <div
                            key={model.model_id}
                            onClick={() => onSelect(model.model_id.toString())}
                            className="card h-full cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border-t-4 border-t-blue-500 group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="card-title-icon blue">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                    </svg>
                                </div>
                                <span className={`status-badge success`}>
                                    <span className="status-badge-dot"></span>
                                    READY
                                </span>
                            </div>
                            <h3 className="font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{model.model_name}</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                                    Type: {model.model_type || 'Custom'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                                <span className="text-[10px] text-slate-400 font-medium">
                                    Created {new Date(model.created_at || Date.now()).toLocaleDateString()}
                                </span>
                                <span className="text-blue-600 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Select Model
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card py-16 text-center border-dashed">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <svg className="text-slate-300" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        </svg>
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">No Projects Found</h3>
                    <p className="text-sm text-slate-500">Please create a model from the dashboard first.</p>
                </div>
            )}
        </div>
    );
}
