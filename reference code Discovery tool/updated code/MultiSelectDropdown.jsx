import React, { useState, useRef, useEffect } from 'react';

export default function MultiSelectDropdown({ options, selected, onChange, label = 'Select Variables' }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (option) => {
        if (selected.includes(option)) {
            onChange(selected.filter(item => item !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    const handleSelectAll = () => {
        if (selected.length === options.length) {
            onChange([]);
        } else {
            onChange([...options]);
        }
    };

    return (
        <div className="relative w-full max-w-xs" ref={dropdownRef}>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {label}
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm flex justify-between items-center"
            >
                <span className="truncate">
                    {selected.length === 0
                        ? 'Select variables...'
                        : selected.length === options.length
                            ? 'All Variables Selected'
                            : `${selected.length} selected`}
                </span>
                <span className="ml-2 text-slate-400">▼</span>
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 flex items-center gap-2"
                        onClick={handleSelectAll}
                    >
                        <input
                            type="checkbox"
                            checked={selected.length === options.length && options.length > 0}
                            onChange={() => { }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-semibold text-slate-700">Select All</span>
                    </div>
                    {options.map((option) => (
                        <div
                            key={option}
                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                            onClick={() => toggleOption(option)}
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(option)}
                                onChange={() => { }}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">{option.replace(/_/g, ' ')}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
