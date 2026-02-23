import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Filter } from 'lucide-react';

const NumberRangeFilter = ({ label, value, onChange, align = 'left' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hasSelection = (value?.min !== undefined && value.min !== '') || (value?.max !== undefined && value.max !== '');

    return (
        <div className="relative inline-block text-left w-full" ref={ref}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full inline-flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold bg-white border shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${hasSelection ? 'border-blue-500 text-blue-700 bg-blue-50/30' : 'border-slate-200 text-slate-500'} rounded hover:border-slate-300 transition-all`}
                title={label}
            >
                <div className="flex items-center gap-1.5 truncate uppercase tracking-wider">
                    <Filter className="w-3 h-3 opacity-60" />
                    {hasSelection ? 'Filtered' : 'All'}
                </div>
                <ChevronDown className={`w-3 h-3 ml-1 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute z-[60] w-48 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl top-full ${align === 'right' ? 'right-0' : 'left-0'}`}>
                    <div className="p-3">
                        <div className="mb-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Min Value</label>
                            <input
                                type="number"
                                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 font-mono"
                                value={value?.min || ''}
                                onChange={(e) => onChange({ ...value, min: e.target.value })}
                                onClick={e => e.stopPropagation()}
                                placeholder="e.g. 1000"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Max Value</label>
                            <input
                                type="number"
                                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 font-mono"
                                value={value?.max || ''}
                                onChange={(e) => onChange({ ...value, max: e.target.value })}
                                onClick={e => e.stopPropagation()}
                                placeholder="e.g. 50000"
                            />
                        </div>
                    </div>
                    {hasSelection && (
                        <div className="px-2 py-1.5 border-t border-slate-100 bg-slate-50 rounded-b-lg">
                            <button
                                onClick={(e) => { e.stopPropagation(); onChange({ min: '', max: '' }); }}
                                className="w-full py-1 text-[10px] font-bold text-slate-400 hover:text-slate-800 transition-colors uppercase tracking-wider"
                            >
                                Clear Filter
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NumberRangeFilter;
