import React from 'react';
import { Database, RefreshCw, ChevronRight, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * A professional UI component for displaying and switching the active model context.
 * Designed to feel like a "Workspace" or "Project" selector.
 */
export default function ModelContextSelector({
    activeModelId,
    models = [],
    onSwitch,
    isLoading = false
}) {
    const activeModel = models.find(m => String(m.model_id) === String(activeModelId));
    const modelName = activeModel?.model_name || 'Select a Project';
    const modelType = activeModel?.model_type || 'Custom';

    return (
        <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
            {/* Context Indicator */}
            <div className="flex items-center gap-2 pl-3 pr-2 py-1.5 border-r border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-indigo-100 shadow-lg">
                    <Database size={16} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.15em] leading-none mb-1">
                        Workspace
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-none">
                        {modelType}
                    </span>
                </div>
            </div>

            {/* Active Model Name */}
            <div className="px-4 py-1.5 flex flex-col justify-center min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    Active Project
                </span>
                <span className="text-sm font-extrabold text-slate-800 truncate max-w-[200px]">
                    {isLoading ? (
                        <div className="h-4 w-24 bg-slate-200 animate-pulse rounded" />
                    ) : (
                        modelName
                    )}
                </span>
            </div>

            {/* Switch Action */}
            <button
                onClick={onSwitch}
                disabled={isLoading}
                className="group ml-2 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-indigo-600 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            >
                <div className="p-1 bg-indigo-50 rounded text-indigo-500 group-hover:bg-indigo-100 group-hover:rotate-180 transition-all duration-500">
                    <RefreshCw size={12} strokeWidth={3} />
                </div>
                <span>SWITCH PROJECT</span>
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
        </div>
    );
}
