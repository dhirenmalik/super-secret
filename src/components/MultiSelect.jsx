import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Filter } from 'lucide-react';

const MultiSelect = ({ label, options, selectedValues, onChange, align = 'left' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
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

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        String(opt.value).toLowerCase().includes(search.toLowerCase())
    );

    const toggleOption = (value) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter(v => v !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    const hasSelection = selectedValues.length > 0;

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
                <div className={`absolute z-[60] w-64 mt-1 origin-top-left bg-white border border-slate-200 rounded-xl shadow-xl top-full overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${align === 'right' ? 'right-0' : 'left-0'}`}>
                    <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                className="w-full pl-8 pr-2 py-1.5 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-400"
                                placeholder={`Search ${label}...`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-200">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-6 text-[11px] text-center text-slate-400">
                                No match found
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = selectedValues.includes(opt.value);
                                return (
                                    <label
                                        key={String(opt.value)}
                                        className="flex items-center px-2 py-2 text-[11px] rounded-lg cursor-pointer hover:bg-slate-50 group transition-colors"
                                        onClick={(e) => { e.stopPropagation(); toggleOption(opt.value); setIsOpen(false); }}
                                    >
                                        <div className={`flex items-center justify-center w-4 h-4 mr-2.5 border rounded-md transition-colors ${isSelected ? 'bg-primary border-primary' : 'bg-white border-slate-300 group-hover:border-primary'}`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                        </div>
                                        <span className={`truncate flex-1 ${isSelected ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                                            {opt.label}
                                        </span>
                                    </label>
                                );
                            })
                        )}
                    </div>
                    {hasSelection && (
                        <div className="px-2 py-1.5 border-t border-slate-100 bg-slate-50">
                            <button
                                onClick={(e) => { e.stopPropagation(); onChange([]); }}
                                className="w-full py-1.5 text-[10px] font-bold text-center tracking-wide text-slate-500 uppercase transition-colors rounded hover:bg-slate-200/50 hover:text-slate-800"
                            >
                                Clear Selection
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
