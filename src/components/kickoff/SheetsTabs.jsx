import React from 'react'

const SheetsTabs = ({ tabs, activeId, onChange }) => {
    return (
        <div className="mb-6 border-b border-slate-200">
            <div className="flex gap-6 overflow-x-auto">
                {tabs.map((tab) => {
                    const isActive = tab.id === activeId
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onChange(tab.id)}
                            className={`whitespace-nowrap pb-3 text-sm font-semibold transition border-b-2 ${isActive
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default SheetsTabs
